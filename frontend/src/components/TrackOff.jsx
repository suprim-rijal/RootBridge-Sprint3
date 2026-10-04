import { Link } from "react-router-dom";
import { Lock } from "lucide-react";

// Shown when a parent has turned a learning path off.
export default function TrackOff({ title }) {
  return (
    <div className="ln-page-narrow ln-center">
      <div className="ln-card" style={{ marginTop: 24 }}>
        <Lock size={28} aria-hidden="true" />
        <h1 className="ln-h2">{title} is turned off</h1>
        <p className="ln-sub">A parent turned this path off in Parental Controls.</p>
        <p style={{ marginTop: 18 }}>
          <Link to="/dashboard" className="btn btn-primary btn-sm">
            Back to my dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
