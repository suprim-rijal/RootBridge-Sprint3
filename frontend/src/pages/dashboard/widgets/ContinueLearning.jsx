import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import ProgressBar from "../../../components/ProgressBar.jsx";
import { moduleProgress } from "../../../lib/progress.js";

// Widget 1: quick resume of the current lesson.
export default function ContinueLearning({ next, state }) {
  if (!next) {
    return (
      <section className="widget widget-continue" aria-labelledby="w-continue">
        <h2 id="w-continue" className="widget-title">
          Continue learning
        </h2>
        <p className="widget-muted">Both learning paths are turned off right now. Ask a parent to switch one on.</p>
      </section>
    );
  }

  const { track, module: mod, lesson, resuming } = next;
  const progress = moduleProgress(state, mod.id);
  const lessonNumber = mod.lessons.findIndex((l) => l.id === lesson.id) + 1;

  return (
    <section className={`widget widget-continue ln-${track.id}`} aria-labelledby="w-continue">
      <h2 id="w-continue" className="widget-title">
        Continue learning
      </h2>
      <p className="continue-track">
        {track.title} · {mod.code} {mod.title}
      </p>
      <p className="continue-lesson">{lesson.title}</p>
      <p className="widget-muted">
        Lesson {lessonNumber} of {mod.lessons.length} · about {lesson.minutes} minutes
      </p>
      <div className="continue-progress">
        <ProgressBar value={progress.pct} label="Module progress" />
        <span>
          {progress.done}/{progress.total}
        </span>
      </div>
      <div className="continue-actions">
        <Link to={`/learn/${track.id}/lesson/${lesson.id}`} className="btn btn-primary">
          <Play size={18} /> {resuming ? "Resume lesson" : "Start lesson"}
        </Link>
        <Link to={`/learn/${track.id}`} className="widget-link">
          Open the {track.id} path
        </Link>
      </div>
    </section>
  );
}
