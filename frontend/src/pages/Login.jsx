import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { setAuthToken } from "../api/client";
import { authApi, mapUser, apiDetail } from "../api/vox";
import { useAuth } from "../context/AuthContext";
import { useOnboarding } from "../context/OnboardingContext";
import { useReveal } from "../lib/motion";

// After login, send each role where their saved onboarding_step says they stopped.
function resumePath(type, step) {
  if (type === "interviewee") {
    if (step >= 4) return "/interviewee/dashboard";
    if (step === 3) return "/interviewee/documents";
    if (step === 2) return "/interviewee/education";
    return "/interviewee/verify";
  }
  if (type === "interviewer") {
    if (step >= 4) return "/interviewer/dashboard";
    return "/interviewer/subscription";
  }
  return "/login";
}

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, user, restoring } = useAuth();
  const {
    setIntervieweeId,
    setIntervieweeStep,
    setInterviewerId,
    setInterviewerStep,
    resetOnboarding,
  } = useOnboarding();

  const [tab, setTab] = useState("interviewee");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const revealRef = useReveal();

  // Already signed in? Send them where they left off instead of showing the form.
  useEffect(() => {
    if (!restoring && user) {
      navigate(resumePath(user.type, user.onboarding_step ?? 1), { replace: true });
    }
  }, [restoring, user, navigate]);

  async function handleIntervieweeSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const tokenRes = await authApi.login(email, password);
      const me = await afterToken(tokenRes.access_token);
      if (me.role !== "interviewee") {
        setError(t("login.invalid_credentials"));
        return;
      }
      finishLogin("interviewee", me, tokenRes.access_token);
    } catch (err) {
      setError(apiDetail(err) === "Incorrect email or password" ? t("login.invalid_credentials") : t("login.no_account"));
    } finally {
      setBusy(false);
    }
  }

  async function handleInterviewerSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const tokenRes = await authApi.login(email, password);
      const me = await afterToken(tokenRes.access_token);
      if (me.role !== "employer") {
        setError(t("login.invalid_credentials"));
        return;
      }
      finishLogin("interviewer", me, tokenRes.access_token);
    } catch (err) {
      setError(apiDetail(err) === "Incorrect email or password" ? t("login.invalid_credentials") : t("login.no_account"));
    } finally {
      setBusy(false);
    }
  }

  async function afterToken(token) {
    setAuthToken(token);
    return authApi.me();
  }

  function finishLogin(type, me, token) {
    resetOnboarding();
    const record = mapUser(me);
    login(token, record, type);
    if (type === "interviewee") {
      setIntervieweeId(record.id);
      setIntervieweeStep(4);
      navigate("/interviewee/dashboard");
    } else {
      setInterviewerId(record.id);
      setInterviewerStep(4);
      navigate("/interviewer/dashboard");
    }
  }

  return (
    <div ref={revealRef} className="max-w-md mx-auto space-y-6">
      <div className="text-center" data-reveal>
        <h1 className="gtext text-3xl font-extrabold tracking-tight text-white text-center">{t("login.title")}</h1>
      </div>

      <div className="auth-card p-6 sm:p-8 space-y-6" data-reveal>
        {/* Role tabs */}
        <div className="flex gap-1.5" role="tablist">
          {["interviewee", "interviewer"].map((role) => (
            <button
              key={role}
              role="tab"
              aria-selected={tab === role}
              onClick={() => {
                setTab(role);
                setError(null);
              }}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                tab === role
                  ? "npill--active npill"
                  : "npill"
              }`}
            >
              {t(`login.${role}`)}
            </button>
          ))}
        </div>

        {tab === "interviewee" ? (
          <form onSubmit={handleIntervieweeSubmit} className="space-y-4">
            <div>
              <label className="nlabel">{t("profile.email")}</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("profile.email_placeholder")}
                className="nfield"
              />
            </div>
            <div>
              <label className="nlabel">{t("personal_profile.password")}</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="nfield"
              />
            </div>
            {error && <p className="text-sm font-semibold" style={{ color: "#e0265c" }}>{error}</p>}
            <button type="submit" disabled={busy} className="nbtn-primary w-full">
              {t("login.sign_in")}
            </button>
          </form>
        ) : (
          <form onSubmit={handleInterviewerSubmit} className="space-y-4">
            <div>
              <label className="nlabel">{t("login.personal_email")}</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("profile.email_placeholder")}
                className="nfield"
              />
            </div>
            <div>
              <label className="nlabel">{t("personal_profile.password")}</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="nfield"
              />
            </div>
            {error && <p className="text-sm font-semibold" style={{ color: "#e0265c" }}>{error}</p>}
            <button type="submit" disabled={busy} className="nbtn-primary w-full">
              {t("login.sign_in")}
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-sm" style={{ color: "#b9b3d6" }} data-reveal>
        {t("login.no_account_prompt")}{" "}
        <Link to="/interviewee/profile" className="nlink">
          {t("login.sign_up_interviewee")}
        </Link>
        {" · "}
        <Link to="/interviewer/company-profile" className="nlink">
          {t("login.sign_up_interviewer")}
        </Link>
      </p>
    </div>
  );
}
