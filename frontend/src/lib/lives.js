// =====================================================================
// useLives() — the hearts, for Normal learners only.
// ---------------------------------------------------------------------
// Unlike lessons and XP, lives are decided by the SERVER: the browser
// asks "take one away" or "I finished a review", and shows whatever the
// server answers. So refreshing the page, or clearing the browser, can
// never give free hearts.
//
// For Child/Parent accounts this hook returns { enabled: false } and
// every action does nothing: the child's lessons stay exactly as in
// Sprint 2 (unlimited tries, free hints, no hearts).
// =====================================================================
import { useCallback, useEffect, useState } from "react";
import { earnLife, getProgress, loseLife } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { onProgressSynced } from "./progress.js";
import { ROLES } from "../config/roles.js";

// Every screen shows the SAME hearts. When one screen changes them
// (a wrong answer in a lesson), it tells the others through this event,
// so the navbar, the dashboard and the lesson never disagree.
const LIVES_EVENT = "rootbridge:lives";
let lastKnown = null;

function broadcast(livesInfo) {
  lastKnown = livesInfo;
  window.dispatchEvent(new CustomEvent(LIVES_EVENT, { detail: livesInfo }));
}

export function useLives() {
  const { user } = useAuth();
  const enabled = user?.role === ROLES.NORMAL;
  // Start from what another screen already knows, so the hearts never
  // flash a wrong number while loading.
  const [info, setInfo] = useState(lastKnown ?? { enabled, lives: 7, max: 7, nextHeartAt: null, loading: enabled });

  const apply = useCallback((livesInfo) => {
    if (!livesInfo) return;
    setInfo({ ...livesInfo, loading: false });
    broadcast(livesInfo);
  }, []);

  // Listen for changes made on other screens.
  useEffect(() => {
    const onChange = (event) => setInfo({ ...event.detail, loading: false });
    window.addEventListener(LIVES_EVENT, onChange);
    return () => window.removeEventListener(LIVES_EVENT, onChange);
  }, []);

  // Load the current hearts (the server adds any that regenerated).
  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await getProgress();
      apply(res.data.livesInfo);
    } catch {
      setInfo((i) => ({ ...i, loading: false }));
    }
  }, [enabled, apply]);

  // First load: fetch from the server (state is only set when it answers).
  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    getProgress()
      .then((res) => alive && apply(res.data.livesInfo))
      .catch(() => alive && setInfo((i) => ({ ...i, loading: false })));
    return () => {
      alive = false;
    };
  }, [enabled, apply]);

  // A module quest refill arrives through the progress sync.
  useEffect(() => (enabled ? onProgressSynced((data) => apply(data.livesInfo)) : undefined), [enabled, apply]);

  // reason: "wrong" | "hint" | "speech". Resolves with the new count.
  const lose = useCallback(
    async (reason) => {
      if (!enabled) return null;
      try {
        const res = await loseLife(reason);
        apply(res.data.livesInfo);
        return res.data.livesInfo.lives;
      } catch (err) {
        if (err.status === 409) setInfo((i) => ({ ...i, lives: 0 }));
        return 0;
      }
    },
    [enabled, apply],
  );

  // After a no-fail review of a mastered lesson.
  const earn = useCallback(
    async (lessonId) => {
      if (!enabled) return { ok: false };
      try {
        const res = await earnLife(lessonId);
        apply(res.data.livesInfo);
        return { ok: true, message: res.message };
      } catch (err) {
        return { ok: false, message: err.message };
      }
    },
    [enabled, apply],
  );

  return { ...info, enabled, lose, earn, refresh };
}

// "in 3 h 20 min" style text for the next free heart.
export function timeUntil(iso, now = Date.now()) {
  if (!iso) return "";
  const ms = Math.max(0, new Date(iso).getTime() - now);
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
