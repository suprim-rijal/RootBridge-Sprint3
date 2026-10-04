import { useEffect, useRef, useState } from "react";
import ForgotPin from "./ForgotPin.jsx";

// Asks for the 4-digit parent PIN before leaving child view.
// Uses the native <dialog> element: it traps focus and closes with Esc.
// Sprint 3: the PIN is checked on the server (verifyPin), so it never has
// to be sent to the browser at all.

export default function PinDialog({ open, verifyPin, onSuccess, onClose }) {
  const ref = useRef(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setPin("");
      setError("");
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const submit = async (event) => {
    event.preventDefault();
    setChecking(true);
    try {
      await verifyPin(pin);
      onSuccess();
    } catch (err) {
      setError(err.status === 401 ? "That PIN is not right. Try again." : err.message);
      setPin("");
    } finally {
      setChecking(false);
    }
  };

  return (
    <dialog ref={ref} className="pin-dialog" onClose={onClose} aria-labelledby="pin-title">
      <form onSubmit={submit}>
        <h2 id="pin-title">Parent check</h2>
        <p>Enter the 4-digit parent PIN to open parental controls.</p>
        <input
          className="pin-input"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
            setError("");
          }}
          inputMode="numeric"
          autoComplete="off"
          aria-label="4-digit PIN"
          autoFocus
        />
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="pin-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-dark btn-sm" disabled={pin.length !== 4 || checking}>
            {checking ? "Checking…" : "Unlock"}
          </button>
        </div>
      </form>
      {/* A forgotten PIN must not lock a parent out of their own account. */}
      <ForgotPin
        onDone={(message) => {
          setError("");
          setPin("");
          setNote(message);
        }}
      />
      {note ? (
        <p className="pd-save-msg success" role="status">
          {note}
        </p>
      ) : null}
    </dialog>
  );
}
