import { createContext, useContext, useEffect, useState } from "react";
import { saveOnboardingState, loadOnboardingState, clearOnboardingState } from "../api/client";

const OnboardingContext = createContext(null);

// Pre-auth wizard state: who is mid-signup and where they stopped. Persisted to
// localStorage so a refresh in the middle of email verification doesn't kick
// the user back to step 1. Cleared only when a stage completes or the flow is
// abandoned (full login/logout).
const INITIAL_STATE = {
  intervieweeId: null,
  intervieweeStep: 1,
  intervieweePendingEmail: null,

  interviewerId: null,
  interviewerStagingToken: null,
  interviewerStep: 1,
  interviewerPendingEmail: null,
};

function normalize(saved) {
  // Guard against shape changes across deploys: only keep known keys.
  const out = { ...INITIAL_STATE };
  if (!saved || typeof saved !== "object") return out;
  for (const key of Object.keys(INITIAL_STATE)) {
    if (saved[key] !== undefined) out[key] = saved[key];
  }
  return out;
}

export function OnboardingProvider({ children }) {
  // intervieweeId / interviewerId are used before full auth exists (pre-verification stages)
  const [state, setState] = useState(() => normalize(loadOnboardingState()));

  // Persist on every change so refresh always restores the latest wizard state.
  useEffect(() => {
    saveOnboardingState(state);
  }, [state]);

  const value = {
    ...state,
    setIntervieweeId: (id) => setState((s) => ({ ...s, intervieweeId: id })),
    setIntervieweeStep: (step) => setState((s) => ({ ...s, intervieweeStep: step })),
    setIntervieweePendingEmail: (email) => setState((s) => ({ ...s, intervieweePendingEmail: email })),

    setInterviewerId: (id) => setState((s) => ({ ...s, interviewerId: id })),
    setInterviewerStagingToken: (token) => setState((s) => ({ ...s, interviewerStagingToken: token })),
    setInterviewerStep: (step) => setState((s) => ({ ...s, interviewerStep: step })),
    setInterviewerPendingEmail: (email) => setState((s) => ({ ...s, interviewerPendingEmail: email })),

    // Wipe wizard state: used on full login (staging superseded) and logout.
    resetOnboarding: () => {
      clearOnboardingState();
      setState({ ...INITIAL_STATE });
    },
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
