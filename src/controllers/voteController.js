const prisma = require("../config/database")
const { AppError, handleAsync } = require("../utils/errors")
const socketManager = require("../websocket/socketManager")

// Cast a vote
const castVote = handleAsync(async (req, res) => {
  const { pollOptionId } = req.params
  const userId = req.user.id

  // Check if poll option exists
  const pollOption = await prisma.pollOption.findUnique({
    where: { id: pollOptionId },
    include: {
      poll: {
        select: {
          id: true,
          isPublished: true,
        },
      },
    },
  })

  if (!pollOption) {
    throw new AppError("Poll option not found", 404)
  }

  if (!pollOption.poll.isPublished) {
    throw new AppError("Cannot vote on unpublished poll", 400)
  }

  // Check if user has already voted on this poll
  const existingVoteOnPoll = await prisma.vote.findFirst({
    where: {
      userId,
      pollOption: {
        pollId: pollOption.poll.id,
      },
    },
  })

  if (existingVoteOnPoll) {
    throw new AppError("You have already voted on this poll", 400)
  }

  // Create the vote
  const vote = await prisma.vote.create({
    data: {
      userId,
      pollOptionId,
    },
    include: {
      pollOption: {
        include: {
          poll: {
            select: {
              id: true,
              question: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  // Get updated poll results for real-time broadcasting
  const updatedPoll = await prisma.poll.findUnique({
    where: { id: pollOption.poll.id },
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
    },
  })

  // Broadcast real-time update
  await socketManager.broadcastVoteUpdate(pollOption.poll.id, {
    id: vote.id,
    user: vote.user,
    pollOption: {
      id: vote.pollOption.id,
      text: vote.pollOption.text,
    },
    createdAt: vote.createdAt,
  })

  res.status(201).json({
    message: "Vote cast successfully",
    vote: {
      id: vote.id,
      createdAt: vote.createdAt,
      pollOption: {
        id: vote.pollOption.id,
        text: vote.pollOption.text,
      },
      poll: vote.pollOption.poll,
    },
    updatedPoll,
  })
})

// Get user's votes
const getUserVotes = handleAsync(async (req, res) => {
  const userId = req.user.id

  const votes = await prisma.vote.findMany({
    where: { userId },
    include: {
      pollOption: {
        include: {
          poll: {
            select: {
              id: true,
              question: true,
              createdAt: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  res.json({
    votes,
    count: votes.length,
  })
})

// Get votes for a specific poll (detailed results)
const getPollVotes = handleAsync(async (req, res) => {
  const { pollId } = req.params

  // Check if poll exists
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
  })

  if (!poll) {
    throw new AppError("Poll not found", 404)
  }

  const votes = await prisma.vote.findMany({
    where: {
      pollOption: {
        pollId,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      pollOption: {
        select: {
          id: true,
          text: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  res.json({
    votes,
    count: votes.length,
  })
})

// Remove vote (allow users to change their vote)
const removeVote = handleAsync(async (req, res) => {
  const { voteId } = req.params
  const userId = req.user.id

  // Check if vote exists and belongs to user
  const vote = await prisma.vote.findUnique({
    where: { id: voteId },
    include: {
      pollOption: {
        include: {
          poll: {
            select: {
              id: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!vote) {
    throw new AppError("Vote not found", 404)
  }

  if (vote.userId !== userId) {
    throw new AppError("You can only remove your own votes", 403)
  }

  await prisma.vote.delete({
    where: { id: voteId },
  })

  // Get updated poll results for real-time broadcasting
  const updatedPoll = await prisma.poll.findUnique({
    where: { id: vote.pollOption.poll.id },
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
    },
  })

  // Broadcast real-time update
  await socketManager.broadcastVoteUpdate(vote.pollOption.poll.id, {
    id: vote.id,
    user: vote.user,
    pollOption: {
      id: vote.pollOption.id,
      text: vote.pollOption.text,
    },
    removed: true,
    createdAt: vote.createdAt,
  })

  res.json({
    message: "Vote removed successfully",
    updatedPoll,
  })
})

module.exports = {
  castVote,
  getUserVotes,
  getPollVotes,
  removeVote,
}
