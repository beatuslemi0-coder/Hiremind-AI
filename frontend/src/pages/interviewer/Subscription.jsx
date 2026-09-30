import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { usePageReveal } from "../../lib/pageReveal";

/**
 * Subscription is deferred — the placeholder "Coming Soon" screen. Onboarding
 * step 4 still exists in the schema, but nothing is gated on the plan yet.
 */
export default function Subscription() {
  const { t } = useTranslation();
  const reveal = usePageReveal();
  const navigate = useNavigate();

  return (
    <div ref={reveal} className="max-w-md mx-auto text-center space-y-5 mt-6">
      <div className="form-card !p-8 space-y-4">
        <span className="abadge-gold inline-block">
          {t("subscription.coming_soon_badge")}
        </span>
        <h1 className="gh-cool text-2xl font-bold tracking-tight text-gray-900">{t("subscription.title")}</h1>
        <p className="text-gray-600 text-sm">{t("subscription.coming_soon_body")}</p>
      </div>

      <button
        onClick={() => navigate("/interviewer/dashboard")}
        className="abtn-primary w-full py-3"
      >
        {t("subscription.continue")}
      </button>
    </div>
  );
}
