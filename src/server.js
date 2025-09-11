require("dotenv").config()
const express = require("express")
const http = require("http")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")

// Import routes
const userRoutes = require("./routes/userRoutes")
const pollRoutes = require("./routes/pollRoutes")
const voteRoutes = require("./routes/voteRoutes")

// Import middleware and utilities
const { globalErrorHandler } = require("./utils/errors")
const socketManager = require("./websocket/socketManager")

const app = express()
const server = http.createServer(app)

// Initialize WebSocket
socketManager.initialize(server)

// Security middleware
app.use(helmet())

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
  credentials: true,
  optionsSuccessStatus: 200,
}
app.use(cors(corsOptions))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
})
app.use(limiter)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    websocket: {
      connectedUsers: socketManager.getConnectedUsersCount(),
      activePollRooms: socketManager.getActivePollRooms().length,
    },
  })
})

// API routes
app.use("/api/users", userRoutes)
app.use("/api/polls", pollRoutes)
app.use("/api/votes", voteRoutes)

// API documentation endpoint
app.get("/api", (req, res) => {
  res.json({
    message: "Move37 Ventures Polling API",
    version: "1.0.0",
    endpoints: {
      users: {
        "POST /api/users/register": "Register a new user",
        "POST /api/users/login": "Login user",
        "GET /api/users/me": "Get current user profile (auth required)",
        "GET /api/users": "Get all users (auth required)",
      },
      polls: {
        "GET /api/polls": "Get all polls (query: ?published=true/false)",
        "GET /api/polls/:id": "Get specific poll by ID",
        "POST /api/polls": "Create new poll (auth required)",
        "GET /api/polls/user/me": "Get current user's polls (auth required)",
        "PUT /api/polls/:id": "Update poll (auth required, creator only)",
        "DELETE /api/polls/:id": "Delete poll (auth required, creator only)",
      },
      votes: {
        "POST /api/votes/:pollOptionId": "Cast vote (auth required)",
        "GET /api/votes/user/me": "Get current user's votes (auth required)",
        "GET /api/votes/poll/:pollId": "Get votes for specific poll (auth required)",
        "DELETE /api/votes/:voteId": "Remove vote (auth required, voter only)",
      },
    },
    websocket: {
      url: `ws://localhost:${process.env.PORT || 3000}`,
      events: {
        authenticate: "Authenticate with JWT token",
        join_poll: "Join poll room for real-time updates",
        leave_poll: "Leave poll room",
        get_poll_results: "Get current poll results",
        vote_update: "Receive real-time vote updates",
        new_poll: "Receive notifications of new polls",
        poll_update: "Receive poll updates",
      },
    },
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  })
})

// Global error handler
app.use(globalErrorHandler)

// Start server
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 API Documentation: http://localhost:${PORT}/api`)
  console.log(`🔍 Health Check: http://localhost:${PORT}/health`)
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`)
})

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully")
  server.close(() => {
    console.log("Process terminated")
  })
})

module.exports = { app, server, socketManager }
