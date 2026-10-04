# backend/models

The shape of the data. Each file is a Mongoose schema: which fields exist, their types, what is required, what is unique, which fields are hidden, and which indexes MongoDB should keep. Read these first: understanding the data explains most of the rest of the codebase.

## Files in this folder

- **Assignment.js** (Member 3) - Homework a teacher posts to one class.
- **Chapter.js** (Member 4) - A chapter inside a track, for example 'L1 Hello and first sounds'.
- **Group.js** (Member 3) - A teacher's class.
- **JoinRequest.js** (Member 3) - A learner asking a teacher to let them into a class.
- **Material.js** (Member 3) - A file or a link shared with a class.
- **Message.js** (Member 5) - A message from the public contact form.
- **Module.js** (Member 4) - A module: its vocabulary (items) and its four lessons.
- **Progress.js** (Member 2) - One document per learner: what they finished, their XP, their streak days and their hearts.
- **Track.js** (Member 4) - One learning path, such as 'nepali-language' or 'finnish-culture'.
- **User.js** (Member 1) - The account: who someone is, their hashed password, their hashed parent PIN, and their settings.
