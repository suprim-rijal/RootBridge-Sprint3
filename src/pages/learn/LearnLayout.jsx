import { Link, NavLink, Outlet } from "react-router-dom";
import { ArrowLeft, BookOpen, Landmark, Star } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { levelFromXp, useProgress } from "../../lib/progress.js";

// Layout for everything under /learn: its own top bar, separate from
// the site navbar, so the course feels like its own space.
const PATHS = [
  { id: "language", label: "Language path", icon: BookOpen },
  { id: "culture", label: "Culture path", icon: Landmark },
];

export default function LearnLayout() {
  const { learningRules } = useAuth();
  const { state } = useProgress();

  return (
    <div className="learn-shell">
      <header className="learn-bar">
        <Link to="/dashboard" className="learn-exit">
          <ArrowLeft size={17} aria-hidden="true" />
          <span>Dashboard</span>
        </Link>

        <nav className="learn-tabs" aria-label="Learning paths">
          {PATHS.filter((p) => learningRules.allowedTracks[p.id]).map(({ id, label, icon: Icon }) => (
            <NavLink key={id} to={`/learn/${id}`} className={({ isActive }) => `learn-tab ln-${id} ${isActive ? "active" : ""}`}>
              <Icon size={16} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <span className="learn-xp">
          <Star size={14} aria-hidden="true" /> {state.xp} XP · Level {levelFromXp(state.xp)}
        </span>
      </header>

      <main id="main" className="learn-main">
        <Outlet />
      </main>
    </div>
  );
}
