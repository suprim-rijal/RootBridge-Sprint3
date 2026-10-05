import { useRef, useState } from "react";
import { getActiveLanguage } from "../../data/curriculum.js";
import { Camera, Check, Pencil, Trash2, X } from "lucide-react";
import JoinClassCard from "../../components/JoinClassCard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { LANGUAGES } from "../../data/languages.js";
import { checkImageFile, shrinkImage } from "../../lib/image.js";
import { passportStamps } from "../../lib/learningSummary.js";
import { useProgress } from "../../lib/progress.js";

// /passport — the Cultural Passport (child profile, Child/Parent accounts).
// Gamified on purpose: stamps, a passport look, "My classes".
// Parents never see this page; the parent view has a standard profile.
//   - Photo: chosen file -> shrunk to 256px (lib/image.js) -> preview in
//     local state -> "Save photo" stores it (api.updateUser).
//   - Name: edits the child's name (details.parentSettings.childName).
//   - Language dropdown: only active languages can be chosen; the rest
//     are listed as disabled "Coming soon" options.
//   - My classes: join a class with a 6-digit teacher code.

export default function PassportPage() {
  const {
    user,
    learnerName,
    updateDetails,
    updateParentSettings,
    setLanguage,
  } = useAuth();
  const { state } = useProgress();
  const fileInput = useRef(null);

  const displayName = learnerName;

  // ----- photo state -----
  const [preview, setPreview] = useState(null); // unsaved photo
  const [photoMsg, setPhotoMsg] = useState({ type: "idle", text: "" });

  // ----- name state -----
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(displayName);
  const [nameError, setNameError] = useState("");

  // ----- language state -----
  const [langMsg, setLangMsg] = useState("");

  const stamps = passportStamps(state);
  const shownPhoto = preview ?? user.details.avatar;

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow picking the same file again
    if (!file) return;
    const problem = checkImageFile(file);
    if (problem) {
      setPhotoMsg({ type: "error", text: problem });
      return;
    }
    try {
      setPreview(await shrinkImage(file));
      setPhotoMsg({ type: "idle", text: "This is a preview. Save it to keep it." });
    } catch (err) {
      setPhotoMsg({ type: "error", text: err.message });
    }
  };

  const savePhoto = async (avatar) => {
    setPhotoMsg({ type: "loading", text: "Saving…" });
    try {
      await updateDetails({ avatar });
      setPreview(null);
      setPhotoMsg({ type: "success", text: avatar ? "Photo saved." : "Photo removed." });
    } catch (err) {
      setPhotoMsg({ type: "error", text: err.message });
    }
  };

  const saveName = async (event) => {
    event.preventDefault();
    const clean = nameDraft.trim();
    if (!clean) return setNameError("Your name cannot be empty.");
    if (clean.length > 40) return setNameError("Use 40 characters or fewer.");
    try {
      await updateParentSettings({ childName: clean });
      setEditingName(false);
      setNameError("");
    } catch (err) {
      setNameError(err.message);
    }
  };

  const changeLanguage = async (event) => {
    const choice = LANGUAGES.find((l) => l.id === event.target.value);
    if (!choice || choice.status !== "active") return; // disabled options cannot be picked
    await setLanguage(choice.id);
    setLangMsg(`Learning language set to ${choice.name}.`);
  };

  return (
    <div className="passport-page">
      <article className="passport" aria-labelledby="passport-name">
        <header className="passport-top">
          <span className="passport-emblem" aria-hidden="true">
            ✦
          </span>
          <div>
            <p className="passport-kicker">RootBridge · Explorer profile</p>
            <p className="passport-title">
              Cultural Passport <span lang="ne">सांस्कृतिक राहदानी</span>
            </p>
          </div>
        </header>

        <div className="passport-body">
          {/* Photo */}
          <div className="passport-photo-col">
            <div className={`passport-photo ${preview ? "is-preview" : ""}`}>
              {shownPhoto ? (
                <img src={shownPhoto} alt={preview ? "Preview of your new photo" : `Photo of ${displayName}`} />
              ) : (
                <span className="passport-initial" aria-hidden="true">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <input ref={fileInput} type="file" accept="image/*" onChange={handleFile} hidden />

            {preview ? (
              <div className="photo-actions">
                <button type="button" className="btn btn-green btn-sm" onClick={() => savePhoto(preview)}>
                  <Check size={15} /> Save photo
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setPreview(null);
                    setPhotoMsg({ type: "idle", text: "" });
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="photo-actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInput.current.click()}>
                  <Camera size={15} /> {user.details.avatar ? "Change photo" : "Add photo"}
                </button>
                {user.details.avatar ? (
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => savePhoto(null)}
                    aria-label="Remove photo"
                    title="Remove photo"
                  >
                    <Trash2 size={15} />
                  </button>
                ) : null}
              </div>
            )}
            <p className={`photo-msg ${photoMsg.type}`} aria-live="polite">
              {photoMsg.text}
            </p>
          </div>

          {/* Details */}
          <div className="passport-fields">
            <div className="passport-field">
              <span className="pf-label">Name</span>
              {editingName ? (
                <form className="name-form" onSubmit={saveName}>
                  <input
                    value={nameDraft}
                    onChange={(e) => {
                      setNameDraft(e.target.value);
                      setNameError("");
                    }}
                    aria-label="Display name"
                    maxLength={40}
                    autoFocus
                  />
                  <button type="submit" className="icon-btn ok" aria-label="Save name">
                    <Check size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Cancel"
                    onClick={() => {
                      setEditingName(false);
                      setNameDraft(displayName);
                      setNameError("");
                    }}
                  >
                    <X size={16} />
                  </button>
                </form>
              ) : (
                <span className="pf-value pf-name" id="passport-name">
                  {displayName}
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => {
                      setNameDraft(displayName);
                      setEditingName(true);
                    }}
                    aria-label="Edit name"
                  >
                    <Pencil size={15} />
                  </button>
                </span>
              )}
              {nameError ? (
                <span className="form-error" role="alert">
                  {nameError}
                </span>
              ) : null}
            </div>

            <div className="passport-field">
              <label className="pf-label" htmlFor="passport-language">
                Learning language
              </label>
              <select
                id="passport-language"
                className="pf-select"
                value={user.details.onboarding.language ?? "nepali"}
                onChange={changeLanguage}
                aria-describedby="language-help"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id} disabled={l.status !== "active"}>
                    {l.name} ({l.native}){l.status !== "active" ? " · Coming soon" : ""}
                  </option>
                ))}
              </select>
              <span id="language-help" className="pf-help" aria-live="polite">
                {langMsg || "More languages are coming soon."}
              </span>
            </div>
            <div className="passport-field">
              <span className="pf-label">Member since</span>
              <span className="pf-value">
                {new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
            <div className="passport-field">
              <span className="pf-label">Classes</span>
              <span className="pf-value">
                {user.details.classes.length ? user.details.classes.map((c) => c.name).join(", ") : "None yet"}
              </span>
            </div>
          </div>
        </div>

        {/* Stamps */}
        <section className="stamps" aria-labelledby="stamps-title">
          <h2 id="stamps-title">
            Stamps <small>{stamps.filter((s) => s.earned).length} collected</small>
          </h2>
          <ul>
            {stamps.map((s, i) => (
              <li key={s.id} className={`stamp-item ${s.earned ? "earned" : ""}`} style={{ "--tilt": `${(i % 3) * 4 - 4}deg` }}>
                <span className="stamp-ring">
                  {/* The stamp names are written in Nepali; other languages show the English name. */}
                  {getActiveLanguage() === "nepali" ? <span lang="ne">{s.np}</span> : <span>{s.label}</span>}
                </span>
                <b>{s.label}</b>
                <small>{s.earned ? "Collected" : s.rule}</small>
              </li>
            ))}
          </ul>
        </section>
        {/* My classes */}
        <div className="passport-classes">
          <JoinClassCard />
        </div>
      </article>
    </div>
  );
}
