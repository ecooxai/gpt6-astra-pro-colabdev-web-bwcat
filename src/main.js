import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { buildCat } from './cat.js';
import './style.css';
import {fitCamera} from './framing.js';
const $=s=>document.querySelector(s), stage=$('#stage'),canvas=$('#scene');
const params=new URLSearchParams(location.search);let ready=false;
const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio,1.5),1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.00;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();let camera=new THREE.PerspectiveCamera(32,1,.1,100);camera.position.set(5.2,2.85,5.4);const perspective=camera,orthographic=new THREE.OrthographicCamera(-3,3,1.7,-1.7,.1,100);
const controls=new OrbitControls(camera,canvas);controls.target.set(0,1.30,-.32);controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=3.8;controls.maxDistance=12;controls.minZoom=.65;controls.maxZoom=3;controls.maxPolarAngle=Math.PI*.51;controls.minPolarAngle=.16;controls.enablePan=true;controls.autoRotateSpeed=.65;
const hemi=new THREE.HemisphereLight('#fff9ee','#aaa79f',.55);scene.add(hemi);
function light(color,power,position){const l=new THREE.DirectionalLight(color,power);l.position.set(...position);scene.add(l);return l;}
const key=light('#fff6e8',0,[-3.5,6,5]);key.castShadow=false;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=4;key.shadow.camera.bottom=-4;key.shadow.normalBias=.013;key.shadow.bias=-.00008;key.shadow.radius=4;
light('#edf0f3',.18,[4,3,1]);light('#ffffff',1.1,[0,5,-4]);
RectAreaLightUniformsLib.init();function softbox(color,power,width,height,position){const l=new THREE.RectAreaLight(color,power,width,height);l.position.set(...position);l.lookAt(0,1.3,0);scene.add(l);return l;}softbox('#fff9ef',6,4,4,[-3.2,4.5,5]);softbox('#eef1f7',1.8,3,3,[4,2,3]);scene.environmentIntensity=.60;
const envScene=new THREE.Scene();envScene.background=new THREE.Color('#bebdb7');const panelMat=new THREE.MeshBasicMaterial({color:'#ffffff'});
for(const [p,s]of[[[-3,4,3],[2.5,4,2]],[[4,2,2],[1.8,3,2]],[[0,5,-3],[4,1,2]]]){const m=new THREE.Mesh(new THREE.BoxGeometry(...s),panelMat);m.position.set(...p);envScene.add(m);}
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(envScene,.10).texture;pmrem.dispose();
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:0}));floor.rotation.x=-Math.PI/2;floor.position.y=.005;floor.receiveShadow=true;scene.add(floor);
// A hand-authored soft contact shadow, independent of any reference pixels.
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const sc=shadowCanvas.getContext('2d');const gradient=sc.createRadialGradient(64,64,2,64,64,63);gradient.addColorStop(0,'rgba(35,32,25,.23)');gradient.addColorStop(.52,'rgba(35,32,25,.09)');gradient.addColorStop(1,'rgba(35,32,25,0)');sc.fillStyle=gradient;sc.fillRect(0,0,128,128);
const sm=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false});const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1.9,3.1),sm);shadow.rotation.x=-Math.PI/2;shadow.position.set(0,.008,-.23);scene.add(shadow);
for(const s of[-1,1])for(const z of[.865+(s===-1?-.09:0),-.96+(s===-1?.07:-.035)]){const contact=new THREE.Mesh(new THREE.PlaneGeometry(.58,.71),sm.clone());contact.rotation.x=-Math.PI/2;contact.position.set(s*(z>0?.326:.376),.010,z);contact.material.opacity=.8;scene.add(contact);}

