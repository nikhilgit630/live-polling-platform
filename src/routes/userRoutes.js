const express = require("express")
const { registerUser, loginUser, getCurrentUser, getAllUsers } = require("../controllers/userController")
const { authenticateToken } = require("../middleware/auth")
const { validateUserRegistration, validateUserLogin } = require("../middleware/validation")

const router = express.Router()

// Public routes
router.post("/register", validateUserRegistration, registerUser)
router.post("/login", validateUserLogin, loginUser)

// Protected routes
router.get("/me", authenticateToken, getCurrentUser)
router.get("/", authenticateToken, getAllUsers)

module.exports = router
