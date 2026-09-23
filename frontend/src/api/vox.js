import client from "./client";

function unwrap(promise) {
  return promise.then((res) => res.data);
}

export function apiDetail(err) {
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || item.detail || JSON.stringify(item)).join("; ");
  }
  return err?.response?.data?.error || err?.message || "Request failed";
}

export function mapUser(user) {
  if (!user) return null;
  const type = user.role === "employer" ? "interviewer" : "interviewee";
  return {
    ...user,
    type,
    jina: user.username || user.jina || "",
    barua_pepe: user.email || user.barua_pepe || "",
    namba_ya_simu: user.namba_ya_simu || user.phone_number || "",
    onboarding_step: 4,
  };
}

export const authApi = {
  register: (body) => unwrap(client.post("/auth/register", body)),
  login: (email, password) => unwrap(client.post("/auth/session", { email, password })),
  me: () => unwrap(client.get("/auth/me")),
};

export const profileApi = {
  create: (body) => unwrap(client.post("/profile", body)),
  get: () => unwrap(client.get("/profile")),
  update: (body) => unwrap(client.put("/profile", body)),
};

export const educationApi = {
  create: (body) => unwrap(client.post("/profile/education", body)),
  list: () => unwrap(client.get("/profile/education")),
  update: (id, body) => unwrap(client.put(`/profile/education/${id}`, body)),
  remove: (id) => unwrap(client.delete(`/profile/education/${id}`)),
};

export const experienceApi = {
  create: (body) => unwrap(client.post("/profile/experience", body)),
  list: () => unwrap(client.get("/profile/experience")),
  update: (id, body) => unwrap(client.put(`/profile/experience/${id}`, body)),
  remove: (id) => unwrap(client.delete(`/profile/experience/${id}`)),
};

export const documentsApi = {
  upload: (file, documentType = "cv") => {
    const formData = new FormData();
    formData.append("document_type", documentType);
    formData.append("file", file);
    return unwrap(
      client.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    );
  },
  text: (id) => unwrap(client.get(`/documents/${id}/text`)),
  analyze: (id) => unwrap(client.get(`/documents/${id}/analyze`)),
  interviewQuestion: (id) => unwrap(client.get(`/documents/${id}/interview-question`)),
};

