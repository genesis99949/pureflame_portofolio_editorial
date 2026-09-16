# PureFlame — riscuri rămase și checklist de lansare

Document de lucru pentru trecerea site-ului în producție.
Stare cod la data redactării: securitate implementată și testată (32 teste automate trec, `npm audit` curat). Proiectul are acum și un repository git local (2 commit-uri), deocamdată fără remote (nu e pe GitHub/GitLab).

---

## PARTEA 1 — Riscuri rămase, ordonate după severitate

### CRITIC — blochează lansarea

**1. Verifică dacă hostingul clientului suportă Node.js**
Site-ul nu mai e doar HTML static: are nevoie de un proces Node.js care rulează permanent.
Hostingul clasic de tip cPanel/shared (doar PHP + fișiere) **nu poate rula acest backend**.
→ Întreabă furnizorul: "suportați aplicații Node.js (versiune ≥ 22) rulate permanent?"
→ Dacă răspunsul e nu: mutăm pe Render / Railway (au HTTPS automat, plan gratuit sau ~5-7 EUR/lună), păstrând domeniul actual.
**Acesta e primul lucru de clarificat — de el depind toți ceilalți pași de deploy.**

**2. Pagini legale obligatorii — ✅ create**
- **Termeni și condiții** — [`termeni.html`](termeni.html)
- **Politica de retur / dreptul de retragere în 14 zile** — [`politica-retur.html`](politica-retur.html)
- **Date de identificare firmă** adăugate în [`privacy.html`](privacy.html) (secțiunea 1)
- **Linkuri ANPC și SOL** adăugate în footerul tuturor paginilor

Rămâne de verificat/decis:
- Termenul de retur și cine plătește transportul retur au fost completate cu **minimul legal implicit** (14 zile, transport pe cumpărător) — nu au fost confirmate explicit de tine. Dacă vrei alte condiții (ex. transport retur gratuit, termen mai lung), spune-mi și actualizez `politica-retur.html`.
- Garanția a fost completată cu **minimul legal** (2 ani, garanție de conformitate, OUG 140/2021). Dacă oferi o garanție extinsă, actualizez `termeni.html`.
- Reg. Comerțului (J.../.../...) nu a fost furnizat — dacă îl ai, adaugă-l în `privacy.html` și `termeni.html` lângă CUI.
- Link-ul "Ghid de întreținere" din footer rămâne placeholder (`#`) — conținut real, nu e o cerință legală în sine.

**3. HTTPS obligatoriu în producție**
Se colectează nume, adresă, telefon, email + se procesează plăți. Fără HTTPS, datele circulă necriptat.
→ Render/Railway/Vercel îl activează automat. Pe hosting propriu: Let's Encrypt.
→ După activare, setează `BASE_URL=https://domeniu.ro` în `.env`.

---

### RIDICAT

**4. Chei Stripe live + webhook live**
Momentan totul e în mod test (bani fictivi).
→ Activează contul Stripe (KYC: date firmă, cont bancar, act identitate administrator) — durează 1-3 zile.
→ Înlocuiește `sk_test_...` cu `sk_live_...`
→ Creează webhook live în Stripe Dashboard către `https://domeniu.ro/api/webhook`, eveniment `checkout.session.completed`, și pune secretul în `STRIPE_WEBHOOK_SECRET`.
⚠️ Serverul refuză intenționat să pornească fără acest secret — protecție anti-fraudă, nu bug.

**5. SMTP real — ✅ configurat și testat (local)**
Cont Brevo (plan Free, 300 emailuri/zi), conectat în `.env`. Testat cu succes: email de confirmare comandă, notificare formular de contact, și confirmat că NU pleacă email dacă plata eșuează.
Rămâne de făcut până la lansare:
- `EMAIL_FROM` folosește temporar o adresă gmail verificată individual în Brevo — pentru trimitere de la `@pureflame.ro`, trebuie autentificat domeniul întreg (SPF/DKIM) în Brevo → Settings → Senders, Domains & Dedicated IPs → Domains.
- Aceleași variabile `SMTP_*` trebuie puse și în `.env`-ul de pe serverul de producție (nu doar local).

**6. Rotește cheia Stripe de test**
Cheia de test folosită în dezvoltare a trecut printr-o conversație de chat. Risc financiar zero (e cheie de test), dar e igienă corectă.
→ Stripe Dashboard → Developers → API keys → Roll key.

**7. Programează backupul**
Scriptul există și e testat (backup criptat + restaurare verificate), dar **rulează doar manual**.
→ Programează `npm run backup` zilnic (cron pe Linux / Task Scheduler pe Windows).
→ Setează `BACKUP_ENCRYPTION_KEY` (parolă lungă, aleatoare, păstrată separat de backup).
→ Copiază backupurile **în afara serverului** (alt disc / cloud storage privat).
→ Testează restaurarea o dată pe lună: `node scripts/restore-db.js <fisier> test.db`

---

### MEDIU

**8. Nu există panou de administrare**
Comenzile și mesajele se citesc doar deschizând direct fișierul SQLite (DB Browser for SQLite sau extensia din VS Code).
A fost o alegere deliberată de securitate: zero suprafață de atac expusă pe web.
→ Dacă vrei panou web, e funcționalitate nouă: necesită autentificare cu parolă hash-uită (Argon2id/bcrypt), sesiuni pe cookie HttpOnly, roluri, rate limiting, audit log. Spune-mi dacă îl construim.