const views={three:[5.2,2.85,5.4],front:[0,1.88,8],left:[-8,1.88,-.32],right:[8,1.88,-.32],back:[0,1.88,-8]};let cat,mode='three',raf,anim=false,frames=0;
function resize(){
 const r=stage.getBoundingClientRect();if(r.width<=0||r.height<=0)return;renderer.setSize(r.width,r.height,false);
 if(cat?.bounds){const target=controls.target,baseDistance=new THREE.Vector3(...views[mode]).distanceTo(target);const fit=fitCamera(camera,cat.bounds,target,r.width,r.height,{baseDistance});controls.maxDistance=Math.max(12,fit.distance*1.25);}
 else{camera.aspect=r.width/r.height;camera.fov=r.width<600?44:30;camera.updateProjectionMatrix();}
 render();
}
function render(){controls.update();renderer.render(scene,camera);frames++;}
function tick(){if(anim){raf=requestAnimationFrame(tick);render();}}
function setView(v){if(!views[v])return;mode=v;camera=v==='three'?perspective:orthographic;controls.object=camera;camera.position.set(...views[v]);camera.zoom=1;controls.target.set(0,v==='three'?1.30:1.43,-.32);controls.update();resize();document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===v);b.setAttribute('aria-pressed',String(b.dataset.view===v));});$('#view-name').textContent=({three:'Three-quarter',front:'Front',left:'Left profile',right:'Right profile',back:'Back'})[v];}
let idleTicks=0;controls.addEventListener('change',()=>{if(!anim&&ready){idleTicks=12;}});controls.addEventListener('start',()=>{idleTicks=60;});function idle(){requestAnimationFrame(idle);if(idleTicks-->0&&!anim&&!params.has('test'))render();}idle();
new ResizeObserver(resize).observe(stage);
function save(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);}
async function exportGLB(download=true){const button=$('#export');button.disabled=true;const before=button.innerHTML;button.textContent='Preparing GLB…';try{const data=await new GLTFExporter().parseAsync(cat.root,{binary:true,onlyVisible:true,maxTextureSize:512});if(download)save(new Blob([data],{type:'model/gltf-binary'}),'GPT6-Astra-Pro_ColabDev_ThreeJS_BWCat.glb');return data;}finally{button.disabled=false;button.innerHTML=before;}}
function notify(message){$('#toast').textContent=message;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),2800);}
$('#snapshot').addEventListener('click',()=>{render();canvas.toBlob(b=>{if(b)save(b,'GPT6-Astra-Pro_ColabDev_Web_BWCat.png');});notify('A clean studio capture is ready.');});
$('#export').addEventListener('click',()=>exportGLB().catch(e=>notify(`Export failed: ${e.message}`)));
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
$('#rotate').addEventListener('click',()=>{anim=!anim;controls.autoRotate=anim;$('#rotate').classList.toggle('active',anim);$('#rotate').setAttribute('aria-pressed',String(anim));$('#rotate').innerHTML=anim?'Ⅱ <span>Pause turntable</span>':'↻ <span>Turntable</span>';if(anim)tick();else cancelAnimationFrame(raf);});
$('#fur').addEventListener('change',e=>{cat.furGroup.visible=e.target.checked;render();});
$('#wire').addEventListener('change',e=>{cat.root.traverse(o=>{if(o.isMesh&&o.parent!==cat.furGroup)o.material.wireframe=e.target.checked;});render();});
$('#reset').addEventListener('click',()=>setView('three'));
$('#fullscreen').addEventListener('click',()=>{if(document.fullscreenElement)document.exitFullscreen();else stage.requestFullscreen().catch(()=>notify('Fullscreen is unavailable in this browser.'));});
$('#light').addEventListener('input',e=>{renderer.toneMappingExposure=+e.target.value;render();});
$('#reference-toggle').addEventListener('click',()=>{$('#reference-dialog').showModal();});$('#close-ref').addEventListener('click',()=>$('#reference-dialog').close());$('#reference-dialog').addEventListener('click',e=>{if(e.target===$('#reference-dialog'))e.target.close();});
window.addEventListener('keydown',e=>{if(e.target.matches('input')||$('#reference-dialog').open)return;const v=({'1':'front','2':'left','3':'back','4':'right','0':'three'})[e.key];if(v)setView(v);});
let revision='';async function updateManifest(){try{const m=await fetch('./manifest.json?t='+Date.now(),{cache:'no-store'}).then(r=>r.json());if(m.revision===revision)return;revision=m.revision;$('#review-count').textContent=m.iterations;$('#score').textContent=m.score==null?'—':m.score;$('#quality-caption').textContent=m.note;$('#updated').textContent=m.updated||'In development';$('#absolute-path').textContent=m.projectPath;$('#iteration-count').textContent=`${m.iterations} completed reviews / 20,000 requested`;
 if(m.qa){$('#qa-status').textContent=`${m.qa.passed.toLocaleString()} / ${m.qa.cases.toLocaleString()} numerical framing configurations passed. These projection tests are separate from the visual-review count.`;}

 const turnaround=$('#turnaround-grid');turnaround.replaceChildren();const latest=m.reviews.find(r=>(r.captures||[]).filter(c=>['front','left','right','back'].includes(c.view)).length===4);if(latest){$('#turnaround-label').textContent=`Reviewed build ${String(latest.iteration).padStart(2,'0')}`;for(const view of['front','right','back','left']){const c=latest.captures.find(c=>c.view===view),fig=document.createElement('figure'),a=document.createElement('a'),image=document.createElement('img'),caption=document.createElement('figcaption'),code=document.createElement('code');a.href=c.image;a.target='_blank';image.src=c.image;image.alt=`${view} view of the original cat`;image.loading='lazy';a.append(image);caption.textContent=view.charAt(0).toUpperCase()+view.slice(1)+' · '+latest.iteration;code.textContent=c.path;fig.append(a,caption,code);turnaround.append(fig);}}
 const list=$('#reviews');list.replaceChildren();for(const r of m.reviews){const card=document.createElement('article');card.className='review';const a=document.createElement('a');a.href=r.image;a.target='_blank';const img=document.createElement('img');img.src=r.image+'?v='+revision;img.alt=r.title;img.loading='lazy';a.append(img);card.append(a);const h=document.createElement('h3');h.textContent=r.title;card.append(h);const score=document.createElement('span');score.className='review-score';score.textContent=`${r.score}/100 · visual review`;card.append(score);const p=document.createElement('p');p.textContent=r.note;card.append(p);const path=document.createElement('code');path.textContent=r.path;card.append(path);const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='All captures & validation files';details.append(summary);for(const c of r.captures||[]){const a=document.createElement('a'),code=document.createElement('code');a.href=c.image;a.target='_blank';a.textContent=c.view+' · PNG ↗';code.textContent=c.path;details.append(a,code);}if(r.testReport){const a=document.createElement('a'),code=document.createElement('code');a.href=r.testReport.file;a.target='_blank';a.textContent='Browser test report · JSON ↗';code.textContent=r.testReport.path;details.append(a,code);}card.append(details);list.append(card);}
 }catch(e){console.warn('Review feed temporarily unavailable',e.message);}}
