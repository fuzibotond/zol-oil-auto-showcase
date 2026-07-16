import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, ShieldCheck, MapPin, Phone, Facebook } from "lucide-react";
import { listCars } from "@/lib/api/cars.functions";
import { CarCard } from "@/components/site/CarCard";
import { SITE, mapsEmbedUrl } from "@/lib/site";
import { useSiteSettings } from "@/hooks/use-site-settings";

const CREAM = "#EDEAE2";
const DARK = "#252018";
const OG = "#F15A22";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ZOL-OIL · Parc Auto în Cernat — mașini second-hand verificate" },
      {
        name: "description",
        content:
          "Parc Auto ZOL-OIL în Cernat, Covasna. Autoturisme rulate, verificate și pregătite pentru drum.",
      },
      { property: "og:title", content: "Parc Auto ZOL-OIL · Cernat" },
      {
        property: "og:description",
        content: "Autoturisme rulate, verificate și pregătite pentru drum.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

function HomePage() {
  const fetchCars = useServerFn(listCars);
  const { settings } = useSiteSettings();
  const facebook = settings.social_links.find((x) => x.key === "facebook");
  const { data: featured = [] } = useQuery({
    queryKey: ["cars", "featured"],
    queryFn: () => fetchCars({ data: { featured: true, limit: 6 } }),
  });
  const { data: latest = [] } = useQuery({
    queryKey: ["cars", "latest"],
    queryFn: () => fetchCars({ data: { limit: 6 } }),
  });
  const shown = featured.length ? featured : latest;

  return (
    <div style={{ background: CREAM }}>
      {/* ===== POSTER HERO ===== */}
      <section
        style={{ position: "relative", overflow: "hidden", minHeight: "100svh", background: CREAM }}
      >
        {/* Layer 0 — ghost type fills the whole frame */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            pointerEvents: "none",
            userSelect: "none",
            padding: "0.5vw 1.5vw",
            zIndex: 0,
          }}
        >
          <div
            style={{
              fontFamily: "'Sora', system-ui, sans-serif",
              fontWeight: 900,
              fontSize: "clamp(90px, 27vw, 400px)",
              lineHeight: 0.83,
              letterSpacing: "-0.05em",
              color: DARK,
              opacity: 0.1,
            }}
          >
            ZOL
          </div>
          <div
            style={{
              fontFamily: "'Sora', system-ui, sans-serif",
              fontWeight: 900,
              fontSize: "clamp(90px, 27vw, 400px)",
              lineHeight: 0.83,
              letterSpacing: "-0.05em",
              color: DARK,
              opacity: 0.1,
              textAlign: "right",
            }}
          >
            OIL
          </div>
        </div>

        {/* Layer 1 — diagonal orange band */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: OG,
            clipPath: "polygon(0% 34%, 100% 17%, 100% 66%, 0% 83%)",
            zIndex: 1,
          }}
        />

        {/* Layer 2 — car in oval lens on the band */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -52%) rotate(-8deg)",
            width: "clamp(260px, 52vw, 640px)",
            aspectRatio: "16 / 9",
            borderRadius: "50%",
            overflow: "hidden",
            zIndex: 2,
            boxShadow: "0 28px 72px rgba(0,0,0,0.42), 0 6px 20px rgba(0,0,0,0.22)",
          }}
        >
          <img
            src="/parc-auto.png"
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 55%",
            }}
          />
        </div>

        {/* Layer 3 — foreground layout */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            minHeight: "100svh",
            display: "flex",
            flexDirection: "column",
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0 clamp(1.25rem, 4vw, 3rem)",
          }}
        >
          <div style={{ flex: 1 }} />

          {/* Bottom row: brand + editorial block */}
          <div
            style={{
              paddingBottom: "clamp(2.5rem, 6vw, 5rem)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: "2rem",
              flexWrap: "wrap",
            }}
          >
            {/* Brand + CTA */}
            <div>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  color: DARK + "88",
                  marginBottom: "0.75rem",
                }}
              >
                Parc Auto · {SITE.city}, {SITE.county}
              </div>
              <h1
                style={{
                  fontFamily: "'Sora', system-ui, sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(2.6rem, 6vw, 5.5rem)",
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                  color: DARK,
                  margin: 0,
                }}
              >
                ZOL-OIL<span style={{ color: OG }}>.</span>
              </h1>
              <p
                style={{
                  marginTop: "1rem",
                  fontSize: "clamp(0.9rem, 1.5vw, 1.1rem)",
                  lineHeight: 1.6,
                  color: DARK + "99",
                  maxWidth: "21rem",
                }}
              >
                Mașini verificate tehnic,
                <br />
                pregătite de drum.
              </p>
              <div
                style={{ display: "flex", gap: "0.75rem", marginTop: "1.75rem", flexWrap: "wrap" }}
              >
                <Link
                  to="/masini"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: DARK,
                    color: CREAM,
                    padding: "0.85rem 1.5rem",
                    borderRadius: "9999px",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Vezi mașinile <ArrowRight size={16} />
                </Link>
                <a
                  href={`https://wa.me/${settings.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: OG,
                    color: "#fff",
                    padding: "0.85rem 1.5rem",
                    borderRadius: "9999px",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  WhatsApp
                </a>
              </div>
            </div>

            {/* Editorial info block */}
            <div
              style={{
                borderLeft: `2px solid ${DARK}20`,
                paddingLeft: "1.25rem",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: DARK + "35",
                  marginBottom: "0.5rem",
                }}
              >
                —
              </div>
              <div
                style={{
                  fontFamily: "'Sora', system-ui, sans-serif",
                  fontWeight: 800,
                  fontSize: "11px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: DARK,
                }}
              >
                Parc Auto
              </div>
              <div
                style={{
                  marginTop: "0.6rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.3rem",
                }}
              >
                <div style={{ fontSize: "11px", color: DARK + "65" }}>Locație: {SITE.city}</div>
                <div style={{ fontSize: "11px", color: DARK + "65" }}>Județ: {SITE.county}</div>
                <div style={{ fontSize: "11px", color: DARK + "65" }}>
                  {settings.opening_hours[0]?.day ?? "Luni - Vineri"} /{" "}
                  {settings.opening_hours[0]?.value ?? "09:00 - 18:00"}
                </div>
              </div>
              <div
                style={{
                  marginTop: "0.75rem",
                  paddingTop: "0.75rem",
                  borderTop: `1px solid ${DARK}15`,
                  fontFamily: "'Sora', system-ui, sans-serif",
                  fontWeight: 700,
                  fontSize: "12px",
                  color: DARK + "40",
                }}
              >
                01 / 50+
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section style={{ background: DARK, padding: "1.75rem 0" }}>
        <div
          style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem, 4vw, 3rem)" }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: "1.5rem",
            }}
          >
            {[
              { v: "50+", l: "Mașini în parc" },
              { v: "10+", l: "Ani experiență" },
              { v: "100%", l: "Verificate tehnic" },
              { v: SITE.city, l: SITE.county },
            ].map(({ v, l }) => (
              <div key={l}>
                <div
                  style={{
                    fontFamily: "'Sora', system-ui, sans-serif",
                    fontWeight: 900,
                    fontSize: "1.75rem",
                    letterSpacing: "-0.02em",
                    color: CREAM,
                  }}
                >
                  {v}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: CREAM + "50",
                    marginTop: "0.1rem",
                  }}
                >
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CARS GRID ===== */}
      <section
        style={{ maxWidth: "1280px", margin: "0 auto", padding: "5rem clamp(1.25rem, 4vw, 3rem)" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "1rem",
            marginBottom: "2.5rem",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: OG,
                marginBottom: "0.4rem",
              }}
            >
              Mașini disponibile
            </div>
            <h2
              style={{
                fontFamily: "'Sora', system-ui, sans-serif",
                fontWeight: 900,
                fontSize: "clamp(1.8rem, 4vw, 3.2rem)",
                letterSpacing: "-0.03em",
                color: DARK,
                margin: 0,
              }}
            >
              {featured.length ? "Recomandate" : "Cele mai noi"}
            </h2>
          </div>
          <Link
            to="/masini"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: DARK + "70",
              textDecoration: "none",
            }}
          >
            Vezi toate <ArrowRight size={15} />
          </Link>
        </div>
        {shown.length === 0 ? (
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              borderRadius: "1.5rem",
              background: DARK + "08",
              border: `1px solid ${DARK}12`,
            }}
          >
            <p style={{ color: DARK + "70" }}>
              În curând adăugăm mașinile disponibile. Contactează-ne direct pentru oferte actuale.
            </p>
            <a
              href={`https://wa.me/${settings.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                marginTop: "1rem",
                borderRadius: "9999px",
                padding: "0.6rem 1.25rem",
                background: OG,
                color: "#fff",
                fontSize: "0.85rem",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Scrie pe WhatsApp
            </a>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((c) => (
              <CarCard key={c.id} car={c} />
            ))}
          </div>
        )}
      </section>

      {/* ===== WHY US ===== */}
      <section
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 clamp(1.25rem, 4vw, 3rem)",
          paddingBottom: "5rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1px",
            borderRadius: "1.5rem",
            overflow: "hidden",
            background: DARK + "15",
          }}
        >
          {[
            {
              icon: <ShieldCheck size={22} />,
              t: "Verificate tehnic",
              d: "Fiecare mașină este verificată înainte de a fi expusă spre vânzare.",
            },
            {
              icon: <MapPin size={22} />,
              t: "Parc auto fizic",
              d: "Vino în Cernat să vezi mașina și să faci proba pe drum.",
            },
            {
              icon: <Phone size={22} />,
              t: "Contact rapid",
              d: "Telefon, WhatsApp sau Messenger — îți răspundem repede.",
            },
          ].map(({ icon, t, d }) => (
            <div
              key={t}
              style={{
                background: CREAM,
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div style={{ color: OG }}>{icon}</div>
              <div
                style={{
                  fontFamily: "'Sora', system-ui, sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: DARK,
                }}
              >
                {t}
              </div>
              <div style={{ fontSize: "0.85rem", lineHeight: 1.6, color: DARK + "80" }}>{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FACEBOOK CTA ===== */}
      {facebook?.enabled && facebook.url && (
        <section
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0 clamp(1.25rem, 4vw, 3rem)",
            paddingBottom: "5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1.5rem",
              background: DARK,
              borderRadius: "1.5rem",
              padding: "2rem 2.5rem",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Sora', system-ui, sans-serif",
                  fontWeight: 800,
                  fontSize: "1.4rem",
                  color: CREAM,
                }}
              >
                Urmărește-ne pe Facebook
              </div>
              <p style={{ fontSize: "0.85rem", color: CREAM + "70", marginTop: "0.3rem" }}>
                Postăm constant mașini noi pe Marketplace și pe pagina noastră.
              </p>
            </div>
            <a
              href={facebook.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: OG,
                color: "#fff",
                padding: "0.8rem 1.5rem",
                borderRadius: "9999px",
                fontSize: "0.875rem",
                fontWeight: 700,
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              <Facebook size={16} /> Vezi pagina
            </a>
          </div>
        </section>
      )}

      {/* ===== LOCATION ===== */}
      <section
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 clamp(1.25rem, 4vw, 3rem)",
          paddingBottom: "6rem",
        }}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div
            style={{
              background: DARK + "07",
              border: `1px solid ${DARK}10`,
              borderRadius: "1.5rem",
              padding: "2.5rem",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: OG,
                marginBottom: "0.5rem",
              }}
            >
              Locație
            </div>
            <h2
              style={{
                fontFamily: "'Sora', system-ui, sans-serif",
                fontWeight: 900,
                fontSize: "1.9rem",
                letterSpacing: "-0.02em",
                color: DARK,
                margin: "0 0 0.75rem",
              }}
            >
              Parcul auto din {SITE.city}
            </h2>
            <p style={{ fontSize: "0.875rem", color: DARK + "80", lineHeight: 1.6 }}>
              {settings.address || SITE.address}. Te așteptăm să vezi mașinile pe viu și să faci
              proba pe drum.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginTop: "1.5rem" }}>
              {(settings.maps_url || SITE.mapsDirections) && (
                <a
                  href={settings.maps_url || SITE.mapsDirections}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: DARK,
                    color: CREAM,
                    padding: "0.6rem 1.25rem",
                    borderRadius: "9999px",
                    fontSize: "0.825rem",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Direcții Google Maps
                </a>
              )}
              {(settings.waze_url || SITE.waze) && (
                <a
                  href={settings.waze_url || SITE.waze}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    border: `1.5px solid ${DARK}28`,
                    color: DARK,
                    padding: "0.6rem 1.25rem",
                    borderRadius: "9999px",
                    fontSize: "0.825rem",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Deschide în Waze
                </a>
              )}
            </div>
            <div style={{ marginTop: "1.5rem" }}>
              {settings.opening_hours.map((h) => (
                <div
                  key={h.day}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.5rem 0",
                    borderBottom: `1px solid ${DARK}12`,
                    fontSize: "0.875rem",
                  }}
                >
                  <span style={{ color: DARK + "70" }}>{h.day}</span>
                  <span style={{ fontWeight: 700, color: DARK }}>{h.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              borderRadius: "1.5rem",
              overflow: "hidden",
              minHeight: "320px",
              border: `1px solid ${DARK}10`,
            }}
          >
            <iframe
              title="Hartă"
              src={mapsEmbedUrl(settings.address)}
              style={{ width: "100%", height: "100%", minHeight: "320px", display: "block" }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
