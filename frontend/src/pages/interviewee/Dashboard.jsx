import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { CalendarClock, Star } from "lucide-react";
import { applicationsApi, loadCandidateDashboard, apiDetail } from "../../api/vox";
import { useAuth } from "../../context/AuthContext";
import { Badge, EmptyState, LinkButton } from "../../components/ui";
import { useReveal } from "../../lib/motion";

const VERIFICATION_TONES = {
  imethibitishwa: "green",
  inasubiri: "amber",
  imekataliwa: "red",
};

// Quiet dot colors for the skills legend.
const SKILL_COLORS = ["#b11345", "#1d4ed8", "#0e7490", "#7c3aed", "#b45309", "#15803d"];

function Stars({ value, max = 5 }) {
  const full = Math.max(0, Math.min(max, Math.round(value)));
  return (
    <span className="dash-stars" aria-label={`${value}/${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className="h-3.5 w-3.5"
          style={{ color: i < full ? "#f59e0b" : "#d1d5db" }}
          fill={i < full ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
}

/** Formats the next booked session into hero-friendly pieces. */
function nextInterviewParts(session) {
  const d = session?.scheduled_for ? new Date(session.scheduled_for) : new Date();
  if (Number.isNaN(d.getTime())) {
    const now = new Date();
    return {
      day: now.getDate(),
      month: now.toLocaleString([], { month: "short" }),
      time: "",
    };
  }
  return {
    day: d.getDate(),
    month: d.toLocaleString([], { month: "short" }),
    time: d.toLocaleString([], { weekday: "long", hour: "2-digit", minute: "2-digit" }),
  };
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const revealRef = useReveal();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const dashboard = await loadCandidateDashboard();
      setData(dashboard);
    } catch (err) {
      setError(apiDetail(err) || t("common.error_generic"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function cancelSession(session) {
    setCancellingId(session.id);
    try {
      if (session.application_id) {
        await applicationsApi.withdraw(session.application_id);
      }
      await load();
    } finally {
      setCancellingId(null);
    }
  }

  if (loading) {
    return <p className="py-16 text-center text-sm text-gray-400">{t("common.loading")}</p>;
  }
  if (error || !data) {
    return (
      <div className="mx-auto max-w-md space-y-3 py-16 text-center">
        <p className="text-sm font-semibold text-[#b11345]">{error || t("common.error_generic")}</p>
        <button onClick={load} className="abtn-primary">{t("common.retry")}</button>
      </div>
    );
  }

  const { profile, verification, upcoming, history, stats, topMatches, recommendedSkills } = data;
  const name = profile.jina || user?.jina || "";
  const skills = Array.isArray(profile.ujuzi) ? profile.ujuzi : [];

  // Rating: mean completed score mapped onto 5 stars (score/20).
  const scored = history.filter((s) => typeof s.score === "number");
  const avgScore = scored.length
    ? Math.round(scored.reduce((a, s) => a + s.score, 0) / scored.length)
    : null;
  const rating5 = avgScore != null ? Math.round((avgScore / 20) * 10) / 10 : null;

  // The hero leads with the next booked interview (or an invitation when none).
  const next = upcoming[0] || null;
  const nextParts = next ? nextInterviewParts(next) : null;

  return (
    <div ref={revealRef} className="space-y-6">
      {/* ------- Hero: the next interview, or an invitation to book ------- */}
      <section className="dash-hero" data-reveal>
        {/* Mobile-only header: welcome + verification status top-right */}
        <div className="relative mb-4 flex items-center justify-between gap-3 sm:hidden">
          <p className="min-w-0 truncate text-sm font-extrabold text-gray-900">
            {t("dash.welcome_back")}{name ? `, ${name}` : ""}
          </p>
          <Badge tone={VERIFICATION_TONES[verification] || "gray"} className="shrink-0">
            {t(`candidateDash.status.${verification}`)}
          </Badge>
        </div>

        {next ? (
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            {/* Date block: the day number is the visual anchor */}
            <div className="flex items-center gap-5">
              <div className="text-center">
                <p className="dash-huge">{nextParts.day}</p>
                <p className="dash-day-month">{nextParts.month}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-400">{t("candidateDash.upcoming_title")}</p>
                <p className="mt-0.5 truncate text-lg font-extrabold text-gray-900">{next.title}</p>
                <p className="truncate text-sm font-medium text-gray-500">{next.jina_la_kampuni}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#1d4ed8]">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {nextParts.time}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-stretch">
              <button
                onClick={() =>
                  navigate("/interviewee/session-setup", {
                    state: {
                      interview: {
                        id: next.id,
                        title: next.title,
                        application_id: next.application_id,
                      },
                    },
                  })
                }
                className="abtn-primary flex-1"
              >
                {t("candidateDash.join")}
              </button>
              <button
                onClick={() => cancelSession(next)}
                disabled={cancellingId === next.id}
                className="abtn-outline flex-1 disabled:opacity-50"
              >
                {t("candidateDash.cancel")}
              </button>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-extrabold text-gray-900">{t("dash.hero_none")}</p>
              <p className="mt-0.5 max-w-md text-sm text-gray-500">{t("dash.hero_hint")}</p>
            </div>
            <LinkButton to="/interviewee/interviews" className="shrink-0">
              {t("dash.browse")}
            </LinkButton>
          </div>
        )}
      </section>

      {/* ------- Quiet facts strip: one line, not four tiles -------
          Label-first so text values read as sentences: Documents verified. */}
      <section className="dash-strip" data-reveal aria-label={t("dash.strip_label")}>
        <span className="dash-strip-item">
          {t("candidateDash.stat_completeness")} <strong>{stats.completeness}%</strong>
        </span>
        <span className="dash-strip-item">
          {t("dash.rail_results")} <strong>{avgScore != null ? `${avgScore}/100` : "—"}</strong>
        </span>
        <span className="dash-strip-item">
          {t("nav.interviews")} <strong>{stats.completed}</strong>
        </span>
        <span className="dash-strip-item">
          {t("candidateDash.stat_docs")}{" "}
          <strong>
            {t(`candidateDash.docs_${verification === "imethibitishwa" ? "ok" : verification === "imekataliwa" ? "rejected" : "pending"}`)}
          </strong>
        </span>
        {rating5 != null && (
          <span className="dash-strip-item flex items-center gap-1.5">
            {t("dash.rating")} <strong>{rating5}/5</strong>
            <Stars value={rating5} />
          </span>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* ================= Main column ================= */}
        <div className="space-y-6">
          {/* Matches for you */}
          <section data-reveal>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="dash-card-title">{t("candidateDash.matches_title")}</h2>
              <span className="text-xs font-medium text-gray-400">
                {t("dash.matches_count", { count: topMatches.length })}
              </span>
            </div>
            {topMatches.length === 0 ? (
              <EmptyState title={t("interviews.no_results")} />
            ) : (
              <ul className="space-y-2">
                {topMatches.map((iv) => (
                  <li key={iv.id} className="dash-row">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-900">{iv.title}</p>
                      <p className="truncate text-xs text-gray-400">
                        {iv.jina_la_kampuni} — {iv.taaluma}
                      </p>
                    </div>
                    <Badge tone={iv.score >= 75 ? "green" : iv.score >= 50 ? "amber" : "gray"} className="shrink-0">
                      {iv.score}%
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Skills employers are asking for — informational, no links */}
          {recommendedSkills?.length > 0 && (
            <section className="dash-card" data-reveal>
              <h2 className="dash-card-title mb-3">{t("dash.recommended_title")}</h2>
              <p className="mb-3 text-xs text-gray-400">{t("dash.recommended_hint")}</p>
              <ul className="flex flex-wrap gap-2">
                {recommendedSkills.map((r) => (
                  <li key={r.name} className="dash-chip" title={r.sekta}>
                    {r.name}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* ================= Right rail ================= */}
        <aside className="space-y-6" data-reveal>
          {/* Document status — only when it needs attention */}
          {verification !== "imethibitishwa" && (
            <section className="dash-card">
              <div className="dash-rail-title mb-3">
                <h2 className="dash-card-title">{t("candidateDash.docs_title")}</h2>
              </div>
              <p className="text-xs leading-relaxed text-gray-500">
                {t(`dash.status_${verification === "imekataliwa" ? "rejected" : "pending"}`)}
              </p>
              <LinkButton to="/interviewee/documents" size="sm" className="mt-3 w-full">
                {t("dash.status_upload")}
              </LinkButton>
            </section>
          )}

          {/* Results with scores — the report is the destination */}
          <section className="dash-card">
            <div className="dash-rail-title mb-3">
              <h2 className="dash-card-title">{t("dash.rail_results")}</h2>
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-gray-400">{t("candidateDash.history_empty")}</p>
            ) : (
              <ul className="space-y-2">
                {history.map((s) => (
                  <li key={s.id} className="dash-row !p-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-gray-900">{s.title}</p>
                      <p className="text-[11px] text-gray-400">
                        {s.jina_la_kampuni}
                        {s.completed_at && ` · ${new Date(s.completed_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5">
                      {typeof s.score === "number" && (
                        <span className="text-sm font-extrabold text-gray-900">{s.score}</span>
                      )}
                      <Link
                        to={`/interviewee/sessions/${s.id}/report`}
                        className="dash-textlink"
                      >
                        {t("report.view_link")}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Skills legend — quiet dots, with an edit path to the Account page */}
          <section className="dash-card">
            <div className="dash-rail-title mb-3">
              <h2 className="dash-card-title">{t("dash.your_skills")}</h2>
              <Link to="/interviewee/account" className="dash-textlink">
                {t("account.edit_link")}
              </Link>
            </div>
            {skills.length === 0 ? (
              <p className="text-xs text-gray-400">{t("candidateDash.history_empty")}</p>
            ) : (
              <ul className="space-y-2.5">
                {skills.map((s, i) => (
                  <li key={s} className="dash-skill">
                    <span className="dash-skill-dot" style={{ background: SKILL_COLORS[i % SKILL_COLORS.length] }} />
                    <span className="truncate">{s}</span>
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

