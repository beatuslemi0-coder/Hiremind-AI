import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);

  useEffect(() => {
    api
      .get("/interviews")
      .then((res) => setInterviews(res.data.interviews))
      .catch(() => setInterviews([]));
  }, []);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold">
        {t("dashboard.welcome")}, {user?.name} 👋
      </h1>
      <p className="mt-1 text-slate-500">{t("app.tagline")}</p>

      <Link
        to="/interview"
        className="mt-6 inline-block rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700"
      >
        {t("dashboard.startNew")}
      </Link>

      <h2 className="mt-10 text-lg font-semibold">{t("dashboard.past")}</h2>
      {interviews.length === 0 ? (
        <p className="mt-2 text-slate-500">{t("dashboard.none")}</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {interviews.map((i) => (
            <li key={i.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="font-medium capitalize">
                {i.role} · {i.difficulty}
              </span>
              <span className="text-slate-500">
                {i.status === "completed" ? `${t("interview.score")}: ${i.feedback?.totalScore}/10` : i.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
