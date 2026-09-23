import { useTranslation } from "react-i18next";

export default function InterviewerAvatar({ state = "idle", size = "lg", showName = false, className = "" }) {
  const { t } = useTranslation();
  const talking = state === "talking";
  const dims = size === "sm" ? "h-24 w-24" : "h-44 w-44 sm:h-56 sm:w-56";

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className={`relative ${talking ? "avatar-talking" : "avatar-idle"}`}>
        <div
          className={`aura absolute -inset-6 rounded-full blur-2xl ${
            talking ? "bg-brand-blue/40" : "bg-brand-blue/20"
          }`}
        />
        <svg viewBox="0 0 200 200" className={`relative ${dims} drop-shadow-2xl`}>
          <defs>
            <radialGradient id="faceGrad" cx="50%" cy="42%" r="65%">
              <stop offset="0%" stopColor="#e8eefc" />
              <stop offset="100%" stopColor="#9db4dd" />
            </radialGradient>
          </defs>
          <ellipse cx="100" cy="100" rx="62" ry="70" fill="url(#faceGrad)" />
          <g className="avatar-blink">
            <ellipse cx="76" cy="86" rx="7" ry="10" fill="#1e3a5f" />
            <ellipse cx="124" cy="86" rx="7" ry="10" fill="#1e3a5f" />
            <circle cx="78.5" cy="83" r="2.4" fill="#ffffff" />
            <circle cx="126.5" cy="83" r="2.4" fill="#ffffff" />
          </g>
          <rect x="66" y="66" width="21" height="4" rx="2" fill="#5b769f" />
          <rect x="113" y="66" width="21" height="4" rx="2" fill="#5b769f" />
          <g className="avatar-mouth">
            <ellipse cx="100" cy="128" rx="17" ry={talking ? 12 : 3.5} fill="#1e3a5f" />
            <ellipse cx="100" cy={talking ? 131 : 128} rx="10" ry={talking ? 5 : 1.5} fill="#e3297c" opacity="0.55" />
          </g>
          <path d="M 34 96 Q 34 30 100 30 Q 166 30 166 96" stroke="#1d4ed8" strokeWidth="7" fill="none" strokeLinecap="round" />
          <rect x="26" y="92" width="14" height="26" rx="7" fill="#1d4ed8" />
          <rect x="160" y="92" width="14" height="26" rx="7" fill="#1d4ed8" />
        </svg>
      </div>
      {showName && (
        <div className="text-center">
          <p className="text-sm font-bold text-on-surface">{t("landing.persona.name")}</p>
          <p className="text-xs text-on-surface-variant">{t("landing.persona.role")}</p>
        </div>
      )}
    </div>
  );
}