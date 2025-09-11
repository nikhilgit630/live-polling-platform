# Move37 Ventures Real-Time Polling Application

A robust backend service for a real-time polling application built with Node.js, Express, PostgreSQL, Prisma, and WebSockets.

## 🚀 Features

- **User Management**: Registration, authentication, and profile management
- **Poll Creation**: Create polls with multiple options
- **Real-time Voting**: Cast votes with instant updates via WebSockets
- **Live Results**: Real-time poll results broadcasting
- **RESTful API**: Comprehensive REST endpoints for all operations
- **Database Relations**: Properly modeled one-to-many and many-to-many relationships
- **Security**: JWT authentication, rate limiting, input validation
- **Error Handling**: Comprehensive error handling and validation

## 🛠 Technologies

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.IO for WebSocket communication
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## 🔧 Installation & Setup

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd move37-polling-backend
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Environment Configuration

Copy the example environment file and configure your settings:

\`\`\`bash
cp .env.example .env
\`\`\`

Update the `.env` file with your configuration:

\`\`\`env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/polling_db?schema=public"

# JWT Secret (use a strong, random string in production)
JWT_SECRET="your-super-secret-jwt-key-here"

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Origins (comma-separated)
CORS_ORIGINS="http://localhost:3000,http://localhost:3001"
\`\`\`

### 4. Database Setup

Generate Prisma client and push the schema to your database:

\`\`\`bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# OR run migrations (for production)
npm run db:migrate
\`\`\`

### 5. Seed Database (Optional)

\`\`\`bash
npm run db:seed
\`\`\`

### 6. Start the Server

For development:
\`\`\`bash
npm run dev
\`\`\`

For production:
\`\`\`bash
npm start
\`\`\`

The server will start on `http://localhost:3000` (or your configured PORT).

## 📊 Database Schema

### Models and Relationships

#### User Model
- `id`: Unique identifier (CUID)
- `name`: User's display name
- `email`: Unique email address
- `passwordHash`: Bcrypt hashed password
- `createdAt`, `updatedAt`: Timestamps

#### Poll Model
- `id`: Unique identifier (CUID)
- `question`: Poll question text
- `isPublished`: Publication status
- `creatorId`: Foreign key to User (creator)
- `createdAt`, `updatedAt`: Timestamps

#### PollOption Model
- `id`: Unique identifier (CUID)
- `text`: Option text
- `pollId`: Foreign key to Poll

#### Vote Model
- `id`: Unique identifier (CUID)
- `userId`: Foreign key to User
- `pollOptionId`: Foreign key to PollOption
- `createdAt`: Timestamp
- Unique constraint on `(userId, pollOptionId)` to prevent duplicate votes

### Relationships
- **One-to-Many**: User → Polls, Poll → PollOptions
- **Many-to-Many**: User ↔ PollOptions (through Vote table)

## 🔌 API Endpoints

### Authentication
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user
- `GET /api/users/me` - Get current user profile (auth required)
- `GET /api/users` - Get all users (auth required)

### Polls
- `GET /api/polls` - Get all polls (query: `?published=true/false`)
- `GET /api/polls/:id` - Get specific poll by ID
- `POST /api/polls` - Create new poll (auth required)
- `GET /api/polls/user/me` - Get current user's polls (auth required)
- `PUT /api/polls/:id` - Update poll (auth required, creator only)
- `DELETE /api/polls/:id` - Delete poll (auth required, creator only)

### Votes
- `POST /api/votes/:pollOptionId` - Cast vote (auth required)
- `GET /api/votes/user/me` - Get current user's votes (auth required)
- `GET /api/votes/poll/:pollId` - Get votes for specific poll (auth required)
- `DELETE /api/votes/:voteId` - Remove vote (auth required, voter only)

### Utility
- `GET /health` - Health check endpoint
- `GET /api` - API documentation

## 🌐 WebSocket Events

### Client → Server Events

