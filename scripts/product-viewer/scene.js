import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

// Meter-scale glTF coordinates: X right, Y up, Z toward the front controls.
// Framing is derived from the model's own bounds rather than fixed numbers, so
// the same viewer serves a 0.8 m round table and a 1.7 m rectangular one.
const HOME_DIRECTION = new THREE.Vector3(.519, .322, .792).normalize();
const HOME_DISTANCE = 2.65;          // multiples of the bounding radius
// Where the camera sits for each family of parts, again as a direction.
const PART_VIEWS = {
  burner: [.25, .85, .45], stones: [.25, .85, .45], bowl: [.25, .85, .45],
  ignition: [.32, .70, .55], controls: [.15, .25, .95], badge: [.15, .25, .95],
  handles: [.90, .25, .35], base: [.55, .28, .78], cover: [.40, .62, .68],
  louvres: [.55, .30, .78]
};
const LIFT = {cover: .81, glass: .40, hardware: .40, bowl: .16, burner: .16, ignition: .16, stones: .16};

export async function mount(host, hooks) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
  host.append(renderer.domElement);
  const canvas = renderer.domElement; canvas.tabIndex=0; canvas.setAttribute('role','img');
  canvas.setAttribute('aria-describedby',hooks.helpId);
  const camera = new THREE.PerspectiveCamera(38,1,.01,60);
  const controls = new OrbitControls(camera,canvas);
  controls.enablePan=false; controls.enableDamping=false; controls.rotateSpeed=.7;
  controls.minPolarAngle=.045; controls.maxPolarAngle=Math.PI*.49;
  const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
  const environment = pmrem.fromScene(room,.04); scene.environment=environment.texture;
  scene.environmentIntensity=.45;
  room.dispose(); pmrem.dispose();
  // Exposure balanced against the flat material factors the models carry: a rig
  // bright enough to lift near-black albedos would flatten every finish.
  scene.add(new THREE.HemisphereLight(0xfff9ed,0x6b6254,.32));
  const key=new THREE.DirectionalLight(0xfff1dd,1.35);key.position.set(-2,3,3);scene.add(key);
  const fill=new THREE.DirectionalLight(0xdce9ff,.3);fill.position.set(2,1,-2);scene.add(fill);
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=256;shadowCanvas.height=256;
  const context=shadowCanvas.getContext('2d');
  const gradient=context.createRadialGradient(128,128,40,128,128,125);
  gradient.addColorStop(0,'rgba(32,25,16,.32)');gradient.addColorStop(1,'rgba(32,25,16,0)');
  context.fillStyle=gradient;context.fillRect(0,0,256,256);
  const shadowTexture=new THREE.CanvasTexture(shadowCanvas);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2; shadow.position.y=-.003;scene.add(shadow);
  let model, meshes=[], groups=new Map(), frame=0, stopped=false, disposed=false, visible=true;
  let moving=false, selected=hooks.home, coverVisible=false, exploded=false;
  let radius=1, height=1, homePosition=new THREE.Vector3(), homeTarget=new THREE.Vector3();
  const modelSize=new THREE.Vector3(1,1,1);
  let desiredPosition=new THREE.Vector3(), desiredTarget=new THREE.Vector3();
  const pointer=new THREE.Vector2(), raycaster=new THREE.Raycaster();
  const originalPositions=new Map(), liftTargets=new Map();
  function invalidate() {
    if (!frame && !disposed && !stopped && visible && !document.hidden) frame=requestAnimationFrame(draw);
  }
  function draw() {
    frame=0; if(disposed || stopped || !visible || document.hidden)return;
    let again=false;
    if(moving){
      const speed=reduced.matches?1:.16;
      camera.position.lerp(desiredPosition,speed); controls.target.lerp(desiredTarget,speed);
      moving=camera.position.distanceTo(desiredPosition)>radius*.0015 || controls.target.distanceTo(desiredTarget)>radius*.0015;
      controls.update();again=moving;
    }
    for(const [o,target] of liftTargets){
      o.position.y=THREE.MathUtils.lerp(o.position.y,target,reduced.matches?1:.18);
      if(Math.abs(o.position.y-target)>.0001)again=true;else o.position.y=target;
    }
    renderer.render(scene,camera);
    if(again)invalidate();
  }
  function go(position,target,animate=true){
    desiredPosition.copy(position);desiredTarget.copy(target);
    if(!animate || reduced.matches){camera.position.copy(position);controls.target.copy(target);controls.update();moving=false;}
    else moving=true;
    invalidate();
  }
  const resize=new ResizeObserver(()=>{
    const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();invalidate();
  });resize.observe(host);
  const intersection=new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;
    if(visible)invalidate();else{cancelAnimationFrame(frame);frame=0;}
  });intersection.observe(host);
  function onVisibility(){if(!document.hidden)invalidate();else{cancelAnimationFrame(frame);frame=0;}}
  document.addEventListener('visibilitychange',onVisibility);
  controls.addEventListener('change',invalidate);
  controls.addEventListener('start',()=>{moving=false;});
  function dispose(){
    if(disposed)return;disposed=true;cancelAnimationFrame(frame);resize.disconnect();intersection.disconnect();
    document.removeEventListener('visibilitychange',onVisibility);controls.dispose();
    scene.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])m.dispose();});
    shadowTexture.dispose();environment.dispose();renderer.dispose();canvas.remove();
  }
  try {
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),45000);
    let data;
    try{
      const response=await fetch(hooks.model,{signal:controller.signal});
      if(!response.ok)throw new Error(`Model HTTP ${response.status}`);
      data=await response.arrayBuffer();
    }finally{clearTimeout(timeout);}
    const gltf=await new GLTFLoader().parseAsync(data,'');model=gltf.scene;scene.add(model);
    model.traverse(o=>{
      if(!o.isMesh)return;
      let parent=o,part;
      while(parent&&!part){part=parent.userData.pf_part;parent=parent.parent;}
      if(!part)return;
      o.userData.part=part;meshes.push(o);
      if(!groups.has(part))groups.set(part,[]);groups.get(part).push(o);
      originalPositions.set(o,o.position.y);liftTargets.set(o,o.position.y);
      const materials=Array.isArray(o.material)?o.material:[o.material];
      const clones=materials.map(m=>{
        const c=m.clone();c.userData.baseEmissive=c.emissive?.clone();
        if(part==='glass'){c.transparent=true;c.opacity=.18;c.depthWrite=false;c.side=THREE.DoubleSide;c.roughness=.08;}
        return c;
      });o.material=Array.isArray(o.material)?clones:clones[0];
      if(part==='cover')o.visible=false;
    });
    if(hooks.parts.some(id=>!groups.has(id)))throw new Error('Model is missing component metadata');
    // Everything below scales with the object, so one viewer fits every product.
    const bounds=new THREE.Box3().setFromObject(model);
    const size=bounds.getSize(new THREE.Vector3());modelSize.copy(size);
    const centre=bounds.getCenter(new THREE.Vector3());
    radius=size.length()/2; height=size.y;
    shadow.scale.setScalar(Math.max(size.x,size.z)*1.32);
    shadow.position.set(centre.x,-.003,centre.z);
    controls.minDistance=radius*.40; controls.maxDistance=radius*4.1;
    homeTarget.set(centre.x,bounds.min.y+height*.45,centre.z);
    homePosition.copy(homeTarget).addScaledVector(HOME_DIRECTION,radius*HOME_DISTANCE);
    camera.far=radius*40; camera.near=radius*.01; camera.updateProjectionMatrix();
    camera.position.copy(homePosition);controls.target.copy(homeTarget);controls.update();
  } catch(error){dispose();throw error;}
  function highlight(id){
    for(const o of meshes){
      for(const m of Array.isArray(o.material)?o.material:[o.material]){
        if(!m.emissive)continue;
        m.emissive.copy(m.userData.baseEmissive || new THREE.Color(0));
        if(o.userData.part===id && id!==hooks.home)m.emissive.setRGB(.12,.065,.009);
      }
    }
  }
  function cover(value){
    coverVisible=value;
    for(const o of groups.get('cover')||[])o.visible=value;
    hooks.onCover(value);invalidate();
  }
  function explode(value){
    exploded=value;
    for(const o of meshes){
      const lift=(LIFT[o.userData.part]||0)*height;
      liftTargets.set(o,originalPositions.get(o)+(value?lift:0));
    }
    if(value)go(homeTarget.clone().addScaledVector(HOME_DIRECTION,radius*HOME_DISTANCE*1.16)
                 .setY(homeTarget.y+height*.55),
               homeTarget.clone().setY(homeTarget.y+height*.30));
    else go(homePosition,homeTarget);
    invalidate();
  }
  function select(id,focus=true){
    if(!groups.has(id))return;selected=id;highlight(id);
    if(['burner','ignition','stones','bowl'].includes(id))cover(false);
    if(id==='cover')cover(true);
    if(focus){
      const bounds=new THREE.Box3();
      for(const o of groups.get(id))bounds.expandByObject(o);
      const target=bounds.getCenter(new THREE.Vector3());
      const extent=bounds.getSize(new THREE.Vector3()).length()/2;
      const view=PART_VIEWS[id];
      const direction=view?new THREE.Vector3(...view).normalize():HOME_DIRECTION;
      const distance=THREE.MathUtils.clamp(Math.max(extent,radius*.16)*3.0,
                                           controls.minDistance,controls.maxDistance);
      go(target.clone().addScaledVector(direction,distance),target);
    }
    hooks.onSelect(id);invalidate();
  }
  let down=null,dragged=false;
  canvas.addEventListener('pointerdown',event=>{down={x:event.clientX,y:event.clientY,id:event.pointerId};dragged=false;});
  canvas.addEventListener('pointermove',event=>{
    if(down&&Math.hypot(event.clientX-down.x,event.clientY-down.y)>6)dragged=true;
  });
  canvas.addEventListener('pointercancel',()=>{down=null;});
  canvas.addEventListener('pointerup',event=>{
    if(!down||down.id!==event.pointerId||dragged||Math.hypot(event.clientX-down.x,event.clientY-down.y)>6){down=null;return;}down=null;
    const rect=canvas.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObjects(meshes.filter(o=>o.visible),false);
    // Transparent glass does not block access to the burner beneath it.
    const hit=hits.find(h=>h.object.userData.part!=='glass')||hits[0];
    if(hit)select(hit.object.userData.part);
  });
  function zoom(factor){
    moving=false;const offset=camera.position.clone().sub(controls.target);
    offset.setLength(THREE.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance));
    camera.position.copy(controls.target).add(offset);controls.update();invalidate();
  }
  function reset(){explode(false);cover(false);select(hooks.home,false);go(homePosition,homeTarget);}
  canvas.addEventListener('keydown',event=>{
    if(event.key==='Home'){event.preventDefault();reset();return;}
    if(['+','=','-','_'].includes(event.key)){event.preventDefault();zoom(event.key==='-'||event.key==='_'?1.15:.87);return;}
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
    event.preventDefault();moving=false;
    const spherical=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    spherical.theta+=(event.key==='ArrowLeft'?.12:event.key==='ArrowRight'?-.12:0);
    spherical.phi=THREE.MathUtils.clamp(spherical.phi+(event.key==='ArrowUp'?-.10:event.key==='ArrowDown'?.10:0),controls.minPolarAngle,controls.maxPolarAngle);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));controls.update();invalidate();
  });
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();hooks.onError(new Error('WebGL context lost'));});
  // A compact read-only diagnostics hook supports regression checks without coupling UI to renderer internals.
  host.aetherDiagnostics=()=>({parts:[...groups.keys()],triangles:renderer.info.render.triangles,calls:renderer.info.render.calls,selected,coverVisible,exploded,moving,radius,size:[modelSize.x,modelSize.y,modelSize.z],home:homePosition.toArray(),desired:desiredPosition.toArray(),camera:camera.position.toArray(),target:controls.target.toArray()});
  invalidate();
  return {select,cover,explode,reset,zoom,dispose,pause(){stopped=true;cancelAnimationFrame(frame);frame=0;},resume(){stopped=false;invalidate();}};
}
