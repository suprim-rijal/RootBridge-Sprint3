import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Smile } from "lucide-react";
import PinDialog from "./PinDialog.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { VIEWS } from "../config/roles.js";

// "Switch to Parent View" / "Switch to Child View" (Child/Parent accounts only).
// The view is saved in AuthContext (and localStorage):
//   child view  -> /dashboard (+ learning paths, Cultural Passport)
//   parent view -> /parent    (administrative, no passport)
// Switching is instant, unless the parent switched on "Ask for a PIN".

export default function ViewSwitch({ className = "" }) {
  const {
    isFamily,
    isParentView,
    learnerName,
    user,
    setActiveView,
    verifyPin,
  } = useAuth();
  const navigate = useNavigate();
  const [pinOpen, setPinOpen] = useState(false);

  if (!isFamily) return null;
  const { requirePin, hasPin } = user.details.parentSettings;

  const goTo = (view) => {
    // Navigate FIRST, then change the view. The other order leaves the
    // parent page rendered for one moment with the child view active,
    // and its guard would send us to the unlock page instead.
    navigate(view === VIEWS.PARENT ? "/parent" : "/dashboard", {
      replace: true,
    });
    setActiveView(view);
  };

  const handleClick = () => {
    if (isParentView) goTo(VIEWS.CHILD);
    else if (requirePin && hasPin) setPinOpen(true);
    else goTo(VIEWS.PARENT);
  };

  return (
    <>
      <button
        type="button"
        className={`view-switch ${isParentView ? "is-parent" : ""} ${className}`}
        onClick={handleClick}
        aria-label={
          isParentView
            ? `Switch to ${learnerName}'s view`
            : "Switch to Parent View"
        }
      >
        <span className="view-switch-track" aria-hidden="true">
          <span className="view-switch-thumb">
            {isParentView ? <ShieldCheck size={14} /> : <Smile size={14} />}
          </span>
        </span>
        <span className="view-switch-text">
          {isParentView ? "Switch to Child View" : "Switch to Parent View"}
        </span>
      </button>

      {/* Portal: the dialog lives on <body>, so it still shows when the
          phone menu that holds this button closes. */}
      {createPortal(
        <PinDialog
          open={pinOpen}
          verifyPin={verifyPin}
          onClose={() => setPinOpen(false)}
          onSuccess={() => {
            setPinOpen(false);
            goTo(VIEWS.PARENT);
          }}
        />,
        document.body,
      )}
    </>
  );
}
