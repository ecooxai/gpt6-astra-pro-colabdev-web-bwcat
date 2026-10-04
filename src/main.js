import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { buildCat } from './cat.js';
import './style.css';
const $=s=>document.querySelector(s), stage=$('#stage'),canvas=$('#scene');
const params=new URLSearchParams(location.search);let ready=false;
const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.00;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(32,1,.1,100);camera.position.set(5.2,2.85,5.4);
const controls=new OrbitControls(camera,canvas);controls.target.set(0,1.30,-.32);controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=3.8;controls.maxDistance=12;controls.maxPolarAngle=Math.PI*.51;controls.minPolarAngle=.16;controls.enablePan=true;controls.autoRotateSpeed=.65;
const hemi=new THREE.HemisphereLight('#fff9ee','#aaa79f',1.02);scene.add(hemi);
function light(color,power,position){const l=new THREE.DirectionalLight(color,power);l.position.set(...position);scene.add(l);return l;}
const key=light('#fff6e8',2.6,[-3.5,6,5]);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=4;key.shadow.camera.bottom=-4;key.shadow.normalBias=.013;key.shadow.bias=-.00008;key.shadow.radius=4;
light('#edf0f3',.55,[4,3,1]);light('#ffffff',1.7,[0,5,-4]);
const envScene=new THREE.Scene();envScene.background=new THREE.Color('#bebdb7');const panelMat=new THREE.MeshBasicMaterial({color:'#ffffff'});
for(const [p,s]of[[[-3,4,3],[2.5,4,2]],[[4,2,2],[1.8,3,2]],[[0,5,-3],[4,1,2]]]){const m=new THREE.Mesh(new THREE.BoxGeometry(...s),panelMat);m.position.set(...p);envScene.add(m);}
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(envScene,.10).texture;pmrem.dispose();
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:0}));floor.rotation.x=-Math.PI/2;floor.position.y=.005;floor.receiveShadow=true;scene.add(floor);
// A hand-authored soft contact shadow, independent of any reference pixels.
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const sc=shadowCanvas.getContext('2d');const gradient=sc.createRadialGradient(64,64,2,64,64,63);gradient.addColorStop(0,'rgba(35,32,25,.23)');gradient.addColorStop(.52,'rgba(35,32,25,.09)');gradient.addColorStop(1,'rgba(35,32,25,0)');sc.fillStyle=gradient;sc.fillRect(0,0,128,128);
const sm=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false});const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1.9,3.1),sm);shadow.rotation.x=-Math.PI/2;shadow.position.set(0,.008,-.23);scene.add(shadow);
for(const s of[-1,1])for(const z of[.905,-1.049+(s===-1?.07:-.035)]){const contact=new THREE.Mesh(new THREE.PlaneGeometry(.58,.71),sm.clone());contact.rotation.x=-Math.PI/2;contact.position.set(s*(z>0?.326:.376),.010,z);contact.material.opacity=.8;scene.add(contact);}

const views={three:[5.2,2.85,5.4],front:[0,2.02,7.8],left:[-7.2,2.15,-.15],right:[7.2,2.15,-.15],back:[0,2.1,-8]};let cat,mode='three',raf,anim=false,frames=0;
function resize(){const r=stage.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.fov=r.width<600?44:32;camera.updateProjectionMatrix();render();}
function render(){controls.update();renderer.render(scene,camera);frames++;}
function tick(){if(anim){raf=requestAnimationFrame(tick);render();}}
function setView(v){if(!views[v])return;mode=v;camera.position.set(...views[v]);controls.target.set(0,1.3,-.32);controls.update();render();document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===v);b.setAttribute('aria-pressed',String(b.dataset.view===v));});$('#view-name').textContent=({three:'Three-quarter',front:'Front',left:'Left profile',right:'Right profile',back:'Back'})[v];}
let idleTicks=0;controls.addEventListener('change',()=>{if(!anim&&ready){renderer.render(scene,camera);idleTicks=12;}});controls.addEventListener('start',()=>{idleTicks=60;});function idle(){requestAnimationFrame(idle);if(idleTicks-->0&&!anim)render();}idle();
new ResizeObserver(resize).observe(stage);
function save(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);}
async function exportGLB(download=true){const button=$('#export');button.disabled=true;const before=button.textContent;button.textContent='Preparing GLB…';try{const data=await new GLTFExporter().parseAsync(cat.root,{binary:true,onlyVisible:true,maxTextureSize:512});if(download)save(new Blob([data],{type:'model/gltf-binary'}),'GPT6-Astra-Pro_ColabDev_ThreeJS_BWCat.glb');return data;}finally{button.disabled=false;button.textContent=before;}}
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
 const list=$('#reviews');list.replaceChildren();for(const r of m.reviews){const card=document.createElement('article');card.className='review';const a=document.createElement('a');a.href=r.image;a.target='_blank';const img=document.createElement('img');img.src=r.image+'?v='+revision;img.alt=r.title;img.loading='lazy';a.append(img);card.append(a);const h=document.createElement('h3');h.textContent=r.title;card.append(h);const score=document.createElement('span');score.className='review-score';score.textContent=`${r.score}/100 · visual review`;card.append(score);const p=document.createElement('p');p.textContent=r.note;card.append(p);const path=document.createElement('code');path.textContent=r.path;card.append(path);list.append(card);}
 }catch(e){console.warn('Review feed temporarily unavailable',e.message);}}
updateManifest();setInterval(updateManifest,8000);
setTimeout(()=>{
 try{const started=performance.now();cat=buildCat({resolution:124,hairs:120000});scene.add(cat.root);resize();setView(params.get('view')||'three');ready=true;$('#loading').hidden=true;$('#render-status').textContent='LIVE 3D';$('#geometry-stat').textContent=`${(renderer.info.render.triangles/1000).toFixed(0)}k`;$('#strand-stat').textContent='146k';
 window.__catStudio={ready:true,setView,render,exportGLB,cat,camera,controls,renderer,scene,stats:()=>({triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,buildMs:performance.now()-started,frames,view:mode,webgl:renderer.capabilities.isWebGL2?'WebGL2':'WebGL'})};
 }catch(e){console.error(e);$('#loading').innerHTML='<strong>Unable to start the 3D view.</strong><p>Please use a WebGL-enabled browser, then reload.</p>';$('#render-status').textContent='RENDER ERROR';window.__catError=e.message;}
},80);
