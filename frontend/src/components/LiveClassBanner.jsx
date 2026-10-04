import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Video } from "lucide-react";
import { myClasses } from "../services/api.js";

// A slim banner on the dashboard when one of the learner's classes has a
// live lesson link. (A banner, not a widget: the dashboard keeps its five
// widgets.) Nothing is shown when there is no live link.
export default function LiveClassBanner() {
  const [live, setLive] = useState([]);

  useEffect(() => {
    let alive = true;
    myClasses()
      .then((res) => alive && setLive(res.data.filter((c) => c.liveClassUrl)))
      .catch(() => {}); // the banner is optional: never break the dashboard
    return () => {
      alive = false;
    };
  }, []);

  if (!live.length) return null;
  return (
    <div className="live-banner" role="region" aria-label="Live classes">
      {live.map((c) => (
        <div key={c.id} className="live-banner-row">
          <Video size={18} aria-hidden="true" />
          <span>
            <b>{c.name}</b>
            {c.meets ? ` · ${c.meets}` : ""}
          </span>
          <a className="btn btn-green btn-sm" href={c.liveClassUrl} target="_blank" rel="noopener noreferrer">
            Join live class
          </a>
        </div>
      ))}
      <Link to="/classes" className="live-banner-more">
        Homework and materials
      </Link>
    </div>
  );
}
