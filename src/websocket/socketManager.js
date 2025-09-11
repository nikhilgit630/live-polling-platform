const { Server } = require("socket.io")
const { verifyToken } = require("../config/auth")
const prisma = require("../config/database")

class SocketManager {
  constructor() {
    this.io = null
    this.connectedUsers = new Map() // userId -> socket.id
    this.pollRooms = new Map() // pollId -> Set of socket.ids
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true,
      },
    })

    this.setupEventHandlers()
    console.log("WebSocket server initialized")
  }

  setupEventHandlers() {
    this.io.on("connection", (socket) => {
      console.log(`Client connected: ${socket.id}`)

      // Handle authentication
      socket.on("authenticate", async (token) => {
        try {
          const decoded = verifyToken(token)
          const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, name: true, email: true },
          })

          if (user) {
            socket.userId = user.id
            socket.user = user
            this.connectedUsers.set(user.id, socket.id)

            socket.emit("authenticated", { user })
            console.log(`User authenticated: ${user.name} (${user.id})`)
          } else {
            socket.emit("authentication_error", { message: "Invalid token" })
          }
        } catch (error) {
          socket.emit("authentication_error", { message: "Authentication failed" })
        }
      })

      // Handle joining a poll room for real-time updates
      socket.on("join_poll", async (pollId) => {
        try {
          // Verify poll exists
          const poll = await prisma.poll.findUnique({
            where: { id: pollId },
            select: { id: true, question: true, isPublished: true },
          })

          if (!poll) {
            socket.emit("error", { message: "Poll not found" })
            return
          }

          // Join the poll room
          socket.join(`poll_${pollId}`)

          // Track the room
          if (!this.pollRooms.has(pollId)) {
            this.pollRooms.set(pollId, new Set())
          }
          this.pollRooms.get(pollId).add(socket.id)

          socket.emit("joined_poll", { pollId, poll })
          console.log(`Socket ${socket.id} joined poll room: ${pollId}`)

          // Send current poll results
          const pollWithResults = await this.getPollResults(pollId)
          socket.emit("poll_results", pollWithResults)
        } catch (error) {
          socket.emit("error", { message: "Failed to join poll" })
        }
      })

      // Handle leaving a poll room
      socket.on("leave_poll", (pollId) => {
        socket.leave(`poll_${pollId}`)

        if (this.pollRooms.has(pollId)) {
          this.pollRooms.get(pollId).delete(socket.id)
          if (this.pollRooms.get(pollId).size === 0) {
            this.pollRooms.delete(pollId)
          }
        }

        socket.emit("left_poll", { pollId })
        console.log(`Socket ${socket.id} left poll room: ${pollId}`)
      })

      // Handle getting live poll results
      socket.on("get_poll_results", async (pollId) => {
        try {
          const pollResults = await this.getPollResults(pollId)
          socket.emit("poll_results", pollResults)
        } catch (error) {
          socket.emit("error", { message: "Failed to get poll results" })
        }
      })

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`)

        // Remove from connected users
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId)
        }

        // Remove from all poll rooms
        this.pollRooms.forEach((socketIds, pollId) => {
          socketIds.delete(socket.id)
          if (socketIds.size === 0) {
            this.pollRooms.delete(pollId)
          }
        })
      })
    })
  }

  // Broadcast vote update to all clients in a poll room
  async broadcastVoteUpdate(pollId, voteData) {
    try {
      const pollResults = await this.getPollResults(pollId)

      // Emit to all clients in the poll room
      this.io.to(`poll_${pollId}`).emit("vote_update", {
        pollId,
        vote: voteData,
        results: pollResults,
        timestamp: new Date().toISOString(),
      })

      console.log(`Broadcasted vote update for poll: ${pollId}`)
    } catch (error) {
      console.error("Error broadcasting vote update:", error)
    }
  }

  // Broadcast poll creation to all connected clients
  async broadcastNewPoll(poll) {
    this.io.emit("new_poll", {
      poll,
      timestamp: new Date().toISOString(),
    })
    console.log(`Broadcasted new poll: ${poll.id}`)
  }

  // Broadcast poll update (e.g., published status change)
  async broadcastPollUpdate(pollId, updatedPoll) {
    this.io.to(`poll_${pollId}`).emit("poll_update", {
      pollId,
      poll: updatedPoll,
      timestamp: new Date().toISOString(),
    })

    // Also broadcast to general audience if poll was just published
    if (updatedPoll.isPublished) {
      this.io.emit("poll_published", {
        poll: updatedPoll,
        timestamp: new Date().toISOString(),
      })
    }

    console.log(`Broadcasted poll update: ${pollId}`)
  }

  // Get current poll results with vote counts
  async getPollResults(pollId) {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        options: {
          include: {
            _count: {
              select: {
                votes: true,
              },
            },
          },
        },
      },
    })

    if (!poll) {
      throw new Error("Poll not found")
    }

    // Calculate total votes and percentages
    const totalVotes = poll.options.reduce((sum, option) => sum + option._count.votes, 0)

    const optionsWithPercentages = poll.options.map((option) => ({
      id: option.id,
      text: option.text,
      votes: option._count.votes,
      percentage: totalVotes > 0 ? Math.round((option._count.votes / totalVotes) * 100) : 0,
    }))

    return {
      id: poll.id,
      question: poll.question,
      isPublished: poll.isPublished,
      createdAt: poll.createdAt,
      updatedAt: poll.updatedAt,
      creator: poll.creator,
      options: optionsWithPercentages,
      totalVotes,
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size
  }

  // Get active poll rooms
  getActivePollRooms() {
    return Array.from(this.pollRooms.keys())
  }

  // Send message to specific user
  sendToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId)
    if (socketId) {
      this.io.to(socketId).emit(event, data)
    }
  }
}

// Create singleton instance
const socketManager = new SocketManager()

module.exports = socketManager
