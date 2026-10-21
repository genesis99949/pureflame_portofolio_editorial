# PureFlame

Site de prezentare și magazin online pentru o colecție de mese cu foc pe gaz, construit ca **proiect de portofoliu**. Brandul și produsele sunt fictive, nu există stoc, clienți sau vânzări reale, iar plățile rulează doar în **Stripe test mode**.

Proiectul combină un front-end editorial (design, animații, responsive) cu un backend Node.js care procesează comenzi, plăți, newsletter, contact și recenzii. Prețurile și specificațiile produselor stau într-un catalog unic, editabil dintr-un CMS bazat pe Git.

**Demo online (doar front-end):** https://pureflameportofolioeditorial.vercel.app/ — pe Vercel rulează doar paginile statice. Plata, formularul de contact, newsletter-ul și recenziile au nevoie de backend și funcționează doar local (vezi „Instalare și rulare").

## Capturi

![Pagina de acasă](docs/screenshots/acasa.webp)

![Pagina Colecție](docs/screenshots/colectie.webp)

## Ce este implementat

**Front-end** (HTML, CSS și JavaScript vanilla, fără framework sau bundler)
- 15 pagini (acasă, colecție, 5 pagini de produs, despre noi, coș, finalizare comandă, confirmare, newsletter, termeni, confidențialitate, retur) și o pagină 404, generate din șabloane HTML cu datele din catalog.
- Comutator de limbă RO/EN, galerii de produs, vizualizare 3D a produselor, animații la scroll și coș de cumpărături salvat în `localStorage`.
- Layout responsive, cu header și navigare adaptate pentru mobil.

**Back-end** (Node.js + Express)
- **Comenzi și plăți:** coșul multi-produs ajunge la Stripe Checkout (card, Apple Pay, Google Pay). Prețurile se calculează pe server, din catalogul din `content/`; valorile trimise de browser sunt ignorate.
- **Webhook Stripe** cu verificarea semnăturii. O comandă devine „paid" doar prin webhook, niciodată prin pagina de confirmare.
- **Newsletter** cu dublă confirmare, dezabonare prin token și păstrarea dovezii de consimțământ (text, moment, IP).
- **Formular de contact** și **recenzii** cu moderare (o recenzie apare public doar după aprobare).
- **Email** prin Nodemailer. Fără SMTP configurat, mesajele sunt doar afișate în consolă.
- **Bază de date SQLite** (`node:sqlite`, fără dependență externă) și scripturi de backup/restore cu compresie și criptare AES-256-GCM opțională.

