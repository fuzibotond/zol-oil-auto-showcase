-- Seed real company identity (from the client's existing site zoloil.ro) and the
-- Romanian legal pages. Company fields are filled but left UNVERIFIED
-- (verified_fields stays empty) — the owner confirms them in Admin -> Companie.
-- Legal pages are marked needs_review = 1 and must be reviewed by a RO professional.
-- Guards (WHERE ... = '' / ON CONFLICT DO NOTHING) prevent clobbering later admin edits.

UPDATE company_info SET
  trading_name        = 'Parc Auto ZOL-OIL',
  legal_name          = 'SC Prod Com "Zol-Oil" SRL',
  entity_type         = 'SRL',
  cui                 = 'RO 6604723',
  reg_com             = 'J14/993/1994',
  registered_address  = '525400 Targu Secuiesc, Str. Purczel Janos nr. 14, jud. Covasna, Romania',
  workpoint_address   = 'Cernat, jud. Covasna, Romania',
  county              = 'Covasna',
  country             = 'Romania',
  phone               = '0267 360 662',
  website             = 'https://www.zoloil.ro',
  updated_at          = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id = 'default' AND (legal_name IS NULL OR legal_name = '');

INSERT INTO legal_pages (slug, title, body, version, needs_review, updated_at) VALUES
('confidentialitate', 'Politica de confidentialitate',
'Ultima actualizare: verificati si completati.

## 1. Operatorul de date
SC Prod Com "Zol-Oil" SRL, CUI RO 6604723, Nr. Reg. Com. J14/993/1994, sediu social in Targu Secuiesc, Str. Purczel Janos nr. 14, jud. Covasna. Punct de lucru: Cernat, jud. Covasna. Telefon: 0267 360 662.

## 2. Ce date colectam
- Date transmise prin formularul de contact: nume, telefon, adresa de e-mail (optional) si mesajul dumneavoastra.
- Date tehnice si de securitate generate automat de infrastructura (adresa IP, jurnale de acces), necesare functionarii si securitatii site-ului.
- Cookie-uri strict necesare pentru functionarea site-ului.

## 3. Scopurile prelucrarii
Prelucram datele pentru a raspunde solicitarilor privind autoturismele, pentru a va contacta si pentru buna functionare si securitate a site-ului.

## 4. Temeiul legal
Interesul legitim de a raspunde solicitarilor si de a asigura securitatea site-ului, respectiv consimtamantul, acolo unde este cazul. Furnizarea datelor de contact este necesara pentru a putea raspunde solicitarii.

## 5. Destinatari si imputerniciti
Folosim furnizori de infrastructura care prelucreaza date in numele nostru: Cloudflare (gazduire, baza de date, stocare imagini) si serviciul de e-mail folosit pentru notificari. Nu vindem datele dumneavoastra.

## 6. Transferuri internationale
Unii furnizori pot prelucra date in afara Romaniei, cu garantii adecvate conform legislatiei aplicabile.

## 7. Durata de pastrare
Pastram datele din solicitari doar cat este necesar pentru a raspunde si pentru evidenta, apoi le stergem. Contactati-ne pentru detalii.

## 8. Drepturile dumneavoastra
Aveti dreptul de acces, rectificare, stergere, restrictionare, opozitie si portabilitate, precum si dreptul de a va retrage consimtamantul. Puteti depune o plangere la Autoritatea Nationala de Supraveghere a Prelucrarii Datelor cu Caracter Personal (ANSPDCP, www.dataprotection.ro).

## 9. Decizii automate
Nu luam decizii automate cu efecte juridice pe baza datelor dumneavoastra.

## 10. Cum ne contactati
Pentru orice cerere privind datele personale ne puteti contacta la telefon 0267 360 662 sau prin datele de contact publicate pe site.

(Text orientativ care necesita verificare juridica de catre un profesionist roman.)',
1, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now')),

('politica-cookie', 'Politica privind modulele cookie',
'Ultima actualizare: verificati si completati.

## Ce sunt cookie-urile
Cookie-urile sunt fisiere mici stocate in browserul dumneavoastra pentru a permite functionarea site-ului.

## Ce cookie-uri folosim
Folosim doar cookie-uri strict necesare:
- un cookie care retine optiunea dumneavoastra privind cookie-urile.
Nu folosim cookie-uri de analiza a traficului, publicitate sau urmarire (tracking).

## Gestionarea cookie-urilor
Puteti bloca sau sterge cookie-urile din setarile browserului. Blocarea cookie-urilor strict necesare poate afecta functionarea site-ului.

## Modificari
Vom actualiza aceasta politica daca introducem noi tehnologii. In acel caz veti putea alege categoriile non-esentiale.

(Text orientativ care necesita verificare juridica.)',
1, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now')),

('termeni', 'Termeni si conditii',
'Ultima actualizare: verificati si completati.

## 1. Despre site
Acest site prezinta autoturisme rulate disponibile la Parc Auto ZOL-OIL. Operator: SC Prod Com "Zol-Oil" SRL, CUI RO 6604723, J14/993/1994.

## 2. Caracter informativ
Anunturile au caracter informativ. Trimiterea unei solicitari prin formular NU reprezinta un contract de vanzare-cumparare si nu obliga la achizitie.

## 3. Disponibilitate si preturi
Disponibilitatea autovehiculelor se poate modifica fara notificare prealabila. Preturile si specificatiile afisate pot contine erori; specificatiile finale si conditiile contractuale se confirma la fata locului cu reprezentantul.

## 4. Verificare
Va recomandam sa verificati autovehiculul pe viu inainte de achizitie. Datele tehnice afisate sunt orientative.

## 5. Protectia consumatorului
Reclamatiile se pot adresa direct la telefon 0267 360 662 sau catre Autoritatea Nationala pentru Protectia Consumatorilor (ANPC, www.anpc.ro).

## 6. Proprietate intelectuala
Continutul site-ului apartine operatorului si nu poate fi reutilizat fara acord.

(Text orientativ care necesita verificare juridica.)',
1, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
ON CONFLICT (slug) DO NOTHING;
