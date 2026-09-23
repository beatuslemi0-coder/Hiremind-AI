import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageToggle from "./components/LanguageToggle";
import ThemeToggle from "./components/ThemeToggle";
import ProgressSteps from "./components/ProgressSteps";
import PageTransition from "./components/PageTransition";
import { useOnboarding } from "./context/OnboardingContext";
import { useAuth } from "./context/AuthContext";

import Profile from "./pages/interviewee/Profile";
import VerifyEmail from "./pages/interviewee/VerifyEmail";
import EducationSkills from "./pages/interviewee/EducationSkills";
import Documents from "./pages/interviewee/Documents";
import InterviewList from "./pages/interviewee/InterviewList";
import IntervieweeDashboard from "./pages/interviewee/Dashboard";
import SessionSetup from "./pages/interviewee/SessionSetup";
import SessionRoom from "./pages/interviewee/SessionRoom";
import Sessions from "./pages/interviewee/Sessions";
import Report from "./pages/Report";

import CompanyProfile from "./pages/interviewer/CompanyProfile";
import VerifyCompanyEmail from "./pages/interviewer/VerifyCompanyEmail";
import PersonalProfile from "./pages/interviewer/PersonalProfile";
import VerifyPersonalEmail from "./pages/interviewer/VerifyPersonalEmail";
import Subscription from "./pages/interviewer/Subscription";
import Dashboard from "./pages/interviewer/Dashboard";
import Reviews from "./pages/interviewer/Reviews";
import InterviewerSessions from "./pages/interviewer/Sessions";
import SessionDetail from "./pages/interviewer/SessionDetail";
import Candidates from "./pages/interviewer/Candidates";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import AccountPage from "./pages/Account";
import AppShell from "./components/AppShell";

/*
 * Night shell for the public auth surfaces (login + both signup wizards):
 * the .night/.dark classes now live on the App root (see isNightRoute below)
 * so the wizard header chrome is themed too; the splash backdrop renders at
 * App level for the same reason — PageTransition's transform would otherwise
 * trap the fixed layers inside the page box.
 * Signed-in pages are untouched.
 */
function NightAuthShell({ children }) {
  return <>{children}</>;
}

/* Step 1 routes — always night. */
const NIGHT_ROUTES = ["/login", "/interviewee/profile", "/interviewer/company-profile"];

/* Step 2/3 routes — night only while a signup is actually in progress
   (onboarding state exists), so signed-in users revisiting these paths
   keep the normal app style. */
const NIGHT_WIZARD_ROUTES = [
  "/interviewee/verify",
  "/interviewee/education",
  "/interviewee/documents",
  "/interviewer/verify-company",
  "/interviewer/personal-profile",
  "/interviewer/verify-personal",
  "/interviewer/subscription",
];

