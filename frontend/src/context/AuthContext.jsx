// =====================================================================
// AuthContext: the logged-in user, shared by every page.
// ---------------------------------------------------------------------
// How it works:
//   1. <AuthProvider> wraps the whole app (see App.jsx).
//   2. Any component calls useAuth() to read `user` or call an action.
//   3. Every action calls the backend (services/api.js), then saves the
//      returned user in React state AND in localStorage, so a refresh
//      shows the page at once.
//   4. On every page load the saved token is checked with
//      GET /api/auth/me, so the user always comes from the server, not
//      from a stale copy in the browser.
//
// Sprint 3: the backend is real (MongoDB + JWT). The token is stored in
// localStorage under "rootbridge_token" (see README, known limits).
// =====================================================================

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as api from "../services/api.js";
import { tokenStore } from "../services/http.js";
import { cancelProgressSync, notifyProgressChanged, pullProgress } from "../lib/progress.js";
import { setActiveLanguage } from "../data/curriculum.js";
import { homeFor, LEARNER_ROLES, ROLES, VIEWS } from "../config/roles.js";

const SESSION_KEY = "rootbridge_session";
const VIEW_KEY = "rootbridge_active_view"; // "child" | "parent" (Child/Parent accounts)

const AuthContext = createContext(null);

function loadSession() {
  // No token means no session, whatever else is saved.
  if (!tokenStore.get()) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  try {
    return api.normalizeUser(JSON.parse(localStorage.getItem(SESSION_KEY)));
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

// Where should this user go next? Used by the route guards and after login.
export function nextStepFor(user, view = VIEWS.CHILD) {
  if (!user) return "/login";
  if (!user.details.onboarding.completed) return "/welcome";
  return homeFor(user.role, view);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadSession);
  // true right after "Log out" in this tab. RequireAuth then sends the
  // visitor home instead of remembering the page they were on (which
  // would send the NEXT person who logs in to the previous user's page).
  const [signedOut, setSignedOut] = useState(false);
  const [view, setViewState] = useState(() =>
    localStorage.getItem(VIEW_KEY) === VIEWS.PARENT ? VIEWS.PARENT : VIEWS.CHILD,
  );

  // Save the user in state + localStorage.
  const saveSession = useCallback((nextUser) => {
    const clean = api.normalizeUser(nextUser);
    setUser(clean);
    if (clean) localStorage.setItem(SESSION_KEY, JSON.stringify(clean));
    else localStorage.removeItem(SESSION_KEY);
    notifyProgressChanged(); // progress is stored per user
  }, []);

  // ----- on page load: ask the server who the token belongs to -----
  // Only a failed /auth/me ends the session. Other 401s (a wrong PIN,
  // a wrong password on a form) must never log anyone out.
  useEffect(() => {
    if (!tokenStore.get()) return undefined;
    let alive = true;
    api
      .me()
      .then((res) => {
        if (!alive) return;
        saveSession(res.user);
        pullProgress(); // bring in progress made on other devices
      })
      .catch((err) => {
        if (!alive) return;
        if (err.status === 401) {
          tokenStore.clear();
          saveSession(null);
        }
        // Any other problem (server down): keep the saved copy for now.
      });
    return () => {
      alive = false;
    };
  }, [saveSession]);

  const setActiveView = useCallback((next) => {
    localStorage.setItem(VIEW_KEY, next);
    setViewState(next);
  }, []);

  // ----- auth -----
  const login = useCallback(
    async (email, password, role) => {
      const res = await api.login({ email, password, role });
      setSignedOut(false);
      setActiveView(VIEWS.CHILD); // Child/Parent accounts open in child view
      saveSession(res.user);
      pullProgress();
      return res.user;
    },
    [saveSession, setActiveView],
  );

  const signup = useCallback(
    async (form) => {
      const res = await api.signup(form);
      setSignedOut(false);
      setActiveView(VIEWS.CHILD);
      saveSession(res.user);
      pullProgress();
      return res.user;
    },
    [saveSession, setActiveView],
  );

  const logout = useCallback(() => {
    setSignedOut(true);
    cancelProgressSync(); // drop any progress waiting to be sent
    api.logout(); // forget the token
    saveSession(null);
    localStorage.removeItem(VIEW_KEY);
  }, [saveSession]);

  // ----- profile -----
  // Replace one or more "details" sections, e.g. updateDetails({ avatar })
  const updateDetails = useCallback(
    async (patch) => {
      const res = await api.updateUser({ userId: user.id, details: patch });
      saveSession(res.user);
      return res.user;
    },
    [user, saveSession],
  );

  const updateName = useCallback(
    async (name) => {
      const res = await api.updateUser({ userId: user.id, name });
      saveSession(res.user);
      return res.user;
    },
    [user, saveSession],
  );

  // Called at the end of the welcome animation.
  const completeWelcome = useCallback(
    () => updateDetails({ onboarding: { ...user.details.onboarding, completed: true } }),
    [user, updateDetails],
  );

  const setLanguage = useCallback(
    (language) => updateDetails({ onboarding: { ...user.details.onboarding, language } }),
    [user, updateDetails],
  );

  const updateParentSettings = useCallback(
    (settings) => updateDetails({ parentSettings: { ...user.details.parentSettings, ...settings } }),
    [user, updateDetails],
  );

  // ----- classes -----
  const joinClass = useCallback(
    async (code) => {
      const res = await api.joinClass({ userId: user.id, code });
      saveSession(res.user);
      return res.user;
    },
    [user, saveSession],
  );

  const leaveClass = useCallback(
    async (code) => {
      const res = await api.leaveClass({ userId: user.id, code });
      saveSession(res.user);
    },
    [user, saveSession],
  );

  // ----- values derived from the user -----
  const isFamily = user?.role === ROLES.CHILD_PARENT;
  const isLearner = Boolean(user && LEARNER_ROLES.includes(user.role));
  const activeView = isFamily ? view : VIEWS.CHILD;
  // The learner's language decides which curriculum every page shows.
  // Set during render (cheap, idempotent), so the first paint is right.
  setActiveLanguage(user?.details.onboarding.language || "nepali");

  const settings = user?.details.parentSettings ?? api.DEFAULT_DETAILS.parentSettings;
  // Checked on the server (POST /api/users/verify-pin), never in the browser.
  const verifyPin = api.verifyPin;
  // Forgotten PIN: check the account password, then set or remove it.
  const resetPin = useCallback(
    async ({ password, newPin }) => {
      const res = await api.resetPin({ password, newPin });
      saveSession(res.user);
      return res;
    },
    [saveSession],
  );
  // Parent settings only limit Child/Parent accounts.
  const learningRules = isFamily
    ? { allowedTracks: settings.allowedTracks, allowSpeaking: settings.allowSpeaking }
    : { allowedTracks: { language: true, culture: true }, allowSpeaking: true };
  // Name to greet the learner with.
  const learnerName = isFamily ? settings.childName || "Explorer" : user?.name.split(" ")[0] ?? "";

  const value = useMemo(
    () => ({
      user,
      signedOut,
      isFamily,
      isLearner,
      activeView,
      isParentView: isFamily && activeView === VIEWS.PARENT,
      home: user ? nextStepFor(user, activeView) : "/",
      learnerName,
      learningRules,
      login,
      signup,
      logout,
      updateName,
      updateDetails,
      completeWelcome,
      setLanguage,
      updateParentSettings,
      setActiveView,
      joinClass,
      leaveClass,
      verifyPin,
      resetPin,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, signedOut, activeView, login, signup, logout, updateName, updateDetails, completeWelcome,
      setLanguage, updateParentSettings, setActiveView, joinClass, leaveClass, resetPin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
