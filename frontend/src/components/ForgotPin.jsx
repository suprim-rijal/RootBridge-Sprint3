import { useState } from "react";
import { KeyRound } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

// "Forgot the PIN?" — the parent proves who they are with the account
// password, then picks a new PIN or removes it. Without this, a forgotten
// PIN would lock a parent out of their own parent view for good.
export default function ForgotPin({ onDone }) {
  const { user, resetPin } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [newPin, setNewPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await resetPin({ password, newPin });
      setOpen(false);
      setPassword("");
      setNewPin("");
      onDone?.(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        className="pd-text-btn forgot-pin-link"
        onClick={() => setOpen(true)}
      >
        Forgot the PIN?
      </button>
    );
  }

  return (
    <form className="forgot-pin" onSubmit={submit}>
      <p className="ln-muted">
        <KeyRound size={15} aria-hidden="true" /> Enter the password of this
        account ({user.email}) to choose a new PIN.
      </p>
      <label className="pd-field">
        <span>Account password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      <label className="pd-field">
        <span>New PIN (leave empty to remove the PIN)</span>
        <input
          className="pin-input"
          inputMode="numeric"
          autoComplete="off"
          value={newPin}
          onChange={(e) =>
            setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))
          }
          placeholder="••••"
        />
      </label>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="pd-form-actions">
        <button
          type="submit"
          className="btn btn-dark btn-sm"
          disabled={busy || !password}
        >
          {busy ? "Checking…" : newPin ? "Set the new PIN" : "Remove the PIN"}
        </button>
        <button
          type="button"
          className="pd-text-btn"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
