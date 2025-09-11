class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

const handleAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || "error"

  if (process.env.NODE_ENV === "development") {
    console.error("Error:", err)
  }

  // Prisma errors
  if (err.code === "P2002") {
    return res.status(400).json({
      error: "Duplicate entry",
      message: "A record with this information already exists",
    })
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      error: "Not found",
      message: "The requested resource was not found",
    })
  }

  // Operational errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message,
    })
  }

  // Programming or unknown errors
  res.status(500).json({
    error: "Something went wrong",
    ...(process.env.NODE_ENV === "development" && { details: err.message }),
  })
}

module.exports = {
  AppError,
  handleAsync,
  globalErrorHandler,
}
