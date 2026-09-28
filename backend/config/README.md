# backend/config

Settings read in one place. env.js loads and CHECKS the .env file (the app refuses to start when something essential is missing). db.js opens and closes the MongoDB connection. roles.js defines the three account types as constants so the same spelling is used everywhere.

## Files in this folder

- **db.js** (Member 5) - The single place that knows how to open, close and describe the MongoDB connection.
- **env.js** (Member 5) - Reads every setting from the environment in one place and refuses to start if something essential is missing.
- **roles.js** (Member 5) - Defines the three account types as constants, so the same spelling is used everywhere.
