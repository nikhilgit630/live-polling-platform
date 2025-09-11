const prisma = require("../config/database")
const { AppError, handleAsync } = require("../utils/errors")
const socketManager = require("../websocket/socketManager")

// Create a new poll
const createPoll = handleAsync(async (req, res) => {
  const { question, options, isPublished = false } = req.body
  const creatorId = req.user.id

  // Create poll with options in a transaction
  const poll = await prisma.$transaction(async (tx) => {
    // Create the poll
    const newPoll = await tx.poll.create({
      data: {
        question,
        isPublished,
        creatorId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Create poll options
    const pollOptions = await Promise.all(
      options.map((optionText) =>
        tx.pollOption.create({
          data: {
            text: optionText,
            pollId: newPoll.id,
          },
        }),
      ),
    )

    return {
      ...newPoll,
      options: pollOptions,
    }
  })

  // Broadcast new poll if it's published
  if (poll.isPublished) {
    await socketManager.broadcastNewPoll(poll)
  }

  res.status(201).json({
    message: "Poll created successfully",
    poll,
  })
})

// Get all polls
const getAllPolls = handleAsync(async (req, res) => {
  const { published } = req.query

  const whereClause = {}
  if (published !== undefined) {
    whereClause.isPublished = published === "true"
  }

  const polls = await prisma.poll.findMany({
    where: whereClause,
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
      _count: {
        select: {
          options: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Calculate total votes for each poll
  const pollsWithStats = polls.map((poll) => ({
    ...poll,
    totalVotes: poll.options.reduce((sum, option) => sum + option._count.votes, 0),
  }))

  res.json({
    polls: pollsWithStats,
    count: polls.length,
  })
})

// Get a specific poll by ID
const getPollById = handleAsync(async (req, res) => {
  const { id } = req.params

  const poll = await prisma.poll.findUnique({
    where: { id },
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
    throw new AppError("Poll not found", 404)
  }

  // Calculate total votes
  const totalVotes = poll.options.reduce((sum, option) => sum + option._count.votes, 0)

  res.json({
    poll: {
      ...poll,
      totalVotes,
    },
  })
})

// Get polls created by the current user
const getUserPolls = handleAsync(async (req, res) => {
  const creatorId = req.user.id

  const polls = await prisma.poll.findMany({
    where: { creatorId },
    include: {
      options: {
        include: {
          _count: {
            select: {
              votes: true,
            },
          },
        },
      },
      _count: {
        select: {
          options: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Calculate total votes for each poll
  const pollsWithStats = polls.map((poll) => ({
    ...poll,
    totalVotes: poll.options.reduce((sum, option) => sum + option._count.votes, 0),
  }))

  res.json({
    polls: pollsWithStats,
    count: polls.length,
  })
})

// Update poll (only creator can update)
const updatePoll = handleAsync(async (req, res) => {
  const { id } = req.params
  const { question, isPublished } = req.body
  const userId = req.user.id

  // Check if poll exists and user is the creator
  const existingPoll = await prisma.poll.findUnique({
    where: { id },
  })

  if (!existingPoll) {
    throw new AppError("Poll not found", 404)
  }

  if (existingPoll.creatorId !== userId) {
    throw new AppError("You can only update your own polls", 403)
  }

  const wasPublished = existingPoll.isPublished

  const updatedPoll = await prisma.poll.update({
    where: { id },
    data: {
      ...(question && { question }),
      ...(isPublished !== undefined && { isPublished }),
    },
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

  // Broadcast poll update
  await socketManager.broadcastPollUpdate(id, updatedPoll)

  res.json({
    message: "Poll updated successfully",
    poll: updatedPoll,
  })
})

// Delete poll (only creator can delete)
const deletePoll = handleAsync(async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  // Check if poll exists and user is the creator
  const existingPoll = await prisma.poll.findUnique({
    where: { id },
  })

  if (!existingPoll) {
    throw new AppError("Poll not found", 404)
  }

  if (existingPoll.creatorId !== userId) {
    throw new AppError("You can only delete your own polls", 403)
  }

  await prisma.poll.delete({
    where: { id },
  })

  res.json({
    message: "Poll deleted successfully",
  })
})

module.exports = {
  createPoll,
  getAllPolls,
  getPollById,
  getUserPolls,
  updatePoll,
  deletePoll,
}
