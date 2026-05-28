import { Languages } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  variant?: "ghost" | "pill";
  className?: string;
}

export function LanguageSwitcher({ variant = "ghost", className = "" }: Props) {
  const { lang, setLang } = useLang();

  const trigger = variant === "pill" ? (
    <button className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur hover:bg-card ${className}`}>
      <Languages className="h-3.5 w-3.5" />
      {lang === "id" ? "🇮🇩 ID" : "🇬🇧 EN"}
    </button>
  ) : (
    <button className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-foreground/80 hover:bg-accent ${className}`}>
      <Languages className="h-3.5 w-3.5" />
      {lang === "id" ? "ID" : "EN"}
    </button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuItem onClick={() => setLang("id")} className={lang === "id" ? "font-semibold" : ""}>
          🇮🇩 Bahasa Indonesia
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLang("en")} className={lang === "en" ? "font-semibold" : ""}>
          🇬🇧 English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
