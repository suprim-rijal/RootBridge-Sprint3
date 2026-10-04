import { useRef, useState } from "react";
import { Camera, KeyRound, LogOut, UserRound } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { LEARNER_ROLES, ROLE_LABELS, ROLES } from "../../config/roles.js";
import { LANGUAGES } from "../../data/languages.js";
import { checkImageFile, shrinkImage } from "../../lib/image.js";
import { requestPasswordReset } from "../../services/api.js";

// Standard profile (no gamification). Used by:
//   /profile         Normal users
//   /parent/profile  Child/Parent accounts in parent view
//   /teacher/profile
// Sections: photo, name, account details, learning language, security.
// Every save goes through AuthContext -> api.updateUser() (POST /api/users/update).

export default function AccountProfile() {
  const { user, isFamily, updateName, updateDetails, setLanguage, logout } = useAuth();
  const fileInput = useRef(null);
  const avatarKey = isFamily ? "parentAvatar" : "avatar"; // the child's photo stays in the passport
  const avatar = user.details[avatarKey];
  const isLearnerRole = LEARNER_ROLES.includes(user.role);

  const [name, setName] = useState(user.name);
  const [preview, setPreview] = useState(null);
  const [msg, setMsg] = useState({ area: "", type: "", text: "" });
  const [resetSent, setResetSent] = useState(false);

  const say = (area, type, text) => setMsg({ area, type, text });

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const problem = checkImageFile(file);
    if (problem) return say("photo", "error", problem);
    try {
      setPreview(await shrinkImage(file));
      say("photo", "", "Preview. Save to keep it.");
    } catch (err) {
      say("photo", "error", err.message);
    }
  };

  const savePhoto = async (value) => {
    try {
      await updateDetails({ [avatarKey]: value });
      setPreview(null);
      say("photo", "success", value ? "Photo saved." : "Photo removed.");
    } catch (err) {
      say("photo", "error", err.message);
    }
  };

  const saveName = async (event) => {
    event.preventDefault();
    const clean = name.trim();
    if (!clean) return say("name", "error", "The name cannot be empty.");
    if (clean.length > 60) return say("name", "error", "Use 60 characters or fewer.");
    try {
      await updateName(clean);
      setName(clean);
      say("name", "success", "Name saved.");
    } catch (err) {
      say("name", "error", err.message);
    }
  };

  const changeLanguage = async (event) => {
    const choice = LANGUAGES.find((l) => l.id === event.target.value);
    if (choice?.status !== "active") return;
    await setLanguage(choice.id);
    say("language", "success", `Learning language set to ${choice.name}.`);
  };

  const sendReset = async () => {
    await requestPasswordReset({ email: user.email });
    setResetSent(true);
  };

  const message = (area) =>
    msg.area === area ? (
      <p className={`acct-msg ${msg.type}`} role="status">
        {msg.text}
      </p>
    ) : null;

  const shown = preview ?? avatar;

  return (
    <div className="acct">
      <header className="acct-head">
        <p className="pd-eyebrow">{isFamily ? "Parent view" : ROLE_LABELS[user.role]}</p>
        <h1>Profile</h1>
      </header>

      <section className="pd-panel acct-panel" aria-labelledby="acct-photo">
        <h2 id="acct-photo">Photo and name</h2>
        <div className="acct-identity">
          <div className="acct-avatar">
            {shown ? <img src={shown} alt={preview ? "Preview of your new photo" : ""} /> : <UserRound size={34} />}
          </div>
          <div className="acct-photo-actions">
            <input ref={fileInput} type="file" accept="image/*" onChange={handleFile} hidden />
            {preview ? (
              <>
                <button type="button" className="btn btn-dark btn-sm" onClick={() => savePhoto(preview)}>
                  Save photo
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPreview(null)}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInput.current.click()}>
                  <Camera size={15} /> {avatar ? "Change photo" : "Upload photo"}
                </button>
                {avatar ? (
                  <button type="button" className="pd-text-btn" onClick={() => savePhoto(null)}>
                    Remove
                  </button>
                ) : null}
              </>
            )}
            {message("photo")}
          </div>
        </div>

        <form className="acct-name" onSubmit={saveName}>
          <label className="pd-field">
            <span>Display name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" />
          </label>
          <button type="submit" className="btn btn-dark btn-sm" disabled={name.trim() === user.name}>
            Save name
          </button>
        </form>
        {message("name")}
      </section>

      <section className="pd-panel acct-panel" aria-labelledby="acct-details">
        <h2 id="acct-details">Account</h2>
        <dl className="pd-account-list">
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{ROLE_LABELS[user.role]}</dd>
          </div>
          {isFamily ? (
            <div>
              <dt>Child</dt>
              <dd>{user.details.parentSettings.childName || "Not set"}</dd>
            </div>
          ) : null}
          <div>
            <dt>Member since</dt>
            <dd>
              {new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
            </dd>
          </div>
        </dl>
      </section>

      {isLearnerRole ? (
        <section className="pd-panel acct-panel" aria-labelledby="acct-language">
          <h2 id="acct-language">Learning language</h2>
          <label className="pd-field acct-select">
            <span>{isFamily ? "Your child learns" : "You learn"}</span>
            <select value={user.details.onboarding.language} onChange={changeLanguage}>
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id} disabled={l.status !== "active"}>
                  {l.name}
                  {l.status !== "active" ? " (coming soon)" : ""}
                </option>
              ))}
            </select>
          </label>
          {message("language")}
        </section>
      ) : null}

      <section className="pd-panel acct-panel" aria-labelledby="acct-security">
        <h2 id="acct-security">Security</h2>
        <div className="acct-row">
          <span>
            <b>Password</b>
            <small>{resetSent ? `A reset link is on its way to ${user.email}.` : "We email you a link to set a new password."}</small>
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={sendReset} disabled={resetSent}>
            <KeyRound size={15} /> {resetSent ? "Link sent" : "Send reset link"}
          </button>
        </div>
        <div className="acct-row">
          <span>
            <b>Log out</b>
            <small>End the session on this device.</small>
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
            <LogOut size={15} /> Log out
          </button>
        </div>
        {user.role === ROLES.CHILD_PARENT ? (
          <p className="pd-footnote">The child's photo and name are edited in their Cultural Passport (child view).</p>
        ) : null}
      </section>
    </div>
  );
}
