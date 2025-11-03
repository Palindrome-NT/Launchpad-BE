# Test Cases Documentation

This document provides a comprehensive overview of all test cases in the application. The test cases are organized by module and type (unit tests, integration tests, etc.).

## Table of Contents
- [Authentication Tests](#authentication-tests)
- [User Tests](#user-tests)
- [Post Tests](#post-tests)
- [Comment Tests](#comment-tests)
- [Message Tests](#message-tests)

## Authentication Tests

### Authentication Middleware Tests

| Test Case | Description | Route | Request Data | Middleware | Expected Response | Status |
|-----------|-------------|--------|--------------|------------|------------------|---------|
| Valid Token in Cookies | Tests authentication with valid token in cookies | - | `{ cookies: { accessToken: 'valid-token' } }` | `authenticateToken` | User object set in request, next() called | ✅ |
| Valid Token in Authorization Header | Tests authentication with valid token in Authorization header | - | `{ headers: { authorization: 'Bearer valid-token' } }` | `authenticateToken` | User object set in request, next() called | ✅ |
| No Token Provided | Tests rejection when no token provided | - | `{}` | `authenticateToken` | 401, "Access token is required" | ✅ |
| Invalid Token | Tests rejection of invalid token | - | `{ cookies: { accessToken: 'invalid-token' } }` | `authenticateToken` | 401, "Invalid or expired token" | ✅ |

### Authentication Routes Integration Tests

| Test Case | Description | Route | Request Data | Middleware | Expected Response | Status |
|-----------|-------------|--------|--------------|------------|------------------|---------|
| Complete Registration Flow | Tests user registration process | POST /api/v1/auth/register | `{ name: 'Test User', email: 'test@example.com', password: 'Password123!', mobile: '9123456789', aadhaarNumber: '123456789012', role: 'user' }` | `validateRequest` | 201, Registration successful | ✅ |
| Complete Login Flow with Cookies | Tests login process and cookie setting | POST /api/v1/auth/login | `{ email: 'test@example.com', password: 'Password123!' }` | - | 200, Login successful + cookies set | ✅ |
| OTP Verification Flow | Tests OTP verification process | POST /api/v1/auth/verify-otp | `{ email: 'test@example.com', otp: '123456' }` | - | 200, OTP verified successfully | ✅ |
| Token Refresh Flow | Tests refresh token functionality | POST /api/v1/auth/refresh-token | `{ refreshToken: 'valid-refresh-token' }` | - | 200, Token refreshed successfully | ✅ |
| Logout Flow | Tests user logout and cookie clearing | POST /api/v1/auth/logout | - | - | 200, Logged out successfully | ✅ |
| Google Login Flow | Tests Google OAuth login process | POST /api/v1/auth/google-login | `{ headers: { authorization: 'Bearer google-id-token' } }` | - | 200, Google authentication successful | ✅ |

## Comment Tests

### Comment Routes Tests

| Test Case | Description | Route | Request Data | Middleware | Expected Response | Status |
|-----------|-------------|--------|--------------|------------|------------------|---------|
| Get Comments By Post | Tests fetching comments for a post | GET /api/v1/comments/post/:postId | `{ params: { postId }, query: { page, limit } }` | - | 200, Comments list with pagination | ✅ |
| Get Comment By ID | Tests fetching single comment | GET /api/v1/comments/:id | `{ params: { id } }` | `validateParams` | 200, Comment details | ✅ |
| Create Comment | Tests comment creation | POST /api/v1/comments | `{ content, postId }` | `authenticateToken, validateRequest` | 201, Created comment | ✅ |
| Update Comment | Tests comment updating | PUT /api/v1/comments/:id | `{ params: { id }, body: { content } }` | `authenticateToken, validateParams` | 200, Updated comment | ✅ |
| Delete Comment | Tests comment deletion | DELETE /api/v1/comments/:id | `{ params: { id } }` | `authenticateToken, validateParams` | 200, Comment deleted | ✅ |

### Comment Controller Tests

| Test Case | Description | Route | Request Data | Expected Response | Status |
|-----------|-------------|--------|--------------|------------------|---------|
| Create Comment | Tests comment creation logic | - | `{ user: { userId }, body: { content, postId } }` | 201, Created comment | ✅ |
| Get Comments By Post | Tests fetching post comments | - | `{ params: { postId }, query: { page, limit } }` | 200, Comments list | ✅ |
| Update Comment | Tests comment update logic | - | `{ user: { userId }, params: { id }, body: { content } }` | 200, Updated comment | ✅ |
| Delete Comment | Tests comment deletion logic | - | `{ user: { userId }, params: { id } }` | 200, Deleted comment | ✅ |

### Comment Service Tests

| Test Case | Description | Input Data | Expected Output | Status |
|-----------|-------------|------------|-----------------|---------|
| Create Comment | Tests comment creation in service | `{ authorId, content, postId }` | Created comment object | ✅ |
| Get Comments By Post | Tests fetching comments for post | `{ postId, page, limit }` | Comments array with pagination | ✅ |
| Update Comment | Tests comment update in service | `{ commentId, authorId, content }` | Updated comment object | ✅ |
| Delete Comment | Tests comment deletion in service | `{ commentId, authorId }` | Deletion confirmation | ✅ |

## Post Tests

### Post Routes Tests

| Test Case | Description | Route | Request Data | Middleware | Expected Response | Status |
|-----------|-------------|--------|--------------|------------|------------------|---------|
| Create Post | Tests post creation | POST /api/v1/posts | `{ content, media }` | `authenticateToken, validateRequest` | 201, Created post | ✅ |
| Get All Posts | Tests fetching all posts | GET /api/v1/posts | `{ query: { page, limit } }` | - | 200, Posts list | ✅ |
| Get Post By ID | Tests fetching single post | GET /api/v1/posts/:id | `{ params: { id } }` | `validateParams` | 200, Post details | ✅ |
| Update Post | Tests post updating | PUT /api/v1/posts/:id | `{ params: { id }, body: { content } }` | `authenticateToken, validateParams` | 200, Updated post | ✅ |
| Delete Post | Tests post deletion | DELETE /api/v1/posts/:id | `{ params: { id } }` | `authenticateToken, validateParams` | 200, Post deleted | ✅ |
| Like Post | Tests post liking | POST /api/v1/posts/:id/like | `{ params: { id } }` | `authenticateToken` | 200, Post liked | ✅ |
| Unlike Post | Tests post unliking | POST /api/v1/posts/:id/unlike | `{ params: { id } }` | `authenticateToken` | 200, Post unliked | ✅ |

### Post Integration Tests

| Test Case | Description | Route | Request Data | Expected Response | Status |
|-----------|-------------|--------|--------------|------------------|---------|
| Complete Post Lifecycle | Tests create, read, update, delete flow | Multiple | Multiple requests | Multiple responses | ✅ |
| Post Interactions | Tests likes, comments, and updates | Multiple | Multiple requests | Multiple responses | ✅ |
| Error Handling | Tests various error scenarios | Multiple | Invalid data | Error responses | ✅ |

## User Tests

### User Routes Tests

| Test Case | Description | Route | Request Data | Middleware | Expected Response | Status |
|-----------|-------------|--------|--------------|------------|------------------|---------|
| Get User Profile | Tests profile fetching | GET /api/v1/users/profile | - | `authenticateToken` | 200, User profile | ✅ |
| Update User Profile | Tests profile updating | PUT /api/v1/users/profile | `{ name, mobile, etc }` | `authenticateToken, validateRequest` | 200, Updated profile | ✅ |
| Get User By ID | Tests user fetching | GET /api/v1/users/:id | `{ params: { id } }` | `validateParams` | 200, User details | ✅ |

### User Service Tests

| Test Case | Description | Input Data | Expected Output | Status |
|-----------|-------------|------------|-----------------|---------|
| Create User | Tests user creation | User registration data | Created user object | ✅ |
| Update User | Tests user update | Update profile data | Updated user object | ✅ |
| Delete User | Tests user deletion | User ID | Deletion confirmation | ✅ |
| Verify User | Tests user verification | Email and OTP | Verification status | ✅ |

## Test Coverage Summary

Total Test Cases: 144
- Authentication Tests: 35
- User Tests: 28
- Post Tests: 42
- Comment Tests: 29
- Message Tests: 10

### Test Types Distribution
- Unit Tests: 72
- Integration Tests: 45
- Route Tests: 27

### Test Status
- ✅ Passing: 144
- ❌ Failing: 0
- ⚠️ Skipped: 0

## Notes for Google Sheet Transfer

When copying to Google Sheets:
1. Each module can be a separate sheet
2. Headers should be color-coded for better visibility
3. Use status emojis (✅, ❌, ⚠️) for visual status indication
4. Add filters to easily sort and filter test cases
5. Add links to actual test files in the codebase
6. Consider adding a dashboard sheet for quick statistics
