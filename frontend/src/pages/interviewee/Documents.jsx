import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { documentsApi, apiDetail } from "../../api/vox";
import { usePageReveal } from "../../lib/pageReveal";

export default function Documents() {
  const { t } = useTranslation();
  const reveal = usePageReveal();
  const navigate = useNavigate();
  const inputRef = useRef();

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  function addFiles(fileList) {
    setFiles((prev) => [...prev, ...Array.from(fileList)]);
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!files.length) return;
    setUploading(true);
    setError(null);
    try {
      for (let i = 0; i < files.length; i += 1) {
        const type = i === 0 ? "cv" : "degree";
        const uploaded = await documentsApi.upload(files[i], type);
        if (type === "cv") {
          try {
            await documentsApi.analyze(uploaded.document_id);
          } catch {
            /* analysis is optional */
          }
        }
      }
      navigate("/interviewee/interviews");
    } catch (err) {
      setError(apiDetail(err) || t("common.error_generic"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div ref={reveal} className="max-w-md mx-auto space-y-5">
      <h1 className="gh-cool text-2xl font-bold tracking-tight text-gray-900">{t("documents.title")}</h1>

      <div className="form-card space-y-4">
        <p className="text-gray-600 text-sm">{t("documents.instructions")}</p>

        <div
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addFiles(e.dataTransfer.files);
          }}
          className="grad-ring border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer
                     hover:border-brand-gold text-gray-500 transition-colors"
        >
          {t("documents.drag_drop")}
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            hidden
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map((f, i) => (
              <li key={i} className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50">
                <span className="truncate">{f.name}</span>
                <button type="button" onClick={() => removeFile(i)} className="text-brand-pink hover:underline">
                  {t("documents.remove")}
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && <p className="text-brand-pink text-sm">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={uploading || !files.length}
          className="abtn-primary w-full"
        >
          {uploading ? t("documents.uploading") : t("common.submit")}
        </button>
      </div>
    </div>
  );
}
