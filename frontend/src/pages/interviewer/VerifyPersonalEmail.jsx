import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import client from "../../api/client";
import { useOnboarding } from "../../context/OnboardingContext";
import { useAuth } from "../../context/AuthContext";
import CodeInput from "../../components/CodeInput";
import { usePageReveal } from "../../lib/pageReveal";

export default function VerifyPersonalEmail() {
  const { t } = useTranslation();
  const reveal = usePageReveal();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { setInterviewerStep } = useOnboarding();
  const { login } = useAuth();

  const [error, setError] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  async function handleComplete(code) {
    setError(null);
    try {
      const { data } = await client.post("/interviewer/personal-profile/verify", { code });
      login(data.token, data.interviewer, "interviewer");
      setInterviewerStep(3);
      navigate("/interviewer/subscription");
    } catch (err) {
      const reason = err.response?.data?.error;
      setError(
        reason === "expired"
          ? t("verify.code_expired")
          : reason === "too_many_attempts"
          ? t("verify.too_many_attempts")
          : t("verify.code_incorrect")
      );
    }
  }

  async function handleResend() {
    try {
      const { data } = await client.post("/interviewer/personal-profile/resend-code");
      setCooldown(data.cooldownSeconds);
      const interval = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) clearInterval(interval);
          return c - 1;
        });
      }, 1000);
    } catch {
      setError(t("common.error_generic"));
    }
  }

  return (
    <div ref={reveal} className="max-w-md mx-auto text-center space-y-6">
      <h1 className="gh-cool text-2xl font-bold tracking-tight text-gray-900">{t("verify.title")}</h1>

      <div className="form-card space-y-5">
        <p className="text-gray-600 text-sm">{t("verify.instructions", { email: state?.email })}</p>

        <CodeInput onComplete={handleComplete} />

        {error && <p className="text-brand-pink text-sm">{error}</p>}

        <button
          onClick={handleResend}
          disabled={cooldown > 0}
          className="alink disabled:opacity-40 disabled:pointer-events-none"
        >
          {cooldown > 0 ? t("verify.resend_in", { seconds: cooldown }) : t("common.resend_code")}
        </button>
      </div>
    </div>
  );
}
