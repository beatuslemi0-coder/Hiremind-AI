import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import api from "../api/client.js";

const ROLES = ["frontend", "backend", "fullstack", "general"];
const DIFFICULTIES = ["junior", "mid", "senior"];

export default function InterviewPage() {
  const { t } = useTranslation();

  const [setup, setSetup] = useState({ role: "frontend", difficulty: "junior" });
  const [interview, setInterview] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const start = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/interviews", setup);
      setInterview(res.data.interview);
      setQIndex(0);
      setAnswer("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not start interview");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    const question = interview.questions[qIndex];
    setBusy(true);
    setError("");
    try {
      const res = await api.post(`/interviews/${interview.id}/answers`, {
        questionId: question.id,
        answer,
      });
      const updated = res.data.interview;
      setInterview(updated);
      setAnswer("");
      if (!res.data.done) setQIndex((n) => n + 1);
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit answer");
    } finally {
      setBusy(false);
    }
  };

  // ---- setup screen ----
  if (!interview) {
    return (
      <main className="mx-auto max-w-md p-6">
        <h1 className="text-2xl font-bold">{t("nav.interview")}</h1>
        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm text-slate-600">{t("interview.role")}</span>
            <select
              value={setup.role}
              onChange={(e) => setSetup((s) => ({ ...s, role: e.target.value }))}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-slate-600">{t("interview.difficulty")}</span>
            <select
              value={setup.difficulty}
              onChange={(e) => setSetup((s) => ({ ...s, difficulty: e.target.value }))}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            onClick={start}
            disabled={busy}
            className="w-full rounded bg-brand-600 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {t("interview.start")}
          </button>
        </div>
      </main>
    );
  }

  // ---- results screen ----
  if (interview.status === "completed") {
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <h1 className="text-2xl font-bold">{t("interview.score")}</h1>
        <p className="my-4 text-5xl font-extrabold text-brand-600">
          {interview.feedback.totalScore}/10
        </p>
        <p className="text-slate-600">{interview.feedback.summary}</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded bg-brand-600 px-5 py-2 font-medium text-white hover:bg-brand-700"
        >
          {t("nav.dashboard")}
        </Link>
      </main>
    );
  }

  // ---- question screen ----
  const question = interview.questions[qIndex];
  return (
    <main className="mx-auto max-w-2xl p-6">
      <p className="text-sm text-slate-500">
        {t("interview.question")} {qIndex + 1} / {interview.questions.length}
      </p>
      <h1 className="mt-2 text-xl font-semibold">{question.text}</h1>
      <textarea
        rows={8}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder={t("interview.answerPlaceholder")}
        className="mt-4 w-full rounded border border-slate-300 p-3 focus:border-brand-500 focus:outline-none"
      />
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <button
        onClick={submit}
        disabled={busy || !answer.trim()}
        className="mt-4 rounded bg-brand-600 px-5 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {qIndex + 1 === interview.questions.length ? t("interview.finish") : t("interview.submit")}
      </button>
    </main>
  );
}
