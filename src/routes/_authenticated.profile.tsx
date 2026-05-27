import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import {
  User as UserIcon, Crown, History, Download, HelpCircle, Info, Shield, LogOut, Trash2, Save, Loader2, Camera,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — Tintify" }] }),
});


function ProfilePage() {
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [pushNotif, setPushNotif] = useState(true);
  const [emailReports, setEmailReports] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);


  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ["profile-stats", user?.id],
    queryFn: async () => {
      const [{ count: scanCount }, { count: habitCount }, { data: firstLog }] = await Promise.all([
        supabase.from("tooth_scans").select("*", { count: "exact", head: true }),
        supabase.from("habit_logs").select("*", { count: "exact", head: true }),
        supabase.from("habit_logs").select("log_date").order("log_date", { ascending: true }).limit(1),
      ]);
      const since = firstLog?.[0]?.log_date ? new Date(firstLog[0].log_date) : null;
      const daysActive = since ? Math.max(1, Math.floor((Date.now() - since.getTime()) / 86400000)) : 0;
      return {
        totalScans: scanCount ?? 0,
        habitsTracked: habitCount ?? 0,
        daysActive,
        memberSince: user?.created_at ? new Date(user.created_at).toLocaleDateString("id-ID", { month: "long", year: "numeric" }) : "—",
      };
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
    else if (user?.user_metadata?.display_name) setDisplayName(user.user_metadata.display_name);
  }, [profile, user]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").upsert({
        user_id: user!.id, display_name: displayName, email: user!.email,
      }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Profil disimpan"); qc.invalidateQueries({ queryKey: ["profile"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Not signed in");
      if (file.size > 5 * 1024 * 1024) throw new Error("Maks 5MB");
      const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatar_url = pub.publicUrl;
      const { error } = await supabase.from("profiles").update({ avatar_url }).eq("user_id", user.id);
      if (error) throw error;
      return avatar_url;
    },
    onSuccess: () => { toast.success("Foto profil diperbarui"); qc.invalidateQueries({ queryKey: ["profile"] }); },
    onError: (e: Error) => toast.error(e.message),
  });


  async function handleLogout() {
    await signOut();
    toast.success("Anda telah keluar");
    navigate({ to: "/" });
  }

  const initials = (displayName || user?.email || "U").slice(0, 2).toUpperCase();
  const isPremium = profile?.subscription === "premium";

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-10">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight text-foreground">Profile</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Hero */}
          <div className="rounded-3xl p-8 text-center text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/20 text-2xl font-bold backdrop-blur">
              {initials}
            </div>
            <h2 className="mt-4 text-2xl font-semibold">{displayName || user?.email?.split("@")[0]}</h2>
            <p className="text-sm opacity-90">{user?.email}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1 text-xs font-medium backdrop-blur">
              <Crown className="h-3.5 w-3.5" /> {isPremium ? "Premium Member" : "Free Member"}
            </span>
          </div>

          {/* Statistics */}
          <div className="rounded-2xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-lg font-semibold text-foreground">Statistics</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat value={stats?.totalScans ?? 0} label="Total Scans" />
              <Stat value={stats?.daysActive ?? 0} label="Days Active" />
              <Stat value={stats?.habitsTracked ?? 0} label="Habits Tracked" />
              <Stat value={(stats?.totalScans ?? 0) > 0 ? "Active" : "—"} label="Status" small />
            </div>
          </div>

          {/* Account Info */}
          <div className="rounded-2xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-lg font-semibold text-foreground">Informasi Akun</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Nama Lengkap">
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </Field>
              <Field label="Email">
                <input value={user?.email ?? ""} disabled
                  className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground" />
              </Field>
              <Field label="Member Since">
                <input value={stats?.memberSince ?? "—"} disabled
                  className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground" />
              </Field>
              <Field label="Subscription">
                <input value={isPremium ? "Premium" : "Free"} disabled
                  className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground" />
              </Field>
            </div>
            <button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}
              className="mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              style={{ background: "var(--gradient-primary)" }}>
              {saveProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Profil
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-lg font-semibold text-foreground">Settings</h3>
            <ToggleRow label="Push Notifications" desc="Reminder kebiasaan harian" value={pushNotif} onChange={setPushNotif} />
            <ToggleRow label="Email Reports" desc="Ringkasan mingguan" value={emailReports} onChange={setEmailReports} />
          </div>

          <div className="rounded-2xl bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-lg font-semibold text-foreground">Menu Cepat</h3>
            <div className="mt-3 space-y-1">
              <MenuLink to="/dashboard" icon={History}>Scan History</MenuLink>
              <MenuLink to="/recommendations" icon={Download}>Export Data</MenuLink>
              <MenuButton icon={HelpCircle}>Help & Support</MenuButton>
              <MenuButton icon={Info}>About Tintify</MenuButton>
              <MenuButton icon={Shield}>Privacy Policy</MenuButton>
            </div>
          </div>

          <div className="rounded-2xl border border-destructive/30 bg-card p-5">
            <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
            <div className="mt-3 space-y-1">
              <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
                <LogOut className="h-4 w-4" /> Keluar
              </button>
              <button onClick={() => toast.info("Hubungi admin untuk menghapus akun")}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" /> Hapus Akun
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ value, label, small }: { value: string | number; label: string; small?: boolean }) {
  return (
    <div className="rounded-xl bg-primary/5 p-4 text-center">
      <p className={`font-bold text-primary ${small ? "text-lg" : "text-2xl"}`}>{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="mt-4 flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <button onClick={() => onChange(!value)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${value ? "" : "bg-secondary"}`}
        style={value ? { background: "var(--gradient-primary)" } : undefined}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${value ? "left-5" : "left-0.5"}`} />
      </button>
    </div>
  );
}

function MenuLink({ to, icon: Icon, children }: { to: string; icon: any; children: React.ReactNode }) {
  return (
    <Link to={to} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-secondary/60">
      <Icon className="h-4 w-4 text-primary" /> {children}
    </Link>
  );
}

function MenuButton({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-secondary/60">
      <Icon className="h-4 w-4 text-primary" /> {children}
    </button>
  );
}
