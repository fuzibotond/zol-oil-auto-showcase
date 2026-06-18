import { Phone, MessageCircle, Send } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function ContactButtons({ message }: { message?: string }) {
  const { settings } = useSiteSettings();
  const messenger = settings.social_links.find((x) => x.key === "messenger");
  const waMsg = message ? `?text=${encodeURIComponent(message)}` : "";

  return (
    <div className={`grid ${messenger?.enabled && messenger.url ? "grid-cols-3" : "grid-cols-2"} gap-2`}>
      <a href={`tel:${settings.phone}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-3 py-3 text-sm font-medium text-background hover:opacity-90">
        <Phone className="h-4 w-4" /> Sună
      </a>
      <a href={`https://wa.me/${settings.whatsapp}${waMsg}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-3 py-3 text-sm font-medium text-accent-foreground hover:opacity-90">
        <MessageCircle className="h-4 w-4" /> WhatsApp
      </a>
      {messenger?.enabled && messenger.url && (
        <a href={messenger.url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-3 text-sm font-medium hover:bg-secondary">
          <Send className="h-4 w-4" /> Messenger
        </a>
      )}
    </div>
  );
}
