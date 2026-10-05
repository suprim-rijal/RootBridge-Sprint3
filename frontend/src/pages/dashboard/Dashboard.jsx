import { useAuth } from "../../context/AuthContext.jsx";
import LiveClassBanner from "../../components/LiveClassBanner.jsx";
import { curriculumFor, htmlLangOf } from "../../data/curriculum.js";
import { continueLearning, overallProgress, summarize } from "../../lib/learningSummary.js";
import { useProgress } from "../../lib/progress.js";
import ContinueLearning from "./widgets/ContinueLearning.jsx";
import CulturalFact from "./widgets/CulturalFact.jsx";
import OverallProgress from "./widgets/OverallProgress.jsx";
import StreakWidget from "./widgets/StreakWidget.jsx";
import WordOfTheDay from "./widgets/WordOfTheDay.jsx";

// =====================================================================
// /dashboard — the central hub (not the course itself).
// Exactly five widgets:
//   Continue learning · Streak · Word of the day · Cultural fact ·
//   Overall progress
// The courses live on their own pages: /learn/language, /learn/culture.
// Data: progress from lib/progress.js (localStorage, per user).
// =====================================================================

export default function Dashboard() {
  const { learnerName, learningRules } = useAuth();
  const { state } = useProgress();

  const summary = summarize(state);
  const next = continueLearning(state, learningRules.allowedTracks);
  const overall = overallProgress(state);

  return (
    <div className="dash">
      <header className="dash-head">
        {/* "Hello" in the learner's own language */}
        <p className="dash-hello" lang={htmlLangOf()}>
          {curriculumFor().greeting}
        </p>
        <h1>Hi, {learnerName}</h1>
      </header>

      <LiveClassBanner />

      <div className="dash-grid">
        <ContinueLearning next={next} state={state} />
        <StreakWidget summary={summary} rhythmDays={state.rhythmDays} />
        <WordOfTheDay />
        <CulturalFact />
        <OverallProgress overall={overall} allowedTracks={learningRules.allowedTracks} />
      </div>
    </div>
  );
}
