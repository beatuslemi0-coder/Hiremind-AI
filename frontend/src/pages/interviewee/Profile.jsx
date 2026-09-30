import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { setAuthToken } from "../../api/client";
import { authApi, profileApi, mapUser, apiDetail } from "../../api/vox";
import { useOnboarding } from "../../context/OnboardingContext";
import { useAuth } from "../../context/AuthContext";
import { usePageReveal } from "../../lib/pageReveal";

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { setIntervieweeId, setIntervieweeStep, setIntervieweePendingEmail } = useOnboarding();

  const [form, setForm] = useState({
    jina: "",
    namba_ya_simu: "",
    barua_pepe: "",
    nenosiri: "",
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const reveal = usePageReveal();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authApi.register({
        username: form.jina.trim(),
        email: form.barua_pepe.trim(),
        password: form.nenosiri,
        role: "interviewee",
      });
      const tokenRes = await authApi.login(form.barua_pepe.trim(), form.nenosiri);
      setAuthToken(tokenRes.access_token);
      try {
        await profileApi.create({
          phone_number: form.namba_ya_simu.trim(),
          location: "",
        });
      } catch {
        /* profile may already exist */
      }
      const me = await authApi.me();
      const record = mapUser(me);
      login(tokenRes.access_token, record, "interviewee");
      setIntervieweeId(record.id);
      setIntervieweeStep(2);
      setIntervieweePendingEmail(form.barua_pepe);
      navigate("/interviewee/education");
    } catch (err) {
      setError(apiDetail(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form ref={reveal} onSubmit={handleSubmit} className="max-w-md mx-auto space-y-5">
      <div className="text-center">
        <h1 className="gtext text-3xl font-extrabold tracking-tight text-white">{t("profile.title")}</h1>
      </div>

      <div className="auth-card space-y-4 p-6 sm:p-8">
        <div>
          <label className="nlabel">{t("profile.full_name")}</label>
          <input
            required
            placeholder={t("profile.full_name_placeholder")}
            value={form.jina}
            onChange={(e) => setForm({ ...form, jina: e.target.value })}
            className="nfield"
          />
        </div>

        <div>
          <label className="nlabel">{t("profile.phone")}</label>
          <input
            required
            placeholder={t("profile.phone_placeholder")}
            value={form.namba_ya_simu}
            onChange={(e) => setForm({ ...form, namba_ya_simu: e.target.value })}
            className="nfield"
          />
        </div>

        <div>
          <label className="nlabel">{t("profile.email")}</label>
          <input
            required
            type="email"
            placeholder={t("profile.email_placeholder")}
            value={form.barua_pepe}
            onChange={(e) => setForm({ ...form, barua_pepe: e.target.value })}
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