updateManifest();setInterval(updateManifest,8000);
async function acquireCat(){
 if(!params.has('procedural')){
  try{
   const response=await fetch('./model-status.json',{cache:'no-cache'});if(!response.ok)throw new Error('Model manifest unavailable');const status=await response.json();
   if(status.ready){
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const assetURL=new URL(status.file,location.href);assetURL.searchParams.set('v',status.generatorSHA256.slice(0,16));const asset=await loader.loadAsync(assetURL.href,p=>{const caption=$('#loading small');if(caption&&p.total)caption.textContent=`Loading the original 3D model · ${Math.round(100*p.loaded/p.total)}%`;});
    const root=asset.scene;let furGroup=null,body=null,metadata=null;
    root.traverse(o=>{if(o.userData.role==='fur')furGroup=o;if(o.userData.role==='body')body=o;if(o.userData.metrics)metadata=o.userData;});
    if(!furGroup||!body||!metadata)throw new Error('Optimized model is missing its authored metadata');
    root.userData={...metadata};root.name='GPT-6 Astra Pro | ColabDev Web | Bicolor Fold Cat';
    root.traverse(o=>{if(o.isMesh){o.receiveShadow=true;if(o.material.alphaTest>0)o.material.alphaToCoverage=true;if(o.material.userData?.portableFiberBlend){o.material.alphaToCoverage=false;o.material.blending=THREE.NormalBlending;o.material.depthWrite=false;o.material.forceSinglePass=true;}o.castShadow=o.userData.role==='body'||o.name==='Folded ear cartilage';}});furGroup.traverse(o=>{if(o.isMesh)o.castShadow=false;});
    root.updateMatrixWorld(true);return {root,furGroup,body,metrics:metadata.metrics,loadingMethod:'precomputed-meshopt'};
   }
  }catch(error){console.warn('Optimized asset unavailable; constructing the original procedural model.',error.message);}
 }
 const result=buildCat({resolution:124,hairs:120000});result.loadingMethod='procedural';return result;
}
setTimeout(async()=>{
 try{const started=performance.now();cat=await acquireCat();const buildMs=performance.now()-started;scene.add(cat.root);cat.bounds=new THREE.Box3().setFromObject(cat.root);resize();setView(params.get('view')||'three');ready=true;const navigationToReadyMs=performance.now();$('#loading').hidden=true;$('#render-status').textContent='LIVE 3D';$('#geometry-stat').textContent=`${(cat.metrics.triangles/1000).toFixed(0)}k`;$('#strand-stat').textContent=((cat.metrics.tufts||cat.metrics.hairs)/1000).toFixed(0)+'k';
 window.__catStudio={ready:true,setView,render,exportGLB,cat,get camera(){return camera;},controls,renderer,scene,stats:()=>({triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,buildMs,initializationMs:buildMs,navigationToReadyMs,loadingMethod:cat.loadingMethod,bounds:{min:cat.bounds.min.toArray(),max:cat.bounds.max.toArray()},frames,view:mode,webgl:renderer.capabilities.isWebGL2?'WebGL2':'WebGL'})};
 }catch(e){console.error(e);$('#loading').innerHTML='<strong>Unable to start the 3D view.</strong><p>Please use a WebGL-enabled browser, then reload.</p>';$('#render-status').textContent='RENDER ERROR';window.__catError=e.message;}
},80);

let liveBuild=null;async function checkBuild(){try{const b=await fetch('./build-id.json?t='+Date.now(),{cache:'no-store'}).then(r=>r.json());if(!params.has('test')&&liveBuild&&b.id!==liveBuild&&!document.hidden&&!$('#export').disabled&&!$('#reference-dialog').open){location.reload();return;}liveBuild=b.id;}catch{}}checkBuild();setInterval(checkBuild,8000);
