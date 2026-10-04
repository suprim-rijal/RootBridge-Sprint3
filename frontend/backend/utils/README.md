# backend/utils

Small helpers used everywhere: an error type that carries an HTTP status, a wrapper that removes try/catch from every controller, JWT signing, and the lesson question builder.

## Files in this folder

- **AppError.js** (Member 5) - An error we throw on purpose, carrying an HTTP status code.
- **asyncHandler.js** (Member 5) - Removes a try/catch from every single controller.
- **lessonPayload.js** (Member 4) - Turns a module's vocabulary into simple multiple-choice questions for the API.
- **token.js** (Member 1) - Creates and checks the login token (JWT).
