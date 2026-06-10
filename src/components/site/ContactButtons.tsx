import { Phone, MessageCircle, Send } from "lucide-react";
import { SITE } from "@/lib/site";

export function ContactButtons({ message }: { message?: string }) {
  const waMsg = message ? `?text=${encodeURIComponent(message)}` : "";
  return (
    <div className="grid grid-cols-3 gap-2">
      <a href={`tel:${SITE.phone}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-3 py-3 text-sm font-medium text-background hover:opacity-90">
        <Phone className="h-4 w-4" /> Sună
      </a>
      <a href={`https://wa.me/${SITE.whatsapp}${waMsg}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-3 py-3 text-sm font-medium text-accent-foreground hover:opacity-90">
        <MessageCircle className="h-4 w-4" /> WhatsApp
      </a>
      <a href={SITE.messenger} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-3 text-sm font-medium hover:bg-secondary">
        <Send className="h-4 w-4" /> Messenger
      </a>
    </div>
  );
}
