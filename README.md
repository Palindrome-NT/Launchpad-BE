# Launchpad Backend API

A robust Express.js backend API for the Launchpad social media application, built with TypeScript and clean architecture principles.

## Features

- 🔐 **Authentication & Authorization**: JWT-based authentication with refresh tokens
- 📱 **User Management**: Registration, verification, profile management
- 📝 **Posts**: Create, read, update, delete posts with media support
- 💬 **Comments**: Full comment system with threading support
- 📨 **Messaging**: Real-time messaging with Socket.IO
- 🎯 **Clean Architecture**: Well-organized, maintainable codebase
- 🧪 **Testing**: Comprehensive test suite with Jest
- 📚 **TypeScript**: Full type safety and IntelliSense support

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with refresh tokens
- **Real-time**: Socket.IO
- **Validation**: Joi
- **Testing**: Jest, Supertest
- **Linting**: ESLint
- **Email**: Nodemailer

## Project Structure

```
src/
├── config/           # Database and other configurations
├── controllers/      # Request handlers (controllers)
├── middlewares/      # Express middlewares
├── models/          # Mongoose models
├── routes/          # API routes
├── services/        # Business logic (future use)
├── utils/           # Utility functions
└── __tests__/       # Test files
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd launchpad-be
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` with your configuration:
   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=27017
   DB_NAME=launchpad

   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-super-secret-refresh-key
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d

   # Email (optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password

   # Server
   PORT=5000
   NODE_ENV=development
   API_URL=http://localhost:5000
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/verify-otp` - Verify OTP
- `POST /api/v1/auth/resend-otp` - Resend OTP
- `POST /api/v1/auth/refresh-token` - Refresh access token

### Users
- `GET /api/v1/users/profile` - Get user profile
- `GET /api/v1/users` - Get all users (admin only)
- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/profile` - Update profile
- `DELETE /api/v1/users` - Delete account

### Posts
- `GET /api/v1/posts` - Get all posts
- `GET /api/v1/posts/:id` - Get post by ID
- `GET /api/v1/posts/user/:userId` - Get posts by user
- `POST /api/v1/posts` - Create post (authenticated)
- `PUT /api/v1/posts/:id` - Update post (authenticated)
- `DELETE /api/v1/posts/:id` - Delete post (authenticated)
- `POST /api/v1/posts/:id/like` - Like post (authenticated)

### Comments
- `GET /api/v1/comments/post/:postId` - Get comments for a post
- `GET /api/v1/comments/user/:userId` - Get comments by user
- `GET /api/v1/comments/:id` - Get comment by ID
- `POST /api/v1/comments` - Create comment (authenticated)
- `PUT /api/v1/comments/:id` - Update comment (authenticated)
- `DELETE /api/v1/comments/:id` - Delete comment (authenticated)

### Messages
- `GET /api/v1/messages/conversations` - Get all conversations (authenticated)
- `GET /api/v1/messages/conversation/:recipientId` - Get conversation (authenticated)
- `GET /api/v1/messages/unread-count` - Get unread count (authenticated)
- `POST /api/v1/messages` - Send message (authenticated)
- `PUT /api/v1/messages/mark-read/:senderId` - Mark as read (authenticated)
- `DELETE /api/v1/messages/:id` - Delete message (authenticated)

## Development

### Available Scripts

```bash
# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

### Code Quality

This project uses ESLint for code quality. Run linting:

```bash
npm run lint
```

Auto-fix linting issues:

```bash
npm run lint:fix
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Refresh Tokens**: Long-lived refresh tokens for better UX
- **Input Validation**: Comprehensive validation using Joi
- **Rate Limiting**: Protection against brute force attacks (configurable)
- **CORS**: Configurable Cross-Origin Resource Sharing
- **Helmet**: Security headers
- **Input Sanitization**: Protection against XSS attacks

## Real-time Features

The API supports real-time messaging using Socket.IO:

- **Live Chat**: Real-time messaging between users
- **Typing Indicators**: Show when users are typing
- **Online Status**: Track user online/offline status
- **Message Notifications**: Real-time notifications for new messages

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support, email support@launchpad.com or create an issue in the repository.

## Roadmap

- [ ] File upload functionality for media
- [ ] Advanced search and filtering
- [ ] Admin dashboard API
- [ ] API rate limiting
- [ ] Caching with Redis
- [ ] Message encryption
- [ ] Push notifications
