import { Flame } from "lucide-react";
import { DAY_LABELS } from "../../../lib/learningSummary.js";

// Widget 2: current day streak + the last 7 days.
export default function StreakWidget({ summary, rhythmDays }) {
  const { streak, bestStreak, learnedToday, week } = summary;

  const note =
    streak === 0
      ? "Finish a lesson today to start a streak."
      : learnedToday
        ? "You learned today. See you tomorrow!"
        : "Learn today to keep your streak going.";

  return (
    <section className="widget widget-streak" aria-labelledby="w-streak">
      <h2 id="w-streak" className="widget-title">
        Streak
      </h2>
      <div className="streak-main">
        <Flame size={34} className={streak ? "streak-flame on" : "streak-flame"} aria-hidden="true" />
        <span className="streak-number">{streak}</span>
        <span className="streak-unit">day{streak === 1 ? "" : "s"}</span>
      </div>
      <p className="widget-muted">{note}</p>
      <ul className="streak-week" aria-label="Last 7 days">
        {week.map(({ date, weekday }) => {
          const done = rhythmDays.includes(date);
          return (
            <li key={date} className={done ? "on" : ""}>
              <span aria-hidden="true" />
              <small>{DAY_LABELS[weekday]}</small>
              <span className="sr-only">{done ? "learned" : "no lesson"}</span>
            </li>
          );
        })}
      </ul>
      <p className="streak-best">Best streak: {bestStreak} day{bestStreak === 1 ? "" : "s"}</p>
    </section>
  );
}
