# Parc Auto ZOL-OIL — Prezentarea sistemului

*Document de prezentare pentru beneficiar. Explică, pe scurt și fără termeni tehnici,
ce face noul site, ce funcții are și ce servicii folosește.*

---

## 1. Ce este

Un site web modern pentru parcul auto ZOL-OIL, format din două părți:

- **Site-ul public** — ce văd clienții: mașinile de vânzare, detaliile fiecărei mașini,
  pagina „Despre noi”, contact și paginile legale.
- **Panoul de administrare** — o zonă privată, doar pentru dumneavoastră, de unde puteți
  actualiza singur tot conținutul (mașini, poze, texte, date de contact) **fără să aveți
  nevoie de un programator**.

Totul rulează pe rețeaua **Cloudflare**, o platformă mare și sigură, ceea ce înseamnă că
site-ul se încarcă **rapid**, este **stabil** (online non-stop) și are **costuri foarte mici**.

## 2. Cum funcționează (pe înțelesul tuturor)

- Toate informațiile (mașini, fotografii, texte, setări) sunt păstrate într-o **bază de date
  și o stocare de imagini** găzduite la Cloudflare.
- Din **panoul de administrare** modificați aceste informații. Site-ul public le afișează
  **imediat** — nu este nevoie de nimeni tehnic pentru schimbările de zi cu zi.
- Panoul de administrare este **protejat**: intră doar adresele de e-mail aprobate, printr-un
  **cod trimis pe e-mail** (nu există o parolă de reținut sau de pierdut).
- Când un client trimite o **cerere prin formularul de contact**, aceasta se **salvează** în
  panou și (opțional) vă este trimisă și pe **e-mail**.

## 3. Funcționalități

### Site public
- **Prima pagină** — imagine principală, mașini recomandate/recente, hartă cu locația,
  număr real de mașini disponibile.
- **Mașini** — lista mașinilor, cu filtrare și sortare.
- **Pagina fiecărei mașini** — specificații, **galerie foto**, listă de **dotări**, descriere,
  buton **WhatsApp cu mesaj precompletat** (marca, modelul, prețul, link), formular de contact,
  mașini similare, etichetă **„Nou”** pentru mașinile adăugate în ultima săptămână, stare
  (Disponibil / Rezervat / Vândut etc.).
- **Despre noi** — text și secțiuni editabile, plus datele oficiale ale firmei.
- **Contact** — formular de cerere, **hartă** generată din adresă, butoane rapide (telefon,
  WhatsApp, direcții).
- **Pagini legale** — Politica de confidențialitate, Politica de cookie-uri, Termeni și condiții.
- **Bară de cookie-uri** corectă (site-ul folosește doar cookie-uri necesare, fără urmărire).
- **Optimizare pentru Google (SEO)** — titluri unice, hartă a site-ului (sitemap), previzualizare
  la distribuirea pe rețele sociale, date structurate pentru motoarele de căutare.
- **Adaptat pentru telefon** — arată bine pe mobil, tabletă și desktop.

### Panou de administrare
- **Autentificare securizată** (fără parolă — cod pe e-mail).
- **Panou general (Dashboard)**.
- **Mașini** — adăugare, editare, ștergere; **încărcare fotografii** direct de pe dispozitiv
  (se salvează automat în cloud), reordonare poze, stabilirea stării, marcare ca „recomandată”,
  dotări, dată de adăugare și eticheta „Nou”.
- **Leaduri (cereri)** — toate cererile primite prin formular, cu posibilitatea de a le marca
  „contactat” / „închis”.
- **Despre noi** — editarea paginii și a secțiunilor, cu imagini.
- **Companie** — datele oficiale/legale ale firmei, cu o listă de verificare a completării.
- **Pagini legale** — editarea textelor de confidențialitate, cookie-uri și termeni.
- **Setări** — date de contact, adresă (care generează harta), linkuri Google Maps/Waze,
  program de funcționare, linkuri către rețelele sociale.

## 4. Servicii externe folosite

| Serviciu | La ce se folosește | Necesită cont/plată? |
|---|---|---|
| **Cloudflare** | Găzduire site, baza de date, stocare imagini, securitatea panoului | Cont gratuit (plan Free) |
| **Cloudflare Access (Zero Trust)** | Autentificarea în panoul de administrare (cod pe e-mail) | Inclus, gratuit |
| **Resend** (opțional) | Trimite e-mail când cineva completează formularul de contact | Cont gratuit (100 e-mailuri/zi) |
| **Google Maps** | Harta cu locația și butonul de direcții | Fără cont necesar |
| **Waze** | Buton „Deschide în Waze” | Fără cont necesar |
| **WhatsApp** | Buton de contact rapid cu mesaj precompletat | Numărul dvs. de WhatsApp |
| **Autovit** (opțional) | Link către anunțul de pe Autovit, dacă îl completați la o mașină | — |

> Site-ul **nu** folosește instrumente de analiză a traficului, pixeli de publicitate sau
> alte servicii de urmărire.

## 5. Date și confidențialitate (pe scurt)

- Prin formularul de contact se colectează: **nume, telefon, e-mail (opțional) și mesajul**.
  Acestea sunt folosite doar pentru a răspunde solicitării.
- Paginile legale (confidențialitate/cookie/termeni) descriu aceste aspecte. **Textul actual
  este orientativ și trebuie verificat de un specialist/jurist român** înainte de promovare.
- Datele oficiale ale firmei sunt preluate din vechiul site și marcate „de verificat” — vă rugăm
  să le confirmați în panou.

## 6. Ce rămâne de făcut de către proprietar

- **Verificarea datelor firmei** în panou (secțiunea „Companie”).
- **Verificarea juridică** a paginilor legale, apoi debifarea „Necesită verificare juridică”.
- Furnizarea/înlocuirea imaginii mari de pe prima pagină cu una optimizată (opțional, pentru viteză).
- Pașii de domeniu și de securitate (Cloudflare Access, mutarea domeniului `zoloil.ro`) — descriși
  separat în documentele tehnice.

---

*Pentru instrucțiuni pas cu pas de utilizare a panoului, vedeți „GHID_ADMINISTRARE.md”.*
