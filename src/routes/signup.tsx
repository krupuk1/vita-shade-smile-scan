import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, type FormEvent } from "react";
import { Sparkles, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Daftar — Tintify" }] }),
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const checks = useMemo(() => ({
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  }), [password]);
  const allValid = Object.values(checks).every(Boolean);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!allValid) {
      toast.error("Password belum memenuhi syarat.");
      return;
    }
    if (!gender) return toast.error("Pilih jenis kelamin.");
    const ageNum = Number(age);
    if (!ageNum || ageNum < 5 || ageNum > 120) return toast.error("Masukkan usia yang valid (5–120).");

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { display_name: name, gender, age: String(ageNum) },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Akun dibuat! Anda akan diarahkan…");
    navigate({ to: "/dashboard" });
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (result.error) toast.error("Daftar dengan Google gagal");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: "var(--gradient-hero)" }}>
      <Toaster richColors position="top-center" />
      <div className="w-full max-w-md rounded-3xl bg-card p-8 md:p-10" style={{ boxShadow: "var(--shadow-card)" }}>
        <Link to="/" className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          Tintify
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Buat akun gratis</h1>
        <p className="mt-1 text-sm text-muted-foreground">Mulai analisis warna gigi Anda dalam 1 menit.</p>

        <button onClick={handleGoogle} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary">
          <GoogleIcon /> Daftar dengan Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> atau email <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />

          <div className="grid grid-cols-2 gap-3">
            <select required value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary">
              <option value="" disabled>Jenis kelamin</option>
              <option value="laki-laki">Laki-laki</option>
              <option value="perempuan">Perempuan</option>
              <option value="lainnya">Lainnya</option>
            </select>
            <input required type="number" min={5} max={120} value={age} onChange={(e) => setAge(e.target.value)} placeholder="Usia" className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>

          <div>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
            <ul className="mt-2 space-y-1 text-[11px]">
              <Check label="Minimal 8 karakter" ok={checks.length} />
              <Check label="Mengandung huruf besar (A-Z)" ok={checks.upper} />
              <Check label="Mengandung angka (0-9)" ok={checks.number} />
              <Check label="Mengandung simbol (!@#$...)" ok={checks.symbol} />
            </ul>
          </div>

          <button disabled={loading} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60" style={{ background: "var(--gradient-primary)" }}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Buat akun
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Sudah punya akun? <Link to="/login" className="font-medium text-primary hover:underline">Masuk</Link>
        </p>
      </div>
    </main>
  );
}

function Check({ label, ok }: { label: string; ok: boolean }) {
  const Icon = ok ? CheckIcon : XIcon;
  return (
    <li className={`flex items-center gap-1.5 ${ok ? "text-emerald-600" : "text-muted-foreground"}`}>
      <Icon /> {label}
    </li>
  );
}
function CheckIcon() { return <Check2 />; }
function XIcon() { return <X2 />; }
function Check2() { return <Check className="h-3 w-3" />; }
function X2() { return <X className="h-3 w-3" />; }

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
  );
}
