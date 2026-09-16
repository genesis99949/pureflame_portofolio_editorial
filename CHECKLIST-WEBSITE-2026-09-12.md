# PureFlame — checklist de finalizare

Data: 12 septembrie 2026. Scop confirmat: website de portofoliu. Estimare relevantă: ~85% gata; aspect ~90%.

Bifele de mai jos indică rezultate verificate sau lucrări încă necesare. Elementele comerciale sunt în afara scopului actual și nu sunt necesare pentru finalizarea portofoliului. Interacțiunile pot avea rezultate simulate, iar datele illustrative pot rămâne cu contextul de concept clar în prezentare. Prioritățile P0–P2 exprimă ordinea lucrărilor, nu un calcul automat al procentului.


## Implementat — punctele 3–9 din checklist-ul scurt inițial (13 septembrie 2026)

- [x] 3. Desene: proporții în CSS compatibil cu CSP, vederi de sus vizibile și aceeași scară orizontală pentru vederea frontală, toate modelele.
- [x] 4. Conținut: dimensiuni Ignite corectate în Acasă/Colecție; finisaj Fera și forma Embera coerente; descriere Fera ajustată; zecimale RO/EN localizate.
- [x] 5. Recenzii: păstrate ca ilustrație pentru portofoliu, cu etichetă demo și fără titlul «Experiențe reale».
- [x] 6. Linkuri/newsletter: eliminate destinațiile placeholder din paginile publice; newsletter demonstrativ cu validare locală, fără POST și fără stocarea adresei.
- [x] 7. Mobil: postere 3D complete; sumar înaintea formularului; recenzii înaintea formularului de recenzie.
- [x] 8. Tabletă: eliminat overflow-ul Colecției; adăugată instrucțiune RO/EN de glisare.
- [x] 9. Componente comune: footer uniform și mai lizibil, context de portofoliu, link european actualizat; link de salt, H1 Acasă, controale meniu/închidere și placeholder-e localizate.

Validare: 48 combinații pagină/viewport (390, 768, 1440 px), zero depășiri ale lățimii și zero excepții JS; 40/40 teste de coș/backend; test RO/EN trecut. Newsletter verificat fără cereri POST și fără salvarea emailului. Capturi: design-review/portfolio-3-9-verification/.

Această implementare nu include integrarea plăților reale și nu certifică telefoane fizice/Safari. Elementele mai ample rămase nebifate (de exemplu toate mesajele backend în EN sau un audit WCAG complet) nu sunt declarate finalizate.

## Verificat în audit

- [x] Cele 15 pagini publice și pagina 404 parcurse la 1440, 768 și 390 px.
- [x] Capturi complete desktop și mobil inspectate.
- [x] Cele 25 de poziții din galeriile de produs încarcă resursa selectată.
- [x] Variantele Gri/Negru schimbă imaginea principală pentru Aether, Flavo și Fera.
- [x] Modelele 3D se încarcă pentru toate cele cinci produse în Chrome desktop.
- [x] Embera poate fi adăugată în coș, cu preț corect, și persistă între pagini.
- [x] Stările goale și populate ale coșului/checkout-ului sunt afișate.
- [x] Meniul mobil se deschide și se închide cu Escape; modalul contact și popup-ul newsletter se afișează.
- [x] Conținutul principal poate fi comutat în engleză pe toate paginile.
- [x] Ruta inexistentă răspunde HTTP 404.
- [x] Imaginile accesoriilor din coș se încarcă după derulare; nu sunt resurse lipsă.

## Prioritatea actuală — finisarea portofoliului

- [ ] Repararea desenelor de dimensiuni pentru toate modelele.
- [ ] Corectarea contradicțiilor Ignite/Fera și uniformizarea textelor.
- [ ] Finisarea mobilului și tabletei: postere 3D, comparații, sumar checkout.
- [ ] Butoane și linkuri cu rezultate coerente; checkout-ul poate încheia un flux simulat fără plată reală.
- [ ] Newsletterul poate avea o stare demo, fără a promite o livrare reală de email/ghid.
- [ ] Contextul de concept/portofoliu este clar; recenziile, echipa și locațiile illustrative nu necesită înlocuire cu date comerciale pentru acest scop.
- [ ] Verificare finală a animațiilor, galeriilor și navigării pe dispozitive reale.

