import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { apiDetail, applicationsApi, jobsApi, mapJobForUi } from "../../api/vox";
import { Badge, EmptyState } from "../../components/ui";
import { useReveal } from "../../lib/motion";

const STATUS_TONE = {
  pending: "amber",
  shortlisted: "green",
  accepted: "green",
  rejected: "red",
};

export default function Candidates() {
  const { t } = useTranslation();
  const { interviewId } = useParams();

  const [posting, setPosting] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const revealRef = useReveal();

  useEffect(() => {
    (async () => {
      try {
        const [job, apps] = await Promise.all([
          jobsApi.get(interviewId),
          applicationsApi.forJob(interviewId),
        ]);
        setPosting(mapJobForUi(job));
        setCandidates(apps || []);
      } catch (err) {
        setError(err.response?.status === 404 ? t("candidates.not_found") : apiDetail(err) || t("common.error_generic"));
      } finally {
        setLoading(false);
      }
    })();
  }, [interviewId, t]);

  async function setStatus(applicationId, status) {
    setBusyId(applicationId);
    try {
      const updated = await applicationsApi.updateStatus(applicationId, status);
      setCandidates((list) => list.map((item) => (item.id === applicationId ? updated : item)));
    } catch (err) {
      setError(apiDetail(err) || t("common.error_generic"));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="max-w-2xl mx-auto text-gray-400">{t("common.loading")}</p>;
  if (error && !posting) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-3 mt-10">
        <p className="text-brand-pink">{error}</p>
        <Link to="/interviewer/dashboard" className="abtn-outline inline-block">
          {t("candidates.back")}
        </Link>
      </div>
    );
  }

  return (
    <div ref={revealRef} className="max-w-2xl mx-auto space-y-5">
      <header data-reveal>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("candidates.title")}</h1>
        {posting && <p className="text-sm text-gray-500">{posting.title}</p>}
      </header>

      {error && <p className="text-sm font-semibold text-[#b11345]">{error}</p>}

      {candidates.length === 0 ? (
        <EmptyState title={t("candidates.empty")} />
      ) : (
        <ul className="space-y-3">
          {candidates.map((application) => (
            <li key={application.id} data-reveal className="app-card app-card--hover p-4">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">
                    {t("candidates.candidate", { id: application.candidate_id })}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t("candidates.applied_at", {
                      time: application.applied_at
                        ? new Date(application.applied_at).toLocaleString()
                        : "",
                    })}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[application.status] || "gray"}>
                  {t(`interviews.status_${application.status}`, { defaultValue: application.status })}
                </Badge>
              </div>
              {application.status === "pending" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === application.id}
                    onClick={() => setStatus(application.id, "shortlisted")}
                    className="abtn-outline abtn-sm"
                  >
                    {t("candidates.shortlist")}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === application.id}
                    onClick={() => setStatus(application.id, "accepted")}
                    className="abtn-accent abtn-sm"
                  >
                    {t("candidates.accept")}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === application.id}
                    onClick={() => setStatus(application.id, "rejected")}
                    className="abtn-danger abtn-sm"
                  >
                    {t("candidates.reject")}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-center pb-4">
        <Link to="/interviewer/dashboard" className="text-sm text-gray-400 hover:text-gray-600 underline">
          {t("candidates.back")}
        </Link>
      </div>
    </div>
  );
}
