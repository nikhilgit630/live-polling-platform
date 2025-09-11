const express = require("express")
const {
  createPoll,
  getAllPolls,
  getPollById,
  getUserPolls,
  updatePoll,
  deletePoll,
} = require("../controllers/pollController")
const { authenticateToken } = require("../middleware/auth")
const { validatePollCreation } = require("../middleware/validation")

const router = express.Router()

// Public routes
router.get("/", getAllPolls)
router.get("/:id", getPollById)

// Protected routes
router.post("/", authenticateToken, validatePollCreation, createPoll)
router.get("/user/me", authenticateToken, getUserPolls)
router.put("/:id", authenticateToken, updatePoll)
router.delete("/:id", authenticateToken, deletePoll)

module.exports = router
