import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { apiDetail, applicationsApi, jobsApi, mapJobForUi } from "../../api/vox";
import { PageHeader, EmptyState, Badge } from "../../components/ui";
import { useReveal } from "../../lib/motion";

const STATUS_TONE = {
  pending: "amber",
  shortlisted: "green",
  accepted: "green",
  rejected: "red",
};

export default function InterviewList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [error, setError] = useState(null);

  const revealRef = useReveal();

  async function loadJobs() {
    setLoading(true);
    setError(null);
    try {
      const [jobList, appList] = await Promise.all([
        jobsApi.list(),
        applicationsApi.mine().catch(() => []),
      ]);
      setJobs((jobList || []).map(mapJobForUi));
      setApplications(appList || []);
    } catch (err) {
      setError(apiDetail(err) || t("common.error_generic"));
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  function applicationFor(jobId) {
    return applications.find((app) => app.job_id === jobId);
  }

  async function apply(job) {
    setApplyingId(job.id);
    setError(null);
    try {
      const created = await applicationsApi.apply(job.id);
      setApplications((list) => [created, ...list]);
    } catch (err) {
      setError(apiDetail(err) || t("common.error_generic"));
    } finally {
      setApplyingId(null);
    }
  }

  function startInterview(job) {
    const application = applicationFor(job.id);
    if (!application) return;
    navigate("/interviewee/session-setup", {
      state: {
        interview: {
          id: job.id,
          title: job.title,
          application_id: application.id,
        },
      },
    });
  }

  return (
    <div ref={revealRef} className="max-w-2xl mx-auto space-y-4">
      <PageHeader title={t("interviews.title")} subtitle={t("interviews.matched_on")} />

      {error && <p className="text-sm font-semibold text-[#b11345]">{error}</p>}

      {loading ? (
        <p className="text-gray-400">{t("common.loading")}</p>
      ) : jobs.length === 0 ? (
        <EmptyState title={t("interviews.no_results")} />
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => {
            const application = applicationFor(job.id);
            const canStart = application && ["shortlisted", "accepted"].includes(application.status);
            return (
              <li key={job.id} data-reveal className="app-card app-card--hover p-4">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{job.title}</p>
                    <p className="text-sm text-gray-500">
                      {job.jina_la_kampuni} — {job.taaluma}
                    </p>
                    {job.description && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-3">{job.description}</p>
                    )}
                    {job.ujuzi_unaohitajika?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {job.ujuzi_unaohitajika.map((skill) => (
                          <Badge key={skill} tone="green">{skill}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {application && (
                    <Badge tone={STATUS_TONE[application.status] || "gray"} className="shrink-0">
                      {t(`interviews.status_${application.status}`, { defaultValue: t("interviews.applied") })}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  {!application && (
                    <button
                      type="button"
                      onClick={() => apply(job)}
                      disabled={applyingId === job.id}
                      className="abtn-accent abtn-sm"
                    >
                      {applyingId === job.id ? t("interviews.applying") : t("interviews.apply")}
                    </button>
                  )}
                  {canStart && (
                    <button type="button" onClick={() => startInterview(job)} className="abtn-primary abtn-sm">
                      {t("interviews.start")}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
