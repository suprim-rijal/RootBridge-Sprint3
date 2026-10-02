import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import ForgotPin from "../../components/ForgotPin.jsx";
import { VIEWS } from "../../config/roles.js";

// /parent/unlock — the way into the parent view when the browser is in the
// child view (a bookmark, a refresh, or a shared link). Before, those
// simply bounced back to the dashboard with no way to type the PIN.
export default function ParentUnlock() {
  const {
    user,
    isFamily,
    isParentView,
    setActiveView,
    verifyPin,
    learnerName,
  } = useAuth();
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [note, setNote] = useState("");

  if (!isFamily) return <Navigate to="/dashboard" replace />;
  if (isParentView) return <Navigate to="/parent" replace />;

  const { requirePin, hasPin } = user.details.parentSettings;
  const locked = requirePin && hasPin;

  const open = async (event) => {
    event.preventDefault();
    setError("");
    if (!locked) {
      setActiveView(VIEWS.PARENT);
      navigate("/parent", { replace: true });
      return;
    }
    setChecking(true);
    try {
      await verifyPin(pin);
      setActiveView(VIEWS.PARENT);
      navigate("/parent", { replace: true });
    } catch (err) {
      setError(
        err.status === 401 ? "That PIN is not right. Try again." : err.message,
      );
      setPin("");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="unlock">
      <ShieldCheck size={34} aria-hidden="true" />
      <h1>Parent view</h1>
      <p className="ln-muted">
        {locked
          ? "Enter the 4-digit parent PIN to see progress and settings."
          : `Leaving ${learnerName}'s view to open the parent controls.`}
      </p>
      <form onSubmit={open} className="unlock-form">
        {locked ? (
          <input
            className="pin-input"
            inputMode="numeric"
            autoComplete="off"
            aria-label="Parent PIN"
            value={pin}
            onChange={(e) =>
              setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            autoFocus
          />
        ) : null}
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        {note ? (
          <p className="pd-save-msg success" role="status">
            {note}
          </p>
        ) : null}
        <div className="unlock-actions">
          <button
            type="submit"
            className="btn btn-dark"
            disabled={(locked && pin.length !== 4) || checking}
          >
            {checking ? "Checking…" : "Open parent view"}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate("/dashboard", { replace: true })}
          >
            Back to {learnerName}'s view
          </button>
        </div>
      </form>
      {locked ? (
        <ForgotPin
          onDone={(message) => {
            setNote(message);
            setPin("");
            setError("");
          }}
        />
      ) : null}
    </div>
  );
}
