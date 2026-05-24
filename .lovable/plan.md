
# Tintify — Overhaul Lengkap

Mengubah DentaShade menjadi **Tintify**: platform lengkap dengan auth, role-based dashboard, dan beberapa halaman AI sesuai mockup yang kamu kirim.

## 1. Branding & Warna VITA yang Akurat

- Rename app ke **Tintify** (logo gigi ungu, font display ungu)
- Palette ungu (gradient `#a855f7 → #6366f1`) menggantikan aqua
- **Perbaiki hex warna VITA shade** berdasarkan foto VITA Classical asli yang kamu upload — warnanya lebih dingin/abu di B/C dan lebih kuning di A/D
- Update `SHADE_COLORS` di tooth scan + `VITA_SHADES` di guide

## 2. Authentication

- Login & signup (email/password + Google)
- Hanya user login yang bisa akses `/dashboard`, `/scan`, dst.
- Halaman public: `/` (landing), `/login`, `/signup`, `/shades`

## 3. Roles (admin / user)

Tabel `user_roles` (enum `app_role`) + helper `has_role()` (security definer).
- User baru otomatis dapat role `user` via trigger
- Admin di-promote manual via SQL

## 4. Halaman Baru / Diubah

### Public
- **`/` Landing page** — hero "Tintify: Tooth Color Intelligence Platform", Key Features (Smart Scan, Behavior Tracking, Risk Analysis, Recommendations), stats bar, 3-step flow, testimonial, footer
- `/login`, `/signup`
- `/shades` — sudah ada, refresh warnanya

### Authenticated (layout sidebar)
- **`/dashboard` (user)** — welcome, 3-step cards, metric cards (Current Shade, Risk Score, Active Streak, Next Scan), Tooth Color Progress chart (Recharts), Behavior Summary, Quick Actions, Recent Activity
- **`/dashboard` (admin)** — beda: total users, total scans, distribusi shade, recent users, recent scans
- **`/scan`** — 3 tab: Manual Selection (grid 16 shade), Upload Photo (drag & drop), Take Photo (kamera). Tombol "Analyze Shade" memanggil AI yang sudah ada. Sidebar tips.
- **`/risk-analysis`** — current shade + skala VITA, AI-generated risk breakdown (high/moderate impact factors dari habits user), protective factors, CTA recommendations
- **`/recommendations`** — AI-generated priority action plan berdasarkan risk profile (cards: target, current, action steps, progress), professional recs, educational resources, daily tip
- **`/habit-tracker`** — daily log (brushing, flossing, mouthwash, coffee/tea/cigarettes count), activity heatmap 30 hari, stats, coffee chart 7 hari, achievements
- **`/profile`** — info user, stats, settings (notif, dark mode), quick menu

## 5. Database

Tabel baru:
- `profiles` (display_name, avatar_url, subscription)
- `user_roles` (user_id, role) + enum + RLS
- `tooth_scans` (user_id, shade, brightness, confidence, hygiene_score, summary, image_url, created_at)
- `habit_logs` (user_id, date, brushing_morning, brushing_night, flossing, mouthwash, coffee_cups, tea_cups, cigarettes)
- `recommendations` (user_id, title, category, target, current, status, ai_generated)
- `achievements` (user_id, key, earned_at)

RLS: user hanya bisa lihat data sendiri; admin bisa lihat semua via `has_role(uid, 'admin')`.

## 6. AI Integrations (Lovable AI Gateway)

Server functions baru:
- `generateRiskAnalysis` — input: current shade + habit logs 30d → output structured risk factors + advice
- `generateRecommendations` — input: risk profile + habits → output priority actions
- `generateHabitInsights` — input: habit logs → output streak commentary + daily tip

Pakai `google/gemini-2.5-flash` dengan tool calling (sama pola dengan `analyze-teeth`).

## 7. Design System

- Primary ungu `oklch(0.62 0.22 295)`, gradient `from-primary to-indigo-500`
- Font: **Outfit** (display) + **Inter** (body) — match vibe Tintify
- Sidebar collapsible (shadcn `sidebar`)
- Card style: rounded-2xl, soft shadow, white bg

## 8. Urutan Eksekusi (1 turn besar)

1. Migration DB (profiles, roles, scans, habits, recs, achievements + RLS + trigger handle_new_user)
2. Konfigurasi Google auth
3. Auth pages + AuthProvider hook
4. Layout `_authenticated` dengan sidebar + role check
5. Update styles.css (ungu)
6. Landing page baru
7. Dashboard user + admin (conditional render by role)
8. Scan page (3-tab, simpan ke DB)
9. Server functions AI (risk, rec, habit)
10. Risk Analysis, Recommendations, Habit Tracker, Profile
11. Perbaiki VITA hex di shades.tsx + SHADE_COLORS

## Catatan

- **Auto-confirm email**: TIDAK aktifkan kecuali kamu minta — user harus verifikasi email dulu
- Mockup pakai banyak emoji icon kotak (kemungkinan font-loss screenshot) — saya pakai `lucide-react` setara
- Achievements logic minimal dulu (hardcoded check); bisa di-extend nanti
- Dark mode: toggle saja (tidak full themed dulu)

---

**Konfirmasi sebelum mulai:**

Ini pekerjaan besar (~15-20 file baru, 1 migration besar, ~30 menit eksekusi). Apakah saya lanjutkan **semua sekaligus** dengan plan ini, atau kamu ingin saya kerjakan **bertahap** (misal: tahap 1 = auth + landing + dashboard user; tahap 2 = scan multi-mode + VITA color fix; tahap 3 = AI risk/recommendations/habits; tahap 4 = admin dashboard)?
