import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import { usePageReveal } from "../../lib/pageReveal";

export default function PersonalProfile() {
  const { t } = useTranslation();
  const reveal = usePageReveal();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    jina: "",
    barua_pepe_binafsi: "",
    nenosiri: "",
    thibitisha_nenosiri: "",
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (form.nenosiri !== form.thibitisha_nenosiri) {
      setError(t("personal_profile.password_mismatch"));
      return;
    }

    setSubmitting(true);
    try {
      await client.post("/interviewer/personal-profile", form);
      navigate("/interviewer/verify-personal", { state: { email: form.barua_pepe_binafsi } });
    } catch (err) {
      const reason = err.response?.data?.error;
      if (reason === "weak_password") setError(t("personal_profile.weak_password"));
      else if (reason === "personal_email_must_differ_from_company_email")
        setError(t("personal_profile.email_must_differ"));
      else setError(t("common.error_generic"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form ref={reveal} onSubmit={handleSubmit} className="max-w-md mx-auto space-y-5">
      <h1 className="gh-cool text-2xl font-bold tracking-tight text-gray-900">{t("personal_profile.title")}</h1>

      <div className="form-card space-y-4">
        <div>
          <label className="alabel">{t("personal_profile.full_name")}</label>
          <input
            required
            value={form.jina}
            onChange={(e) => setForm({ ...form, jina: e.target.value })}
            className="ainput"
          />
        </div>

        <div>
          <label className="alabel">{t("personal_profile.personal_email")}</label>
          <input
            required
            type="email"
            value={form.barua_pepe_binafsi}
            onChange={(e) => setForm({ ...form, barua_pepe_binafsi: e.target.value })}
            className="ainput"
          />
        </div>

        <div>
          <label className="alabel">{t("personal_profile.password")}</label>
          <input
            required
            type="password"
            value={form.nenosiri}
            onChange={(e) => setForm({ ...form, nenosiri: e.target.value })}
            className="ainput"
          />
        </div>

        <div>
          <label className="alabel">{t("personal_profile.confirm_password")}</label>
          <input
            required
            type="password"
            value={form.thibitisha_nenosiri}
            onChange={(e) => setForm({ ...form, thibitisha_nenosiri: e.target.value })}
            className="ainput"
          />
        </div>

        {error && <p className="text-brand-pink text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="abtn-primary w-full"
        >
          {t("common.next")}
        </button>
      </div>
    </form>
  );
}
