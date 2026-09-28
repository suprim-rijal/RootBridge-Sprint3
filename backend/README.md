# backend

The server. Node.js with Express. It answers every /api/... request, checks who is allowed to do what, and talks to MongoDB. It also serves the built website in production, so one web service runs everything.

## Folders inside

- `config/`
- `controllers/`
- `middleware/`
- `models/`
- `routes/`
- `scripts/`
- `services/`
- `tests/`
- `utils/`

## Files in this folder

- **app.js** (Member 5) - Defines what happens to every request: security headers, compression, JSON parsing, logging, the CORS rule for the API, all route groups, the built website, and finally the error handlers.
- **server.js** (Member 5) - The starting pistol.
