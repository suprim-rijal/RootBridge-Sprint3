import { Navigate, Outlet, useLocation } from "react-router-dom";
import { nextStepFor, useAuth } from "../context/AuthContext.jsx";
import { homeFor, LEARNER_ROLES, VIEWS } from "../config/roles.js";
import ParentUnlock from "../pages/parent/ParentUnlock.jsx";

export function RequireAuth() {
  const { user, signedOut } = useAuth();
  const location = useLocation();
  if (!user && signedOut) return <Navigate to="/" replace />; // just logged out
  if (!user)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

// Learners must pick a language first.
const needsLanguage = (user) =>
  LEARNER_ROLES.includes(user.role) && !user.details.onboarding.language;

export function WelcomeStep() {
  const { user } = useAuth();
  if (needsLanguage(user)) return <Navigate to="/choose-language" replace />;
  if (user.details.onboarding.completed)
    return <Navigate to={homeFor(user.role)} replace />;
  return <Outlet />;
}

// /choose-language: only for learners who have not picked a language yet.
export function ChooseLanguageStep() {
  const { user } = useAuth();
  if (!LEARNER_ROLES.includes(user.role))
    return <Navigate to={homeFor(user.role)} replace />;
  if (user.details.onboarding.language) {
    return (
      <Navigate
        to={user.details.onboarding.completed ? homeFor(user.role) : "/welcome"}
        replace
      />
    );
  }
  return <Outlet />;
}

export function RequireWelcomed() {
  const { user } = useAuth();
  if (needsLanguage(user)) return <Navigate to="/choose-language" replace />;
  if (!user.details.onboarding.completed)
    return <Navigate to="/welcome" replace />;
  return <Outlet />;
}

// Only affects Learners; other roles pass through.
export function RequireRole({ roles }) {
  const { user, activeView } = useAuth();
  if (!roles.includes(user.role))
    return <Navigate to={homeFor(user.role, activeView)} replace />;
  return <Outlet />;
}

// Only affects Child/Parent accounts; other roles pass through.
export function RequireView({ view }) {
  const { user, isFamily, activeView } = useAuth();
  if (isFamily && activeView !== view) {
    // If the user is logged in, but not on the right view, redirect them.
    if (view === VIEWS.PARENT) return <ParentUnlock />;
    return <Navigate to={homeFor(user.role, activeView)} replace />;
  }
  return <Outlet />;
}

export function PublicOnly() {
  const { user, activeView } = useAuth();
  const location = useLocation();
  if (!user) return <Outlet />;
  const next = nextStepFor(user, activeView);
  // If the user is logged in, but not on the welcome page, redirect them.
  const from = location.state?.from;
  return <Navigate to={next !== "/welcome" && from ? from : next} replace />;
}
