const { body, param, validationResult } = require("express-validator")

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    })
  }
  next()
}

// User validation rules
const validateUserRegistration = [
  body("name").trim().isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  handleValidationErrors,
]

const validateUserLogin = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
]

// Poll validation rules
const validatePollCreation = [
  body("question").trim().isLength({ min: 5, max: 200 }).withMessage("Question must be between 5 and 200 characters"),
  body("options").isArray({ min: 2, max: 10 }).withMessage("Poll must have between 2 and 10 options"),
  body("options.*")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Each option must be between 1 and 100 characters"),
  handleValidationErrors,
]

// Vote validation rules
const validateVote = [
  param("pollOptionId").isString().notEmpty().withMessage("Poll option ID is required"),
  handleValidationErrors,
]

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validatePollCreation,
  validateVote,
  handleValidationErrors,
}
