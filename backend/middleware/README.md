# backend/middleware

Functions that see a request before the controller does: proving who you are (auth), turning any failure into clean JSON (errorHandler), one log line per request (logger), and the rules for file uploads (upload).

## Files in this folder

- **auth.js** (Member 1) - Two gatekeepers: one proves who you are, one checks what you may do.
- **errorHandler.js** (Member 5) - Turns every possible failure into the same clean JSON shape, and hides internal details in production.
- **logger.js** (Member 5) - One readable line per request.
- **upload.js** (Member 3) - The rules for uploading class materials: how big, what kind, and where they go.