#### Authentication
\`\`\`javascript
socket.emit('authenticate', 'your-jwt-token')
\`\`\`

#### Poll Room Management
\`\`\`javascript
// Join a poll room for real-time updates
socket.emit('join_poll', 'poll-id')

// Leave a poll room
socket.emit('leave_poll', 'poll-id')

// Get current poll results
socket.emit('get_poll_results', 'poll-id')
\`\`\`

### Server → Client Events

#### Authentication Response
\`\`\`javascript
socket.on('authenticated', (data) => {
  console.log('User authenticated:', data.user)
})

socket.on('authentication_error', (error) => {
  console.log('Auth failed:', error.message)
})
\`\`\`

#### Poll Room Events
\`\`\`javascript
socket.on('joined_poll', (data) => {
  console.log('Joined poll:', data.pollId)
})

socket.on('poll_results', (pollData) => {
  console.log('Current results:', pollData)
})
\`\`\`

#### Real-time Updates
\`\`\`javascript
// Vote cast or removed
socket.on('vote_update', (data) => {
  console.log('Vote update:', data.vote)
  console.log('Updated results:', data.results)
})

// New poll created
socket.on('new_poll', (data) => {
  console.log('New poll:', data.poll)
})

// Poll updated (e.g., published)
socket.on('poll_update', (data) => {
  console.log('Poll updated:', data.poll)
})
\`\`\`

## 🧪 Testing the API

### Using cURL

#### Register a User
\`\`\`bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
\`\`\`

#### Login
\`\`\`bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
\`\`\`

#### Create a Poll
\`\`\`bash
curl -X POST http://localhost:3000/api/polls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "question": "What is your favorite programming language?",
    "options": ["JavaScript", "Python", "Go", "Rust"],
    "isPublished": true
  }'
\`\`\`

#### Cast a Vote
\`\`\`bash
curl -X POST http://localhost:3000/api/votes/POLL_OPTION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
\`\`\`

### Using a WebSocket Client

\`\`\`javascript
const io = require('socket.io-client')
const socket = io('http://localhost:3000')

// Authenticate
socket.emit('authenticate', 'your-jwt-token')

// Join a poll room
socket.on('authenticated', () => {
  socket.emit('join_poll', 'poll-id')
})

// Listen for real-time updates
socket.on('vote_update', (data) => {
  console.log('Real-time vote update:', data)
})
\`\`\`

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt with salt rounds for password security
- **Rate Limiting**: Prevents API abuse (100 requests per 15 minutes per IP)
- **Input Validation**: Comprehensive validation using express-validator
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet**: Security headers for Express applications
- **SQL Injection Prevention**: Prisma ORM provides built-in protection

## 📁 Project Structure

\`\`\`
src/
├── config/
│   ├── auth.js          # JWT configuration
│   └── database.js      # Prisma client setup
├── controllers/
│   ├── pollController.js    # Poll CRUD operations
│   ├── userController.js    # User management
│   └── voteController.js    # Voting logic
├── middleware/
│   ├── auth.js          # Authentication middleware
│   └── validation.js    # Input validation rules
├── routes/
│   ├── pollRoutes.js    # Poll API routes
│   ├── userRoutes.js    # User API routes
│   └── voteRoutes.js    # Vote API routes
├── utils/
│   └── errors.js        # Error handling utilities
├── websocket/
│   ├── events.js        # WebSocket event constants
│   └── socketManager.js # WebSocket server management
└── server.js            # Main application entry point
\`\`\`

## 🚀 Deployment

### Environment Variables for Production

\`\`\`env
NODE_ENV=production
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-jwt-secret"
PORT=3000
CORS_ORIGINS="https://yourdomain.com"
\`\`\`

### Docker Deployment (Optional)

Create a `Dockerfile`:

\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env file
   - Ensure database exists

2. **Prisma Client Error**
   - Run `npm run db:generate` after schema changes
   - Ensure database schema is up to date with `npm run db:push`

3. **WebSocket Connection Issues**
   - Check CORS_ORIGINS configuration
   - Verify JWT token is valid for authentication

4. **Port Already in Use**
   - Change PORT in .env file
   - Kill existing process: `lsof -ti:3000 | xargs kill -9`

## 📝 Development Notes

### Database Migrations

For production deployments, use migrations instead of `db:push`:

\`\`\`bash
# Create a new migration
npx prisma migrate dev --name your-migration-name

# Deploy migrations to production
npx prisma migrate deploy
\`\`\`

### Adding New Features

1. Update Prisma schema if needed
2. Generate new migration
3. Update controllers and routes
4. Add WebSocket events if real-time updates are needed
5. Update API documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For questions or issues, please:
1. Check the troubleshooting section
2. Review the API documentation at `/api`
3. Check the health endpoint at `/health`
4. Open an issue in the repository

---

**Move37 Ventures Backend Developer Challenge - Real-Time Polling Application**
