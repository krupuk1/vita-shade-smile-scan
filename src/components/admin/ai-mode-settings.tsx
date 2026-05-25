import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Brain, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAiSettings, updateAiSettings, type AiProvider } from "@/lib/ai-settings.functions";

const PROVIDERS: { value: AiProvider; label: string; help: string; defaultBaseUrl: string; modelExamples: string[] }[] = [
  { value: "lovable", label: "Lovable AI (Default)", help: "Gateway bawaan Lovable. Tidak perlu API key.", defaultBaseUrl: "https://ai.gateway.lovable.dev/v1", modelExamples: ["google/gemini-2.5-flash", "google/gemini-2.5-pro", "openai/gpt-5-mini"] },
  { value: "openai", label: "OpenAI", help: "Gunakan API key dari platform.openai.com.", defaultBaseUrl: "https://api.openai.com/v1", modelExamples: ["gpt-4o", "gpt-4o-mini", "gpt-4.1-mini"] },
  { value: "gemini", label: "Google Gemini", help: "Gunakan API key dari Google AI Studio (OpenAI-compatible endpoint).", defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", modelExamples: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"] },
  { value: "openrouter", label: "OpenRouter", help: "Gunakan API key dari openrouter.ai.", defaultBaseUrl: "https://openrouter.ai/api/v1", modelExamples: ["openai/gpt-4o-mini", "google/gemini-2.5-flash", "anthropic/claude-3.5-sonnet"] },
  { value: "openai_compatible", label: "OpenAI Compatible", help: "Endpoint custom (vLLM, LM Studio, Together.ai, Groq, dll).", defaultBaseUrl: "", modelExamples: ["llama-3.1-70b", "mixtral-8x7b"] },
];

export function AiModeSettings() {
  const qc = useQueryClient();
  const fetchSettings = useServerFn(getAiSettings);
  const saveSettings = useServerFn(updateAiSettings);

  const { data, isLoading } = useQuery({ queryKey: ["ai-settings"], queryFn: () => fetchSettings() });

  const [provider, setProvider] = useState<AiProvider>("lovable");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    if (data) {
      setProvider(data.provider as AiProvider);
      setModel(data.model);
      setBaseUrl(data.base_url ?? "");
    }
  }, [data]);

  const meta = PROVIDERS.find((p) => p.value === provider)!;

  const mutation = useMutation({
    mutationFn: () => saveSettings({ data: { provider, model, api_key: apiKey || null, base_url: baseUrl || null } }),
    onSuccess: () => {
      toast.success("Konfigurasi AI tersimpan");
      setApiKey("");
      qc.invalidateQueries({ queryKey: ["ai-settings"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menyimpan"),
  });

  return (
    <section className="rounded-2xl bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground"><Brain className="h-4 w-4 text-primary" /> Mode AI</h2>
      <p className="mt-1 text-xs text-muted-foreground">Pilih penyedia AI, masukkan API key, lalu tentukan model. Semua endpoint menggunakan format chat completions kompatibel OpenAI.</p>

      {isLoading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <div className="mt-5 grid gap-4">
          <div className="grid gap-2">
            <Label>Penyedia</Label>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
              {PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setProvider(p.value);
                    if (!baseUrl || PROVIDERS.some((x) => x.defaultBaseUrl === baseUrl)) setBaseUrl(p.defaultBaseUrl);
                  }}
                  className={`rounded-xl border px-3 py-2.5 text-left text-xs transition ${provider === p.value ? "border-primary bg-primary/5 text-foreground" : "border-border bg-background hover:bg-muted/40 text-muted-foreground"}`}
                >
                  <div className="font-medium text-foreground">{p.label}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{meta.help}</p>
          </div>

          {provider !== "lovable" && (
            <div className="grid gap-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder={data?.has_key ? `Tersimpan: ${data.api_key}` : "sk-..."}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">Kosongkan untuk mempertahankan key yang sudah tersimpan.</p>
            </div>
          )}

          {provider === "openai_compatible" && (
            <div className="grid gap-2">
              <Label htmlFor="base-url">Base URL</Label>
              <Input id="base-url" placeholder="https://api.your-endpoint.com/v1" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
              <p className="text-xs text-muted-foreground">URL endpoint chat completions (tanpa `/chat/completions`).</p>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="model">Model</Label>
            <Input id="model" placeholder={meta.modelExamples[0]} value={model} onChange={(e) => setModel(e.target.value)} />
            <div className="flex flex-wrap gap-1.5">
              {meta.modelExamples.map((m) => (
                <button key={m} type="button" onClick={() => setModel(m)} className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/60">
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !model}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-primary-foreground transition disabled:opacity-60"
              style={{ background: "var(--gradient-primary)" }}
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Konfigurasi
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
