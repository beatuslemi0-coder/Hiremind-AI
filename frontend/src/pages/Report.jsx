import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePageReveal } from "../lib/pageReveal";
import { Link, useLocation, useParams } from "react-router-dom";
import { CheckCircle2, Circle, Timer } from "lucide-react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

/**
 * Post-interview scorecard, shared by candidate and interviewer views.
 * Rule-based and honest: engagement + coverage numbers, no answer-quality
 * judgment (the report says so itself via i18n copy).
 */
export default function Report({ backTo: backToProp }) {
  const { t } = useTranslation();
  const { sessionId } = useParams();
  const { state } = useLocation(); // optional: { backTo }
  const { user } = useAuth();
  const isInterviewer = user?.type === "interviewer";
  const backTo = backToProp ?? state?.backTo ?? (isInterviewer ? "/interviewer/dashboard" : "/interviewee/dashboard");
  const reportUrl = isInterviewer
    ? `/interviewer/sessions/${sessionId}/report`
    : `/interviewee/interview-sessions/${sessionId}/report`;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const reveal = usePageReveal();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get(reportUrl);
        setData(data);
        // Interviewer judgment is interviewer-scoped; candidates fetch it via
        // the report payload's session fields instead (handled by the 200 body).
        if (!isInterviewer && data?.report) {
          try {
            const { data: fb } = await client.get(
              `/interviewee/interview-sessions/${sessionId}/feedback`
            );
            setFeedback(fb?.feedback ?? null);
          } catch {
            /* no feedback yet — fine */
          }
        }
      } catch (err) {
        if (err.response?.status === 409) setError(t("report.not_completed"));
        else if (err.response?.status === 404) setError(t("report.not_found"));
        else setError(t("common.error_generic"));
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId, t]);

  if (loading) return <p className="max-w-2xl mx-auto text-gray-400">{t("common.loading")}</p>;
  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-3 mt-10">
        <p className="text-brand-pink">{error}</p>
        <Link to={backTo} className="abtn-outline inline-block">
          {t("report.back")}
        </Link>
      </div>
    );
  }

  const { report } = data;
  const score = report.score;
  const scoreColor =
    score >= 75 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-gray-500";
  const durationMin = report.duration_seconds
    ? Math.max(1, Math.round(report.duration_seconds / 60))
    : null;

  const parts = [
    { key: "completion", ...report.breakdown.completion },
    { key: "effort", ...report.breakdown.effort },
    { key: "engagement", ...report.breakdown.engagement },
    ...(report.breakdown.quality ? [{ key: "quality", ...report.breakdown.quality }] : []),
  ];

  return (
    <div ref={reveal} className="max-w-2xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("report.title")}</h1>
          <p className="text-sm text-gray-500">{t("report.subtitle")}</p>
        </div>
        <div className={`text-right shrink-0`}>
          <p className={`text-4xl font-bold ${scoreColor}`}>{score}</p>
          <p className="text-xs text-gray-400">/ 100</p>
        </div>
      </header>

      {/* Breakdown bars */}
      <section className="form-card space-y-4">
        {parts.map((p) => {
          const pct = p.max > 0 ? Math.round((p.score / p.max) * 100) : 0;
          return (
            <div key={p.key}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{t(`report.${p.key}`)}</span>
                <span className="text-gray-500">
                  {p.score} / {p.max}
                  {p.key === "completion" ? ` · ${p.answered}/${p.planned}` : ""}
                  {p.key === "effort" ? ` · ~${p.mean_chars} ${t("report.chars")}` : ""}
                  {p.key === "quality" ? ` · ${Math.round((p.mean_coverage ?? 0) * 100)}%` : ""}
                </span>
              </div>
              <div className="aprogress !h-2.5">
                <div
                  className={`aprogress-fill ${pct < 40 ? "!bg-none !bg-gray-300" : ""}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}

        {durationMin && (
          <p className="flex items-center gap-2 text-sm text-gray-500 pt-1">
            <Timer className="h-4 w-4" />
            {t(durationMin === 1 ? "report.duration_one" : "report.duration_other", { count: durationMin })}
          </p>
        )}
        {report.breakdown.quality && (
          <p className="text-xs text-gray-400 pt-1">{t("report.quality_hint")}</p>
        )}
      </section>

      {/* Rubric signals — the deterministic per-answer quality layer */}
      {Array.isArray(report.quality?.answers) && report.quality.answers.length > 0 && (
        <section className="form-card space-y-3">
          <h2 className="font-medium text-gray-900">{t("report.quality_signals")}</h2>
          <ul className="space-y-2">
            {report.quality.answers.map((a) => (
              <li key={a.index} className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-gray-700">
                    {t("sessionRoom.progress", { n: a.index, count: report.quality.answers.length })}
                    {a.skill ? ` · ${a.skill}` : ""}
                  </span>
                  <span className="text-xs text-gray-500">{Math.round((a.coverage ?? 0) * 100)}%</span>
                </div>
                {a.keyword_hits?.length > 0 || a.structure_hits?.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {a.keyword_hits?.map((k) => (
                      <span key={`k-${k}`} className="rounded-full bg-brand-blue/[0.08] px-2 py-0.5 text-[11px] text-brand-blue">
                        {k}
                      </span>
                    ))}
                    {a.structure_hits?.map((s) => (
                      <span key={`s-${s}`} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-gray-400">{t("report.quality_none")}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Skill coverage */}
      <section className="form-card space-y-3">
        <h2 className="font-medium text-gray-900">{t("report.skills_title")}</h2>
        {report.skills.covered.length === 0 && report.skills.missed.length === 0 ? (
          <p className="text-sm text-gray-400">{t("report.skills_none")}</p>
        ) : (
          <>
            <ul className="space-y-1.5">
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
            {report.skills.missed.length > 0 && (
              <p className="text-xs text-gray-400">{t("report.skills_missed_hint")}</p>
            )}
          </>
        )}
      </section>

      {/* Interviewer's expert feedback — the human judgment layer */}
      {!isInterviewer && feedback?.note != null && (
        <section className="form-card !bg-brand-blue/[0.04] space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-gray-900">{t("report.feedback_title")}</h2>
            {feedback.decision && (
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  feedback.decision === "endelea"
                    ? "bg-green-100 text-green-700"
                    : feedback.decision === "mapengo"
                      ? "bg-brand-pink/10 text-brand-pink"
                      : "bg-amber-100 text-amber-700"
                }`}
              >
                {t(`sessionDetail.decision_${feedback.decision}`)}
              </span>
            )}
          </div>
          {feedback.note && (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{feedback.note}</p>
          )}
          {feedback.reviewed_at && (
            <p className="text-xs text-gray-400">
              {t("report.feedback_by", { name: feedback.interviewer_name, time: new Date(feedback.reviewed_at).toLocaleString() })}
            </p>
          )}
        </section>
      )}

      {/* Honest-basis note */}
      <p className="text-xs text-gray-400 border-l-4 border-gray-100 pl-3">{t("report.basis_note")}</p>

      <div className="flex justify-center">
        <Link to={backTo} className="abtn-primary px-6">
          {t("report.back")}
        </Link>
      </div>
    </div>
  );
}
