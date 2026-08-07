import { useLanguage } from '../context/LanguageContext';
import en from '../i18n/en.json';
import hi from '../i18n/hi.json';
import mr from '../i18n/mr.json';
import gu from '../i18n/gu.json';
import kn from '../i18n/kn.json';
import ta from '../i18n/ta.json';
import te from '../i18n/te.json';

const translations: Record<string, Record<string, string>> = {
  en: en as Record<string, string>,
  hi: hi as Record<string, string>,
  mr: mr as Record<string, string>,
  gu: gu as Record<string, string>,
  kn: kn as Record<string, string>,
  ta: ta as Record<string, string>,
  te: te as Record<string, string>,
};

export const useTranslation = () => {
  const { language, setLanguage } = useLanguage();

  const t = (key: string) => {
    // Fallback to English if translation is missing in the selected language
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return { t, language, setLanguage };
};