**Catalog și CMS**
- **O singură sursă de date:** fiecare produs și accesoriu are un fișier JSON în `content/` (preț, culori, dimensiuni, greutăți, material, texte RO/EN). Paginile, JavaScript-ul din browser și prețurile trimise la Stripe citesc toate din el, deci nu mai pot afișa un preț și încasa altul.
- **Validare:** `server/catalog.js` verifică datele (preț întreg pozitiv, texte RO și EN completate, id = numele fișierului). Un catalog invalid oprește serverul și build-ul, deci nu ajunge niciodată pe site.
- **Șabloane:** paginile din `src/pages/` conțin marcaje de tipul `{{products.embera.priceLabel}}`. `server/render.js` le înlocuiește, cu escapare HTML; un marcaj necunoscut este o eroare, nu un spațiu gol în pagină.
- **CMS:** [Sveltia CMS](https://sveltiacms.app/) la `/admin/`, cu două colecții (Produse, Accesorii). O salvare devine commit în GitHub, iar Vercel reconstruiește site-ul. Câmpurile care depind de cod sau de imagini (id, culori, dimensiuni, imagini) sunt doar pentru citire.

```
content/*.json ─► server/catalog.js (validare + formate de afișare)
                     ├─► server/index.js   paginile, randate la pornire (local)
                     ├─► scripts/build.js  dist/ pentru Vercel
                     └─► server/products.js prețurile pentru Stripe
/admin (Sveltia CMS) ─► commit în GitHub ─► Vercel rulează build-ul ─► site actualizat
```

**Securitate** (verificată prin teste)
- Validare strictă pe server (tip, lungime, format), limite pentru dimensiunea cererilor.
- Rate limiting pe fiecare endpoint, `helmet` cu Content Security Policy strict, fără CORS.
- Se servește doar o listă albă de pagini și `/assets`, nu rădăcina proiectului. Pe Vercel se publică doar folderul generat `dist/`; codul serverului și `content/` nu sunt accesibile.
- Panoul `/admin/` are un CSP separat (permite doar `unpkg.com` și API-ul GitHub); restul site-ului păstrează politica strictă, fără surse externe.
- Erorile către client sunt generice, fără stack trace.

## Tehnologii

| Zonă | Tehnologie |
|---|---|
| Front-end | HTML5, CSS, JavaScript (vanilla), GSAP pentru animații, scenă 3D pentru produse |
| Back-end | Node.js ≥ 22.5, Express 4 |
| Bază de date | SQLite (`node:sqlite`) |
| Plăți | Stripe Checkout + webhook |
| Email | Nodemailer |
| Securitate | helmet, express-rate-limit |
| Conținut | Sveltia CMS 0.229.0 (Git-based, backend GitHub), catalog JSON |
| Build și hosting | Script Node propriu (`scripts/build.js`), fără dependențe; Vercel (doar static) |
| Teste și CI | `node:test` (test runner nativ Node); GitHub Actions rulează testele și `npm audit` la fiecare PR și push pe `main` |

## Instalare și rulare

Cerințe: Node.js 22.5 sau mai nou.

```bash
npm install
cp .env.example .env
```

Completează în `.env` cheile Stripe de **test** (`STRIPE_SECRET_KEY`, din Dashboard → Developers → API keys). Apoi pornește serverul:

```bash
npm run dev
```

Site-ul rulează la `http://localhost:3000`. Deschide-l mereu prin server: fișierele din `src/pages/` sunt șabloane și conțin marcaje `{{...}}`. Serverul repornește singur când modifici ceva în `content/`, `src/` sau `server/`.

### Editarea catalogului

- **Local:** cu serverul pornit, deschide `http://localhost:3000/admin/` în Chrome sau Edge, apasă „Work with Local Repository” și selectează folderul proiectului. Modificările se scriu direct în `content/`, iar commit-ul îl faci tu cu git. (Firefox, Safari și browserul integrat din unele aplicații nu suportă selectarea folderului.)
- **Online:** pe site-ul publicat, `/admin/` → „Sign In Using Access Token”, cu un [token GitHub fine-grained](https://github.com/settings/personal-access-tokens) limitat la acest repo (permisiune *Contents: Read and write*). Fiecare salvare devine un commit pe `main`; site-ul se actualizează după build-ul Vercel (în jur de un minut).
- **Fără CMS:** fișierele din `content/` se pot edita și direct. Prețul este în bani (`479700` = 4.797 lei).

### Build pentru hosting static

```bash
npm run build     # generează dist/ (paginile randate + assets/ + admin/)
```

Vercel rulează automat această comandă (vezi `vercel.json`) și publică doar `dist/`. Adresele inexistente primesc `404.html` cu status 404.

### Testarea plății (Stripe test mode)

1. Într-un al doilea terminal, instalează [Stripe CLI](https://docs.stripe.com/stripe-cli) și rulează `stripe login`, apoi:
   ```bash
   stripe listen --events checkout.session.completed,checkout.session.expired --forward-to localhost:3000/api/webhook
   ```
2. Copiază secretul `whsec_...` afișat în `.env`, la `STRIPE_WEBHOOK_SECRET`, și repornește serverul.
3. Adaugă un produs în coș, mergi la finalizare și plătește cu cardul de test `4242 4242 4242 4242` (orice dată viitoare și orice CVC).

Fără webhook, plata trece la Stripe, dar comanda rămâne „pending" și pagina de confirmare nu o găsește.

### Teste și backup

```bash
npm test          # 58 de teste: coș, validare, securitate, webhook, catalog, șabloane, build
npm run backup    # copie comprimată (și criptată, dacă ai BACKUP_ENCRYPTION_KEY) a bazei de date
```

## Structura proiectului

```
content/          catalogul: products/*.json și accessories/*.json (editabile din CMS)
src/pages/        șabloanele paginilor (HTML cu marcaje {{...}})
src/admin/        panoul CMS: index.html și config.yml
assets/           CSS, JS, imagini, fonturi, video
server/           index.js (aplicația), catalog.js, render.js, products.js, routes/, db.js, email.js, validation.js
scripts/          build.js (site-ul static), backup/restore al bazei de date, sursa vizualizării 3D (product-viewer/)
test/             teste automate
docs/             capturi de ecran și documentație explicată pe înțeles (docs/documentatie/)
```

## Limite cunoscute

- **Nu este în producție.** Demo-ul de pe Vercel e doar front-end (rutele `/api/...` răspund 404 acolo). Pentru un deploy complet ar fi necesare un host pentru Node, un domeniu, SMTP real și programarea backup-ului.
- **Doar plată online prin Stripe.** Plata ramburs a fost scoasă intenționat.
- **CMS-ul acoperă doar catalogul** (prețuri, specificații, texte scurte). Comenzile, mesajele și recenziile se citesc direct din baza de date, iar moderarea recenziilor se face manual.
- **Textele editoriale rămân în HTML.** Dimensiunile apar și în titluri și descrieri („169 × 95 cm. Amprentă generoasă.”), de aceea sunt doar pentru citire în CMS. Culorile noi și produsele noi cer imagini și o pagină, deci se adaugă din cod.
- **Autentificarea în CMS se face cu token GitHub**, potrivit pentru un singur editor tehnic. Pentru o echipă ar fi nevoie de un server OAuth (Sveltia CMS Authenticator).
- **Comenzile abandonate** devin „expired" după ce expiră sesiunea Stripe (24 de ore), dar datele clientului rămân în baza de date. Nu există încă o curățare automată.
- **Nu are audit de accesibilitate** efectuat (Lighthouse/axe) și nici teste end-to-end în browser.
- Prețurile și produsele sunt fictive și nu corespund unei oferte reale.
- **Recenziile de pe paginile de produs sunt demonstrative** (text generat pentru portofoliu, definit în `assets/js/product-reviews.js`). Nu provin de la clienți reali. Formularul de recenzii funcționează și salvează recenziile noi spre moderare în baza de date.
