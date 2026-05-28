// Server-side language detection: reads cookie `lang`, falls back to Accept-Language header, defaults to "id".
import type { Lang } from "./translations";

export function langFromRequest(request: Request): Lang {
  const cookie = request.headers.get("cookie") ?? "";
  const m = cookie.match(/(?:^|;\s*)lang=(id|en)/);
  if (m) return m[1] as Lang;

  const al = (request.headers.get("accept-language") ?? "").toLowerCase();
  if (al.startsWith("en")) return "en";
  return "id";
}

export function langFromCookieHeader(cookieHeader: string | null | undefined): Lang {
  if (!cookieHeader) return "id";
  const m = cookieHeader.match(/(?:^|;\s*)lang=(id|en)/);
  return (m?.[1] as Lang) ?? "id";
}

export function aiLanguageInstruction(lang: Lang): string {
  return lang === "en"
    ? "IMPORTANT: Respond entirely in English."
    : "PENTING: Tulis seluruh respons dalam Bahasa Indonesia.";
}
