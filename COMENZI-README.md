# Comenzi + plăți (Stripe Checkout) — ghid de pornire

## Ce s-a adăugat
- Buton **Cumpără** pe fiecare din cele 5 pagini de produs, cu preț, selecție culoare (Gri/Negru) și cantitate (1-3 din același model).
- Formular de comandă (prenume, nume, email, telefon, adresă/număr/cod poștal) — fără cont.
- Link "Contactează echipa noastră" pentru comenzi cu modele diferite sau cantități peste 3 bucăți.
- Bază de date locală SQLite (`data/orders.db`, creată automat) — fiecare comandă e salvată, indiferent dacă plata reușește.
- Stripe Checkout pentru plată (cantitatea aleasă e trimisă ca `quantity` pe line item, Stripe calculează totalul).
- Pagină de confirmare (`confirmare.html`) + email automat de confirmare (afișat în consolă dacă nu ai configurat încă un SMTP real).

Limita de cantitate (implicit 3) e definită în [`server/routes/checkout.js`](server/routes/checkout.js) (`MAX_QUANTITY`) și trebuie schimbată și în [`assets/order.js`](assets/order.js) (`MAX_QTY`) dacă o modifici.

## Newsletter (popup de captare emailuri)

Popup pe homepage și pe cele 5 pagini de produs, care oferă **ghidul „Cum alegi masa cu foc potrivită"** în schimbul adresei de email. Apare prin exit-intent pe desktop, iar pe mobil după 30 de secunde sau la 50% scroll. Se afișează o singură dată; respingerea e ținută minte 30 de zile, înscrierea permanent. Nu apare peste formularul de comandă sau de contact, și nici pe pagina de confirmare a comenzii.

Abonații sunt salvați în tabela `subscribers`, cu **dovada consimțământului** cerută de GDPR art. 7: textul exact acceptat (în limba afișată), momentul și adresa IP. Funcționează pe **dublă confirmare** — abonatul rămâne `pending` până accesează linkul din email și abia apoi devine `confirmed`. **Trimite emailuri de marketing doar către abonații cu status `confirmed`.**

### ⚠️ Ghidul promis nu există încă

Textul popup-ului este formulat deliberat ca o promisiune de livrare pe email („îți trimitem ghidul imediat ce e gata"), **nu** ca o descărcare instantanee — butonul nu descarcă nimic. Asta e onest față de vizitatori atât timp cât materialul e în lucru, dar promisiunea trebuie onorată:

1. Produ ghidul (PDF): dimensiuni raportate la spațiu, consum și tip de gaz, siguranță, întreținere, greșeli frecvente.
2. Trimite-l abonaților cu `status = 'confirmed'` acumulați până atunci.
3. După aceea, include linkul de descărcare direct în emailul de confirmare din [`server/email.js`](server/email.js).

Cu cât distanța dintre înscriere și livrarea ghidului e mai mare, cu atât riști mai mult ca oamenii să uite cine ești. Dacă întârzie, ia în calcul dezactivarea temporară a popup-ului (scoate `<script src="assets/newsletter.js">` din pagini).

### Cum văd abonații

Tabela `subscribers` din `data/orders.db`. Pentru export către un serviciu de newsletter (Brevo, Mailchimp), exportă **doar** rândurile cu `status = 'confirmed'`.

## 1. Instalare
```bash
npm install
```

## 2. Configurare `.env`
Copiază `.env.example` în `.env` și completează:

```bash
cp .env.example .env
```

- **STRIPE_SECRET_KEY** — din [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys), în modul **Test mode** (cheia începe cu `sk_test_`).
- **STRIPE_WEBHOOK_SECRET** — vezi pasul 4 mai jos.
- **SMTP_*** — opțional. Dacă le lași goale, emailurile de confirmare sunt doar afișate în consolă, nu trimise. Testat și funcțional cu [Brevo](https://www.brevo.com) (plan Free, 300 emailuri/zi) — vezi `SMTP_HOST=smtp-relay.brevo.com` în exemplul de mai jos. Alternative: [Resend](https://resend.com) sau un Gmail cu "parolă de aplicație".

```
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=<login-ul contului tău Brevo>
SMTP_PASS=<cheia SMTP generată în Brevo — Settings → SMTP & API>
EMAIL_FROM=PureFlame <adresa-verificată-în-Brevo>
CONTACT_EMAIL=<unde vrei să ajungă mesajele din formularul de contact>
```

⚠️ Brevo (și majoritatea furnizorilor) refuză să trimită de la o adresă `@pureflame.ro` până nu autentifici tot domeniul (SPF/DKIM, în Brevo → Settings → Senders, Domains & Dedicated IPs → Domains). Până atunci, `EMAIL_FROM` trebuie să fie o adresă verificată individual (ex. un Gmail al tău).

## 3. Pornire server local
```bash
npm run dev
```
Site-ul complet (pagini + API) rulează pe **http://localhost:3000**.

## 4. Ascultarea webhook-urilor Stripe (obligatoriu pentru ca o comandă să treacă din "pending" în "plătită" și pentru trimiterea emailului)
Stripe CLI e deja descărcat în `tools/stripe-cli/stripe.exe` (nu necesită instalare/admin). Într-un terminal separat, cât timp testezi:
```bash
tools/stripe-cli/stripe.exe listen --api-key sk_test_CHEIA_TA --forward-to localhost:3000/api/webhook
```
Comanda afișează un `whsec_...` — copiază-l în `.env` la `STRIPE_WEBHOOK_SECRET` (dacă nu e deja acolo) și repornește serverul. **Acest terminal trebuie să rămână deschis** cât timp testezi comenzi — el retransmite evenimentele Stripe către serverul tău local.

## 5. Testare plată
Pe orice pagină de produs, apasă **Cumpără**, completează formularul, apoi la Stripe Checkout folosește un card de test:
- Card: `4242 4242 4242 4242`, orice dată viitoare, orice CVC.

După plată ești redirecționat pe `confirmare.html` cu detaliile comenzii.

## Prețuri
Editabile într-un singur loc: [`server/products.js`](server/products.js).

## Cum văd comenzile primite?
Toate comenzile (inclusiv cele neplătite/abandonate) sunt în `data/orders.db` (SQLite). Poți deschide fișierul cu orice client SQLite (ex. extensia "SQLite Viewer" din VS Code, sau [DB Browser for SQLite](https://sqlitebrowser.org/)) și te uiți în tabela `orders`.

## Trecerea în producție (când mutăm pe hostingul real)
1. Înlocuiește cheile Stripe de test cu cele **live** (`sk_live_...`) în `.env` de pe server.
2. Configurează un webhook live în Stripe Dashboard către `https://domeniultau.ro/api/webhook` și pune secretul generat acolo.
3. Configurează un SMTP real (SMTP_*) pentru emailuri.
4. Setează `BASE_URL=https://domeniultau.ro` în `.env`.
