import { useEffect, useState } from "react";
import { Search, Send } from "lucide-react";
import { askToJoin, classDirectory, myJoinRequests } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { LANGUAGES } from "../data/languages.js";

// "Find a class" — for learners who have no join code.
// Teachers can list a class here; a learner sends a short message, and the
// teacher approves or declines. The 6-digit code is never shown until a
// learner is actually in the class.
const STATUS_TEXT = {
  pending: "Waiting for the teacher",
  approved: "Approved",
  declined: "Not accepted",
};

export default function FindClass() {
  const { user, isFamily, learnerName } = useAuth();
  const myLanguage = user.details.onboarding.language ?? "";
  const [language, setLanguage] = useState(myLanguage);
  const [classes, setClasses] = useState(null);
  const [requests, setRequests] = useState([]);
  const [openFor, setOpenFor] = useState(null); // the class being asked
  const [message, setMessage] = useState("");
  const [note, setNote] = useState({ type: "", text: "" });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    Promise.all([classDirectory(language), myJoinRequests()])
      .then(([dir, mine]) => {
        if (!alive) return;
        setClasses(dir.data);
        setRequests(mine.data);
      })
      .catch((err) => alive && setNote({ type: "error", text: err.message }));
    return () => {
      alive = false;
    };
  }, [language, reload]);

  const send = async (group) => {
    setNote({ type: "", text: "" });
    try {
      const res = await askToJoin(group.id, message.trim());
      setNote({ type: "success", text: res.message });
      setOpenFor(null);
      setMessage("");
      setReload((n) => n + 1);
    } catch (err) {
      setNote({ type: "error", text: err.message });
    }
  };

  const answered = requests.filter((r) => r.status === "declined");

  return (
    <section className="pd-panel find-class" aria-labelledby="find-class-title">
      <h2 id="find-class-title">
        <Search size={18} aria-hidden="true" /> Find a class
      </h2>
      <p className="pd-footnote">
        No code from a teacher? These teachers have opened their classes. Send a short message, and they decide.
      </p>

      <label className="pd-field find-filter">
        <span>Language</span>
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="">Every language</option>
          {LANGUAGES.filter((l) => l.status === "active").map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </label>

      {note.text ? (
        <p className={note.type === "error" ? "form-error" : "pd-save-msg success"} role="status">
          {note.text}
        </p>
      ) : null}

      {classes === null ? <p className="pd-empty">Looking for classes…</p> : null}
      {classes?.length === 0 ? (
        <p className="pd-empty">No open classes for this language yet. Ask your teacher for a 6-digit code instead.</p>
      ) : null}

      <ul className="t-list">
        {(classes ?? []).map((c) => (
          <li key={c.id}>
            <div>
              <b>{c.name}</b>
              <small>
                {c.teacher} · {LANGUAGES.find((l) => l.id === c.language)?.name ?? c.language}
                {c.meets ? ` · ${c.meets}` : ""} · {c.learners} learner{c.learners === 1 ? "" : "s"}
              </small>
              {c.about ? <p>{c.about}</p> : null}
              {openFor === c.id ? (
                <div className="find-ask">
                  <label className="pd-field">
                    <span>A short message for {c.teacher}</span>
                    <textarea
                      rows={2}
                      maxLength={500}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={
                        isFamily
                          ? `Hello, ${learnerName} is 8 and is starting to learn. Could they join?`
                          : "Hello, I am learning on my own and would like to join your class."
                      }
                    />
                  </label>
                  <div className="pd-form-actions">
                    <button type="button" className="btn btn-dark btn-sm" onClick={() => send(c)}>
                      <Send size={15} aria-hidden="true" /> Send request
                    </button>
                    <button type="button" className="pd-text-btn" onClick={() => setOpenFor(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            <span className="t-row-actions">
              {c.isMember ? (
                <span className="pd-tag">You are in this class</span>
              ) : c.requestStatus === "pending" ? (
                <span className="pd-tag">{STATUS_TEXT.pending}</span>
              ) : openFor === c.id ? null : (
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpenFor(c.id)}>
                  Ask to join
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>

      {answered.length ? (
        <>
          <h3>Answers from teachers</h3>
          <ul className="t-list">
            {answered.map((r) => (
              <li key={r.id}>
                <div>
                  <b>
                    {r.className} — {STATUS_TEXT[r.status]}
                  </b>
                  <small>{r.teacher}</small>
                  {r.teacherNote ? <p>“{r.teacherNote}”</p> : null}
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
