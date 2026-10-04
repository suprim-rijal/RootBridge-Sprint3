// =====================================================================
// http.js — the one place that calls the backend with fetch().
// ---------------------------------------------------------------------
// It behaves like the Sprint 2 mock's respond()/fail():
//   * success  -> resolves with the JSON body ({ success: true, ... })
//   * failure  -> throws a normal Error with .status and the server's
//                 message, so every page's  try { } catch (err) {
//                 err.message }  keeps working unchanged.
// It also adds the login token to every request.
// =====================================================================

// import.meta.env only exists inside Vite; the fallback keeps plain Node (tests) working.
export const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";

const TOKEN_KEY = "rootbridge_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

function makeError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export async function http(path, { method = "GET", body, form } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  const init = { method, headers };
  if (form) {
    init.body = form; // file upload: the browser sets its own Content-Type
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, init);
  } catch {
    throw makeError("Cannot reach the server. Is the backend running?", 0);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw makeError(data.error || `Request failed (${res.status})`, res.status);
  }
  return data;
}

export const get = (path) => http(path);
export const post = (path, body) => http(path, { method: "POST", body });
export const patch = (path, body) => http(path, { method: "PATCH", body });
export const del = (path) => http(path, { method: "DELETE" });
export const upload = (path, form) => http(path, { method: "POST", form });

// Download a protected file (class materials). A plain <a href> cannot
// send the login token, so we fetch the file with it, then hand the
// browser a temporary link to save.
export async function downloadFile(path, fileName) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: tokenStore.get() ? { Authorization: `Bearer ${tokenStore.get()}` } : {},
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw makeError(data.error || `Download failed (${res.status})`, res.status);
  }
  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName || "download";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
