import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { educationApi, experienceApi, apiDetail } from "../../api/vox";
import { useOnboarding } from "../../context/OnboardingContext";
import { SECTOR_DATA, EDUCATION_LEVELS, EXPERIENCE_RANGES } from "../../data/taxonomy";
import { usePageReveal } from "../../lib/pageReveal";

export default function EducationSkills() {
  const { t } = useTranslation();
  const reveal = usePageReveal();
  const navigate = useNavigate();
  const { setIntervieweeStep } = useOnboarding();

  const [form, setForm] = useState({
    kiwango_cha_elimu: "",
    sekta: "",
    taaluma: "",
    ujuzi: [],
    utaalamu: "",
    uzoefu: "",
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const professionOptions = useMemo(() => SECTOR_DATA[form.sekta]?.professions || [], [form.sekta]);
  const skillOptions = useMemo(() => SECTOR_DATA[form.sekta]?.skills || [], [form.sekta]);

  function toggleSkill(skill) {
    setForm((f) => {
      const has = f.ujuzi.includes(skill);
      if (has) return { ...f, ujuzi: f.ujuzi.filter((s) => s !== skill) };
      if (f.ujuzi.length >= 5) return f; // enforce max 5 in the UI, not just on submit
      return { ...f, ujuzi: [...f.ujuzi, skill] };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const year = new Date().getFullYear();
      const years = { "0-1": 1, "1-3": 2, "3-5": 4, "5-10": 7, "10+": 12 }[form.uzoefu] || 1;
      await educationApi.create({
        education_level: form.kiwango_cha_elimu,
        institution: form.sekta,
        field_of_study: form.taaluma,
        start_year: year - 4,
        end_year: year,
      });
      await experienceApi.create({
        job_title: form.utaalamu || form.taaluma,
        company_name: form.sekta,
        description: form.ujuzi.join(", "),
        start_date: `${year - years}-01-01`,
        currently_working: true,
      });
      setIntervieweeStep(3);
      navigate("/interviewee/documents");
    } catch (err) {
      setError(apiDetail(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form ref={reveal} onSubmit={handleSubmit} className="max-w-md mx-auto space-y-5">
      <h1 className="gh-cool text-2xl font-bold tracking-tight text-gray-900">{t("education_skills.title")}</h1>

      <div className="form-card space-y-4">

      <Field label={t("education_skills.education_level")}>
        <select
          required
          value={form.kiwango_cha_elimu}
          onChange={(e) => setForm({ ...form, kiwango_cha_elimu: e.target.value })}
          className="select"
        >
          <option value="">{t("education_skills.select_placeholder")}</option>
          {EDUCATION_LEVELS.map((lvl) => (
            <option key={lvl} value={lvl}>
              {t(`education_skills.education_levels.${lvl}`)}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t("education_skills.sector")}>
        <select
          required
          value={form.sekta}
          onChange={(e) => setForm({ ...form, sekta: e.target.value, taaluma: "", ujuzi: [] })}
          className="select"
        >
          <option value="">{t("education_skills.select_placeholder")}</option>
          {Object.keys(SECTOR_DATA).map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t("education_skills.profession")}>
        <select
          required
          disabled={!form.sekta}
          value={form.taaluma}
          onChange={(e) => setForm({ ...form, taaluma: e.target.value })}
          className="select"
        >
          <option value="">{t("education_skills.select_placeholder")}</option>
          {professionOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </Field>

      <Field label={`${t("education_skills.skills")} — ${t("education_skills.skills_count", { count: form.ujuzi.length })}`}>
        <div className="flex flex-wrap gap-2">
          {skillOptions.map((skill) => {
            const selected = form.ujuzi.includes(skill);
            return (
              <button
                type="button"
                key={skill}
                onClick={() => toggleSkill(skill)}
                disabled={!selected && form.ujuzi.length >= 5}
                className={`px-3 py-1.5 rounded-full text-sm border-2 disabled:opacity-40 ${
                  selected ? "bg-brand-orange text-white border-brand-orange" : "border-gray-200 text-gray-600"
                }`}
              >
                {skill}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label={t("education_skills.specialization")}>
        <input
          required
          value={form.utaalamu}
          onChange={(e) => setForm({ ...form, utaalamu: e.target.value })}
          className="ainput"
        />
      </Field>

      <Field label={t("education_skills.experience")}>
        <select
          required
          value={form.uzoefu}
          onChange={(e) => setForm({ ...form, uzoefu: e.target.value })}
          className="select"
        >
          <option value="">{t("education_skills.select_placeholder")}</option>
          {EXPERIENCE_RANGES.map((r) => (
            <option key={r} value={r}>
              {t(`education_skills.experience_ranges.${r}`)}
            </option>
          ))}
        </select>
      </Field>

      {error && <p className="text-brand-pink text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting || form.ujuzi.length === 0}
        className="abtn-primary w-full"
      >
        {t("common.next")}
      </button>
      </div>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="alabel">{label}</label>
      {children}
    </div>
  );
}
