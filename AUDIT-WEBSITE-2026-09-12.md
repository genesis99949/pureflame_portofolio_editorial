# PureFlame — audit complet și evaluarea stadiului

Data: 12 septembrie 2026. Versiune analizată: proiectul local „PF Copy - Git - Editorial Integration”.

## Actualizare implementare — 13 septembrie 2026

Punctele 3–9 din checklist-ul scurt inițial au fost implementate și verificate. Desenele, neconcordanțele principale, marcarea recenziilor demo, newsletterul local, posterele 3D mobile, poziția sumarului, overflow-ul Colecției și footerul/traducerile auxiliare au fost corectate. Detaliile și dovezile sunt în checklist. Constatările de mai jos descriu starea inițială a auditului, înaintea acestor corecții.

## Verdict — scop confirmat: portofoliu

**Aproximativ 85% gata ca website de portofoliu; aspectul și compoziția sunt la aproximativ 90%.** Scopul actual, reconfirmat de utilizator, este prezentarea în portofoliu. Evaluarea anterioară de 80% amesteca finisarea demo-ului cu pregătirea comercială și nu mai este verdictul relevant.

Restul de aproximativ 15% privește desenele de dimensiuni, consistența imaginilor și textelor, detaliile mobile, linkurile și interacțiunile demonstrative. Nu este necesară o refacere generală a designului.

Plățile reale, emailurile comerciale, catalogul serverului, webhook-urile și pregătirea juridică/operațională pentru vânzări sunt în afara scopului actual și nu scad procentul de portofoliu. Constatările tehnice de mai jos rămân documentate pentru o eventuală etapă comercială.

Un buton demonstrativ trebuie totuși să aibă un rezultat coerent: checkout-ul poate afișa o confirmare simulată, fără tranzacție reală. Nu este necesară integrarea comercială pentru a încheia demo-ul. Datele illustrative pot rămâne în proiect, cu contextul de concept/portofoliu clar în prezentare.

Procentele sunt estimări profesionale de finisare, nu măsurători exacte. Pentru scopul actual, criteriile sunt calitatea vizuală, responsive, coerența conținutului și funcționarea interacțiunilor prezentate.

## Ce am verificat efectiv

- Cele 15 pagini publice și răspunsul 404: Acasă, Colecție, Embera, Aether, Flavo, Fera, Ignite, Despre noi, Coș, Finalizare comandă, Confidențialitate, Termeni, Retur, Newsletter și Confirmare.
- Încărcare și parcurgere până la footer la 1440 × 900, 768 × 900 și 390 × 900: 48 de combinații pagină/viewport.
- Capturi integrale desktop și mobil, inspectate vizual; verificare suplimentară a comparației pe tabletă.
- Textele RO și comutarea EN pe toate paginile; stări dinamice de produs și coș.
- Toate cele 25 de poziții foto/diagramă rămase în galeriile celor cinci produse: resursele selectate s-au încărcat.
- Schimbarea imaginii principale Gri/Negru pentru Aether, Flavo și Fera.
- Încărcarea modelelor 3D pentru toate cele cinci produse.
- Adăugare în coș, persistență între pagini, coș gol/populat, checkout populat și trimiterea formularului cu date fictive.
- Deschidere/închidere meniu mobil, modal contact și popup newsletter.
- Codul relevant al formularelor, catalogului, rate limiting-ului și stilurilor.
- Comanda existentă `npm test`: **44 rezultate, 41 trecute, 3 eșuate**.

Auditul a folosit Chrome headless și backend local izolat, chei fictive și baze de date separate în folderul auditului. Nu s-au făcut plăți, comenzi comerciale sau trimiteri de email reale. Nu am schimbat paginile sau codul aplicației. Am adăugat doar scripturi, capturi și documentele auditului.

Limite: nu certific Safari/iPhone real, tastatura virtuală, toate gesturile 3D, toate combinațiile de accesorii sau infrastructura live. Capturile sistematice au folosit preferința de mișcare redusă; animațiile complete, sincronizarea video și performanța pe conexiune mobilă lentă rămân de verificat separat. Oferta internă și conceptul retras `embera-copy.html` nu sunt pagini publice ale site-ului și nu intră în scor.

