import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translations, type Lang, type Dict } from "./translations";

const LANG_KEY = "tintify_lang";

function readInitialLang(): Lang {
  if (typeof document === "undefined") return "id";
  // Cookie first
  const m = document.cookie.match(/(?:^|;\s*)lang=(id|en)/);
  if (m) return m[1] as Lang;
  // localStorage
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v === "id" || v === "en") return v;
  } catch {}
  // Browser language (default ID)
  if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("en")) return "en";
  return "id";
}

function writeLangCookie(lang: Lang) {
  if (typeof document === "undefined") return;
  // 1 year
  document.cookie = `lang=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
}

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => readInitialLang());

  useEffect(() => {
    writeLangCookie(lang);
    try { localStorage.setItem(LANG_KEY, lang); } catch {}
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const value: Ctx = {
    lang,
    setLang: setLangState,
    t: translations[lang] as unknown as Dict,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}

export function useT() {
  return useLang().t;
}
