# backend/services

Rules kept away from HTTP. These files know nothing about req and res, which is why they can be tested on their own: the hearts rules, pronunciation grading, the list of real lesson ids, and file storage in MongoDB.

## Files in this folder

- **contentIndex.js** (Member 4) - Holds every real lesson and module id in memory so claimed progress can be checked.
- **fileStore.js** (Member 3) - Stores uploaded files inside MongoDB using GridFS.
- **lives.js** (Member 2) - All the hearts rules in one file, with no database and no HTTP - which is why they can be tested with fixed clock times.
- **pronunciation.js** (Member 2) - Grading speech strictly, with an AI coach when a key is available and a stricter local check when it is not.