## Probleme confirmate, în ordinea impactului

### 1. Checkout-ul online este blocat — relevant pentru o eventuală etapă comercială

Reproducere: Embera → Adaugă în coș → Finalizare comandă → completarea datelor valide → Continuă spre plată.

Rezultat: **HTTP 400, „Produs necunoscut.”** Formularul din `assets/js/finalize.js` trimite `items`, iar `server/routes/checkout.js` cere în continuare `productId` și `quantity`. Backend-ul verifică limita coșului, dar nu construiește plata din liniile coșului. Eșecul apare înainte de apelul Stripe, deci nu este cauzat de cheile fictive ale auditului.

Trebuie integrat întregul coș: produse, finisaje, accesorii, cantități, total calculat pe server, date salvate și confirmare. Catalogul serverului conține doar cele cinci mese, fără accesorii. Simplul adaos al unui `productId` în cerere nu rezolvă comenzile cu mai multe linii.

### 2. Vederile de sus sunt deformate pe toate paginile de produs — prioritate ridicată

În secțiunea „Două vederi · aceeași scară vizuală”, amprenta apare ca o linie. Măsurare în browser pe Embera: **lățime 257,875 px, înălțime 0 px, aspect-ratio `auto`**.

Cauza este confirmată prin cod și comportamentul CSP: rapoartele `--measure-top-ratio` și `--measure-front-ratio` sunt declarate inline în HTML, iar politica serverului blochează stilurile inline. Mutarea valorilor în CSS-ul permis trebuie urmată de verificarea ambelor vederi pentru fiecare produs. Nu se recomandă relaxarea globală a CSP pentru acest detaliu.

### 3. Dimensiuni și finisaje contradictorii — prioritate ridicată

- **Ignite:** Colecție afișează `146 × 66 × 36 cm`; pagina produsului afișează `146 × 36 × 66 cm`. Comparația din Colecție dă o amprentă `146 × 66 cm`, deși pagina produsului indică `146 × 36 cm`. Aceasta afectează alegerea după spațiu, nu doar forma textului.
- **Fera:** fotografia gri deschis este însoțită de „Finisaj negru mat”, inclusiv în eticheta accesibilă a cardului.
- **Embera:** Colecție spune „Asimetrică”, comparația din produs spune „Dreptunghiulară, joasă”. Trebuie clarificat dacă asimetria descrie vatra sau forma mesei.
- Formatarea zecimalelor alternează între `83.5` și `83,5`, respectiv `53.5` și `53,5`, în română.

### 4. Promisiunile de comandă nu corespund implementării

Paginile produselor promit ramburs, dar opțiunea este comentată și absentă din checkout. Codul păstrează o ramură POST `/api/order`, pentru care backend-ul răspunde 404; aceasta nu este un buton activ în interfața actuală.

Produsele spun că transportul se calculează la finalizarea comenzii. Coșul și checkout-ul spun că acesta se adaugă la confirmare și că suma va fi comunicată înainte de expediere. Trebuie stabilit un singur parcurs: calcul înainte de plată sau ofertă confirmată înainte de solicitarea plății.

Codul poștal apare opțional, dar validarea serverului îl cere cu șase cifre. Notele suplimentare sunt trimise de frontend, însă nu sunt utilizate în ruta actuală de checkout. Condițiile descriu comanda unui singur model, deși coșul permite modele diferite în limita a trei mese.

### 5. Recenzii demonstrative prezentate ca experiențe reale

`assets/js/product-reviews.js` conține explicit recenzii de demonstrație. Fiecare produs afișează șase recenzii și aproximativ 4,8 stele sub „Experiențe reale”. Pentru portofoliu, acestea trebuie marcate clar ca date demo; pentru magazin, înlocuite cu recenzii autentice.

Unele texte introduc și informații nesigure despre produs: compartiment interior pentru butelie, capac peste sticlă sau folosire pe balcon. Aceste afirmații trebuie confruntate cu documentația produsului, nu păstrate ca dovezi comerciale. Nu am validat autenticitatea numelor/fotografiilor echipei; acestea rămân de confirmat cu proprietarul.

