import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  GraduationCap,
  LayoutDashboard,
  MonitorPlay,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { VIEWS } from "../../config/roles.js";
import {
  lastSevenDays,
  recentLessons,
  summarize,
  DAY_LABELS,
} from "../../lib/learningSummary.js";
import { useProgress } from "../../lib/progress.js";

// =====================================================================
// /parent — Parent view of a Child/Parent account.
// Standard, administrative interface: no stamps, no passport, no games.
// Sections: Overview (progress), Controls (settings), Classes, Activity.
// Progress shown here is what the child did in child view.
// Settings are saved with updateParentSettings() -> api.updateUser() (POST /api/users/update)
// (Sprint 3: POST /api/users/update with details.parentSettings).
// =====================================================================

const SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "controls", label: "Controls", icon: SlidersHorizontal },
  { id: "classes", label: "Classes", icon: GraduationCap },
  { id: "activity", label: "Activity", icon: Activity },
];

export default function ParentDashboard() {
  const { user, updateParentSettings, setActiveView, leaveClass } = useAuth();
  const navigate = useNavigate();
  const { state, reset } = useProgress();
  const saved = user.details.parentSettings;

  // The form edits a local copy; "Save" sends it to the server.
  // The PIN is never sent back by the server (only "hasPin"), so the PIN
  // box starts empty and a new PIN is only sent when the parent types one.
  const [form, setForm] = useState({ ...saved, pin: "" });
  // The quick "set a PIN" card above the overview.
  const [quickPin, setQuickPin] = useState("");
  const [pinState, setPinState] = useState({ type: "", message: "" });
  const learnerNameForPin = saved.childName?.trim() || "Your child";
  const [saveState, setSaveState] = useState({ type: "idle", message: "" });
  const [confirmReset, setConfirmReset] = useState(false);

  const summary = summarize(state);
  const recent = recentLessons(state, 6);
  const childName = saved.childName || "your child";
  const { pin: newPin, ...formWithoutPin } = form;
  const dirty =
    Boolean(newPin) || JSON.stringify(formWithoutPin) !== JSON.stringify(saved);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaveState({ type: "idle", message: "" });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (newPin && !/^\d{4}$/.test(newPin)) {
      setSaveState({
        type: "error",
        message: "The PIN must be exactly 4 digits.",
      });
      return;
    }
    if (form.requirePin && !saved.hasPin && !newPin) {
      setSaveState({
        type: "error",
        message: "Set a 4-digit PIN, or turn off the PIN requirement.",
      });
      return;
    }
    if (!form.allowedTracks.language && !form.allowedTracks.culture) {
      setSaveState({
        type: "error",
        message: "Keep at least one learning path turned on.",
      });
      return;
    }
    setSaveState({ type: "loading", message: "" });
    try {
      const { hasPin: _hasPin, ...settings } = formWithoutPin;
      const updated = await updateParentSettings({
        ...settings,
        childName: form.childName.trim(),
        ...(newPin ? { pin: newPin } : {}), // only a NEW pin is sent
      });
      setForm({ ...updated.details.parentSettings, pin: "" }); // keep the form equal to what was saved
      setSaveState({ type: "success", message: "Settings saved." });
    } catch (err) {
      setSaveState({ type: "error", message: err.message });
    }
  };

  return (
    <div className="pd">
      <aside className="pd-side" aria-label="Parent sections">
        <p className="pd-side-title">Parental controls</p>
        <nav>
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <a key={id} href={`#pd-${id}`} className="pd-nav">
              <Icon size={17} aria-hidden="true" /> {label}
            </a>
          ))}
        </nav>
        <Link to="/parent/profile" className="pd-nav">
          <UserRound size={17} aria-hidden="true" /> Profile
        </Link>
        <div className="pd-account">
          <span className="pd-avatar">
            {user.details.parentAvatar ? (
              <img src={user.details.parentAvatar} alt="" />
            ) : (
              <UserRound size={18} />
            )}
          </span>
          <span>
            <b>{user.name}</b>
            <small>{user.email}</small>
          </span>
        </div>
      </aside>

      <div className="pd-main">
        <header className="pd-header">
          <div>
            <p className="pd-eyebrow">Parent account</p>
            <h1>Learning overview for {childName}</h1>
          </div>
          <button
            type="button"
            className="btn btn-green btn-sm"
            onClick={() => {
              setActiveView(VIEWS.CHILD);
              navigate("/dashboard");
            }}
          >
            <MonitorPlay size={16} /> Switch to Child View
          </button>
        </header>

        {/* Overview */}
        {/* Setting a PIN used to be a checkbox hidden in Controls, so
            parents never found it. This card offers it directly. */}
        {!saved.hasPin ? (
          <section
            className="pd-panel pin-setup"
            aria-labelledby="pin-setup-title"
          >
            <h2 id="pin-setup-title">
              <ShieldCheck size={18} aria-hidden="true" /> Protect the parent
              view
            </h2>
            <p className="pd-footnote">
              Choose a 4-digit PIN. {learnerNameForPin} will then need it to
              open the parent view, so settings and progress stay yours.
            </p>
            <form
              className="pd-form pin-setup-form"
              onSubmit={async (event) => {
                event.preventDefault();
                setPinState({ type: "", message: "" });
                if (!/^\d{4}$/.test(quickPin)) {
                  setPinState({
                    type: "error",
                    message: "The PIN must be exactly 4 digits.",
                  });
                  return;
                }
                try {
                  const updated = await updateParentSettings({
                    requirePin: true,
                    pin: quickPin,
                  });
                  // Only the PIN fields change here: any unsaved edits the
                  // parent has made in Controls below must survive.
                  const savedNow = updated.details.parentSettings;
                  setForm((current) => ({
                    ...current,
                    requirePin: savedNow.requirePin,
                    hasPin: savedNow.hasPin,
                    pin: "",
                  }));
                  setQuickPin("");
                  setPinState({
                    type: "success",
                    message: "PIN set. The parent view is protected now.",
                  });
                } catch (err) {
                  setPinState({ type: "error", message: err.message });
                }
              }}
            >
              <label className="pd-field">
                <span>New 4-digit PIN</span>
                <input
                  className="pin-input"
                  inputMode="numeric"
                  autoComplete="off"
                  value={quickPin}
                  onChange={(event) =>
                    setQuickPin(
                      event.target.value.replace(/\D/g, "").slice(0, 4),
                    )
                  }
                  placeholder="••••"
                />
              </label>
              <div className="pd-form-actions">
                <button
                  type="submit"
                  className="btn btn-dark btn-sm"
                  disabled={quickPin.length !== 4}
                >
                  Set PIN
                </button>
              </div>
            </form>
            {pinState.type === "error" ? (
              <p className="form-error" role="alert">
                {pinState.message}
              </p>
            ) : null}
          </section>
        ) : null}

        {/* The confirmation lives outside the card, because the card itself
            disappears as soon as a PIN exists. */}
        {pinState.type === "success" ? (
          <p className="pd-save-msg success" role="status">
            {pinState.message}
          </p>
        ) : null}

        <section id="pd-overview" className="pd-panel">
          <h2>
            <BarChart3 size={18} aria-hidden="true" /> Overview
          </h2>
          <dl className="pd-stats">
            <div>
              <dt>Lessons completed</dt>
              <dd>{summary.lessonsDone}</dd>
            </div>
            <div>
              <dt>Modules mastered</dt>
              <dd>{summary.modulesMastered}</dd>
            </div>
            <div>
              <dt>Experience points</dt>
              <dd>
                {summary.xp} <small>level {summary.level}</small>
              </dd>
            </div>
            <div>
              <dt>Active days, last 7</dt>
              <dd>
                {summary.daysThisWeek}{" "}
                <small>goal {saved.weeklyGoalDays}</small>
              </dd>
            </div>
          </dl>

          <div className="pd-table-wrap">
            <table className="pd-table">
              <thead>
                <tr>
                  <th scope="col">Path</th>
                  <th scope="col">Status</th>
                  <th scope="col">Lessons</th>
                  <th scope="col">Modules mastered</th>
                  <th scope="col">Progress</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["language", " Language"],
                  ["culture", "Culture"],
                ].map(([id, label]) => {
                  const t = summary.tracks[id];
                  const on = saved.allowedTracks[id];
                  return (
                    <tr key={id}>
                      <th scope="row">{label}</th>
                      <td>
                        <span className={`pd-tag ${on ? "on" : "off"}`}>
                          {on ? "On" : "Off"}
                        </span>
                      </td>
                      <td>
                        {t.doneLessons} / {t.lessons}
                      </td>
                      <td>
                        {t.mastered} / {t.modules}
                      </td>
                      <td>
                        <span className="pd-meter">
                          <span style={{ width: `${t.pct}%` }} />
                        </span>
                        {t.pct.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Controls */}
        <section id="pd-controls" className="pd-panel">
          <h2>
            <SlidersHorizontal size={18} aria-hidden="true" /> Controls
          </h2>
          <form className="pd-form" onSubmit={handleSave}>
            <label className="pd-field">
              <span>Child's name</span>
              <input
                value={form.childName}
                onChange={(e) => set("childName", e.target.value)}
                placeholder="Aarav"
              />
            </label>

            <label className="pd-field">
              <span>Daily time limit</span>
              <select
                value={form.dailyMinutes}
                onChange={(e) => set("dailyMinutes", Number(e.target.value))}
              >
                {[10, 15, 20, 30, 45, 60].map((m) => (
                  <option key={m} value={m}>
                    {m} minutes
                  </option>
                ))}
              </select>
            </label>

            <label className="pd-field">
              <span>Weekly goal</span>
              <select
                value={form.weeklyGoalDays}
                onChange={(e) => set("weeklyGoalDays", Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <option key={d} value={d}>
                    {d} day{d > 1 ? "s" : ""} a week
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="pd-field pd-checks">
              <legend>Learning paths</legend>
              {[
                ["language", " Language"],
                ["culture", "Culture"],
              ].map(([id, label]) => (
                <label key={id} className="pd-switch">
                  <input
                    type="checkbox"
                    checked={form.allowedTracks[id]}
                    onChange={(e) =>
                      set("allowedTracks", {
                        ...form.allowedTracks,
                        [id]: e.target.checked,
                      })
                    }
                  />
                  <span className="pd-switch-ui" aria-hidden="true" />
                  {label}
                </label>
              ))}
            </fieldset>

            <fieldset className="pd-field pd-checks">
              <legend>Safety</legend>
              <label className="pd-switch">
                <input
                  type="checkbox"
                  checked={form.allowSpeaking}
                  onChange={(e) => set("allowSpeaking", e.target.checked)}
                />
                <span className="pd-switch-ui" aria-hidden="true" />
                Allow microphone for speaking practice
              </label>
              <label className="pd-switch">
                <input
                  type="checkbox"
                  checked={form.requirePin}
                  onChange={(e) => set("requirePin", e.target.checked)}
                />
                <span className="pd-switch-ui" aria-hidden="true" />
                Ask for a PIN before opening Parent View
              </label>
            </fieldset>

            {/* A PIN is created in the "Protect the parent view" card at the
                top of this page. Here it can only be CHANGED, so there are
                never two PIN boxes on one page. */}
            {form.requirePin && saved.hasPin ? (
              <label className="pd-field">
                <span>New PIN (leave empty to keep the current one)</span>
                <input
                  type="password"
                  value={form.pin}
                  onChange={(e) =>
                    set("pin", e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="PIN is set"
                />
              </label>
            ) : null}
            {form.requirePin && !saved.hasPin ? (
              <p className="pd-footnote">
                No PIN yet. Set one in <b>Protect the parent view</b>, at the
                top of this page.
              </p>
            ) : null}

            <div className="pd-form-actions">
              <p className={`pd-save-msg ${saveState.type}`} role="status">
                {saveState.message ||
                  (dirty ? "You have unsaved changes." : "")}
              </p>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={!dirty}
                onClick={() => setForm({ ...saved, pin: "" })}
              >
                Undo changes
              </button>
              <button
                type="submit"
                className="btn btn-dark btn-sm"
                disabled={!dirty || saveState.type === "loading"}
              >
                {saveState.type === "loading" ? "Saving…" : "Save settings"}
              </button>
            </div>
          </form>
        </section>

        {/* Classes */}
        <section id="pd-classes" className="pd-panel">
          <h2>
            <GraduationCap size={18} aria-hidden="true" /> Classes
          </h2>
          {user.details.classes.length === 0 ? (
            <p className="pd-empty">
              No classes yet. Your child can join one from child view with a
              code from their teacher.
            </p>
          ) : (
            <div className="pd-table-wrap">
              <table className="pd-table">
                <thead>
                  <tr>
                    <th scope="col">Class</th>
                    <th scope="col">Teacher</th>
                    <th scope="col">Meets</th>
                    <th scope="col">Code</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {user.details.classes.map((c) => (
                    <tr key={c.code}>
                      <th scope="row">{c.name}</th>
                      <td>{c.teacher}</td>
                      <td>{c.meets}</td>
                      <td>
                        <code>{c.code}</code>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="pd-text-btn"
                          onClick={() => leaveClass(c.code)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Activity */}
        <section id="pd-activity" className="pd-panel">
          <h2>
            <Activity size={18} aria-hidden="true" /> Activity
          </h2>
          <div className="pd-activity">
            <div>
              <h3>Last 7 days</h3>
              <ul className="pd-days">
                {lastSevenDays().map(({ date, weekday }) => (
                  <li
                    key={date}
                    className={state.rhythmDays.includes(date) ? "on" : ""}
                    title={date}
                  >
                    <span />
                    {DAY_LABELS[weekday]}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Recent lessons</h3>
              {recent.length === 0 ? (
                <p className="pd-empty">No lessons finished yet.</p>
              ) : (
                <ul className="pd-recent">
                  {recent.map(({ lesson, module }) => (
                    <li key={lesson.id}>
                      <CheckCircle2 size={15} aria-hidden="true" />
                      <span>
                        {module.code} {lesson.title}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="pd-danger">
            {confirmReset ? (
              <>
                <span>
                  Delete all lesson progress and XP on this account? This cannot
                  be undone.
                </span>
                <button
                  type="button"
                  className="pd-text-btn"
                  onClick={() => setConfirmReset(false)}
                >
                  Keep progress
                </button>
                <button
                  type="button"
                  className="btn btn-sm pd-btn-danger"
                  onClick={() => {
                    reset();
                    setConfirmReset(false);
                  }}
                >
                  Reset progress
                </button>
              </>
            ) : (
              <>
                <span>Start the course again from the beginning.</span>
                <button
                  type="button"
                  className="pd-text-btn"
                  onClick={() => setConfirmReset(true)}
                >
                  Reset progress…
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
