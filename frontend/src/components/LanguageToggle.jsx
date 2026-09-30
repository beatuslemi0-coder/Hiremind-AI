import { useTranslation } from "react-i18next";

export default function LanguageToggle() {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <button
        onClick={() => i18n.changeLanguage("sw")}
        className={`glass-pill !px-2.5 !py-1 !text-xs ${
          i18n.language === "sw" ? "!border-white/70 text-white" : "text-gray-500"
        }`}
      >
        Swahili
      </button>
      <button
        onClick={() => i18n.changeLanguage("en")}
        className={`glass-pill !px-2.5 !py-1 !text-xs ${
          i18n.language === "en" ? "!border-white/70 text-white" : "text-gray-500"
        }`}
      >
        English
      </button>
    </div>
  );
}
