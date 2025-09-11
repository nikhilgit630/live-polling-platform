const bcrypt = require("bcryptjs")
const prisma = require("../config/database")
const { generateToken } = require("../config/auth")
const { AppError, handleAsync } = require("../utils/errors")

// Register a new user
const registerUser = handleAsync(async (req, res) => {
  const { name, email, password } = req.body

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw new AppError("User with this email already exists", 400)
  }

  // Hash password
  const saltRounds = 12
  const passwordHash = await bcrypt.hash(password, saltRounds)

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  })

  // Generate JWT token
  const token = generateToken(user.id)

  res.status(201).json({
    message: "User registered successfully",
    user,
    token,
  })
})

// Login user
const loginUser = handleAsync(async (req, res) => {
  const { email, password } = req.body

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    throw new AppError("Invalid email or password", 401)
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401)
  }

  // Generate JWT token
  const token = generateToken(user.id)

  res.json({
    message: "Login successful",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    token,
  })
})

// Get current user profile
const getCurrentUser = handleAsync(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      _count: {
        select: {
          polls: true,
          votes: true,
        },
      },
    },
  })

  res.json({
    user,
  })
})

// Get all users (for admin purposes)
const getAllUsers = handleAsync(async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      _count: {
        select: {
          polls: true,
          votes: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  res.json({
    users,
    count: users.length,
  })
})

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  getAllUsers,
}
