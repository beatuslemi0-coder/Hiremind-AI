import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { CalendarClock } from "lucide-react";
import client from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Badge, EmptyState, PageHeader } from "../../components/ui";
import { useReveal } from "../../lib/motion";

/**
 * Sessions — one page for everything about the candidate's own sessions:
 * resume a live one, join or cancel an upcoming booking, revisit reports.
 */
export default function Sessions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const revealRef = useReveal();

  const [dashboard, setDashboard] = useState(null);
  const [active, setActive] = useState(null); // live session row (inaendelea)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, activeRes] = await Promise.allSettled([
        client.get("/interviewee/dashboard"),
        client.get("/interviewee/interview-sessions/active"),
      ]);
      if (dashRes.status === "fulfilled") setDashboard(dashRes.value.data);
      if (activeRes.status === "fulfilled") setActive(activeRes.value.data.session);
      else setActive(null); // 404 = none live, which is normal
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function cancelSession(sessionId) {
    setCancellingId(sessionId);
    try {
      await client.post(`/interviewee/interview-sessions/${sessionId}/cancel`);
      await load();
    } finally {
      setCancellingId(null);
    }
  }

  function join(session) {
    navigate("/interviewee/session-setup", {
      state: { session: { ...session } },
    });
  }

  if (loading) {
    return <p className="py-16 text-center text-sm text-gray-400">{t("common.loading")}</p>;
  }

  const name = dashboard?.profile?.jina || user?.jina || "";
  const upcoming = dashboard?.upcoming || [];
  const history = dashboard?.history || [];

  return (
    <div ref={revealRef} className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t("sessionsPage.title")} subtitle={name ? t("dash.welcome_back") + ", " + name : undefined} />

      {/* Live now — resume without redoing device checks */}
      {active && (
        <section data-reveal className="dash-hero !border-[#b11345]/30">
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-[#b11345]" />
              <div>
                <p className="text-lg font-extrabold text-gray-900">{t("sessionsPage.live_now")}</p>
                <p className="truncate text-sm font-medium text-gray-500">{active.title}</p>
              </div>
            </div>
            <button
              onClick={() =>
                navigate("/interviewee/session", {
                  state: { sessionId: active.id, title: active.title },
                })
              }
              className="abtn-primary shrink-0"
            >
              {t("sessionsPage.resume")}
            </button>
          </div>
        </section>
      )}

      {/* Upcoming bookings */}
      <section data-reveal>
        <h2 className="dash-card-title mb-3">{t("sessionsPage.upcoming")}</h2>
        {upcoming.length === 0 ? (
          <EmptyState
            title={t("sessionsPage.none_upcoming")}
            body={t("dash.hero_hint")}
            action={
              <button onClick={() => navigate("/interviewee/interviews")} className="abtn-primary abtn-sm">
                {t("dash.browse")}
              </button>
            }
          />
        ) : (
          <ul className="space-y-2">
            {upcoming.map((s) => (
              <li key={s.id} className="dash-row !flex-col !items-stretch">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-900">{s.title}</p>
                    <p className="flex items-center gap-1.5 truncate text-xs font-semibold text-[#1d4ed8]">
                      <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                      {new Date(s.scheduled_for).toLocaleString([], {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-400">{s.jina_la_kampuni}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => join(s)} className="abtn-primary abtn-sm flex-1">
                    {t("candidateDash.join")}
                  </button>
                  <button
                    onClick={() => cancelSession(s.id)}
                    disabled={cancellingId === s.id}
                    className="abtn-outline abtn-sm flex-1 disabled:opacity-50"
                  >
                    {t("candidateDash.cancel")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Completed — jump straight to the report */}
      <section data-reveal>
        <h2 className="dash-card-title mb-3">{t("sessionsPage.completed")}</h2>
        {history.length === 0 ? (
          <p className="text-xs text-gray-400">{t("candidateDash.history_empty")}</p>
        ) : (
          <ul className="space-y-2">
            {history.map((s) => (
              <li key={s.id} className="dash-row">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900">{s.title}</p>
                  <p className="truncate text-xs text-gray-400">
                    {s.jina_la_kampuni}
                    {s.completed_at && ` · ${new Date(s.completed_at).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {typeof s.score === "number" && (
                    <Badge tone={s.score >= 60 ? "green" : "amber"}>{s.score}</Badge>
                  )}
                  <button
                    onClick={() => navigate(`/interviewee/sessions/${s.id}/report`)}
                    className="dash-textlink"
                  >
                    {t("report.view_link")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