## P1 — corecții vizuale și de conținut confirmate

- [x] **Toate cele cinci produse:** mutate rapoartele desenelor din stil inline în CSS permis de CSP; vederile de sus au înălțime nenulă și proporții corecte.
- [x] **Vederi frontale:** verificate rapoartele și înălțimile după corectarea CSP; aceeași logică de scară în cele două vederi.
- [x] **Ignite:** uniformizate dimensiunile și amprenta în Colecție, carduri, aria-label-uri și produs, pe baza fișei validate.
- [x] **Fera:** corectat „Finisaj negru mat” lângă imaginea gri, inclusiv textul accesibil.
- [x] **Embera:** clarificată eticheta „asimetrică” față de „dreptunghiulară”.
- [x] **Fera:** uniformizată descrierea joasă/înaltă și contextul ei.
- [x] **Recenzii:** marcate explicit ca demo pentru portofoliu sau înlocuite cu recenzii autentice pentru magazin.
- [ ] **Afirmații despre produse:** verificate poziția buteliei, capacul, materialul, montajul și utilizările descrise.
- [ ] **Recenzii API:** limite separate pentru GET și POST; navigarea normală între cinci modele plus o revenire nu produce 429.
- [x] **Întreținere:** creată destinație utilă pentru ghid sau eliminat linkul `#`.
- [x] **Social:** adrese reale Instagram/Pinterest sau eliminarea linkurilor fără destinație.
- [x] **Newsletter:** parcurs demonstrativ coerent; reformulată promisiunea de email/ghid dacă nu există livrare reală. Integrarea emailului nu este necesară pentru portofoliu.
- [ ] **Retur:** corectată trimiterea greșită de la secțiunea 1 la punctul 3 în loc de punctul 6, în RO și EN.
- [ ] **Termeni:** actualizată descrierea fluxului de comandă și a coșului cu modele multiple.
- [ ] **SOL/ODR:** actualizate referințele la platforma închisă în 2025.
- [ ] **Confidențialitate:** actualizată descrierea localStorage pentru limbă, coș și newsletter; numerotare coerentă.

## P1 — mobil, tabletă și accesibilitate

- [x] **Colecție la 768 px:** documentul nu depășește viewport-ul; rezolvat overflow-ul măsurat de 8 px.
- [x] **Comparație pe tabletă:** este evident că tabelul poate fi derulat; toate coloanele sunt accesibile.
- [x] **Poster 3D mobil:** obiectul întreg rămâne vizibil la Embera, Flavo, Fera și celelalte modele.
- [x] **Checkout mobil:** sumarul și totalul apar înaintea butonului „Continuă spre plată”.
- [x] **Recenzii mobile:** opiniile pot fi citite fără parcurgerea obligatorie a formularului mare; formular la cerere sau după listă.
- [ ] **Carusele:** indiciu consecvent de glisare pentru accesorii, dimensiuni și capitolele Despre noi.
- [ ] **Contrast:** măsurate și corectate textele tehnice, linkurile din footer și acțiunile mici.
- [ ] **Focus modal contact:** Tab/Shift+Tab, Escape, revenirea focusului și izolarea fundalului funcționează împreună cu meniul mobil.
- [ ] **EN complet:** traduse linkul de salt, H1-ul ascuns Acasă, aria-label-urile, placeholder-ele și mesajele de eroare dinamice.
- [ ] **Telefon real:** testate modalele cu tastatura virtuală deschisă și orientare landscape.

## P2 — retușuri de finisare