### 6. Citirea recenziilor este limitată ca trimiterea lor

După cinci vizite pe paginile produselor, următoarele cereri GET `/api/reviews` au primit 429. Limita de cinci cereri/15 minute se aplică întregii rute. Frontend-ul ascunde eșecul și continuă să afișeze datele demo.

Separă limita pentru citire de cea pentru publicare. Navigarea normală între modele și reîncărcarea unei pagini nu ar trebui să împiedice afișarea recenziilor reale.

### 7. Linkuri și conținut de suport nefinalizate

Ghidul de întreținere și linkurile Instagram/Pinterest folosesc `#` pe mai multe pagini. Footerul diferă între familiile de pagini: unele afișează aceste destinații incomplete, altele le omit. Păstrează aceeași selecție de linkuri utile și finalizează sau elimină destinațiile fictive.

Popup-ul newsletter promite un ghid trimis prin email. Textul emailului precizează că ghidul va fi trimis „imediat ce este gata”; livrabilul promis nu este integrat. Promisiunea trebuie îndeplinită sau reformulată.

### 8. Responsive și lizibilitate

- La 390 px, niciuna dintre pagini nu a depășit lățimea documentului. Elementele ieșite lateral în carusele sunt în mare parte intenționate și nu au fost numărate automat ca defecte.
- La 768 px, Colecție are document de **776 px**, deci există un overflow real de 8 px. Tabelul comparativ necesită și o indicație mai vizibilă de derulare.
- Pe mobil, posterul 3D taie lateral unele modele, mai evident la Embera, Flavo și Fera. Prima imagine din această secțiune trebuie să arate obiectul complet.
- Paginile de produs ajung la aproximativ **9.400–9.700 px** la 390 px lățime. Formularul de recenzie apare înaintea recenziilor și ocupă mult spațiu; ar funcționa mai bine după opinii sau deschis la cerere.
- Sumarul checkout-ului apare **după butonul de plată pe mobil**. Totalul și transportul trebuie să fie vizibile înaintea acțiunii finale.
- Etichetele tehnice, instrucțiunile mici și linkurile din footer au contrast vizual slab în raport cu titlurile. Este necesară o măsurare de contrast și o ajustare a textelor importante; auditul nu reprezintă o certificare WCAG.

## Evaluare pagină cu pagină