export function skillsFromJob(job) {
  return String(job?.skills_required || "")
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

export function mapJobForUi(job) {
  if (!job) return null;
  const skills = skillsFromJob(job);
  return {
    ...job,
    sekta: job.location,
    taaluma: job.employment_type,
    jina_la_kampuni: job.location,
    kiwango_cha_elimu_kinachohitajika: job.education_required || "",
    ujuzi_unaohitajika: skills,
  };
}

export function jobCreatePayload(form) {
  return {
    title: form.title.trim(),
    description: (form.description || "").trim() || form.title.trim(),
    location: (form.location || form.sekta || "").trim(),
    employment_type: form.taaluma,
    education_required: form.kiwango_cha_elimu_kinachohitajika || null,
    experience_required: null,
    skills_required: (form.ujuzi_unaohitajika || []).join(", ") || null,
  };
}

export const jobsApi = {
  create: (body) => unwrap(client.post("/jobs", body)),
  list: () => unwrap(client.get("/jobs")),
  mine: () => unwrap(client.get("/jobs/employer/my-jobs")),
  get: (id) => unwrap(client.get(`/jobs/${id}`)),
  update: (id, body) => unwrap(client.put(`/jobs/${id}`, body)),
  remove: (id) => unwrap(client.delete(`/jobs/${id}`)),
};

export const applicationsApi = {
  apply: (jobId) => unwrap(client.post("/applications", { job_id: jobId })),
  mine: () => unwrap(client.get("/applications/my-applications")),
  forJob: (jobId) => unwrap(client.get(`/applications/job/${jobId}`)),
  updateStatus: (id, status) => unwrap(client.put(`/applications/${id}/status`, { status })),
  withdraw: (id) => unwrap(client.delete(`/applications/${id}`)),
};

export const interviewsApi = {
  start: (applicationId) =>
    unwrap(client.post("/interviews/start", null, { params: { application_id: applicationId } })),
  list: () => unwrap(client.get("/interviews/")),
  get: (id) => unwrap(client.get(`/interviews/${id}`)),
  startExisting: (id) => unwrap(client.post(`/interviews/${id}/start`)),
  complete: (id) => unwrap(client.post(`/interviews/${id}/complete`)),
  textAnswer: (id, answerText) =>
    unwrap(client.post(`/interviews/${id}/text-answer`, { answer_text: answerText })),
  voiceAnswer: (id, audioBlob, filename = "answer.webm") => {
    const formData = new FormData();
    formData.append("audio", audioBlob, filename);
    return unwrap(
      client.post(`/interviews/${id}/voice-answer`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    );
  },
};

export const reportsApi = {
  forInterview: (interviewId) => unwrap(client.get(`/reports/interview/${interviewId}`)),
  employer: (jobId) =>
    unwrap(client.get("/reports/employer", { params: jobId ? { job_id: jobId } : {} })),
  messageCandidate: (interviewId, body) =>
    unwrap(client.post(`/reports/interview/${interviewId}/message`, body)),
};

export function audioUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const api = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
  const origin = api.replace(/\/api\/v1\/?$/, "");
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function mapReportForUi(report, extras = {}) {
  const score = Math.round(Number(report?.overall_score ?? report?.score ?? 0));
  return {
    ...extras,
    report: {
      score,
      overall_score: score,
      strengths: report?.strengths || "",
      weaknesses: report?.weaknesses || "",
      recommendation: report?.recommendation || "",
      generated_at: report?.generated_at,
      duration_seconds: report?.duration_seconds ?? null,
      breakdown: report?.breakdown || {
        completion: { score, max: 100, answered: extras.answered ?? 0, planned: extras.planned ?? 10 },
        effort: { score: 0, max: 20, mean_chars: 0 },
        engagement: { score: extras.finished ? 30 : 0, max: 30, finished: Boolean(extras.finished) },
      },
      skills: report?.skills || { covered: [], missed: [] },
      quality: report?.quality || { answers: extras.answers || [] },
    },
  };
}

export async function loadCandidateDashboard() {
  const [me, profile, education, experience, applications, interviews, jobs] = await Promise.all([
    authApi.me().catch(() => null),
    profileApi.get().catch(() => null),
    educationApi.list().catch(() => []),
    experienceApi.list().catch(() => []),
    applicationsApi.mine().catch(() => []),
    interviewsApi.list().catch(() => []),
    jobsApi.list().catch(() => []),
  ]);

  const user = mapUser(me);
  const jobById = Object.fromEntries((jobs || []).map((job) => [job.id, job]));
  const appById = Object.fromEntries((applications || []).map((app) => [app.id, app]));

  const history = (interviews || [])
    .filter((iv) => iv.status === "completed")
    .map((iv) => {
      const app = appById[iv.application_id];
      const job = app ? jobById[app.job_id] : null;
      return {
        id: iv.id,
        title: job?.title || `Interview #${iv.id}`,
        jina_la_kampuni: job?.location || "",
        status: iv.status,
        completed_at: iv.updated_at || iv.created_at || null,
        score: null,
      };
    });

  const upcoming = (applications || [])
    .filter((app) => ["shortlisted", "accepted"].includes(app.status))
    .filter((app) => !(interviews || []).some((iv) => iv.application_id === app.id && iv.status === "completed"))
    .map((app) => {
      const job = jobById[app.job_id];
      const live = (interviews || []).find(
        (iv) => iv.application_id === app.id && ["started", "in_progress"].includes(iv.status)
      );
      return {
        id: live?.id || app.id,
        application_id: app.id,
        interview_id: live?.id || null,
        title: job?.title || `Job #${app.job_id}`,
        jina_la_kampuni: job?.location || "",
        scheduled_for: app.applied_at,
        status: live ? "inaendelea" : "imepangwa",
      };
    });

  const latestEdu = (education || [])[0];
  const skills = (experience || [])
    .flatMap((item) => String(item.description || "").split(",").map((s) => s.trim()).filter(Boolean));

  return {
    profile: {
      jina: user?.jina || "",
      ujuzi: skills,
      kiwango_cha_elimu: latestEdu?.education_level || "",
      phone_number: profile?.phone_number || "",
      location: profile?.location || "",
    },
    verification: "imethibitishwa",
    upcoming,
    history,
    stats: {
      completeness: profile ? 80 : 40,
      completed: history.length,
    },
    topMatches: (jobs || []).slice(0, 5).map((job) => {
      const mapped = mapJobForUi(job);
      return {
        id: mapped.id,
        title: mapped.title,
        jina_la_kampuni: mapped.jina_la_kampuni,
        taaluma: mapped.taaluma,
        score: 70,
      };
    }),
    recommendedSkills: [],
    applications,
    interviews,
    jobs,
  };
}
