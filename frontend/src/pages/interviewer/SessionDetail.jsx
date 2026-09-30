import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Circle, Timer, UserRound } from "lucide-react";
import client from "../../api/client";
import { Badge } from "../../components/ui";
import { usePageReveal } from "../../lib/pageReveal";

/**
 * Interviewer's review workspace: full transcript beside the scorecard, the
 * candidate's profile, and the judgment form (Advance / Hold / Reject + note).
 * This is the human layer the rule-based scorecard deliberately leaves open —
 * and the surface the future LLM will pre-draft notes into.
 */
export default function SessionDetail() {
  const { t } = useTranslation();
  const { sessionId } = useParams();
  const reveal = usePageReveal();

  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // judgment form
  const [decision, setDecision] = useState(null);
  const [note, setNote] = useState("");
  const [savingDecision, setSavingDecision] = useState(false);
  const [decisionSaved, setDecisionSaved] = useState(false);

  async function load() {
    try {
      const { data } = await client.get(`/interviewer/sessions/${sessionId}`);
      setSession(data.session);
      setMessages(data.messages);
      setDecision(data.session.interviewer_decision ?? null);
      setNote(data.session.interviewer_note ?? "");
      setDecisionSaved(Boolean(data.session.reviewed_at));
    } catch (err) {
      if (err.response?.status === 404) setError(t("sessionDetail.not_found"));
      else setError(t("common.error_generic"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function submitDecision() {
    if (!decision) return;
    setSavingDecision(true);
    setError(null);
    try {
      await client.post(`/interviewer/sessions/${sessionId}/decision`, { decision, note });
      setDecisionSaved(true);
    } catch (err) {
      setError(err.response?.status === 409 ? t("sessionDetail.not_completed") : t("common.error_generic"));
    } finally {
      setSavingDecision(false);
    }
  }

  async function markNoShow() {
    setError(null);
    try {
      await client.post(`/interviewer/sessions/${sessionId}/no-show`);
      setSession((s) => ({ ...s, no_show: true }));
    } catch {
      setError(t("common.error_generic"));
    }
  }

  if (loading) return <p className="max-w-3xl mx-auto text-gray-400">{t("common.loading")}</p>;
  if (error && !session) {
    return (
      <div className="max-w-3xl mx-auto text-center space-y-3 mt-10">
        <p className="text-brand-pink">{error}</p>
        <Link to="/interviewer/dashboard" className="abtn-outline inline-block">
          {t("sessionDetail.back")}
        </Link>
      </div>
    );
  }

  const report = session.report;
  const score = report?.score ?? session.report_score;
  const completed = session.status === "imekamilika";
  const durationMin =
    report?.duration_seconds
      ? Math.max(1, Math.round(report.duration_seconds / 60))
      : session.started_at && session.completed_at
        ? Math.max(1, Math.round((new Date(session.completed_at) - new Date(session.started_at)) / 60000))
        : null;

  return (
    <div ref={reveal} className="max-w-3xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{session.title}</h1>
          <p className="text-sm text-gray-500">
            {session.candidate_name}
            {session.completed_at
              ? ` · ${new Date(session.completed_at).toLocaleDateString()}`
              : session.started_at
                ? ` · ${new Date(session.started_at).toLocaleDateString()}`
                : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {score != null && (
            <span
              className={`text-2xl font-semibold ${
                score >= 75 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-gray-500"
              }`}
            >
              {score}/100
            </span>
          )}
          {session.no_show && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-brand-pink/10 text-brand-pink">
              {t("sessionDetail.no_show_badge")}
            </span>
          )}
        </div>
      </header>

      {!completed && (
        <section className="app-card !bg-amber-50/70 dark:!bg-amber-500/10 p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-700">{t("sessionDetail.in_progress_note")}</p>
          {!session.no_show && (
            <button onClick={markNoShow} className="abtn-outline abtn-sm shrink-0">
              {t("sessionDetail.mark_no_show")}
            </button>
          )}
        </section>
      )}

      {/* Candidate profile */}
      <section className="form-card space-y-3">
        <h2 className="flex items-center gap-2 font-medium text-gray-900">
          <UserRound className="h-4 w-4 text-brand-blue" /> {t("sessionDetail.candidate_title")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <Field label={t("candidateDash.field_education")} value={session.kiwango_cha_elimu && t(`education_skills.education_levels.${session.kiwango_cha_elimu}`)} />
          <Field label={t("candidateDash.field_sector")} value={session.sekta} />
          <Field label={t("candidateDash.field_profession")} value={session.taaluma} />
          <Field label={t("candidateDash.field_experience")} value={session.uzoefu && t(`education_skills.experience_ranges.${session.uzoefu}`)} />
        </div>
        {Array.isArray(session.ujuzi) && session.ujuzi.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {session.ujuzi.map((s) => (
              <span key={s} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">{s}</span>
            ))}
          </div>
        )}
      </section>

      {/* Scorecard summary (same numbers the candidate sees) */}
      {report && (
        <section className="form-card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-gray-900">{t("sessionDetail.report_title")}</h2>
            {durationMin && (
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <Timer className="h-3.5 w-3.5" />
                {t(durationMin === 1 ? "report.duration_one" : "report.duration_other", { count: durationMin })}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <Metric label={t("report.completion")} value={`${report.breakdown.completion.answered}/${report.breakdown.completion.planned}`} />
            <Metric label={t("report.effort")} value={`${report.breakdown.effort.mean_chars} ${t("report.chars")}`} />
            <Metric label={t("report.engagement")} value={report.breakdown.engagement.finished ? "✓" : "—"} />
            {report.breakdown.quality && (
              <Metric
                label={t("report.quality")}
                value={`${Math.round((report.breakdown.quality.mean_coverage ?? 0) * 100)}%`}
              />
            )}
          </div>
          {(report.skills.covered.length > 0 || report.skills.missed.length > 0) && (
            <ul className="space-y-1 pt-1">
              {report.skills.covered.map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> {s}
                </li>
              ))}
              {report.skills.missed.map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm text-gray-400">
                  <Circle className="h-4 w-4 shrink-0" /> {s}
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-gray-400">{t("report.basis_note")}</p>
        </section>
      )}

      {/* Full transcript */}
      <section className="app-card overflow-hidden divide-y divide-gray-50">
        <h2 className="px-5 py-3 font-medium text-gray-900 border-b border-gray-100">{t("sessionDetail.transcript_title")}</h2>
        {messages.map((m, i) => (
          <article key={i} className="p-4 flex gap-3">
            <span
              className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide mt-0.5 w-16 ${
                m.role === "ai" ? "text-brand-blue" : "text-brand-orange"
              }`}
            >
              {m.role === "ai" ? t("sessionRoom.interviewer") : t("sessionRoom.you")}
            </span>
            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words flex-1">{m.content}</p>
          </article>
        ))}
        {messages.length === 0 && (
          <p className="p-5 text-sm text-gray-400">{t("sessionDetail.transcript_empty")}</p>
        )}
      </section>

      {/* Judgment form — completed sessions only */}
      {completed ? (
        <section className="form-card space-y-4">
          <h2 className="font-medium text-gray-900">{t("sessionDetail.judgment_title")}</h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "endelea", cls: "border-green-600 bg-green-50 text-green-700" },
              { id: "subiri", cls: "border-amber-500 bg-amber-50 text-amber-700" },
              { id: "mapengo", cls: "border-brand-pink bg-brand-pink/5 text-brand-pink" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { setDecision(opt.id); setDecisionSaved(false); }}
                className={`rounded-lg py-2 text-sm font-medium border-2 transition ${
                  decision === opt.id ? opt.cls : "border-gray-200 text-gray-600"
                }`}
              >
                {t(`sessionDetail.decision_${opt.id}`)}
              </button>
            ))}
          </div>
          <textarea
            rows={4}
            maxLength={4000}
            value={note}
            onChange={(e) => { setNote(e.target.value); setDecisionSaved(false); }}
            placeholder={t("sessionDetail.note_placeholder")}
            className="ainput"
          />
          {error && <p className="text-brand-pink text-sm">{error}</p>}
          <button
            onClick={submitDecision}
            disabled={!decision || savingDecision}
            className="abtn-primary w-full"
          >
            {savingDecision ? t("common.loading") : decisionSaved ? t("sessionDetail.update") : t("sessionDetail.save")}
          </button>
          {decisionSaved && (
            <p className="text-xs text-green-600">
              {t("sessionDetail.saved_at", { time: new Date(session.reviewed_at).toLocaleString() })}
            </p>
          )}
        </section>
      ) : null}

      <div className="flex justify-center pb-4">
        <Link to="/interviewer/dashboard" className="alink">
          {t("sessionDetail.back")}
        </Link>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="flex justify-between sm:block">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 sm:block">{value || "—"}</span>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
      <p className="text-sm font-semibold text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}