| Pagină | Ce funcționează bine | Ce mai trebuie făcut |
|---|---|---|
| Acasă | Hero puternic, paletă caldă, selecție editorială, alternanță alb/negru, CTA final clar. | Hero-ul mobil decupează mare parte din contextul uman și masa; ajustare focalizare. Textul de deschidere folosește o voce condensată, diferită de serifurile restului paginii: poate rămâne, dar trebuie asumată. În secțiunea de modele apar 01, 02, 05: corect pentru selecție, dar ar merita indicat „modele selectate”. Video de hero local de 13,36 MiB cu preload auto: pregătit derivat mobil și măsurată încărcarea. Tradus H1-ul ascuns și linkul de salt în EN. |
| Colecție | Fotografiile de studio sunt coerente; toate cinci modelele sunt prezente; comparația devine carduri pe telefon; secțiunea pachet/accesorii are sens. | Corectat Ignite și Fera; uniformizat vocabularul formelor; overflow pe tabletă; acces mai evident la detalii/comparație. Se pot reduce moderat unele spații dintre carduri, păstrând asimetria editorială. |
| Embera | Imagine principală clară, 5 poziții valide în galerie, avantajul suprafeței libere este explicat, CTA și specificații prezente. | Reparat desenul; poster 3D integral pe mobil; fotografia de terasă are o lumină și o estetică mai documentară decât restul randărilor — armonizare de ton. Clarificat poziționarea buteliei în tot conținutul. Marcat/înlocuit recenziile demo. |
| Aether | Forma circulară și atmosfera sunt bine comunicate; cele 5 poziții se încarcă; schimbarea Gri/Negru schimbă imaginea principală. | Reparat cercul din vederea de sus; consecvență între diametru Ø83,5 și dimensiunile dreptunghiului de încadrare; păstrată explicația utilă despre butelia separată. Verificate fotografiile secundare și modelul 3D față de finisajul ales. |
| Flavo | Ierarhie clară, 4 poziții de galerie valide, selectarea finisajului funcționează. | Reparat desenul pătrat; fotografia editorială neagră coexistă cu varianta gri selectată — etichetată ca alt finisaj sau sincronizată; poster 3D complet. Poate beneficia de un detaliu suplimentar al materialului/arzătorului, dacă există o imagine reală utilă. |
| Fera | Proporția lungă este bine ilustrată, 6 poziții valide, atmosferă și imagine principală coerente. | Corectat „negru mat” în Colecție; reparată amprenta; armonizată descrierea „joasă” din poveste cu „înaltă” din comparație; posterul mobil nu trebuie să taie capetele. |
| Ignite | Imagine frontală puternică, ritm arhitectural distinct, 5 poziții valide, modelul 3D se încarcă. | Corectate dimensiunile în toate aparițiile; reparată vederea de sus; uniformizat „Blue hour”/„Ambient cald” în RO; verificată concordanța afirmațiilor despre butelie cu produsul ilustrat. |
| Despre noi | Poveste, atelier, materiale, oameni, locații și CTA într-o succesiune logică; portretele sunt coerente ca lumină și crop. | Confirmate persoanele, rolurile și locațiile. Brașov/Cluj au doar descrieri de vizitare la programare; dacă sunt locații reale, detalii suplimentare utile. Pe mobil, navigarea „Ideea/Materialele/Oamenii” este laterală și cere un indiciu clar de glisare. „Focul ca material” include metal/sticlă/piatră: rafinare editorială opțională. |
| Coș | Starea goală are imagine și CTA; starea populată are produs, cantitate, eliminare și total; suma Embera corespunde prețului; pe mobil sumarul este înaintea accesoriilor. | Integrare reală cu backend-ul; compatibilitate și necesitate explicite pentru accesorii deja incluse în pachet; limbaj unic pentru transport. Lista celor cinci accesorii este lungă pe mobil, poate fi compactată. Imaginile lazy s-au încărcat după derulare: nu sunt imagini lipsă. |
| Finalizare comandă | Compoziție desktop clară, metode de plată distincte, formular lizibil, stare goală corectă. | Blocaj API; cod poștal; note; total/transport; sumar înaintea butonului pe mobil; menționarea culorii în sumar; traduceri ale placeholderelor și erorilor. Validarea reală Apple Pay/Google Pay rămâne pentru mediul de plată corect configurat. |
| Confidențialitate | Textul este grupat și lizibil, există versiune EN. | Operatorul este descris generic, fără identificare concretă. Secțiunea localStorage menționează doar limba, deși există și coș și starea newsletterului. Numerotarea „5b” trebuie uniformizată. Nu se poate declara gata de lansare comercială pe baza prezenței paginii. |
| Termeni | Structură numerotată, linkuri către retur și alte informații. | Actualizat fluxul vechi de comandă, regula modelelor multiple, livrarea și identitatea operatorului. Lista cu URL-uri externe se fragmentează neplăcut pe mobil; ancore scurte și lizibile. Actualizat SOL/ODR. |
| Politica de retur | Paragrafe clare, costuri și model de solicitare descrise, EN disponibil. | Secțiunea 1 trimite la „excepțiile punctului 3”, dar excepțiile sunt la punctul 6; corectat în ambele limbi. Adăugată o destinație practică pentru solicitare și confirmate condițiile comerciale. Revizuire juridică înaintea utilizării reale, inclusiv formularea despre ambalaj și starea produsului. |
| Newsletter | Starea de link invalid este inteligibilă și permite întoarcerea la colecție; popup-ul încape în captura de 390 × 844. | Integrat ghidul promis; legătură directă de contact pentru „scrie-ne”; verificat fluxul real confirmare → email → descărcare. Test cu tastatură virtuală. |
| Confirmare | Lipsa identificatorului este tratată fără eroare JS; utilizatorul poate reveni la colecție. | Validat succesul real după remedierea checkout-ului; confirmarea trebuie să redea toate liniile comenzii. Stări pentru plată în așteptare/anulată și link de suport direct. |
| 404 | HTTP 404 corect, titlu clar, CTA către colecție, afișare bună pe telefon. | Retuș minim: uniformizarea headerului și traducerea etichetelor accesibile. Nu am găsit un blocaj vizual specific acestei pagini. |

