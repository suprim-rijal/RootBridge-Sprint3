import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Circle, Lock, Play, Trophy, Volume2 } from "lucide-react";
import ProgressBar from "../../components/ProgressBar.jsx";
import TrackOff from "../../components/TrackOff.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getModule, getTrack, htmlLangOf, speechLangOf } from "../../data/curriculum.js";
import { moduleProgress, moduleStatus, trackOf, useProgress } from "../../lib/progress.js";
import { speakWord } from "../../lib/speech.js";

// /learn/:trackId/module/:moduleId — one module: goal, words, lessons, quest.
export default function ModulePage() {
  const { trackId, moduleId } = useParams();
  const { learningRules } = useAuth();
  const { state } = useProgress();
  const mod = getModule(moduleId);

  if (!mod) {
    return (
      <div className="path-page path-empty">
        <h1>We could not find that module</h1>
        <Link to={`/learn/${trackId === "culture" ? "culture" : "language"}`} className="btn btn-dark">
          Back to the path
        </Link>
      </div>
    );
  }
  // Wrong track in the URL: send to the right one.
  const realTrack = trackOf(mod.id);
  if (realTrack !== trackId) return <Navigate to={`/learn/${realTrack}/module/${mod.id}`} replace />;
  const track = getTrack(realTrack);
  if (!learningRules.allowedTracks[realTrack]) return <TrackOff title={track.title} />;

  const status = moduleStatus(state, mod.id);
  const progress = moduleProgress(state, mod.id);
  const nextId = mod.lessons.find((l) => !state.completedLessons.includes(l.id))?.id;
  const questReady = progress.done >= mod.lessons.length - 1;

  return (
    <div className={`path-page module-page ln-${realTrack}`}>
      <Link to={`/learn/${realTrack}`} className="back-link">
        <ArrowLeft size={16} aria-hidden="true" /> {track.title}
      </Link>

      <section className="module-card">
        <div className="ln-row">
          <span className="ln-badge track">{mod.code}</span>
          <span className="ln-badge gold">{mod.xp} XP</span>
          {status === "mastered" ? <span className="ln-badge green">Mastered</span> : null}
        </div>
        <h1>{mod.title}</h1>
        <p className="path-muted">{mod.goal}</p>
        <div className="continue-progress">
          <ProgressBar value={progress.pct} label="Module progress" />
          <span>
            {progress.done}/{progress.total}
          </span>
        </div>

        <h2 className="module-sub">Words</h2>
        <ul className="word-chips">
          {mod.items.map((item) => (
            <li key={item.np}>
              <button
                type="button"
                onClick={() =>
                  speakWord(item.np, {
                    lang: speechLangOf(mod.language),
                    englishFallback: `${item.rom}. It means ${item.en}.`,
                  })
                }
                title={`${item.en}. Tap to hear it.`}
              >
                <span lang={htmlLangOf(mod.language)}>{item.np}</span>
                <small>{item.rom}</small>
                <Volume2 size={13} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>

        <h2 className="module-sub">Lessons</h2>
        {status === "locked" ? (
          <p className="locked-note">
            <Lock size={14} aria-hidden="true" /> Finish the module before this one to open it.
          </p>
        ) : (
          <ol className="lesson-list">
            {mod.lessons.map((lesson, i) => {
              const done = state.completedLessons.includes(lesson.id);
              const isNext = lesson.id === nextId;
              return (
                <li key={lesson.id}>
                  <Link to={`/learn/${realTrack}/lesson/${lesson.id}`} className={`lesson-row ${isNext ? "is-next" : ""}`}>
                    {done ? (
                      <CheckCircle2 size={20} className="ic-green" aria-label="Done" />
                    ) : isNext ? (
                      <Play size={20} className="ic-track" aria-label="Next" />
                    ) : (
                      <Circle size={20} color="var(--line)" aria-label="Not started" />
                    )}
                    <span className="lesson-row-text">
                      <b>
                        {i + 1}. {lesson.title}
                      </b>
                      <small>
                        {lesson.phase} · {lesson.minutes} min
                      </small>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}

        <div className="quest-box">
          <Trophy size={20} aria-hidden="true" />
          <span>
            <b>Module quest</b>
            <small>{mod.testTasks} mixed tasks, no timer.</small>
          </span>
          {questReady && status !== "locked" ? (
            <Link to={`/learn/${realTrack}/module/${mod.id}/quest`} className="btn btn-primary btn-sm">
              {status === "mastered" ? "Play again" : "Start"}
            </Link>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" disabled>
              Finish lessons first
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
