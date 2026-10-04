# backend/controllers

The logic behind each endpoint. A controller receives the request, checks the input, asks the models for data, applies the rules, and sends an answer. Controllers never build URLs and never contain HTML.

## Files in this folder

- **authController.js** (Member 1) - Creating accounts and logging in: the security-critical path.
- **contactController.js** (Member 5) - The public contact form, and a way to read what it collects.
- **courseController.js** (Member 4) - Reading course content: tracks, chapters, modules and lessons.
- **groupController.js** (Member 3) - Classes: creating them, joining by code or by request, homework, materials and the roster.
- **progressController.js** (Member 2) - Saving progress and running the hearts rules.
- **pronunciationController.js** (Member 2) - Grading a spoken attempt.
- **userController.js** (Member 1) - Changing your own account: name, photo, language, parent settings and PIN.
