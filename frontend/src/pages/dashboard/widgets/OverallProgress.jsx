import { Link } from "react-router-dom";
import ProgressBar from "../../../components/ProgressBar.jsx";

// Widget 5: completion across both learning paths.
const PATHS = [
  { id: "language", title: "Language path" },
  { id: "culture", title: "Culture path" },
];

export default function OverallProgress({ overall, allowedTracks }) {
  const pct = overall.pct;
  // SVG ring: circumference of r=42 is about 263.9
  const circumference = 2 * Math.PI * 42;

  return (
    <section className="widget widget-progress" aria-labelledby="w-progress">
      <h2 id="w-progress" className="widget-title">
        Overall progress
      </h2>
      <div className="progress-top">
        <svg className="progress-ring" viewBox="0 0 100 100" role="img" aria-label={`${pct.toFixed(1)} percent complete`}>
          <circle cx="50" cy="50" r="42" className="ring-bg" />
          <circle
            cx="50"
            cy="50"
            r="42"
            className="ring-fill"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct / 100)}
          />
          <text x="50" y="55" textAnchor="middle">
            {pct < 10 ? pct.toFixed(1) : Math.round(pct)}%
          </text>
        </svg>
        <dl className="progress-facts">
          <div>
            <dt>Lessons</dt>
            <dd>
              {overall.done} / {overall.lessons}
            </dd>
          </div>
          <div>
            <dt>Modules mastered</dt>
            <dd>
              {overall.mastered} / {overall.modules}
            </dd>
          </div>
        </dl>
      </div>

      <ul className="progress-paths">
        {PATHS.map(({ id, title }) => {
          const t = overall.tracks[id];
          const on = allowedTracks[id];
          return (
            <li key={id} className={`ln-${id}`}>
              <div className="progress-path-top">
                {on ? <Link to={`/learn/${id}`}>{title}</Link> : <span>{title} (turned off)</span>}
                <small>
                  {t.doneLessons}/{t.lessons}
                </small>
              </div>
              <ProgressBar value={t.pct} label={`${title} progress`} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
