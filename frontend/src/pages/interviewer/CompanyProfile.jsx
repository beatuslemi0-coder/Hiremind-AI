import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { setAuthToken } from "../../api/client";
import { authApi, mapUser, apiDetail } from "../../api/vox";
import { useOnboarding } from "../../context/OnboardingContext";
import { useAuth } from "../../context/AuthContext";
import { usePageReveal } from "../../lib/pageReveal";

export default function CompanyProfile() {
  const { t } = useTranslation();
  const reveal = usePageReveal();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { setInterviewerId, setInterviewerStep, setInterviewerPendingEmail } = useOnboarding();

  const [form, setForm] = useState({
    jina_la_kampuni: "",
    barua_pepe_ya_kampuni: "",
    nenosiri: "",
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authApi.register({
        username: form.jina_la_kampuni.trim(),
        email: form.barua_pepe_ya_kampuni.trim(),
        password: form.nenosiri,
        role: "employer",
      });
      const tokenRes = await authApi.login(form.barua_pepe_ya_kampuni.trim(), form.nenosiri);
      setAuthToken(tokenRes.access_token);
      const me = await authApi.me();
      const record = mapUser(me);
      login(tokenRes.access_token, record, "interviewer");
      setInterviewerId(record.id);
      setInterviewerStep(4);
      setInterviewerPendingEmail(form.barua_pepe_ya_kampuni);
      navigate("/interviewer/dashboard");
    } catch (err) {
      setError(apiDetail(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form ref={reveal} onSubmit={handleSubmit} className="max-w-md mx-auto space-y-5">
      <div className="text-center">
        <h1 className="gtext text-3xl font-extrabold tracking-tight text-white">{t("company_profile.title")}</h1>
      </div>

      <div className="auth-card space-y-4 p-6 sm:p-8">
        <div>
          <label className="nlabel">{t("company_profile.company_name")}</label>
          <input
            required
            value={form.jina_la_kampuni}
            onChange={(e) => setForm({ ...form, jina_la_kampuni: e.target.value })}
            className="nfield"
          />
        </div>

        <div>
          <label className="nlabel">{t("company_profile.company_email")}</label>
          <input
            required
            type="email"
            value={form.barua_pepe_ya_kampuni}
            onChange={(e) => setForm({ ...form, barua_pepe_ya_kampuni: e.target.value })}
            className="nfield"
          />
        </div>

        <div>
          <label className="nlabel">{t("personal_profile.password")}</label>
          <input
            required
            type="password"
            minLength={6}
            value={form.nenosiri}
            onChange={(e) => setForm({ ...form, nenosiri: e.target.value })}
            className="nfield"
          />
        </div>

        {error && <p className="text-sm font-semibold" style={{ color: "#e0265c" }}>{error}</p>}

        <button type="submit" disabled={submitting} className="nbtn-primary w-full">
          {t("common.next")}
        </button>
      </div>

      <p className="text-center text-sm" style={{ color: "#b9b3d6" }}>
        {t("login.already_have_account")}{" "}
        <Link to="/login" className="nlink">
          {t("login.sign_in")}
        </Link>
      </p>
    </form>
  );
}
