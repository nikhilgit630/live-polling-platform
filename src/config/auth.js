const jwt = require("jsonwebtoken")

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key"
const JWT_EXPIRES_IN = "7d"

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET)
}

module.exports = {
  generateToken,
  verifyToken,
  JWT_SECRET,
}