- [ ] **Acasă:** revizuit crop-ul hero pe telefon, cu masă/flacără mai ușor de identificat.
- [ ] **Acasă:** clarificată selecția 01/02/05 ca selecție de modele, dacă se păstrează numerotarea.
- [ ] **Imagini editoriale:** armonizate lumina și crop-ul fotografiilor documentare cu randările de studio, în special Embera.
- [ ] **Flavo și variante:** explicate imaginile de alt finisaj și verificate galeriile secundare după selectarea culorii.
- [ ] **3D:** clarificată independența modelului ilustrativ față de finisajul selectat sau sincronizată culoarea.
- [ ] **Tipografie RO:** diacritice în recenzii/demo, virgulă zecimală și unități scrise consecvent.
- [ ] **Terminologie:** paravan/parbriz, mască/compartiment, picioare detașabile/de schimb și denumirile cadrelor foto uniformizate.
- [x] **Footer:** aceeași selecție de destinații utile în toate familiile de pagini.
- [ ] **Despre noi:** confirmate persoanele, portretele, rolurile, orașele și promisiunile despre atelier; marcate ca illustrative dacă sunt demo.
- [ ] **Coș:** explicat când accesoriile sunt suplimentare sau de rezervă față de pachetul inclus.
- [ ] **Coș mobil:** compactată lista de accesorii, păstrând CTA-ul de finalizare ușor accesibil.
- [ ] **Checkout:** afișată culoarea/varianta în sumar.
- [ ] **Confirmare/newsletter:** adăugată acțiune directă de contact lângă „scrie-ne”.
- [ ] **Termeni mobil:** înlocuite URL-urile lungi afișate cu ancore scurte, fără fragmentarea neplăcută a listelor.
- [ ] **Video Acasă:** pregătit fișier mobil și măsurată încărcarea video-ului de 13,36 MiB; optimizare pe baza măsurătorilor.

## Verificarea finală a demo-ului

- [ ] Actualizat testul `product-journey-test.cjs` conform structurii aprobate sau corectată structura dacă testul exprimă cerința dorită.
- [ ] Testele UI pornesc propriile servere ori au o comandă separată cu precondiții documentate.
- [ ] `npm test` termină fără eșecuri; acum 41/44 trec.
- [ ] Testate animațiile fără reduced motion: hero, sticky header, scroll, galerie, secțiunea de fabricație.
- [ ] Testate zoom/reset/selectare/separare componente 3D și gesturi touch pe dispozitiv real.
- [ ] Verificate 360, 390, 768, 1024 și 1440 px, plus zoom browser 200% și navigare cu tastatura.
- [ ] Verificate Safari/iOS, Chrome/Android și Chrome/Edge desktop.
- [ ] Repetat parcursul integral după corecții și închis fiecare problemă pe baza unei dovezi.

## Supliment pentru lansare comercială — nevalidat în acest audit

- [ ] Identitate operator, contacte și condiții comerciale confirmate; revizuire juridică a paginilor.
- [ ] Hosting și versiune Node compatibile, HTTPS și domeniu configurate.
- [ ] Stripe și webhook configurate pentru mediul ales; Apple Pay/Google Pay validate pe dispozitive eligibile.
- [ ] Email de contact, confirmare comandă și newsletter primite efectiv în inbox în teste autorizate.
- [ ] Datele demo nu sunt prezentate drept recenzii, echipă sau locații reale.
- [ ] Backup, restaurare și monitorizare verificate pe infrastructura folosită.
- [ ] Metadate de lansare, indexare și preview social stabilite dacă site-ul devine public/comercial.

Raportul complet: `AUDIT-WEBSITE-2026-09-12.md`. Dovezi: `design-review/audit-2026-09-12/`.

## Opțional — integrare comercială viitoare; exclusă din finalizarea portofoliului

- [ ] **Integrare checkout:** backend-ul primește și procesează `items`; dispare eroarea „Produs necunoscut” pentru coșul valid.
- [ ] **Catalog de accesorii pe server:** toate accesoriile au ID, preț și reguli de compatibilitate validate pe server.
- [ ] **Totaluri:** serverul recalculează toate liniile; prețurile trimise din browser nu devin sursa totalului.
- [ ] **Comandă cu mai multe linii:** produse, variante, cantități și accesorii sunt salvate și apar corect în confirmare/email.
- [ ] **Transport:** o singură regulă în produs, coș, checkout și termeni; suma și momentul plății sunt clare înainte de confirmarea clientului.
- [ ] **Cod poștal:** aceeași regulă în formular și server — opțional sau obligatoriu.
- [ ] **Note suplimentare:** informațiile introduse sunt salvate și transmise operațional.
- [ ] **Ramburs:** eliminată promisiunea din paginile de produs cât timp metoda nu este disponibilă.
- [ ] **Test complet:** produs + accesoriu + variantă → checkout → plată test → webhook → confirmare cu total corect.
- [ ] **Stări de plată:** anulare, eșec, întârziere webhook, reîncărcare și trimitere dublă tratate corect.


