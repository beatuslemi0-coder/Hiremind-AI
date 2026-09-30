import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import sw from "./locales/sw.json";
import en from "./locales/en.json";

// Swahili is fully supported, but English is the default. We deliberately do NOT use
// i18next-browser-languagedetector here, because that would let the browser's locale
// silently override the default — the default stays English until the user explicitly
// switches via the in-app toggle (persisted in localStorage).
const STORAGE_KEY = "app_language";
const savedLanguage = localStorage.getItem(STORAGE_KEY);

i18n.use(initReactI18next).init({
  resources: {
    sw: { translation: sw },
    en: { translation: en },
  },
  lng: savedLanguage || "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

i18n.on("languageChanged", (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
  document.documentElement.lang = lng;
});

export default i18n;
