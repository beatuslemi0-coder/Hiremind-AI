import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyRound, Save, UserRound } from "lucide-react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import { EDUCATION_LEVELS, EXPERIENCE_RANGES, SECTOR_DATA } from "../data/taxonomy";

/**
 * Account page — the single place a signed-in user edits their own details.
 * Shared by both roles: the profile card carries each role's editable fields
 * (candidate: contact + education/skills; employer: company + personal),
 * and the security card handles the employer password change.
 */

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="alabel">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export default function AccountPage() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const type = user?.type || "interviewee";
  const isInterviewee = type === "interviewee";

  // Seed the form from the signed-in record; reseed if the session changes.
  const seeded = useMemo(
    () => ({
      // shared
      jina: user?.jina || "",
      // interviewee
      namba_ya_simu: user?.namba_ya_simu || "",
      barua_pepe: user?.barua_pepe || "",
      kiwango_cha_elimu: user?.kiwango_cha_elimu || "",
      sekta: user?.sekta || "",
      taaluma: user?.taaluma || "",
      utaalamu: user?.utaalamu || "",
      uzoefu: user?.uzoefu || "",
      ujuzi: Array.isArray(user?.ujuzi) ? user.ujuzi : [],
      // interviewer
      jina_la_kampuni: user?.jina_la_kampuni || "",
      barua_pepe_ya_kampuni: user?.barua_pepe_ya_kampuni || "",
      barua_pepe_binafsi: user?.barua_pepe_binafsi || "",
    }),
    [user?.id, user?.type] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const [form, setForm] = useState(seeded);
  const [password, setPassword] = useState({ next: "", confirm: "" });
  const [status, setStatus] = useState(null); // { tone: 'ok'|'error', message }
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(seeded);
  }, [seeded]);

  const sectorSkills = SECTOR_DATA[form.sekta]?.skills || [];
  const professionOptions = SECTOR_DATA[form.sekta]?.professions || [];
  const dirty = JSON.stringify(form) !== JSON.stringify(seeded);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setStatus(null);
  }

  function toggleSkill(skill) {
    setForm((f) => {
      const has = f.ujuzi.includes(skill);
      if (has) return { ...f, ujuzi: f.ujuzi.filter((s) => s !== skill) };
      if (f.ujuzi.length >= 5) return f; // max 5, same rule as the wizard
      return { ...f, ujuzi: [...f.ujuzi, skill] };
    });
    setStatus(null);
  }

  function buildPayload() {
    if (isInterviewee) {
      return {
        jina: form.jina,
        namba_ya_simu: form.namba_ya_simu,
        barua_pepe: form.barua_pepe,
        kiwango_cha_elimu: form.kiwango_cha_elimu,
        sekta: form.sekta,
        taaluma: form.taaluma,
        utaalamu: form.utaalamu,
        uzoefu: form.uzoefu,
        ujuzi: form.ujuzi,
      };
    }
    const payload = {
      jina: form.jina,
      jina_la_kampuni: form.jina_la_kampuni,
      barua_pepe_ya_kampuni: form.barua_pepe_ya_kampuni,
      barua_pepe_binafsi: form.barua_pepe_binafsi,
    };
    // Only send a password when the user actually typed one — empty means keep.
    if (password.next) payload.nenosiri = password.next;
    return payload;
  }

  function validate() {
    if (form.jina.trim().length < 2) return "invalid_name";
    if (isInterviewee) {
      if (form.barua_pepe && !/.+@.+\..+/.test(form.barua_pepe)) return "invalid_email";
      if (form.ujuzi.length === 0) return "pick_skill";
    } else {
      if (form.jina_la_kampuni.trim().length < 2) return "invalid_company";
      if (!/.+@.+\..+/.test(form.barua_pepe_ya_kampuni)) return "invalid_email";
      if (!/.+@.+\..+/.test(form.barua_pepe_binafsi)) return "invalid_email";
      if (password.next || password.confirm) {
        if (password.next.length < 8 || !/\d/.test(password.next)) return "weak_password";
        if (password.next !== password.confirm) return "password_mismatch";
      }
    }
    return null;
  }

  async function handleSave(e) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setStatus({ tone: "error", message: t(`account.errors.${problem}`) });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const url = isInterviewee ? "/interviewee/account" : "/interviewer/account";
      const { data } = await client.put(url, buildPayload());
      updateUser(data.user);
      setPassword({ next: "", confirm: "" });
      setStatus({ tone: "ok", message: t("account.saved") });
    } catch (err) {
      const key = err.response?.data?.error;
      setStatus({ tone: "error", message: t(`account.errors.${key || "generic"}`) });
    } finally {
      setSaving(false);
    }
  }

  const errTone = status?.tone === "error";

  return (
    <div className="mx-auto max-w-3xl space-y-6" ref={undefined}>
      {/* ------- Profile details ------- */}
      <form onSubmit={handleSave} className="dash-card" noValidate>
        <div className="mb-5 flex items-center gap-3">
          <span className="dash-avatar !h-10 !w-10" aria-hidden="true">
            <UserRound className="h-4.5 w-4.5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h1 className="dash-card-title">{t("account.profile_title")}</h1>
            <p className="mt-0.5 truncate text-xs text-gray-400">
              {isInterviewee ? t("dash.role_interviewee") : t("dash.role_interviewer")}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("account.full_name")}>
            <input
              className="ainput"
              value={form.jina}
              onChange={(e) => set("jina", e.target.value)}
              autoComplete="name"
            />
          </Field>

          {isInterviewee ? (
            <>
              <Field label={t("profile.phone")}>
                <input
                  className="ainput"
                  value={form.namba_ya_simu}
                  onChange={(e) => set("namba_ya_simu", e.target.value)}
                  placeholder={t("profile.phone_placeholder")}
                  autoComplete="tel"
                />
              </Field>
              <Field label={t("profile.email")}>
                <input
                  className="ainput"
                  type="email"
                  value={form.barua_pepe}
                  onChange={(e) => set("barua_pepe", e.target.value)}
                  autoComplete="email"
                />
              </Field>
              <Field label={t("education_skills.education_level")}>
                <select
                  className="select"
                  value={form.kiwango_cha_elimu}
                  onChange={(e) => set("kiwango_cha_elimu", e.target.value)}
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
                  className="select"
                  value={form.sekta}
                  onChange={(e) => setForm((f) => ({ ...f, sekta: e.target.value, taaluma: "", ujuzi: [] }))}
                >
                  <option value="">{t("education_skills.select_placeholder")}</option>
                  {Object.keys(SECTOR_DATA).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("education_skills.profession")}>
                <select
                  className="select"
                  disabled={!form.sekta}
                  value={form.taaluma}
                  onChange={(e) => set("taaluma", e.target.value)}
                >
                  <option value="">{t("education_skills.select_placeholder")}</option>
                  {professionOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("education_skills.experience")}>
                <select
                  className="select"
                  value={form.uzoefu}
                  onChange={(e) => set("uzoefu", e.target.value)}
                >
                  <option value="">{t("education_skills.select_placeholder")}</option>
                  {EXPERIENCE_RANGES.map((r) => (
                    <option key={r} value={r}>
                      {t(`education_skills.experience_ranges.${r}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label={t("education_skills.specialization")}>
                  <input
                    className="ainput"
                    value={form.utaalamu}
                    onChange={(e) => set("utaalamu", e.target.value)}
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field
                  label={t("education_skills.skills")}
                  hint={t("account.skills_hint", { count: form.ujuzi.length })}
                >
                  <div className="flex flex-wrap gap-2">
                    {sectorSkills.map((skill) => {
                      const selected = form.ujuzi.includes(skill);
                      const full = !selected && form.ujuzi.length >= 5;
                      return (
                        <button
                          type="button"
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          disabled={full && !selected}
                          className={`px-3 py-1.5 rounded-full text-sm border-2 transition-colors ${
                            selected
                              ? "bg-[#b11345] text-white border-[#b11345]"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          } ${full ? "opacity-40 cursor-not-allowed" : ""}`}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>
            </>
          ) : (
            <>
              <Field label={t("company_profile.company_name")}>
                <input
                  className="ainput"
                  value={form.jina_la_kampuni}
                  onChange={(e) => set("jina_la_kampuni", e.target.value)}
                  autoComplete="organization"
                />
              </Field>
              <Field label={t("company_profile.company_email")}>
                <input
                  className="ainput"
                  type="email"
                  value={form.barua_pepe_ya_kampuni}
                  onChange={(e) => set("barua_pepe_ya_kampuni", e.target.value)}
                  autoComplete="email"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field
                  label={t("personal_profile.personal_email")}
                  hint={t("account.personal_email_hint")}
                >
                  <input
                    className="ainput"
                    type="email"
                    value={form.barua_pepe_binafsi}
                    onChange={(e) => set("barua_pepe_binafsi", e.target.value)}
                    autoComplete="email"
                  />
                </Field>
              </div>
            </>
          )}
        </div>

        {/* ------- Security (interviewer password change) ------- */}
        {!isInterviewee && (
          <div className="mt-6 border-t border-dashed border-gray-100 pt-5">
            <div className="mb-3 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-gray-400" aria-hidden="true" />
              <h2 className="dash-card-title !mb-0 text-base">{t("account.security_title")}</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("account.new_password")}>
                <input
                  className="ainput"
                  type="password"
                  value={password.next}
                  onChange={(e) => {
                    setPassword((p) => ({ ...p, next: e.target.value }));
                    setStatus(null);
                  }}
                  autoComplete="new-password"
                  placeholder={t("account.password_placeholder")}
                />
              </Field>
              <Field label={t("personal_profile.confirm_password")}>
                <input
                  className="ainput"
                  type="password"
                  value={password.confirm}
                  onChange={(e) => {
                    setPassword((p) => ({ ...p, confirm: e.target.value }));
                    setStatus(null);
                  }}
                  autoComplete="new-password"
                  placeholder={t("account.password_placeholder")}
                />
              </Field>
            </div>
          </div>
        )}

        {/* Save row */}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <div aria-live="polite" className="mr-auto min-h-5 text-sm font-semibold">
            {status && (
              <span className={errTone ? "text-[#b11345]" : "text-emerald-600"}>{status.message}</span>
            )}
          </div>
          <button type="submit" disabled={saving} className="abtn-primary disabled:opacity-60">
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? t("account.saving") : t("account.save_changes")}
          </button>
        </div>
      </form>
    </div>
  );
}
