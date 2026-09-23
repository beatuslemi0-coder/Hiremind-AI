import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Check, X } from "lucide-react";
import client from "../../api/client";
import { apiDetail, jobCreatePayload, jobsApi, mapJobForUi, reportsApi } from "../../api/vox";
import { SECTOR_DATA, EDUCATION_LEVELS } from "../../data/taxonomy";
import { Badge, EmptyState } from "../../components/ui";
import { useReveal } from "../../lib/motion";

export default function Dashboard() {
  const { t } = useTranslation();
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [slots, setSlots] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [form, setForm] = useState({
    title: "",
    location: "",
    sekta: "",
    taaluma: "",
    kiwango_cha_elimu_kinachohitajika: "",
    ujuzi_unaohitajika: [],
    description: "",
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [slotStart, setSlotStart] = useState("");
  const [slotError, setSlotError] = useState(null);
  const [statusBusy, setStatusBusy] = useState(null);

  const professionOptions = SECTOR_DATA[form.sekta]?.professions || [];
  const skillOptions = SECTOR_DATA[form.sekta]?.skills || [];

  useEffect(() => {
    (async () => {
      try {
        const [mineRes, reportsRes, slotsRes] = await Promise.allSettled([
          jobsApi.mine(),
          reportsApi.employer(),
          client.get("/interviewer/availability"),
        ]);
        const jobs = mineRes.status === "fulfilled" ? (mineRes.value || []).map(mapJobForUi) : [];
        setMine(jobs);
        const reports = reportsRes.status === "fulfilled" ? reportsRes.value || [] : [];
        setSessions(
          reports.map((report) => ({
            id: report.interview_id,
            title: report.job_title,
            candidate_name: report.candidate_name,
            completed_at: report.generated_at,
            report_score: Math.round(Number(report.overall_score || 0)),
            status: "imekamilika",
          }))
        );
        setAnalytics({
          postings: jobs.length,
          sessions_started: reports.length,
          sessions_completed: reports.length,
          upcoming_booked: 0,
          docs_pending_review: 0,
        });
        if (slotsRes.status === "fulfilled") setSlots(slotsRes.value.data.slots);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function toggleSkill(skill) {
    setForm((f) => {
      const has = f.ujuzi_unaohitajika.includes(skill);
      if (has) return { ...f, ujuzi_unaohitajika: f.ujuzi_unaohitajika.filter((s) => s !== skill) };
      if (f.ujuzi_unaohitajika.length >= 5) return f; // same max-5 rule as the interviewee side
      return { ...f, ujuzi_unaohitajika: [...f.ujuzi_unaohitajika, skill] };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const created = mapJobForUi(await jobsApi.create(jobCreatePayload(form)));
      setMine((list) => [created, ...list]);
      setAnalytics((current) => ({
        ...(current || {}),
        postings: (current?.postings || 0) + 1,
      }));
      setForm({
        title: "",
        location: "",
        sekta: "",
        taaluma: "",
        kiwango_cha_elimu_kinachohitajika: "",
        ujuzi_unaohitajika: [],
        description: "",
      });
    } catch (err) {
      setError(apiDetail(err) || t("common.error_generic"));
    } finally {
      setSubmitting(false);
    }
  }

  async function setPostingStatus(interviewId, status) {
    setStatusBusy(interviewId);
    try {
      const updated = mapJobForUi(await jobsApi.update(interviewId, { status }));
      setMine((list) => list.map((iv) => (iv.id === interviewId ? updated : iv)));
    } finally {
      setStatusBusy(null);
    }
  }

  async function addSlot() {
    setSlotError(null);
    if (!slotStart) return;
    const start = new Date(slotStart);
    if (start <= new Date()) {
      setSlotError(t("dashboard.slot_past"));
      return;
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1-hour slots
    try {
      const { data } = await client.post("/interviewer/availability", {
        slots: [{ starts_at: start.toISOString(), ends_at: end.toISOString() }],
      });
      setSlots((list) => [...list, ...data.slots].sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at)));
      setSlotStart("");
    } catch (err) {
      setSlotError(t("common.error_generic"));
    }
  }

  const pendingDocs = analytics?.docs_pending_review ?? 0;
  const revealRef = useReveal();

  return (
    <div ref={revealRef} className="space-y-6">
      {/* ------- Facts strip: label-first, reads like a table row ------- */}
      {analytics && (
        <section className="dash-strip" data-reveal aria-label={t("dash.strip_label")}>
          <span className="dash-strip-item">
            {t("dashboard.stat_postings")} <strong>{analytics.postings ?? 0}</strong>
          </span>
          <span className="dash-strip-item">
            {t("dashboard.stat_sessions")} <strong>{analytics.sessions_started ?? 0}</strong>
          </span>
          <span className="dash-strip-item">
            {t("dashboard.stat_completion")}{" "}
            <strong>
              {analytics.sessions_started
                ? `${Math.round((analytics.sessions_completed / analytics.sessions_started) * 100)}%`
                : "—"}
            </strong>
          </span>
          <span className="dash-strip-item">
            {t("dashboard.stat_upcoming")} <strong>{analytics.upcoming_booked ?? 0}</strong>
          </span>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* ================= Main column ================= */}
        <div className="space-y-6">
          {/* Post a new interview — the primary action, first */}
          <form onSubmit={handleSubmit} className="dash-card space-y-4" data-reveal>
            <h2 className="dash-card-title">{t("dashboard.create_title")}</h2>

            <div>
              <label className="alabel">{t("dashboard.title_label")}</label>
              <input
                required
                maxLength={255}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t("dashboard.title_placeholder")}
                className="ainput"
              />
            </div>

            <div>
              <label className="alabel">{t("dashboard.location")}</label>
              <input
                required
                maxLength={150}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder={t("dashboard.location_placeholder")}
                className="ainput"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="alabel">{t("dashboard.sector")}</label>
                <select
                  required
                  value={form.sekta}
                  onChange={(e) => setForm({ ...form, sekta: e.target.value, taaluma: "", ujuzi_unaohitajika: [] })}
                  className="select"
                >
                  <option value="">{t("education_skills.select_placeholder")}</option>
                  {Object.keys(SECTOR_DATA).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="alabel">{t("dashboard.profession")}</label>
                <select
                  required
                  disabled={!form.sekta}
                  value={form.taaluma}
                  onChange={(e) => setForm({ ...form, taaluma: e.target.value })}
                  className="select"
                >
                  <option value="">{t("education_skills.select_placeholder")}</option>
                  {professionOptions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="alabel">{t("dashboard.required_education")}</label>
              <select
                value={form.kiwango_cha_elimu_kinachohitajika}
                onChange={(e) => setForm({ ...form, kiwango_cha_elimu_kinachohitajika: e.target.value })}
                className="select"
              >
                <option value="">{t("dashboard.no_minimum")}</option>
                {EDUCATION_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {t(`education_skills.education_levels.${lvl}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="alabel">
                {t("dashboard.required_skills", { count: form.ujuzi_unaohitajika.length })}
              </label>
              {!form.sekta ? (
                <p className="text-sm text-gray-400">{t("dashboard.pick_sector_first")}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skillOptions.map((skill) => {
                    const selected = form.ujuzi_unaohitajika.includes(skill);
                    return (
                      <button
                        type="button"
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        disabled={!selected && form.ujuzi_unaohitajika.length >= 5}
                        className={`px-3 py-1.5 rounded-full text-sm border-2 disabled:opacity-40 ${
                          selected ? "border-[#b11345] bg-[#b11345] text-white" : "border-gray-200 text-gray-600"
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="alabel">{t("dashboard.description")}</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t("dashboard.description_placeholder")}
                className="ainput"
              />
            </div>

            {error && <p className="text-sm font-semibold text-[#b11345]">{error}</p>}

            <button type="submit" disabled={submitting} className="abtn-primary w-full">
              {submitting ? t("dashboard.posting") : t("dashboard.post")}
            </button>
          </form>

          {/* Recent candidate sessions */}
          <section data-reveal>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="dash-card-title">{t("dashboard.sessions_title")}</h2>
            </div>
            {sessions.length === 0 ? (
              <EmptyState title={t("dashboard.sessions_empty")} />
            ) : (
              <ul className="space-y-2">
                {sessions.slice(0, 8).map((s) => (
                  <li key={s.id} className="dash-row">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-900">{s.title}</p>
                      <p className="truncate text-xs text-gray-400">
                        {s.candidate_name} ·{" "}
                        {s.completed_at
                          ? new Date(s.completed_at).toLocaleDateString()
                          : s.scheduled_for
                            ? new Date(s.scheduled_for).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                            : t("dashboard.session_in_progress")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {s.interviewer_decision && (
                        <Badge
                          tone={
                            s.interviewer_decision === "endelea"
                              ? "green"
                              : s.interviewer_decision === "mapengo"
                                ? "red"
                                : "amber"
                          }
                        >
                          {t(`sessionDetail.decision_${s.interviewer_decision}`)}
                        </Badge>
                      )}
                      {s.no_show && <Badge tone="red">{t("sessionDetail.no_show_badge")}</Badge>}
                      <Link
                        to={`/interviewer/sessions/${s.id}`}
                        className="dash-textlink"
                      >
                        {s.status === "imekamilika" && s.report_score != null
                          ? t("dashboard.session_score", { score: s.report_score })
                          : t("dashboard.review_session")}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Your postings */}
          <section data-reveal>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="dash-card-title">{t("dashboard.your_interviews")}</h2>
              <span className="text-xs font-medium text-gray-400">
                {t("dash.matches_count", { count: mine.length })}
              </span>
            </div>
            {loading ? (
              <p className="text-sm text-gray-400">{t("common.loading")}</p>
            ) : mine.length === 0 ? (
              <EmptyState title={t("dashboard.none_posted")} />
            ) : (
              <ul className="space-y-2">
                {mine.map((interview) => (
                  <li key={interview.id} className="dash-row !flex-col !items-stretch">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-gray-900">
                          {interview.title}
                          {interview.status !== "active" && (
                            <Badge tone="gray" className="ml-2 align-middle">
                              {t(`dashboard.posting_${interview.status}`)}
                            </Badge>
                          )}
                        </p>
                        <p className="truncate text-xs text-gray-400">
                          {interview.sekta} — {interview.taaluma}
                          {interview.kiwango_cha_elimu_kinachohitajika
                            ? ` · ${t(`education_skills.education_levels.${interview.kiwango_cha_elimu_kinachohitajika}`)}`
                            : ""}
                        </p>
                        {interview.ujuzi_unaohitajika?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {interview.ujuzi_unaohitajika.map((s) => (
                              <span key={s} className="dash-chip">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Link
                        to={`/interviewer/interviews/${interview.id}/candidates`}
                        className="dash-textlink shrink-0"
                      >
                        {t("dashboard.view_candidates")}
                      </Link>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {interview.status === "active" && (
                        <button
                          type="button"
                          disabled={statusBusy === interview.id}
                          onClick={() => setPostingStatus(interview.id, "paused")}
                          className="abtn-outline abtn-sm"
                        >
                          {t("dashboard.pause_posting")}
                        </button>
                      )}
                      {interview.status === "paused" && (
                        <button
                          type="button"
                          disabled={statusBusy === interview.id}
                          onClick={() => setPostingStatus(interview.id, "active")}
                          className="abtn-outline abtn-sm"
                        >
                          {t("dashboard.resume_posting")}
                        </button>
                      )}
                      {interview.status !== "closed" && (
                        <button
                          type="button"
                          disabled={statusBusy === interview.id}
                          onClick={() => setPostingStatus(interview.id, "closed")}
                          className="abtn-danger abtn-sm"
                        >
                          {t("dashboard.close_posting")}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* ================= Right rail ================= */}
        <aside className="space-y-6" data-reveal>
          {/* Document requests — real work, inline actions */}
          <section className="dash-card">
            <div className="dash-rail-title mb-4">
              <h2 className="dash-card-title">{t("dash.requests_title")}</h2>
              {pendingDocs > 0 && <span className="dash-rail-count">{pendingDocs}</span>}
            </div>
            {pendingDocs === 0 ? (
              <p className="text-xs text-gray-400">{t("dash.docs_all_clear")}</p>
            ) : (
              <DocRequests onDone={() => setAnalytics((a) => ({ ...a, docs_pending_review: Math.max(0, (a?.docs_pending_review ?? 1) - 1) }))} />
            )}
          </section>

          {/* Availability — the input lives here, calm and complete */}
          <section className="dash-card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="dash-card-title">{t("dashboard.availability_title")}</h2>
              <span className="text-xs font-medium text-gray-400">
                {slots.filter((s) => s.status === "tupu").length} {t("dash.slots_free")}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <input
                type="datetime-local"
                value={slotStart}
                onChange={(e) => setSlotStart(e.target.value)}
                className="ainput flex-1"
                aria-label={t("dashboard.add_slot")}
              />
              <button type="button" onClick={addSlot} className="abtn-primary abtn-sm mt-0.5">
                {t("dashboard.add_slot")}
              </button>
            </div>
            {slotError && <p className="text-sm font-semibold text-[#b11345]">{slotError}</p>}
            {slots.length === 0 ? (
              <p className="text-xs text-gray-400">{t("dashboard.no_slots")}</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <li
                    key={slot.id}
                    className={
                      slot.status === "imechukuliwa"
                        ? "dash-chip !line-through !opacity-60"
                        : "dash-chip !border-emerald-200 !bg-emerald-50 !text-emerald-700"
                    }
                  >
                    {new Date(slot.starts_at).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

/** Pending document requests with inline approve/reject. */
function DocRequests({ onDone }) {
  const { t } = useTranslation();
  const [docs, setDocs] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/interviewer/documents/pending");
        setDocs(data.documents);
      } catch {
        setDocs([]);
      }
    })();
  }, []);

  async function review(id, hali) {
    setBusyId(id);
    try {
      await client.post(`/interviewer/documents/${id}/review`, { hali });
      setDocs((list) => list.filter((d) => d.id !== id));
      setFlash(hali === "imethibitishwa" ? t("reviews.approved_flash") : t("reviews.rejected_flash"));
      onDone?.();
    } finally {
      setBusyId(null);
    }
  }

  if (!docs) return <p className="text-xs text-gray-400">{t("common.loading")}</p>;
  if (docs.length === 0) return <p className="text-xs text-gray-400">{t("dash.docs_all_clear")}</p>;

  return (
    <div className="space-y-2">
      {flash && (
        <p className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700">{flash}</p>
      )}
      {docs.map((d) => (
        <div key={d.id} className="dash-req">
          <p className="truncate text-xs font-bold text-gray-900">{t("dash.req_design", { name: d.jina })}</p>
          <p className="truncate text-[11px] text-gray-400">{d.file_name}</p>
          <div className="dash-req-actions mt-2">
            <button
              type="button"
              className="dash-reqbtn dash-reqbtn--ok"
              title={t("reviews.approve")}
              disabled={busyId === d.id}
              onClick={() => review(d.id, "imethibitishwa")}
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              type="button"
              className="dash-reqbtn dash-reqbtn--no"
              title={t("reviews.reject")}
              disabled={busyId === d.id}
              onClick={() => review(d.id, "imekataliwa")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
