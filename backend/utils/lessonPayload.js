// Turns a module's words into simple multiple-choice prompts.
// Copied unchanged from Sprint 2 (mockApi.js / courseController.js), so
// GET /api/lessons/:id returns exactly the same JSON as before.
function buildLessonPayload(mod, lesson) {
  const words = mod.items.slice(0, 4);
  const prompts = words.map((word, i) => {
    const others = mod.items.filter((x) => x.np !== word.np && x.en !== word.en);
    const wrong = [...others.slice(i), ...others.slice(0, i)].slice(0, 2).map((x) => x.en);
    const options = [...new Set([word.en, ...wrong])];
    const shift = i % options.length;
    const rotated = [...options.slice(shift), ...options.slice(0, shift)];
    return {
      question: `What does ${word.np} (${word.rom}) mean?`,
      options: rotated,
      correctAnswer: rotated.indexOf(word.en),
    };
  });

  const first = mod.items[0];
  return {
    id: lesson.id,
    moduleId: mod.id,
    title: lesson.title,
    phase: lesson.phase,
    minutes: lesson.minutes,
    storyText: `${mod.title}: ${mod.goal}${first ? ` Today's first word is ${first.np} (${first.rom}), which means "${first.en}".` : ""}`,
    prompts,
  };
}

module.exports = { buildLessonPayload };
