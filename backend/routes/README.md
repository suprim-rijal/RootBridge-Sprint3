# backend/routes

Addresses mapped to controllers. Each file is an Express Router mounted under a prefix in app.js, so authRoutes.js declares '/login' and the real address becomes /api/auth/login. Guards (protect, requireRole) are listed here, before the handler.

## Files in this folder

- **authRoutes.js** (Member 1) - Maps the /api/auth addresses to the auth controller, and slows down password guessing.
- **contactRoutes.js** (Member 5) - The public form, rate-limited, plus the token-protected read route.
- **courseRoutes.js** (Member 5) - Course reading routes, learners only.
- **groupRoutes.js** (Member 3) - All class routes, for both sides.
- **progressRoutes.js** (Member 5) - Progress and hearts, learners only.
- **pronunciationRoutes.js** (Member 5) - One route, with its own rate limit.
- **userRoutes.js** (Member 1) - Account changes, all requiring a login.
