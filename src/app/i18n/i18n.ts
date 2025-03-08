import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslation from "./locales/en.json";
import esTranslation from "./locales/es.json";

const resources = {
  es: { translation: esTranslation },
  en: { translation: enTranslation },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "es", // Idioma por defecto
  fallbackLng: ["es"],
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
  initImmediate: false,
});

export default i18n;
