import axios from "axios";
import { handleMockRequest } from "./mockDb";

/**
 * Single choke point between every page and the API.
 *
 * Two modes:
 *  - VITE_USE_MOCKS=true  → requests never leave the browser; a stateful
 *    frontend-only simulator answers them (see ./mockDb.js). Tokens are mock
 *    strings ("mocktk_...") and the Authorization header is intentionally not
 *    attached — the simulator identifies the caller from localStorage itself.
 *  - otherwise            → a real HTTP API (VITE_API_URL) exactly as before.
 */
export const USE_MOCKS = String(import.meta.env.VITE_USE_MOCKS || "").toLowerCase() === "true";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
});

if (USE_MOCKS) {
  client.defaults.adapter = handleMockRequest;
}

// --- Full auth token (verified interviewee / interviewer) ---------------------
export function setAuthToken(token) {
  if (token) {
    client.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem("auth_token", token);
  } else {
    delete client.defaults.headers.common.Authorization;
    localStorage.removeItem("auth_token");
  }
}

// --- Staging token (interviewer mid-onboarding: company verified, personal not)
// Kept separate from auth_token so a half-finished signup can never be mistaken
// for a signed-in session — the staging header also gets overwritten by the
// full token on login, never the other way around.
export function setStagingAuth(token) {
  if (token) {
    client.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem("staging_token", token);
  } else {
    delete client.defaults.headers.common.Authorization;
    localStorage.removeItem("staging_token");
  }
}

// Restore the header on module load. Staging wins over full auth on conflict,
// because a user can only be in one flow at a time and staging is the state
// that must not be lost (it's the one with no password to fall back on).
const savedStaging = localStorage.getItem("staging_token");
const savedAuth = localStorage.getItem("auth_token");
if (savedStaging) setStagingAuth(savedStaging);
else if (savedAuth) setAuthToken(savedAuth);

// --- Onboarding wizard blob (IDs, steps, pending emails) ---------------------
const ONBOARDING_KEY = "onboarding_state";

export function saveOnboardingState(state) {
  localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state));
}

export function loadOnboardingState() {
  try {
    const raw = localStorage.getItem("onboarding_state");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearOnboardingState() {
  localStorage.removeItem(ONBOARDING_KEY);
}

export default client;