## Observații generale despre imagini, tipografie și interacțiuni

Imaginile principale de studio au aceeași temperatură și un fundal potrivit brandului. Mixul de imagini lifestyle și randări tehnice este util, însă unele fotografii reale de galerie au altă lumină decât imaginile editoriale. Corecția recomandată este un set comun de reguli de crop, expunere și balans de alb, fără eliminarea detaliilor reale ale produselor.

Modelele 3D sunt vizibil mai simplificate decât fotografiile. Pagina le numește deja illustrative, lucru util. Retușurile suplimentare ale materialelor 3D sunt o îmbunătățire, nu un blocaj: prioritară este afișarea completă pe mobil și coerența cu varianta selectată.

Headerul și butoanele principale sunt recognoscibile. Footerul merită uniformizat între familiile de pagini. Textele de produs și accesorii trebuie să folosească aceeași terminologie: „paravan” versus „parbriz”, „picioare detașabile” versus „picioare de schimb”, „mască” versus „compartiment”.

Comutarea EN funcționează pentru conținutul principal. Rămân elemente în română: linkul de salt, H1-ul ascuns de pe Acasă, unele aria-label-uri, placeholderul codului poștal și erorile returnate de server. Recenziile demonstrative RO au multe cuvinte fără diacritice, diferite de restul paginii.

Meniul mobil s-a deschis și închis cu Escape. Modalul contact s-a deschis corect. Codul contactului nu implementează aceeași gestionare completă a focusului ca newsletterul; trebuie verificat Tab/Shift+Tab, izolarea fundalului și comportamentul după închiderea meniului. Nu am trimis formularul către un serviciu real.

## Informații publice de actualizat

Site-ul trimite încă la SOL/ODR ca serviciu activ. Comisia Europeană confirmă închiderea platformei la **20 iulie 2025**. Referințele trebuie actualizate în texte și footer: [sursa oficială](https://consumer-redress.ec.europa.eu/site-relocation_en).

Nu am efectuat o certificare juridică. Observațiile asupra politicilor disting nepotrivirile de conținut de validarea legală necesară pentru un magazin real.

## Teste și limite ale verificării automate

`npm test` a raportat 41/44 trecute. Cele trei eșecuri sunt:

1. `scripts/cart-ui-test.cjs`: presupune un server la portul 3188; conexiune refuzată.
2. `scripts/liquid-header-test.cjs`: presupune server la portul 3000; conexiune refuzată.
3. `scripts/product-journey-test.cjs`: așteaptă o ordine/structură de secțiuni diferită de cea actuală.

Aceste eșecuri nu sunt trei dovezi independente că interfața este stricată. Ele arată că verificarea standard a proiectului nu este reproductibilă în forma actuală. Separat, checkout-ul și dimensiunile au defecte reale reproduse. Nicio pagină nu a produs o excepție JS necapturată în scanarea de bază, dar acest lucru nu exclude erori HTTP gestionate sau stiluri blocate de CSP.

Nu am rulat o analiză de vulnerabilități sau un audit SEO complet. Configurația live, emailurile, backupurile și monitorizarea rămân nevalidate în această sesiune. Documentele vechi din proiect nu reprezintă dovada stării actuale.

## Ordinea recomandată

1. Repararea desenelor și finisarea responsive; pentru checkout este suficient un rezultat demonstrativ coerent, fără plată reală.
2. Eliminarea contradicțiilor de produs și uniformizarea imaginilor și textelor.
3. Curățarea conținutului demo, linkurilor și promisiunilor neîndeplinite.
4. Retușuri mobile: postere 3D, sumar checkout, comparație tabletă, recenzii și lizibilitate.
5. Validare finală pe dispozitive reale și, dacă este magazin, pe infrastructura de producție.

Checklist-ul de lucru este în `CHECKLIST-WEBSITE-2026-09-12.md`. Dovezile și capturile sunt în `design-review/audit-2026-09-12/`.