**9. Baza de date SQLite e necriptată pe disc**
Cine are acces la server poate citi datele clienților.
→ Minim: permisiuni restrictive pe fișier + disc criptat pe server.
→ Ideal la volum mai mare: migrare la Postgres găzduit (Supabase/Neon — criptare în repaus inclusă, backup automat).

**10. Linkuri placeholder în footer**
`Garanție`, `Ghid de întreținere`, `Livrare` duc spre `#` (nicăieri). La fel Instagram și Pinterest.
→ Fie scriem conținutul paginilor, fie le scoatem până sunt gata. Linkuri moarte pe un site comercial arată neîngrijit și pot fi problematice (garanția și livrarea sunt informații pe care legea cere să fie disponibile).

---

### SCĂZUT

**11. CSRF fără token explicit**
Mitigat arhitectural: API-ul acceptă doar JSON și nu are CORS configurat, deci browserele blochează cererile cross-site. Devine relevant doar dacă adăugăm autentificare pe cookie-uri (ex. panou admin).

**12. Fără monitorizare / alerte**
Dacă serverul cade, nu află nimeni până nu observă un client.
→ UptimeRobot (gratuit) pe adresa site-ului + alertă pe email.

---

## PARTEA 2 — Checklist de lansare

### Newsletter (popup de captare emailuri)
- [ ] **Produs ghidul promis** („Cum alegi masa cu foc potrivită") — popup-ul îl promite pe email, deci promisiunea trebuie onorată
- [ ] Trimis ghidul abonaților acumulați între timp
- [ ] Adăugat linkul de descărcare în emailul de confirmare din `server/email.js`
- [ ] SMTP configurat — fără el emailul de dublă confirmare nu pleacă, iar abonații rămân blocați în `pending`
- [ ] Confirmat că trimiți campanii **doar** către abonații cu `status = 'confirmed'`

### Înainte de deploy
- [ ] Confirmat că hostingul rulează Node.js ≥ 22 (sau ales alternativă: Render / Railway)
- [ ] Cont Stripe activat și verificat (KYC complet, cont bancar atașat)
- [x] Furnizate datele firmei: denumire, CUI, sediu, email, telefon (Reg. Com. lipsește încă)
- [ ] Confirmate condițiile comerciale (momentan minim legal): termen retur 14 zile/transport pe cumpărător, garanție 2 ani — spune dacă vrei altceva
- [x] Create paginile: Termeni și condiții, Politica de retur, date firmă în Politica de confidențialitate, linkuri ANPC + SOL
- [ ] Rezolvate linkurile placeholder rămase din footer (Ghid de întreținere / Instagram / Pinterest) — Garanție și Livrare duc acum spre `termeni.html`
- [x] Cont SMTP creat (Brevo) — testat cu succes local, rămâne de pus și pe serverul de producție + de autentificat domeniul `pureflame.ro`
- [ ] Decis ce se întâmplă cu `embera-copy.html` — pagină experimentală (concept de layout cu panou lângă imagine), nu e linkuită din navigare, dar e servită public de server. Fie o exclude din `PUBLIC_PAGES` în `server/index.js` înainte de lansare, fie o promovezi ca înlocuitor pentru `embera.html` dacă decizi să mergi mai departe cu conceptul
- [ ] **Aștept răspuns de la client dacă vrea CMS** (editare conținut fără developer) — neimplementat încă, preț de stabilit după ce clarificăm ce anume trebuie să poată edita singuri (doar prețuri? tot textul? imagini?)

### Configurare `.env` pe server
- [ ] `STRIPE_SECRET_KEY` — cheia **live** (`sk_live_...`)
- [ ] `STRIPE_WEBHOOK_SECRET` — de la webhookul **live**
- [ ] `BASE_URL=https://domeniu.ro`
- [ ] `NODE_ENV=production`
- [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- [ ] `EMAIL_FROM`, `CONTACT_EMAIL`
- [ ] `BACKUP_ENCRYPTION_KEY` (parolă lungă, aleatoare)
- [ ] Verificat că `.env` **nu** e urcat în git (e deja în `.gitignore`)

### Verificare tehnică
- [ ] `npm test` — toate testele trec
- [ ] `npm audit` — 0 vulnerabilități
- [ ] HTTPS activ, redirect automat de la http
- [ ] Confirmat că nu sunt accesibile public: `/data/orders.db`, `/server/...`, `/package.json`, `/.env` (trebuie 404)
- [ ] Webhook Stripe live testat (Stripe Dashboard → Webhooks → Send test event)

### Test final cu bani reali
- [ ] O comandă reală de test, cu cardul propriu, sumă mică dacă se poate
- [ ] Verificat: comanda apare în baza de date cu status `paid`
- [ ] Verificat: emailul de confirmare **ajunge efectiv** în inbox (verifică și folderul Spam)
- [ ] Verificat: mesajul din formularul de contact ajunge la `CONTACT_EMAIL`
- [ ] Rambursat plata de test din Stripe Dashboard

### După lansare
- [ ] Backup automat programat și rulat cel puțin o dată cu succes
- [ ] Restaurare testată o dată (pe o copie, nu peste datele reale)
- [ ] Monitorizare uptime activată (UptimeRobot sau similar)
- [ ] Rotită cheia Stripe de test folosită în dezvoltare
- [ ] Testat pe telefon (comandă completă, de la buton la confirmare)
