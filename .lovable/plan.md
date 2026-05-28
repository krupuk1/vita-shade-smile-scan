
# Dual Language Support (Indonesian / English)

Tambahkan dukungan dua bahasa di seluruh aplikasi. Default: **Bahasa Indonesia**. User bisa ganti ke **English** dari UI; pilihan ini juga otomatis dipakai oleh backend (AI insight, rekomendasi, risk analysis, error messages) sehingga respons AI ikut berubah bahasa.

## 1. Infrastruktur i18n (Frontend)

- Tambah library ringan `i18next` + `react-i18next` (atau implementasi context custom sederhana — saya akan pakai context custom agar bundle kecil dan SSR-friendly).
- Buat `src/i18n/`:
  - `LanguageProvider.tsx` — context + hook `useT()` + `useLanguage()`.
  - `translations/id.ts` dan `translations/en.ts` — semua string aplikasi.
  - Persist pilihan ke `localStorage` (`tintify_lang`) + cookie `lang` (agar bisa dibaca server function).
- Pasang `LanguageProvider` di `src/routes/__root.tsx`.

## 2. Language Switcher

- Komponen `LanguageSwitcher` (dropdown ID 🇮🇩 / EN 🇬🇧).
- Tempatkan di:
  - Navbar landing (`src/routes/index.tsx`)
  - Header authenticated layout (`src/routes/_authenticated.tsx`)
  - Login & signup page

## 3. Translasi Halaman (Frontend)

Ganti semua string keras menjadi `t("key")`:
- Landing (`index.tsx`)
- Login, Signup
- Dashboard, Scan, Shades, Habit Tracker, Risk Analysis, Recommendations, Profile
- Sidebar (`app-sidebar.tsx`)
- Error / 404 page di `__root.tsx`

## 4. Backend (Server Functions + API Mobile)

Bahasa dikirim dari client:
- Server functions: ambil dari cookie `lang` via `getRequestHeader('cookie')`.
- API mobile: terima header `Accept-Language` atau query `?lang=id|en` (default `id`).

Update prompt AI di:
- `src/lib/ai-insights.functions.ts` (risk analysis, habit insight, recommendations) — inject instruksi `Respond in {Indonesian|English}` ke system prompt.
- `src/routes/api/mobile/risk-analysis.ts`
- `src/routes/api/mobile/recommendations.generate.ts`
- `src/routes/api/mobile/habit-insights.ts`

Error messages dari API mobile juga dual language via helper `localizedError(lang, key)`.

## 5. Persistensi

- `localStorage` untuk web.
- Cookie `lang` (1 tahun, path=/) supaya server function ikut tahu pilihan user tanpa perlu argumen tambahan di setiap call.
- Mobile API: client mobile kirim `Accept-Language: id` atau `en`.

## Technical Notes

- Tidak ada perubahan schema DB.
- Tidak perlu library tambahan — pakai context React + dictionary object (lebih cepat, no SSR hydration issue).
- Tipe `Lang = 'id' | 'en'`.
- Helper server: `getLangFromRequest(request)` → cek cookie lalu header `Accept-Language`, default `'id'`.
- AI prompt: tambahkan satu baris di akhir system prompt: `"IMPORTANT: Tulis seluruh respons dalam Bahasa Indonesia."` atau `"IMPORTANT: Respond entirely in English."`.

## Out of Scope

- Tidak menambah bahasa ketiga.
- Tidak menerjemahkan data dinamis user (catatan habit, dll.) — hanya UI + respons AI baru.
- Riwayat risk analysis lama tetap dalam bahasa saat dibuat (tidak di-regenerate).
