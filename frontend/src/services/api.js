// =====================================================================
// api.js — the real backend, with the SAME function names and shapes as
// the Sprint 2 mockApi.js. Pages swap their import and keep working.
// =====================================================================
import { del, downloadFile, get, patch, post, tokenStore, upload } from "./http.js";
import { isKnownRole, ROLES } from "../config/roles.js";

// ---------- Tracks and lessons ----------
export const getTracks = (language) => get(`/tracks${language ? `?language=${encodeURIComponent(language)}` : ""}`);
export const getTrackById = (trackId) => get(`/tracks/${encodeURIComponent(trackId)}`);
export const getModule = (moduleId) => get(`/modules/${encodeURIComponent(moduleId)}`);
export const getLesson = (lessonId) => get(`/lessons/${encodeURIComponent(lessonId)}`);

// ---------- Users ----------
// The shape every page expects. The server already sends it complete;
// this only fills gaps, so a page can never crash on a missing field.
export const DEFAULT_DETAILS = {
  avatar: null,
  parentAvatar: null,
  onboarding: { language: "nepali", completed: false },
  classes: [],
  parentSettings: {
    childName: "",
    dailyMinutes: 20,
    weeklyGoalDays: 4,
    allowedTracks: { language: true, culture: true },
    allowSpeaking: true,
    requirePin: false,
    hasPin: false, // the PIN itself never leaves the server
  },
};

export function normalizeUser(user) {
  if (!user) return null;
  const d = user.details || {};
  return {
    ...user,
    role: isKnownRole(user.role) ? user.role : ROLES.NORMAL,
    details: {
      ...DEFAULT_DETAILS,
      ...d,
      onboarding: { ...DEFAULT_DETAILS.onboarding, ...d.onboarding },
      classes: Array.isArray(d.classes) ? d.classes : [],
      parentSettings: {
        ...DEFAULT_DETAILS.parentSettings,
        ...d.parentSettings,
        allowedTracks: { ...DEFAULT_DETAILS.parentSettings.allowedTracks, ...d.parentSettings?.allowedTracks },
      },
    },
  };
}

// Login and signup keep the token; everything after uses it.
async function withToken(promise) {
  const res = await promise;
  if (res.token) tokenStore.set(res.token);
  return res;
}

export const login = ({ email, password, role }) => withToken(post("/auth/login", { email, password, role }));
export const signup = ({ name, childName, email, password, role }) =>
  withToken(post("/auth/signup", { name, childName, email, password, role }));
export const me = () => get("/auth/me");
export const logout = () => tokenStore.clear();
export const requestPasswordReset = ({ email }) => post("/auth/forgot-password", { email });

// Same contract as Sprint 2: keys inside "details" replace the old ones.
// userId is accepted for compatibility; the server uses the token.
export const updateUser = ({ name, details = {} }) => post("/users/update", { name, details });

// The parent PIN is checked on the server, never in the browser.
export const verifyPin = (pin) => post("/users/verify-pin", { pin });
// Forgotten PIN: the account password proves who you are. Leave newPin
// empty to remove the PIN altogether.
export const resetPin = ({ password, newPin }) => post("/users/pin/reset", { password, newPin });

// ---------- Classes (the teacher side arrives in Step 6) ----------
export const CLASS_CODE_LENGTH = 6;
export const CLASS_CODE_PATTERN = /^\d{6}$/;
export function cleanClassCode(raw) {
  return String(raw).replace(/\D/g, "").slice(0, CLASS_CODE_LENGTH);
}
// Both return the updated user, like the other user calls.
export const joinClass = ({ code }) => post("/groups/join", { code: cleanClassCode(code) });
export const leaveClass = ({ code }) => post("/groups/leave", { code });

// ---------- Progress and lives (Step 3) ----------
export const getProgress = () => get("/progress/me");
export const syncProgress = (progress) => patch("/progress/me", progress);
export const loseLife = (reason) => post("/progress/lives/lose", { reason });
export const earnLife = (lessonId) => post("/progress/lives/earn", { lessonId });

// ---------- Pronunciation (Step 4) ----------
// { language, targetNative, targetRomanization, targetMeaning,
//   transcripts: [{ text, confidence }], attemptNumber }
export const gradePronunciation = (attempt) => post("/pronunciation/grade", attempt);

// ---------- Classes: learner side (Step 6) ----------
export const myClasses = () => get("/groups/mine");
export const downloadMaterial = (material) => downloadFile(`/materials/${material.id}/file`, material.fileName);

// Finding a class without a code, and asking to join
export const classDirectory = (language) => get(`/groups/directory${language ? `?language=${encodeURIComponent(language)}` : ""}`);
export const askToJoin = (groupId, message) => post(`/groups/${groupId}/requests`, { message });
export const myJoinRequests = () => get("/groups/requests/mine");

// ---------- Classes: teacher side (Step 6) ----------
export const listGroups = () => get("/groups");
export const createGroup = (group) => post("/groups", group);
export const getGroup = (id) => get(`/groups/${id}`);
export const updateGroup = (id, changes) => patch(`/groups/${id}`, changes);
export const deleteGroup = (id) => del(`/groups/${id}`);
export const removeStudent = (id, userId) => del(`/groups/${id}/members/${userId}`);
export const listRequests = (id) => get(`/groups/${id}/requests`);
export const approveRequest = (id, requestId) => post(`/groups/${id}/requests/${requestId}/approve`);
export const declineRequest = (id, requestId, note) => post(`/groups/${id}/requests/${requestId}/decline`, { note });
export const addAssignment = (id, assignment) => post(`/groups/${id}/assignments`, assignment);
export const deleteAssignment = (id, assignmentId) => del(`/groups/${id}/assignments/${assignmentId}`);
export const addLink = (id, { title, url }) => post(`/groups/${id}/materials`, { title, url });
export function addFile(id, { title, file }) {
  const form = new FormData();
  form.append("title", title);
  form.append("file", file);
  return upload(`/groups/${id}/materials`, form);
}
export const deleteMaterial = (id, materialId) => del(`/groups/${id}/materials/${materialId}`);

// ---------- Contact ----------
export const sendContactMessage = ({ name, email, subject, message }) =>
  post("/contact", { name, email, subject, message });
