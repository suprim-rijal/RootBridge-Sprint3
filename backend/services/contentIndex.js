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
