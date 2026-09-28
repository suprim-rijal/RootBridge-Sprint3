# Who owns what

Ownership means: **you write the code there, and you review changes to it.**
It does not mean nobody else may ever touch the file - it means they ask first.

Why we do this: two people editing the same file on different branches is the only
reliable way to create a merge conflict. Split the files, and conflicts nearly vanish.

## Member 1 - Accounts and security

**Backend:** `controllers/authController.js`, `controllers/userController.js`,
`middleware/auth.js`, `models/User.js`, `utils/token.js`, `routes/authRoutes.js`,
`routes/userRoutes.js`
**Frontend:** `context/AuthContext.jsx`, `routes/guards.jsx`, `pages/auth/*`,
`pages/parent/*`, `components/PinDialog.jsx`, `components/ForgotPin.jsx`

**Know these cold:** bcrypt hashing and the pre-save hook, JWT signing and verifying,
why login gives the same message for a wrong password and an unknown email, and why the
parent PIN is hashed and checked on the server.

## Member 2 - Learning experience

**Backend:** `controllers/progressController.js`, `services/lives.js`,
`services/pronunciation.js`, `controllers/pronunciationController.js`, `models/Progress.js`
**Frontend:** `components/LessonEngine.jsx`, `components/PushToTalk.jsx`,
`components/OutOfLives.jsx`, `components/LivesBar.jsx`, `lib/exercises.js`,
`lib/progress.js`, `lib/lives.js`, `lib/speech.js`, `pages/learn/*`

**Know these cold:** the hearts rules and why only the server may change them, how a lesson's
exercises are planned from the track and phase, and how progress is saved locally and synced.

## Member 3 - Classes and teachers

**Backend:** `controllers/groupController.js`, `models/Group.js`, `models/Assignment.js`,
`models/Material.js`, `models/JoinRequest.js`, `services/fileStore.js`,
`middleware/upload.js`, `routes/groupRoutes.js`
**Frontend:** `pages/teacher/*`, `components/FindClass.jsx`, `components/JoinClassCard.jsx`,
`components/LiveClassBanner.jsx`, `pages/learn/MyClasses.jsx`

**Know these cold:** how a teacher owns a class and how that is enforced, the join code and the
request flow, why uploaded files live in MongoDB rather than on disk, and who may download them.

## Member 4 - Content and languages

**Backend:** `scripts/seed.js`, `models/Module.js`, `models/Track.js`, `models/Chapter.js`,
`controllers/courseController.js`, `services/contentIndex.js`, `utils/lessonPayload.js`
**Frontend:** `data/*`, `pages/auth/ChooseLanguage.jsx`, `pages/profile/PassportPage.jsx`

**Know these cold:** why the website and the database read the same content files, how ids are
prefixed per language, the four lesson phases, and how the active language changes the whole app.

## Member 5 - Quality, docs and deployment

**Backend:** `app.js`, `server.js`, `config/*`, `middleware/errorHandler.js`,
`middleware/logger.js`, `tests/*`
**Project:** `tests-e2e/*`, `postman/*`, `README.md`, `render.yaml`, `Dockerfile`,
`docker-compose.yml`, `.github/workflows/*`

**Know these cold:** middleware order, the error handler, how the tests use a real database,
and the deployment steps to Render and Atlas.
