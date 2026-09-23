import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import client from "../../api/client";
import { PageHeader, EmptyState } from "../../components/ui";
import { useReveal } from "../../lib/motion";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export default function Reviews() {
  const { t } = useTranslation();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [done, setDone] = useState(null); // flash message

  const revealRef = useReveal();

  async function load() {
    setLoading(true);
    try {
      const { data } = await client.get("/interviewer/documents/pending");
      setDocs(data.documents);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function review(doc, hali) {
    setBusyId(doc.id);
    try {
      await client.post(`/interviewer/documents/${doc.id}/review`, {
        hali,
        note: notes[doc.id] || undefined,
      });
      setDocs((list) => list.filter((d) => d.id !== doc.id));
      setDone(hali);
      setTimeout(() => setDone(null), 2500);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div ref={revealRef} className="max-w-2xl mx-auto space-y-4">
      <PageHeader title={t("reviews.title")} subtitle={t("reviews.subtitle")} />

      {done && (
        <p data-reveal className="text-green-600 text-sm font-medium">
          {done === "imethibitishwa" ? t("reviews.approved_flash") : t("reviews.rejected_flash")}
        </p>
      )}

      {loading ? (
        <p className="text-gray-400">{t("common.loading")}</p>
      ) : docs.length === 0 ? (
        <EmptyState title={t("reviews.empty")} />
      ) : (
        <ul className="space-y-3">
          {docs.map((doc) => (
            <li key={doc.id} data-reveal className="app-card app-card--hover p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{doc.jina}</p>
                  <p className="text-sm text-gray-500">
                    {doc.sekta} — {doc.taaluma} · {t("reviews.uploaded", { time: new Date(doc.uploaded_at).toLocaleDateString() })}
                  </p>
                </div>
                {doc.file_path ? (
                  <a
                    href={`${API_BASE.replace(/\/api$/, "")}/uploads/interviewees/${doc.file_path.split(/[\\/]/).pop()}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-blue text-sm font-medium hover:underline"
                  >
                    {t("reviews.view_file")}
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">{doc.file_name}</span>
                )}
              </div>

              <input
                value={notes[doc.id] || ""}
                onChange={(e) => setNotes({ ...notes, [doc.id]: e.target.value })}
                placeholder={t("reviews.note_placeholder")}
                className="ainput text-sm"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => review(doc, "imethibitishwa")}
                  disabled={busyId === doc.id}
                  className="abtn-primary bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                >
                  {t("reviews.approve")}
                </button>
                <button
                  onClick={() => review(doc, "imekataliwa")}
                  disabled={busyId === doc.id}
                  className="abtn-danger disabled:opacity-50"
                >
                  {t("reviews.reject")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
