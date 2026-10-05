import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, HeartCrack, RefreshCw } from "lucide-react";
import { timeUntil } from "../lib/lives.js";
import { getChapterOfModule, getLesson, getModule, getTrackOfChapter } from "../data/curriculum.js";

// Shown instead of the exercise when a Normal learner has 0 hearts.
// Two honest ways back (there is nothing to buy in RootBridge):
//   1. practise a lesson from a module you already mastered (+1 heart)
//   2. wait: a new heart arrives every 4 hours
export default function OutOfLives({ nextHeartAt, masteredModules = [], completedLessons = [], onRefresh }) {
  // Re-draw every 30 seconds so the countdown stays right.
  const [, tick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  // A review lesson: the last lesson the learner actually finished. (Any
  // finished lesson counts, so there is always a way back.)
  const reviewLessonId = [...completedLessons].reverse()[0] ?? null;
  const found = reviewLessonId ? getLesson(reviewLessonId) : null;
  const reviewModule = found?.module ?? [...masteredModules].reverse().map(getModule).find(Boolean) ?? null;
  const reviewLesson = found?.lesson ?? reviewModule?.lessons[0] ?? null;
  const reviewTrack = reviewModule ? getTrackOfChapter(getChapterOfModule(reviewModule.id).id) : null;

  return (
    <div className="ln-card warn ln-out-of-lives" role="status">
      <HeartCrack size={34} aria-hidden="true" />
      <h2 className="ln-title">Out of hearts</h2>
      <p className="ln-sub">Take a short break from new questions. Here is how to get a heart back:</p>

      <div className="ln-out-options">
        {reviewLesson ? (
          <div className="ln-out-option">
            <RefreshCw size={18} aria-hidden="true" />
            <div>
              <b>Practise a lesson you already know</b>
              <p className="ln-muted">
                Finish “{reviewLesson.title}” ({reviewModule.code}) without mistakes or hints to earn 1 heart. Review mode never costs hearts.
              </p>
              <Link to={`/learn/${reviewTrack.id}/lesson/${reviewLesson.id}?review=1`} className="btn btn-green btn-sm">
                Start the review
              </Link>
            </div>
          </div>
        ) : null}
        <div className="ln-out-option">
          <Clock size={18} aria-hidden="true" />
          <div>
            <b>Come back a little later</b>
            <p className="ln-muted">
              {nextHeartAt ? `Your next heart arrives in ${timeUntil(nextHeartAt)}.` : "A new heart arrives every 4 hours."}{" "}
              Finishing a module quest fills all 7 hearts.
            </p>
            {onRefresh ? (
              <button type="button" className="btn btn-ghost btn-sm" onClick={onRefresh}>
                Check again
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
