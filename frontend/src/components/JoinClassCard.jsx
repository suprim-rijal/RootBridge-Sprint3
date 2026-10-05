import { useRef, useState } from "react";
import { GraduationCap, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { CLASS_CODE_LENGTH, CLASS_CODE_PATTERN, cleanClassCode } from "../services/api.js";

// "Join a Class" with a 6-digit teacher code (UI + local state in Sprint 2).
// The code is checked in two places:
//   1. here: digits only, exactly 6 (instant feedback while typing)
//   2. api.joinClass(): the server looks the code up (POST /api/groups/join)
//
// One real <input> holds the code; the 6 boxes are only its visual.
// No maxLength on purpose: a pasted "48-29 13" must be cleaned first
// (cleanClassCode keeps the digits and cuts to 6).

export default function JoinClassCard() {
  const { user, joinClass, leaveClass } = useAuth();
  const inputRef = useRef(null);
  const [code, setCode] = useState("");
  const [focused, setFocused] = useState(false);
  const [status, setStatus] = useState({ type: "idle", message: "" }); // idle | loading | error | success
  const classes = user.details.classes;

  const handleJoin = async (event) => {
    event.preventDefault();
    if (!CLASS_CODE_PATTERN.test(code)) {
      setStatus({ type: "error", message: `Enter all ${CLASS_CODE_LENGTH} numbers of the class code.` });
      return;
    }
    setStatus({ type: "loading", message: "" });
    try {
      const updated = await joinClass(code);
      const joined = updated.details.classes.at(-1);
      setStatus({ type: "success", message: `You joined ${joined.name} with ${joined.teacher}.` });
      setCode("");
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  };

  return (
    <section className="kid-card join-class" aria-labelledby="join-class-title">
      <div className="kid-card-head">
        <span className="kid-icon sky">
          <GraduationCap size={20} aria-hidden="true" />
        </span>
        <h2 id="join-class-title">Join a class</h2>
      </div>
      <p className="kid-muted">Type the 6-number code from your teacher.</p>

      <form onSubmit={handleJoin} className="join-form" noValidate>
        <label htmlFor="class-code" className="sr-only">
          6-digit class code
        </label>
        <div
          className={`code-boxes ${focused ? "is-focused" : ""} ${status.type === "error" ? "is-error" : ""}`}
          onClick={() => inputRef.current?.focus()}
        >
          <input
            ref={inputRef}
            id="class-code"
            className="code-hidden-input"
            value={code}
            onChange={(e) => {
              setCode(cleanClassCode(e.target.value));
              if (status.type !== "loading") setStatus({ type: "idle", message: "" });
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            aria-describedby="class-code-help"
            aria-invalid={status.type === "error"}
          />
          {Array.from({ length: CLASS_CODE_LENGTH }, (_, i) => (
            <span
              key={i}
              className={`code-box ${code[i] ? "filled" : ""} ${focused && i === Math.min(code.length, CLASS_CODE_LENGTH - 1) ? "current" : ""}`}
              aria-hidden="true"
            >
              {code[i] ?? ""}
            </span>
          ))}
        </div>
        <button type="submit" className="btn btn-primary btn-sm" disabled={!code || status.type === "loading"}>
          {status.type === "loading" ? "Joining…" : "Join"}
        </button>
      </form>

      <p id="class-code-help" className={`join-status ${status.type}`} aria-live="polite">
        {status.message || "Your teacher gives you the 6-digit code."}
      </p>

      {classes.length ? (
        <ul className="class-list">
          {classes.map((c) => (
            <li key={c.code}>
              <span>
                <b>{c.name}</b>
                <small>
                  {c.teacher}, {c.meets}
                </small>
              </span>
              <button
                type="button"
                className="icon-btn"
                onClick={() => leaveClass(c.code)}
                aria-label={`Leave ${c.name}`}
                title="Leave class"
              >
                <X size={15} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
