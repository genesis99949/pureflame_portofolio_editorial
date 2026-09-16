/* Lightweight loader: no WebGL or model download until the visitor asks for 3D.
   One viewer serves every product page; the section carries data-product-viewer
   with the slug, and the part ids match the pf_part tags written by
   design-review/_shared/export_web.py. */
(() => {
  const root = document.querySelector('[data-product-viewer]');
  if (!root) return;
  const PRODUCTS = {
    aether: {
      name: 'Aether', model: 'assets/products/aether/3d/aether-v2.glb', home: 'body',
      parts: [
        ['body', 'Corpul mesei', 'Table body', 'Formă circulară, din beton fin texturat. Diametru 83,5 cm și înălțime 37 cm până la blat.', 'A circular body in finely textured concrete. 83.5 cm in diameter and 37 cm high to the tabletop.'],
        ['burner', 'Arzător circular', 'Circular burner', 'Inel metalic continuu, cu orificii spre interior. Finisajul reproduce variațiile de culoare vizibile în fotografia arzătorului.', 'A continuous metal ring with inward-facing ports. Its finish recreates the colour variations visible in the burner reference photo.'],
        ['ignition', 'Aprindere', 'Ignition', 'Protecția metalică perforată este așezată lângă inel, deasupra ansamblului de aprindere.', 'The perforated metal shield sits beside the ring, above the ignition assembly.'],
        ['stones', 'Pietre vulcanice', 'Lava stones', 'Pietre mici, cu forme neregulate și nuanțe minerale, distribuite în interiorul și în jurul inelului.', 'Small, irregular stones in mineral tones, arranged inside and around the ring.'],
        ['bowl', 'Cuva metalică', 'Metal bowl', 'Cuva circulară este încastrată în blat și adăpostește patul de pietre și arzătorul.', 'The circular bowl is recessed into the tabletop and holds the stone bed and burner.'],
        ['glass', 'Sticlă curbată', 'Curved glass', 'Patru segmente curbate urmăresc conturul vetrei și lasă centrul mesei vizibil.', 'Four curved segments follow the hearth’s outline, keeping the centre of the table visible.'],
        ['hardware', 'Prinderi', 'Glass fittings', 'Cleme metalice, garnituri și șuruburi la îmbinările dintre segmentele de sticlă.', 'Metal clamps, gaskets and screws connect the curved glass segments.'],
        ['cover', 'Capac metalic', 'Metal cover', 'Capac circular detașabil, cu mâner arcuit, așezat peste sticlă. Îl poți afișa sau ascunde pentru a inspecta interiorul.', 'A removable circular cover with an arched handle, resting on the glass. Show or hide it to inspect the interior.'],
        ['controls', 'Comenzi', 'Controls', 'Panoul lateral încastrat grupează butonul de reglaj și aprinderea. Marcajele sunt simplificate în model.', 'The recessed side panel groups the control dial and ignition button. Markings are simplified in the model.'],
        ['handles', 'Mânere laterale', 'Side handles', 'Două decupaje opuse sunt integrate în corpul circular al mesei.', 'Two opposing openings are integrated into the circular table body.'],
        ['base', 'Bază retrasă', 'Inset base', 'Baza mai îngustă creează o linie de umbră sub corp. Este inclusă în înălțimea totală de 37 cm.', 'The narrower base creates a shadow line below the body. It is included in the overall 37 cm body height.'],
        ['badge', 'Emblema', 'Emblem', 'Un mic accent frontal deasupra comenzilor. Emblema este reprezentată schematic.', 'A small front detail above the controls. The emblem is represented schematically.']
      ]
    },
    embera: {
      name: 'Embera', model: 'assets/products/embera/3d/embera.glb', home: 'body',
      parts: [
        ['body', 'Corpul mesei', 'Table body', 'Bloc rectangular din metal texturat, în nuanță grafit. 169 × 95 cm, înălțime 44 cm până la blat.', 'A rectangular body in textured metal, in a graphite finish. 169 × 95 cm, 44 cm high to the tabletop.'],
        ['burner', 'Arzător circular', 'Circular burner', 'Inel metalic continuu, cu orificii spre interior. Este aceeași piesă ca pe Aether.', 'A continuous metal ring with inward-facing ports. It is the same part as on Aether.'],
        ['ignition', 'Aprindere', 'Ignition', 'Protecția metalică perforată este așezată lângă inel, deasupra ansamblului de aprindere. Aceeași piesă ca pe Aether.', 'The perforated metal shield sits beside the ring, above the ignition assembly. The same part as on Aether.'],
        ['stones', 'Pietre vulcanice', 'Lava stones', 'Pietre mici, cu forme neregulate și nuanțe minerale, distribuite în interiorul și în jurul inelului.', 'Small, irregular stones in mineral tones, arranged inside and around the ring.'],
        ['bowl', 'Cuva metalică', 'Metal bowl', 'Cuva din inox este încastrată în blat și adăpostește patul de pietre și arzătorul.', 'The stainless bowl is recessed into the tabletop and holds the stone bed and burner.'],
        ['glass', 'Paravan de sticlă', 'Glass guard', 'Patru panouri drepte din sticlă securizată, în jurul vetrei pătrate.', 'Four flat tempered panels enclose the square hearth.'],
        ['hardware', 'Prinderi', 'Glass fittings', 'Cleme metalice, garnituri și eticheta de avertizare la colțurile paravanului.', 'Metal clamps, gaskets and the warning label at the corners of the guard.'],
        ['cover', 'Capac metalic', 'Metal cover', 'Capac metalic detașabil, așezat peste paravanul de sticlă. Îl poți afișa sau ascunde pentru a inspecta interiorul.', 'A removable metal cover resting on the glass guard. Show or hide it to inspect the interior.'],
        ['controls', 'Comenzi', 'Controls', 'Panoul încastrat grupează butonul de reglaj și aprinderea. Aceeași nișă ca pe Aether.', 'The recessed panel groups the control dial and ignition button. The same recess as on Aether.'],
        ['handles', 'Mânere laterale', 'Side handles', 'Două decupaje ovale, centrate pe cele două laturi scurte ale mesei.', 'Two oval openings, centred on the two short ends of the table.'],
        ['base', 'Plintă retrasă', 'Inset plinth', 'Plinta mai îngustă creează o linie de umbră sub corp. Este inclusă în înălțimea de 44 cm.', 'The narrower plinth creates a shadow line below the body. It is included in the 44 cm height.'],
        ['badge', 'Emblema', 'Emblem', 'Un mic accent deasupra comenzilor. Emblema este reprezentată schematic.', 'A small detail above the controls. The emblem is represented schematically.']
      ]
    },
    flavo: {
      name: 'Flavo', model: 'assets/products/flavo/3d/flavo.glb', home: 'body',
      parts: [
        ['body', 'Corpul mesei', 'Table body', 'Bloc pătrat din metal texturat, în nuanță grafit. 96 × 96 cm, înălțime 38 cm până la blat.', 'A square body in textured metal, in a graphite finish. 96 × 96 cm, 38 cm high to the tabletop.'],
        ['burner', 'Arzător circular', 'Circular burner', 'Inel metalic continuu, cu orificii spre interior. Este aceeași piesă ca pe Aether.', 'A continuous metal ring with inward-facing ports. It is the same part as on Aether.'],
        ['ignition', 'Aprindere', 'Ignition', 'Protecția metalică perforată este așezată lângă inel, deasupra ansamblului de aprindere. Aceeași piesă ca pe Aether.', 'The perforated metal shield sits beside the ring, above the ignition assembly. The same part as on Aether.'],
        ['stones', 'Pietre vulcanice', 'Lava stones', 'Pietre mici, cu forme neregulate și nuanțe minerale, distribuite în interiorul și în jurul inelului.', 'Small, irregular stones in mineral tones, arranged inside and around the ring.'],
        ['bowl', 'Cuva metalică', 'Metal bowl', 'Cuva din inox este încastrată central în blat și adăpostește patul de pietre și arzătorul.', 'The stainless bowl is recessed into the centre of the tabletop and holds the stone bed and burner.'],
        ['glass', 'Paravan de sticlă', 'Glass guard', 'Patru panouri drepte din sticlă securizată, în jurul vetrei pătrate.', 'Four flat tempered panels enclose the square hearth.'],
        ['hardware', 'Prinderi', 'Glass fittings', 'Cleme metalice, garnituri și eticheta de avertizare la colțurile paravanului.', 'Metal clamps, gaskets and the warning label at the corners of the guard.'],
        ['cover', 'Capac metalic', 'Metal cover', 'Capac metalic detașabil, așezat peste paravanul de sticlă. Îl poți afișa sau ascunde pentru a inspecta interiorul.', 'A removable metal cover resting on the glass guard. Show or hide it to inspect the interior.'],
        ['controls', 'Comenzi', 'Controls', 'Panoul încastrat grupează butonul de reglaj și aprinderea. Aceeași nișă ca pe Aether.', 'The recessed panel groups the control dial and ignition button. The same recess as on Aether.'],
        ['handles', 'Mânere laterale', 'Side handles', 'Două decupaje ovale, câte unul în fiecare latură.', 'Two oval openings, one in each side.'],
        ['base', 'Plintă retrasă', 'Inset plinth', 'Plinta mai îngustă creează o linie de umbră sub corp. Este inclusă în înălțimea de 38 cm.', 'The narrower plinth creates a shadow line below the body. It is included in the 38 cm height.'],
        ['badge', 'Emblema', 'Emblem', 'Un mic accent deasupra comenzilor. Emblema este reprezentată schematic.', 'A small detail above the controls. The emblem is represented schematically.']
      ]
    },
    fera: {
      name: 'Fera', model: 'assets/products/fera/3d/fera.glb', home: 'body',
      parts: [
        ['body', 'Corpul mesei', 'Table body', 'Bloc rectangular din metal, cu suprafață texturată. 160 × 69 cm, înălțime 55 cm până la blat.', 'A rectangular body in metal with a textured surface. 160 × 69 cm, 55 cm high to the tabletop.'],
        ['burner', 'Arzător liniar', 'Linear burner', 'Tub drept din inox, așezat într-un canal lustruit pe toată lungimea jgheabului.', 'A straight stainless tube seated in a polished channel running the length of the trough.'],
        ['ignition', 'Aprindere', 'Ignition', 'Protecția metalică este așezată lângă tub, deasupra ansamblului de aprindere.', 'The metal shield sits beside the tube, above the ignition assembly.'],
        ['stones', 'Pietre vulcanice', 'Lava stones', 'Pietre mici, cu forme neregulate, distribuite de o parte și de alta a canalului central.', 'Small, irregular stones arranged on both sides of the central channel.'],
        ['bowl', 'Jgheabul metalic', 'Metal trough', 'Jgheabul din inox este încastrat în blat, pe toată lungimea mesei.', 'The stainless trough is recessed into the tabletop, running the length of the table.'],
        ['glass', 'Paravan de sticlă', 'Glass guard', 'Patru panouri drepte din sticlă securizată, în jurul jgheabului.', 'Four flat tempered panels enclose the trough.'],
        ['hardware', 'Prinderi', 'Glass fittings', 'Cleme metalice, garnituri și eticheta de avertizare la colțurile paravanului.', 'Metal clamps, gaskets and the warning label at the corners of the guard.'],
        ['cover', 'Capac metalic', 'Metal cover', 'Capac metalic detașabil, așezat peste paravanul de sticlă. Îl poți afișa sau ascunde pentru a inspecta interiorul.', 'A removable metal cover resting on the glass guard. Show or hide it to inspect the interior.'],
        ['controls', 'Comenzi', 'Controls', 'Panoul încastrat grupează butonul de reglaj și aprinderea. Aceeași nișă ca pe Aether.', 'The recessed panel groups the control dial and ignition button. The same recess as on Aether.'],
        ['handles', 'Mânere laterale', 'Side handles', 'Două decupaje ovale, câte unul în fiecare capăt scurt al mesei.', 'Two oval openings, one in each short end of the table.'],
        ['base', 'Plintă retrasă', 'Inset plinth', 'Plinta mai îngustă creează o linie de umbră sub corp. Este inclusă în înălțimea de 55 cm.', 'The narrower plinth creates a shadow line below the body. It is included in the 55 cm height.'],
        ['badge', 'Emblema', 'Emblem', 'Un mic accent deasupra comenzilor. Emblema este reprezentată schematic.', 'A small detail above the controls. The emblem is represented schematically.']
      ]
    },
    ignite: {
      name: 'Ignite', model: 'assets/products/ignite/3d/ignite.glb?v=20260911', home: 'body',
      parts: [
        ['body', 'Blat și structură', 'Top and frame', 'Blat și stâlpi din aluminiu vopsit în câmp electrostatic. 146 × 36 cm, înălțime 66 cm.', 'Top and corner posts in powder-coated aluminium. 146 × 36 cm, 66 cm high.'],
        ['burner', 'Arzător liniar', 'Linear burner', 'Tub drept din inox, între două reflectoare înclinate.', 'A straight stainless tube between two angled reflectors.'],
        ['stones', 'Pietre vulcanice', 'Lava stones', 'Pietre mici, cu forme neregulate, distribuite de o parte și de alta a tubului.', 'Small, irregular stones arranged on both sides of the tube.'],
        ['bowl', 'Caseta de ardere', 'Firebox', 'Caseta din inox este suspendată sub blat, pe toată lungimea deschiderii.', 'The stainless firebox hangs below the top, running the length of the opening.'],
        ['glass', 'Paravan de sticlă', 'Glass guard', 'Patru panouri drepte din sticlă securizată, în jurul jgheabului.', 'Four flat tempered panels enclose the trough.'],
        ['hardware', 'Prinderi', 'Glass fittings', 'Cleme metalice, garnituri și eticheta de avertizare la colțurile paravanului.', 'Metal clamps, gaskets and the warning label at the corners of the guard.'],
        ['cover', 'Capac metalic', 'Metal cover', 'Capac metalic detașabil, așezat peste paravanul de sticlă. Îl poți afișa sau ascunde pentru a inspecta interiorul.', 'A removable metal cover resting on the glass guard. Show or hide it to inspect the interior.'],
        ['louvres', 'Lamele', 'Louvres', 'Nouă lamele orizontale late pe fiecare față, separate prin rosturi înguste de ventilație.', 'Nine broad horizontal slats on each face, separated by narrow ventilation gaps.'],
        ['base', 'Picioare de reglaj', 'Levelling feet', 'Patru picioare la colțuri, incluse în înălțimea totală de 66 cm.', 'Four feet at the corners, included in the overall 66 cm height.'],
      ]
    }
  };
  const product = PRODUCTS[root.dataset.productViewer];
  if (!product) return;
  const parts = product.parts;
  const copy = {
    ro: {reset:'Vedere inițială',hint:'Trage pentru rotire · două degete pentru zoom · click pe o piesă',details:'Anatomia ' + product.name,cover:'Capac metalic',explode:'Separă componentele',load:'Explorează în 3D ↗',loading:'Se încarcă modelul…',ready:'Model încărcat. Selectează o piesă sau rotește masa.',error:'Modelul 3D nu s-a putut încărca. Poți încerca din nou; fotografia și detaliile rămân disponibile.',retry:'Încearcă din nou',local:'Vizualizarea 3D are nevoie de un server local. Pornește „npm run dev” și deschide http://localhost:3000/ — din file:// browserul blochează modelul.',canvas:'Model 3D ' + product.name + '. Săgeți: rotire; plus și minus: zoom; Home: vedere inițială. Selectează componentele din lista de detalii.',zoomIn:'Apropie',zoomOut:'Depărtează'},
    en: {reset:'Reset view',hint:'Drag to rotate · pinch to zoom · click a component',details:'The anatomy of ' + product.name,cover:'Metal cover',explode:'Separate components',load:'Explore in 3D ↗',loading:'Loading model…',ready:'Model loaded. Select a component or rotate the table.',error:'The 3D model could not load. Try again; the photo and details are still available.',retry:'Try again',local:'The 3D view needs a local server. Run “npm run dev” and open http://localhost:3000/ — from file:// the browser blocks the model.',canvas:product.name + ' 3D model. Arrows: rotate; plus and minus: zoom; Home: reset view. Select components from the detail list.',zoomIn:'Zoom in',zoomOut:'Zoom out'}
  };
  let lang = document.querySelector('.lang-btn.active')?.dataset.lang === 'en' ? 'en' : 'ro';
  let selected = product.home, viewer, busy = false, failed = false, status = '';
  const find = name => root.querySelector(`[data-viewer-${name}]`);
  const list = find('parts'), load = find('load');
  for (const [id] of parts) {
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.part = id; button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => { selected = id; viewer?.select(id); translate(); });
    list.append(button);
  }
  function translate() {
    root.lang = lang;
    root.querySelectorAll('[data-viewer-label]').forEach(el => { el.textContent = copy[lang][el.dataset.viewerLabel]; });
    for (const part of parts) {
      const button = list.querySelector(`[data-part="${part[0]}"]`);
      button.textContent = part[lang === 'ro' ? 1 : 2]; button.setAttribute('aria-pressed', String(selected === part[0]));
    }
    const index = parts.findIndex(p => p[0] === selected), part = parts[index];
    find('number').textContent = `${String(index + 1).padStart(2, '0')} / ${parts.length}`;
    find('title').textContent = part[lang === 'ro' ? 1 : 2];
    find('description').textContent = part[lang === 'ro' ? 3 : 4];
    load.textContent = copy[lang][busy ? 'loading' : failed ? 'retry' : 'load'];
    if (status) find('status').textContent = copy[lang][status];
    root.querySelector('[data-viewer-action="zoom-in"]').setAttribute('aria-label', copy[lang].zoomIn);
    root.querySelector('[data-viewer-action="zoom-out"]').setAttribute('aria-label', copy[lang].zoomOut);
    root.querySelector('.av-inspector').setAttribute('aria-label', copy[lang].details);
    root.querySelector('canvas')?.setAttribute('aria-label', copy[lang].canvas);
  }
  document.querySelectorAll('.lang-btn').forEach(button => button.addEventListener('click', () => {
    lang = button.dataset.lang === 'en' ? 'en' : 'ro'; translate();
  }));
  function showError(error) {
    console.warn('PureFlame 3D:', error);
    viewer?.dispose(); viewer = undefined; busy = false; failed = true; status = 'error';
    find('canvas').hidden = true; find('canvas').replaceChildren();
    find('poster').hidden = false; find('launch').hidden = false;
    find('tools').hidden = true; find('options').hidden = true;
    root.querySelector('.av-hint').hidden = true;
    load.disabled = false; root.removeAttribute('aria-busy'); translate();
  }
  load.addEventListener('click', async () => {
    if (busy || viewer) return;
    // Both the module import and the model fetch are CORS-blocked on file:// URLs,
    // so say what to do about it rather than reporting a generic failure.
    if (location.protocol === 'file:') { status = 'local'; translate(); return; }
    busy = true; failed = false; status = 'loading'; load.disabled = true; root.setAttribute('aria-busy', 'true'); translate();
    try {
      const {mount} = await import('./vendor/product-three-viewer.min.js?v=2');
      find('canvas').hidden = false;
      viewer = await mount(find('canvas'), {
        model: product.model,
        parts: parts.map(p => p[0]),
        home: product.home,
        helpId: root.querySelector('.av-hint').id,
        onSelect(id) { selected = id; translate(); },
        onCover(value) { root.querySelector('[data-viewer-action="cover"]').setAttribute('aria-pressed', String(value)); },
        onError: showError
      });
      busy = false; status = 'ready'; root.removeAttribute('aria-busy');
      find('poster').hidden = true; find('launch').hidden = true;
      find('tools').hidden = false; find('options').hidden = false; root.querySelector('.av-hint').hidden = false;
      translate(); viewer.select(selected, false); root.querySelector('canvas').focus({preventScroll:true});
    } catch (error) { showError(error); }
  });
  root.querySelectorAll('[data-viewer-action]').forEach(button => button.addEventListener('click', () => {
    if (!viewer) return;
    const action = button.dataset.viewerAction;
    if (action === 'cover' || action === 'explode') {
      const value = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(value)); viewer[action](value);
    } else if (action === 'reset') {
      viewer.reset(); selected = product.home;
      root.querySelector('[data-viewer-action="explode"]').setAttribute('aria-pressed','false'); translate();
    } else viewer.zoom(action === 'zoom-in' ? .8 : 1.25);
  }));
  window.addEventListener('pagehide', () => viewer?.pause());
  window.addEventListener('pageshow', () => viewer?.resume());
  translate();
})();
