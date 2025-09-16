import { io, type Socket } from "socket.io-client"
import type { Poll } from "./api"

export interface VoteUpdateData {
  pollId: string
  vote: {
    id: string
    user: {
      id: string
      name: string
    }
    pollOption: {
      id: string
      text: string
    }
    removed?: boolean
    createdAt: string
  }
  results: Poll
  timestamp: string
}

export interface NewPollData {
  poll: Poll
  timestamp: string
}

export interface PollUpdateData {
  pollId: string
  poll: Poll
  timestamp: string
}

class WebSocketManager {
  private socket: Socket | null = null
  private token: string | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  connect(token: string) {
    this.token = token
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3000"

    this.socket = io(wsUrl, {
      transports: ["websocket"],
      upgrade: false,
    })

    this.socket.on("connect", () => {
      console.log("WebSocket connected")
      this.reconnectAttempts = 0

      // Authenticate immediately after connection
      if (this.token) {
        this.socket?.emit("authenticate", this.token)
      }
    })

    this.socket.on("authenticated", (data) => {
      console.log("WebSocket authenticated:", data.user)
    })

    this.socket.on("authentication_error", (data) => {
      console.error("WebSocket authentication failed:", data.message)
    })

    this.socket.on("disconnect", () => {
      console.log("WebSocket disconnected")
      this.handleReconnect()
    })

    this.socket.on("error", (error) => {
      console.error("WebSocket error:", error)
    })

    return this.socket
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => {
        if (this.token) {
          this.connect(this.token)
        }
      }, this.reconnectDelay * this.reconnectAttempts)
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.token = null
  }

  joinPoll(pollId: string) {
    if (this.socket) {
      this.socket.emit("join_poll", pollId)
    }
  }

  leavePoll(pollId: string) {
    if (this.socket) {
      this.socket.emit("leave_poll", pollId)
    }
  }

  getPollResults(pollId: string) {
    if (this.socket) {
      this.socket.emit("get_poll_results", pollId)
    }
  }

  onVoteUpdate(callback: (data: VoteUpdateData) => void) {
    if (this.socket) {
      this.socket.on("vote_update", callback)
    }
  }

  onNewPoll(callback: (data: NewPollData) => void) {
    if (this.socket) {
      this.socket.on("new_poll", callback)
    }
  }

  onPollUpdate(callback: (data: PollUpdateData) => void) {
    if (this.socket) {
      this.socket.on("poll_update", callback)
    }
  }

  onPollResults(callback: (poll: Poll) => void) {
    if (this.socket) {
      this.socket.on("poll_results", callback)
    }
  }

  offVoteUpdate(callback: (data: VoteUpdateData) => void) {
    if (this.socket) {
      this.socket.off("vote_update", callback)
    }
  }

  offNewPoll(callback: (data: NewPollData) => void) {
    if (this.socket) {
      this.socket.off("new_poll", callback)
    }
  }

  offPollUpdate(callback: (data: PollUpdateData) => void) {
    if (this.socket) {
      this.socket.off("poll_update", callback)
    }
  }

  offPollResults(callback: (poll: Poll) => void) {
    if (this.socket) {
      this.socket.off("poll_results", callback)
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

export const wsManager = new WebSocketManager()
