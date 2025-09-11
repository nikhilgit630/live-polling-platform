const express = require("express")
const { castVote, getUserVotes, getPollVotes, removeVote } = require("../controllers/voteController")
const { authenticateToken } = require("../middleware/auth")
const { validateVote } = require("../middleware/validation")

const router = express.Router()

// All vote routes require authentication
router.post("/:pollOptionId", authenticateToken, validateVote, castVote)
router.get("/user/me", authenticateToken, getUserVotes)
router.get("/poll/:pollId", authenticateToken, getPollVotes)
router.delete("/:voteId", authenticateToken, removeVote)

module.exports = router
