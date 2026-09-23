import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import client from "../../api/client";
import { Badge, EmptyState, PageHeader } from "../../components/ui";
import { useReveal } from "../../lib/motion";

/**
 * Sessions — every candidate session in one list, newest first, each opening
 * its detail/review page. Same data the dashboard shows, but complete and
 * filterable by status.
 */
export default function Sessions() {
  const { t } = useTranslation();
  const revealRef = useReveal();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | live | scheduled | completed

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/interviewer/sessions");
        setSessions(data.sessions);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = sessions.filter((s) => {
    if (filter === "live") return s.status === "inaendelea";
    if (filter === "scheduled") return s.status === "imepangwa";
    if (filter === "completed") return s.status === "imekamilika";
    return true;
  });

  const tabs = [
    { key: "all", label: t("sessionsPage.filter_all") },
    { key: "live", label: t("sessionsPage.filter_live") },
    { key: "scheduled", label: t("sessionsPage.filter_scheduled") },
    { key: "completed", label: t("sessionsPage.filter_completed") },
  ];

  return (
    <div ref={revealRef} className="space-y-6">
      <PageHeader title={t("sessionsPage.title")} subtitle={t("sessionsPage.interviewer_subtitle")} />

      {/* Status filter — quiet segmented control */}
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={t("sessionsPage.title")}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={filter === tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
              filter === tab.key
                ? "bg-[#b11345] text-white"
                : "border border-[var(--dash-card-border)] bg-[var(--dash-card)] text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-gray-400">{t("common.loading")}</p>
      ) : filtered.length === 0 ? (
        <EmptyState title={t("dashboard.sessions_empty")} />
      ) : (
        <ul className="space-y-2">
          {filtered.map((s) => (
            <li key={s.id} className="dash-row !flex-col !items-stretch sm:!flex-row sm:!items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-900">{s.title}</p>
                <p className="truncate text-xs text-gray-400">
                  {s.candidate_name}
                  {" · "}
                  {s.completed_at
                    ? new Date(s.completed_at).toLocaleDateString()
                    : s.scheduled_for
                      ? new Date(s.scheduled_for).toLocaleString([], {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : t("dashboard.session_in_progress")}
                </p>
              </div>
              <div className="mt-2 flex shrink-0 items-center gap-3 sm:mt-0">
                {s.status === "inaendelea" && (
                  <Badge tone="amber">{t("sessionsPage.badge_live")}</Badge>
                )}
                {s.status === "imepangwa" && (
                  <Badge tone="blue">{t("sessionsPage.badge_scheduled")}</Badge>
                )}
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
                <Link to={`/interviewer/sessions/${s.id}`} className="dash-textlink">
                  {s.status === "imekamilika" && s.report_score != null
                    ? t("dashboard.session_score", { score: s.report_score })
                    : t("dashboard.review_session")}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
