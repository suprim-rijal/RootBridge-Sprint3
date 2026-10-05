// =====================================================================
// Which lesson and module ids really exist.
// ---------------------------------------------------------------------
// The browser tells the server which lessons are finished. Without this
// list it could claim ANY id (or thousands of made-up ones), which would
// fake a teacher's roster and fill the database with rubbish. The ids
// are read once at start-up and kept in memory: 536 short strings.
// =====================================================================
const Module = require("../models/Module");

let lessonIds = new Set();
let moduleIds = new Set();

async function loadContentIndex() {
  const modules = await Module.find().select("id lessons.id").lean();
  moduleIds = new Set(modules.map((m) => m.id));
  lessonIds = new Set(modules.flatMap((m) => m.lessons.map((l) => l.id)));
  return { modules: moduleIds.size, lessons: lessonIds.size };
}

const isLesson = (id) => lessonIds.has(id);
const isModule = (id) => moduleIds.has(id);
// Before the first load (or an empty database) nothing is known: allow
// through rather than block learning, but say so.
const isReady = () => lessonIds.size > 0;

module.exports = { loadContentIndex, isLesson, isModule, isReady };
