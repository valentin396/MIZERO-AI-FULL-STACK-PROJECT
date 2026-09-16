import { createContext, useContext, useState } from 'react';
import { translate } from './i18n.js';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('mizero_lang') || 'en');

  function changeLang(code) {
    setLang(code);
    localStorage.setItem('mizero_lang', code);
  }

  function t(key) {
    return translate(key, lang);
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}