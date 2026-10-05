// =====================================================================
// RootBridge backend (Sprint 3): check .env -> connect to MongoDB -> listen.
// Start with:  npm run dev   ->  http://localhost:5000
// =====================================================================
const { env, assertEnv } = require("./config/env");
const { connectDB, disconnectDB } = require("./config/db");
const { loadContentIndex } = require("./services/contentIndex");

async function start() {
  try {
    assertEnv();
    await connectDB();
    // Which lesson and module ids exist, so claimed progress can be checked.
    const counts = await loadContentIndex();
    console.log(`Content loaded: ${counts.modules} modules, ${counts.lessons} lessons`);
    if (counts.lessons === 0) console.warn('No courses in the database yet. Run "npm run seed".');
    const app = require("./app");
    const server = app.listen(env.port, () =>
      console.log(`RootBridge backend running on http://localhost:${env.port} (${env.nodeEnv})`),
    );

    // Hosting platforms stop the app with SIGTERM when they redeploy:
    // finish open requests, close the database, then exit.
    const shutdown = (signal) => {
      console.log(`${signal} received: shutting down`);
      server.close(async () => {
        await disconnectDB().catch(() => {});
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000).unref();
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    console.error(`Could not start: ${err.message}`);
    process.exit(1);
  }
}

start();
