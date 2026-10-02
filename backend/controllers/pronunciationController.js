// POST /api/pronunciation/grade
// body: { language, targetNative, targetRomanization, targetMeaning,
//         transcripts: [{ text, confidence }], attemptNumber }
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { grade, LANGUAGE_NAMES } = require("../services/pronunciation");

const gradePronunciation = asyncHandler(async (req, res) => {
  const { language = "nepali", targetNative, targetRomanization = "", targetMeaning = "", transcripts, attemptNumber = 1 } =
    req.body || {};

  if (!LANGUAGE_NAMES[language]) throw new AppError("Unknown language.", 400);
  if (!targetNative || typeof targetNative !== "string") throw new AppError("Send the targetNative word.", 400);
  if (!Array.isArray(transcripts)) throw new AppError("transcripts must be a list.", 400);

  const clean = transcripts
    .slice(0, 5)
    .map((t) => ({ text: String(t?.text ?? "").slice(0, 200), confidence: Math.max(0, Math.min(1, Number(t?.confidence) || 0)) }));

  const data = await grade({
    language,
    targetNative: targetNative.slice(0, 120),
    targetRomanization: String(targetRomanization).slice(0, 120),
    targetMeaning: String(targetMeaning).slice(0, 120),
    transcripts: clean,
    attemptNumber: Math.max(1, Math.min(20, Number(attemptNumber) || 1)),
  });
  res.json({ success: true, data });
});

module.exports = { gradePronunciation };