function isNightRoute(pathname, onboardingActive) {
  if (pathname === "/") return true;
  if (NIGHT_ROUTES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  return (
    onboardingActive &&
    NIGHT_WIZARD_ROUTES.some((p) => pathname === p || pathname.startsWith(p + "/"))
  );
}

/* True when someone is mid-signup: any wizard id/token/pending email set. */
function useOnboardingActive() {
  const o = useOnboarding();
  return Boolean(
    o.intervieweeId ||
      o.interviewerId ||
      o.interviewerStagingToken ||
      o.intervieweePendingEmail ||
      o.interviewerPendingEmail
  );
}

function NightBackdrop() {
  const { pathname } = useLocation();
  // The landing mounts its own backdrop inside its smooth-scroll wrapper;
  // these App-level layers serve the wizard/login routes. Same gate as the
  // root classes: step 2/3 pages only while a signup is in progress.
  const onboardingActive = useOnboardingActive();
  if (!isNightRoute(pathname, onboardingActive) || pathname === "/") return null;
  return (
    <>
      <div className="night-bg" aria-hidden="true" />
      <div className="night-veil" aria-hidden="true" />
    </>
  );
}

/* Signed-in pages get the dashboard shell (red sidebar + topbar + floating
   canvas, per the reference design); everything else keeps the centered
   column with plain padding. */
function Shell({ active, children }) {
  return active ? <AppShell>{children}</AppShell> : <main className="px-4 pb-16">{children}</main>;
}

// Route guards enforce the gating rules from the spec: a step is unreachable until the
// step before it is actually complete, not just visually disabled.

function RequireIntervieweeId({ children }) {
  const { intervieweeId } = useOnboarding();
  if (!intervieweeId) return <Navigate to="/interviewee/profile" replace />;
  return children;
}

function RequireIntervieweeAuth({ children }) {
  const { user, restoring } = useAuth();
  if (restoring) return null; // wait for token rehydration before deciding
  if (!user || user.type !== "interviewee") return <Navigate to="/login" replace />;
  return children;
}

function RequireInterviewerId({ children }) {
  const { interviewerId } = useOnboarding();
  if (!interviewerId) return <Navigate to="/interviewer/company-profile" replace />;
  return children;
}

function RequireInterviewerStaging({ children }) {
  const { interviewerStagingToken } = useOnboarding();
  if (!interviewerStagingToken) return <Navigate to="/interviewer/company-profile" replace />;
  return children;
}

function RequireInterviewerAuth({ children }) {
  const { user, restoring } = useAuth();
  if (restoring) return null; // wait for token rehydration before deciding
  if (!user || user.type !== "interviewer") return <Navigate to="/login" replace />;
  return children;
}

function Header() {
  const { t } = useTranslation();
  const location = useLocation();

  const intervieweeSteps = [t("steps.profile"), t("steps.education_skills"), t("steps.documents")];
  const interviewerSteps = [t("steps.company_profile"), t("steps.personal_profile"), t("steps.subscription")];

  let stepsBar = null;
  if (location.pathname.startsWith("/interviewee/profile")) stepsBar = <ProgressSteps steps={intervieweeSteps} currentIndex={0} />;
  else if (location.pathname.startsWith("/interviewee/education")) stepsBar = <ProgressSteps steps={intervieweeSteps} currentIndex={1} />;
  else if (location.pathname.startsWith("/interviewee/documents")) stepsBar = <ProgressSteps steps={intervieweeSteps} currentIndex={2} />;
  else if (location.pathname.startsWith("/interviewer/company-profile")) stepsBar = <ProgressSteps steps={interviewerSteps} currentIndex={0} />;
  else if (location.pathname.startsWith("/interviewer/personal-profile")) stepsBar = <ProgressSteps steps={interviewerSteps} currentIndex={1} />;
  else if (location.pathname.startsWith("/interviewer/subscription")) stepsBar = <ProgressSteps steps={interviewerSteps} currentIndex={2} />;

  return (
    <header className="max-w-2xl mx-auto pt-8 pb-4 px-4">
      <div className="flex justify-end mb-4">
        <LanguageToggle />
      </div>
      {stepsBar}
      <div className="flex justify-center mt-4">
        <ThemeToggle />
      </div>
    </header>
  );
}

export default function App() {
  const location = useLocation();
  // Pages that show the dashboard shell (signed-in app surfaces). Everything else —
  // landing, login, the signup wizards — keeps the wizard header.
  const NAV_PATHS = [
    "/interviewee/dashboard",
    "/interviewee/interviews",
    "/interviewee/documents",
    "/interviewee/session-setup",
    "/interviewee/sessions",
    "/interviewee/account",
    "/interviewer/dashboard",
    "/interviewer/reviews",
    "/interviewer/sessions",
    "/interviewer/interviews",
    "/interviewer/account",
  ];
  const showNav =
    NAV_PATHS.some((p) => location.pathname.startsWith(p)) &&
    // The live room gets the whole viewport: no wizard header, no shell.
    !location.pathname.endsWith("/session");

  const onboardingActive = useOnboardingActive();
  const nightRoute = isNightRoute(location.pathname, onboardingActive);

  return (
    <div
      className={`min-h-screen isolate ${
        nightRoute ? "night dark" : "bg-gray-50"
      }`}
    >
      {/* Full-page night backdrop for the night auth routes (fixed at App level,
          outside PageTransition so no transform can confine it to the page box). */}
      <NightBackdrop />
      {location.pathname !== "/" && !showNav && <Header />}
      <Shell active={showNav}>
        <PageTransition>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<NightAuthShell><Login /></NightAuthShell>} />

          {/* Interviewee wizard */}
          <Route path="/interviewee/profile" element={<NightAuthShell><Profile /></NightAuthShell>} />
          <Route
            path="/interviewee/verify"
            element={
              <RequireIntervieweeId>
                <VerifyEmail />
              </RequireIntervieweeId>
            }
          />
          <Route
            path="/interviewee/education"
            element={
              <RequireIntervieweeAuth>
                <EducationSkills />
              </RequireIntervieweeAuth>
            }
          />
          <Route
            path="/interviewee/documents"
            element={
              <RequireIntervieweeAuth>
                <Documents />
              </RequireIntervieweeAuth>
            }
          />
          <Route
            path="/interviewee/interviews"
            element={
              <RequireIntervieweeAuth>
                <InterviewList />
              </RequireIntervieweeAuth>
            }
          />
          <Route
            path="/interviewee/dashboard"
            element={
              <RequireIntervieweeAuth>
                <IntervieweeDashboard />
              </RequireIntervieweeAuth>
            }
          />
          <Route
            path="/interviewee/sessions"
            element={
              <RequireIntervieweeAuth>
                <Sessions />
              </RequireIntervieweeAuth>
            }
          />
          <Route
            path="/interviewee/account"
            element={
              <RequireIntervieweeAuth>
                <AccountPage />
              </RequireIntervieweeAuth>
            }
          />
          <Route
            path="/interviewee/session-setup"
            element={
              <RequireIntervieweeAuth>
                <SessionSetup />
              </RequireIntervieweeAuth>
            }
          />
          {/* The live interview room is a full-viewport experience: no
              dashboard shell, no wizard header — SessionRoom paints its own. */}
          {/* The live interview room is a full-viewport experience: no
              dashboard shell, no wizard header — SessionRoom paints its own. */}
          <Route
            path="/interviewee/session"
            element={
              <RequireIntervieweeAuth>
                <SessionRoom />
              </RequireIntervieweeAuth>
            }
          />
          <Route
            path="/interviewee/sessions/:sessionId/report"
            element={
              <RequireIntervieweeAuth>
                <Report />
              </RequireIntervieweeAuth>
            }
          />          <Route
            path="/interviewer/sessions/:sessionId/report"
            element={
              <RequireInterviewerAuth>
                <Report backTo="/interviewer/dashboard" />
              </RequireInterviewerAuth>
            }
          />
          <Route
            path="/interviewer/sessions/:sessionId"
            element={
              <RequireInterviewerAuth>
                <SessionDetail />
              </RequireInterviewerAuth>
            }
          />
          <Route
            path="/interviewer/interviews/:interviewId/candidates"
            element={
              <RequireInterviewerAuth>
                <Candidates />
              </RequireInterviewerAuth>
            }
 />

          {/* Interviewer wizard */}
          <Route path="/interviewer/company-profile" element={<NightAuthShell><CompanyProfile /></NightAuthShell>} />
          <Route
            path="/interviewer/verify-company"
            element={
              <RequireInterviewerId>
                <VerifyCompanyEmail />
              </RequireInterviewerId>
            }
          />
          <Route
            path="/interviewer/personal-profile"
            element={
              <RequireInterviewerStaging>
                <PersonalProfile />
              </RequireInterviewerStaging>
            }
          />
          <Route
            path="/interviewer/verify-personal"
            element={
              <RequireInterviewerStaging>
                <VerifyPersonalEmail />
              </RequireInterviewerStaging>
            }
          />
          <Route
            path="/interviewer/subscription"
            element={
              <RequireInterviewerAuth>
                <Subscription />
              </RequireInterviewerAuth>
            }
          />
          <Route
            path="/interviewer/dashboard"
            element={
              <RequireInterviewerAuth>
                <Dashboard />
              </RequireInterviewerAuth>
            }
          />
          <Route
            path="/interviewer/reviews"
            element={
              <RequireInterviewerAuth>
                <Reviews />
              </RequireInterviewerAuth>
            }
          />
          <Route
            path="/interviewer/sessions"
            element={
              <RequireInterviewerAuth>
                <InterviewerSessions />
              </RequireInterviewerAuth>
            }
          />
          <Route
            path="/interviewer/account"
            element={
              <RequireInterviewerAuth>
                <AccountPage />
              </RequireInterviewerAuth>
            }
          />
        </Routes>
        </PageTransition>
      </Shell>
    </div>
  );
}
