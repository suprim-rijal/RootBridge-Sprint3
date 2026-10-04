import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { homeFor } from "../../config/roles.js";
import { useAuth } from "../../context/AuthContext.jsx";

// /welcome — shown once, right after signup.
// A short, calm CSS animation (see ".welcome" in styles/flow.css):
//   1. "Welcome" appears in five languages, one after another
//   2. it settles on "Welcome, <name>" with a line drawn underneath
//   3. after ~4.5 s the user moves on to their home page
// The welcome is only marked as seen when leaving, so a refresh during
// the animation shows it again instead of skipping it.

const WORDS = [
  { text: "स्वागत छ", lang: "ne" },
  { text: "Bienvenue", lang: "fr" },
  { text: "Karibu", lang: "sw" },
  { text: "ようこそ", lang: "ja" },
  { text: "Akwaaba", lang: "tw" },
];

const DURATION_MS = 4500;

export default function WelcomePage() {
  const { user, learnerName, isFamily, completeWelcome } = useAuth();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);

  const finish = async () => {
    if (leavingRef.current) return; // the button and the timer must not both run
    leavingRef.current = true;
    setLeaving(true);
    await completeWelcome();
    navigate(homeFor(user.role), { replace: true });
  };

  useEffect(() => {
    const timer = window.setTimeout(finish, DURATION_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const name = isFamily ? learnerName : user.name.split(" ")[0];

  return (
    <div className="welcome">
      {/* The words and the final greeting share one spot, so the words
          appear to settle into the greeting. */}
      <div className="welcome-stack">
        <div className="welcome-words" aria-hidden="true">
          {WORDS.map((w, i) => (
            <span key={w.lang} lang={w.lang} style={{ animationDelay: `${i * 0.55}s` }}>
              {w.text}
            </span>
          ))}
        </div>

        <h1 className="welcome-final">
          Welcome, <span className="welcome-name">{name}</span>
          <svg className="welcome-line" viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden="true">
            <path d="M2 8 C 80 2, 180 12, 298 4" />
          </svg>
        </h1>
      </div>
      <p className="welcome-sub">Your account is ready.</p>

      <button type="button" className="btn btn-dark welcome-skip" onClick={finish} disabled={leaving}>
        {leaving ? "Opening…" : "Continue"}
      </button>
      <div className="welcome-timer" aria-hidden="true">
        <span style={{ animationDuration: `${DURATION_MS}ms` }} />
      </div>
    </div>
  );
}
