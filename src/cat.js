import * as THREE from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{x=clamp((x-a)/(b-a));return x*x*(3-2*x);};
function random(seed=1947){return()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};}
const rng=random();
function noise(x,y,z){return Math.sin(x*31.7+y*47.1+Math.sin(z*23.8))*Math.sin(z*41.3-y*26.4+x*19.6);}
const white=new THREE.Color('#dfdcd3'),black=new THREE.Color('#111214');
function coat(p,kind='body'){
 let b=0; const [x,y,z]=[p.x,p.y,p.z],a=Math.abs(x),n=noise(x,y,z)*.036;
 if(kind==='tail'||kind==='ear')b=1;
 else {
  const p1=((z-.30)/.38)**2+((y-1.39)/.60)**2+((a-.41)/.62)**2;
  const p2=((z+.92)/.38)**2+((y-1.38)/.47)**2+((a-.39)/.62)**2;
  const p3=((z+.42)/.20)**2+((y-.68)/.19)**2+((a-.39)/.22)**2;
  b=Math.max(1-smooth(.94+n,1.04+n,p1),1-smooth(.93+n,1.07+n,p2),1-smooth(.90+n,1.05+n,p3));
  if(x<-.22&&z<-.92) b=Math.max(b,(1-smooth(.63,.68,y))*smooth(.28,.34,y));
  if(z>.54&&y>1.70){
   const boundary=1.99-.17*smooth(.15,.51,a)-.16*(1-smooth(.87,1.30,z));
   const cap=smooth(boundary-.016+n,boundary+.016+n,y);
   const width=Math.max(.006,.135-(y-2.06)*.28);
   const blaze=(1-smooth(width-.01+n*.18,width+.01+n*.18,a))*smooth(1.24,1.40,z);
   b=cap*(1-blaze);
  }
 }
 const col=white.clone().lerp(black,b); col.multiplyScalar(.97+noise(x*2,y*2,z*2)*.027);return col;
}
function ell(x,y,z,c,r){const ax=(x-c[0])/r[0],ay=(y-c[1])/r[1],az=(z-c[2])/r[2];const k=Math.sqrt(ax*ax+ay*ay+az*az);return k*(k-1)/(Math.sqrt((ax/r[0])**2+(ay/r[1])**2+(az/r[2])**2)||1);}
function smin(a,b,k){const h=clamp(.5+.5*(b-a)/k);return b+(a-b)*h-k*h*(1-h);}
function capsule(p,a,b,ra,rb){const ba=b.clone().sub(a),pa=p.clone().sub(a);const h=clamp(pa.dot(ba)/ba.lengthSq());return pa.addScaledVector(ba,-h).length()-THREE.MathUtils.lerp(ra,rb,h);}
function bodyGeometry(res=112){
 const shapes=[
 [[0,1.19,-.14],[.53,.58,1.12],.14],[[0,1.20,-.97],[.49,.56,.49],.16],
 [[0,1.30,.64],[.475,.59,.49],.16],[[0,1.69,.84],[.375,.48,.38],.14],
 [[0,2.075,1.015],[.548,.490,.452],.14],
 [[-.285,1.962,1.197],[.279,.255,.246],.09],[[.285,1.962,1.197],[.279,.255,.246],.09],
 [[-.118,1.924,1.443],[.169,.140,.140],.035],[[.118,1.924,1.443],[.169,.140,.140],.035],
 [[0,1.796,1.385],[.220,.098,.139],.04]
 ];
 for(const s of [-1,1]){
  const x=s*.326;
  shapes.push([[x,1.015,.650],[.179,.408,.211],.085],[[x,.577,.756],[.117,.319,.136],.065],[[x,.272,.805],[.110,.216,.120],.050],[[x,.116,.905],[.153,.113,.216],.033]);
  const dz=s===-1?.07:-.035;
  shapes.push([[s*.357,1.040,-.942+dz],[.222,.370,.297],.14],[[s*.36,.718,-.809+dz],[.167,.235,.192],.075],[[s*.369,.480,-1.017+dz],[.116,.206,.181],.07],[[s*.373,.261,-1.151+dz],[.097,.213,.121],.055],[[s*.376,.104,-1.049+dz],[.140,.103,.209],.033]);
 }
 const lo=V(-.80,-.06,-1.57),range=V(1.60,2.76,3.37);
 const mc=new MarchingCubes(res,new THREE.MeshStandardMaterial(),false,false,320000);mc.isolation=0;
 let index=0;
 for(let z=0;z<res;z++)for(let y=0;y<res;y++)for(let x=0;x<res;x++){
  const px=lo.x+x/res*range.x,py=lo.y+y/res*range.y,pz=lo.z+z/res*range.z;
  let d=100;for(const [c,r,k]of shapes)d=smin(d,ell(px,py,pz,c,r),k);
  mc.field[index++]=-d;
 }
 mc.update();const count=mc.count;
 const pos=mc.geometry.attributes.position.array.slice(0,count*3),normal=mc.geometry.attributes.normal.array.slice(0,count*3),col=new Float32Array(count*3);
 for(let i=0;i<count;i++){
  let j=i*3;pos[j]=lo.x+(pos[j]+1)*range.x*.5;pos[j+1]=lo.y+(pos[j+1]+1)*range.y*.5;pos[j+2]=lo.z+(pos[j+2]+1)*range.z*.5;
  const n=V(normal[j]/range.x,normal[j+1]/range.y,normal[j+2]/range.z).normalize();n.toArray(normal,j);
  coat(V(pos[j],pos[j+1],pos[j+2])).toArray(col,j);
 }
 mc.geometry.dispose();mc.material.dispose();
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('normal',new THREE.BufferAttribute(normal,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeBoundingSphere();return g;
}
function sweep(points,radii,steps=64,sides=12){
 const c=new THREE.CatmullRomCurve3(points.map(p=>V(...p))),frames=c.computeFrenetFrames(steps,false),p=[],n=[],uv=[],idx=[];
 for(let i=0;i<=steps;i++){
  const t=i/steps,k=t*(radii.length-1),ri=Math.floor(k),r=THREE.MathUtils.lerp(radii[ri],radii[Math.min(ri+1,radii.length-1)],k-ri),o=c.getPoint(t);
  for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,nn=frames.normals[i].clone().multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[i],Math.sin(a));p.push(o.x+nn.x*r,o.y+nn.y*r,o.z+nn.z*r);n.push(nn.x,nn.y,nn.z);uv.push(j/sides,t);if(i<steps&&j<sides){const q=i*(sides+1)+j;idx.push(q,q+1,q+sides+1,q+1,q+sides+2,q+sides+1);}}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);return g;
}
function earGeometry(sign){
 const pos=[],ind=[];const nu=22,nv=28;
 const path=new THREE.CubicBezierCurve3(V(sign*.35,2.395,.865),V(sign*.38,2.79,.805),V(sign*.46,2.70,1.11),V(sign*.465,2.454,1.24));
 for(let v=0;v<=nv;v++)for(let u=0;u<=nu;u++){
  const t=v/nv,a=u/nu*2-1,o=path.getPoint(t),w=.19*(1-t*.73);pos.push(o.x+a*w,o.y-.068*a*a,o.z+.055*(1-a*a));
  if(v<nv&&u<nu){const k=v*(nu+1)+u;ind.push(k,k+nu+1,k+1,k+1,k+nu+1,k+nu+2);}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(ind);g.computeVertexNormals();return g;
}
function colored(g,kind){const p=g.attributes.position,c=new Float32Array(p.count*3);for(let i=0;i<p.count;i++)coat(V(p.getX(i),p.getY(i),p.getZ(i)),kind).toArray(c,i*3);g.setAttribute('color',new THREE.BufferAttribute(c,3));return g;}
function surfaceSampler(geometry){
 const g=geometry.index?geometry.toNonIndexed():geometry;const p=g.attributes.position,n=g.attributes.normal;let sum=0;const area=[];const a=V(),b=V(),c=V();
 for(let i=0;i<p.count;i+=3){a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,i+1);c.fromBufferAttribute(p,i+2);sum+=b.sub(a).cross(c.sub(a)).length()*.5;area.push(sum);}
 return()=>{const r=rng()*sum;let l=0,h=area.length-1;while(l<h){let m=(l+h)>>1;if(area[m]<r)l=m+1;else h=m;}const i=l*3,u=Math.sqrt(rng()),v=rng(),aa=1-u,bb=u*(1-v),cc=u*v;
 const P=V().addScaledVector(a.fromBufferAttribute(p,i),aa).addScaledVector(b.fromBufferAttribute(p,i+1),bb).addScaledVector(c.fromBufferAttribute(p,i+2),cc);
 const N=V().addScaledVector(a.fromBufferAttribute(n,i),aa).addScaledVector(b.fromBufferAttribute(n,i+1),bb).addScaledVector(c.fromBufferAttribute(n,i+2),cc).normalize();return[P,N];};
}
function fur(geometry,count,kind='body'){
 const sample=surfaceSampler(geometry),p=[],norm=[],color=[],uv=[];
 for(let i=0;i<count;i++){
  const [o,n]=sample();if(o.y<.075)continue;
  if(kind==='body'&&o.z>1.33&&o.y>2.03&&o.y<2.30&&Math.abs(Math.abs(o.x)-.23)<.142)continue;
  let len=(.020+rng()*.026),dir=V(0,-.45,-.70);
  if(o.y>1.78&&o.z>.7){len*=.54;dir.set(o.x*.8,-.3,-.05);}
  if(o.y>1.0&&o.z>.42&&o.y<1.85)len*=1.25;
  if(kind==='tail'){len=.040+rng()*.040;dir.set(0,.35,.23);}
  if(kind==='ear'){len=.011+rng()*.021;dir.set(o.x*.7,0,.8);}
  const tangent=dir.addScaledVector(n,-dir.dot(n)).normalize();const flow=n.clone().multiplyScalar(.60).addScaledVector(tangent,.80).normalize();
  const side=V().crossVectors(n,flow).normalize();if(side.lengthSq()<.2)side.set(1,0,0);
  const width=(.00105+rng()*.00105)*(kind==='tail'?1.2:1);const col=coat(o,kind).multiplyScalar(.70+rng()*.52);
  const wiggle=(rng()-.5)*.015,root=o.clone().addScaledVector(n,.0015),mid=root.clone().addScaledVector(flow,len*.50).addScaledVector(n,len*.12),tip=root.clone().addScaledVector(flow,len).addScaledVector(tangent,len*.20).addScaledVector(side,wiggle*.25);
  const verts=[root.clone().addScaledVector(side,-width),root.clone().addScaledVector(side,width),mid.clone().addScaledVector(side,-width*.48),mid.clone().addScaledVector(side,width*.48),tip];
  for(const k of[0,1,2,1,3,2,2,3,4]){const v=verts[k];p.push(v.x,v.y,v.z);norm.push(n.x,n.y,n.z);const shade=k===4?1.09:1; color.push(col.r*shade,col.g*shade,col.b*shade);uv.push(k%2,k<2?0:k<4?.5:1);}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(norm,3));g.setAttribute('color',new THREE.Float32BufferAttribute(color,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.98,side:THREE.DoubleSide});const mesh=new THREE.Mesh(g,m);mesh.name=`Procedural ${kind} fur`;mesh.castShadow=false;mesh.receiveShadow=true;return mesh;
}
function irisTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d'),rnd=random(482);c.fillStyle='#443817';c.fillRect(0,0,512,512);
 const grad=c.createRadialGradient(256,256,20,256,256,250);grad.addColorStop(0,'#b5a75b');grad.addColorStop(.34,'#b29b3a');grad.addColorStop(.65,'#cfb952');grad.addColorStop(.85,'#d5bb56');grad.addColorStop(.96,'#687344');grad.addColorStop(1,'#202a22');c.fillStyle=grad;c.beginPath();c.arc(256,256,250,0,Math.PI*2);c.fill();
 for(let i=0;i<2400;i++){const a=rnd()*Math.PI*2,r=50+rnd()*185,l=8+rnd()*67;c.strokeStyle=`rgba(${rnd()>.5?'65,56,20':'237,216,131'},${.08+rnd()*.22})`;c.lineWidth=.4+rnd()*1.1;c.beginPath();c.moveTo(256+Math.cos(a)*r,256+Math.sin(a)*r);c.quadraticCurveTo(256+Math.cos(a+.005)*(r+l*.5),256+Math.sin(a+.005)*(r+l*.5),256+Math.cos(a)*(Math.min(r+l,240)),256+Math.sin(a)*(Math.min(r+l,240)));c.stroke();}
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function sphere(group,name,mat,center,scale,detail=40){const o=new THREE.Mesh(new THREE.SphereGeometry(1,detail,Math.ceil(detail*.7)),mat);o.name=name;o.position.set(...center);o.scale.set(...scale);group.add(o);return o;}
function eye(group,s,texture){
 const e=new THREE.Group();e.name=s<0?'Left gold eye':'Right gold eye';e.position.set(s*.236,2.155,1.394);e.rotation.y=s*.17;group.add(e);
 const globe=new THREE.MeshPhysicalMaterial({color:'#344031',roughness:.26,clearcoat:1,clearcoatRoughness:.04});sphere(e,'Eyeball',globe,[0,0,0],[.146,.151,.124]);
 const irisMat=new THREE.MeshPhysicalMaterial({map:texture,roughness:.30,clearcoat:.85,clearcoatRoughness:.045});
 const p=[],uv=[],ids=[];const seg=80,rows=16,r=.124;
 for(let j=0;j<=rows;j++)for(let i=0;i<=seg;i++){const q=j/rows,a=i/seg*Math.PI*2,x=Math.cos(a)*r*q,y=Math.sin(a)*r*q;p.push(x,y,.121+.023*(1-q*q));uv.push(.5+x/r*.5,.5+y/r*.5);if(j<rows&&i<seg){let k=j*(seg+1)+i;ids.push(k,k+1,k+seg+1,k+1,k+seg+2,k+seg+1);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();const iris=new THREE.Mesh(g,irisMat);iris.name='Radially striated golden iris';e.add(iris);
 const pupil=new THREE.MeshPhysicalMaterial({color:'#030706',roughness:.15,clearcoat:1});sphere(e,'Vertical oval pupil',pupil,[0,0,.145],[.046,.083,.006]);
 const catchlight=new THREE.MeshBasicMaterial({color:'#fffdf2'});sphere(e,'Upper softbox reflection',catchlight,[-.033,.050,.151],[.020,.023,.004]);sphere(e,'Lower softbox reflection',catchlight,[.040,-.044,.143],[.005,.008,.003]);
 const rimMat=new THREE.MeshStandardMaterial({color:'#151314',roughness:.69});const points=[];for(let i=0;i<=80;i++){let a=i/80*Math.PI*2;points.push([Math.cos(a)*.144,Math.sin(a)*.148,.063+Math.sin(a)*.014]);}const rim=new THREE.Mesh(sweep(points,Array(9).fill(.009),80,7),rimMat);rim.name='Soft eyelid rim';e.add(rim);return e;
}
function nose(group){
 const m=new THREE.MeshPhysicalMaterial({color:'#30262b',roughness:.63,clearcoat:.2});
 const sh=new THREE.Shape();sh.moveTo(-.081,.021);sh.bezierCurveTo(-.088,.043,-.047,.049,0,.036);sh.bezierCurveTo(.047,.049,.088,.043,.081,.021);sh.bezierCurveTo(.054,-.007,.028,-.008,.021,-.049);sh.quadraticCurveTo(0,-.073,-.021,-.049);sh.bezierCurveTo(-.028,-.008,-.054,-.007,-.081,.021);
 const g=new THREE.ExtrudeGeometry(sh,{depth:.028,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:.008,bevelThickness:.008,curveSegments:18});const n=new THREE.Mesh(g,m);n.name='Sculpted leather nose';n.position.set(0,1.999,1.570);group.add(n);
 const dark=new THREE.MeshStandardMaterial({color:'#160f12',roughness:.85});for(const s of[-1,1])sphere(group,'Nostril',dark,[s*.051,2.016,1.606],[.016,.007,.0026],20);
 const lineMat=new THREE.MeshStandardMaterial({color:'#675854',roughness:.92});
 for(const points of[[[0,1.958,1.588],[0,1.911,1.589],[0,1.886,1.562]],[[-.126,1.872,1.516],[-.066,1.866,1.561],[0,1.886,1.562]],[[.126,1.872,1.516],[.066,1.866,1.561],[0,1.886,1.562]]]){const line=new THREE.Mesh(sweep(points,[.0028,.0035,.0021],22,6),lineMat);line.name='Muzzle contour';group.add(line);}
}
function whiskers(group){
 const mat=new THREE.MeshStandardMaterial({color:'#faf5e9',roughness:.8});
 for(const s of[-1,1]){
  for(let i=0;i<9;i++){const y=1.925+(i%3)*.025,x=s*(.13+(i%3)*.026),z=1.567-(i%3)*.015,spread=(i-4)*.047;const pts=[[x,y,z],[s*.35,y+spread*.35,z+.027],[s*.61,y+spread*.84,z-.035],[s*(.74+(i%3)*.035),y+spread-.06,z-.16]];const w=new THREE.Mesh(sweep(pts,[.0019,.0015,.0008,.00012],26,5),mat);w.name='Tapered muzzle whisker';group.add(w);}
  for(let i=0;i<3;i++){const w=new THREE.Mesh(sweep([[s*.23,2.331,1.378],[s*.30,2.47,1.408],[s*(.35+i*.058),2.54+i*.018,1.32]],[.0011,.0008,.00012],18,5),mat);w.name='Brow whisker';group.add(w);}
 }
}
export function buildCat({resolution=112,hairs=72000}={}){
 const root=new THREE.Group();root.name='GPT-6 Astra Pro | ColabDev Web | Bicolor Fold Cat';root.userData={author:'GPT-6 Astra Pro',tools:'ColabDev, Three.js, JavaScript, headless Chromium',source:'Original procedural geometry; reference used only for visual guidance',version:1};
 const furGroup=new THREE.Group();furGroup.name='Procedural fur strands';root.add(furGroup);
 const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95});const bodyG=bodyGeometry(resolution),body=new THREE.Mesh(bodyG,mat);body.name='Continuous anatomical sculpt';body.castShadow=true;body.receiveShadow=true;root.add(body);furGroup.add(fur(bodyG,hairs));
 const tailG=colored(sweep([[0,1.43,-1.37],[.025,1.64,-1.70],[.040,1.92,-2.025],[.060,2.30,-2.215],[.075,2.70,-2.18]],[.112,.135,.143,.131,.012],92,20),'tail');const tail=new THREE.Mesh(tailG,mat);tail.name='Upright curved tail';tail.castShadow=true;root.add(tail);furGroup.add(fur(tailG,15000,'tail'));
 const earMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.99,side:THREE.DoubleSide});
 for(const s of[-1,1]){const eg=colored(earGeometry(s),'ear'),em=new THREE.Mesh(eg,earMat);em.name='Folded ear cartilage';em.castShadow=true;root.add(em);furGroup.add(fur(eg,3600,'ear'));
 const conchaMat=new THREE.MeshStandardMaterial({color:'#756460',roughness:1,side:THREE.DoubleSide});const concha=sphere(root,'Recessed inner ear',conchaMat,[s*.39,2.486,1.186],[.093,.087,.026]);concha.rotation.z=s*-.5;}
 const texture=irisTexture();eye(root,-1,texture);eye(root,1,texture);nose(root);whiskers(root);
 const toeMat=new THREE.MeshStandardMaterial({color:'#a8a397',roughness:1});for(const s of[-1,1])for(const z of[.905,-1.049+(s===-1?.07:-.035)])for(const off of[-.048,.044]){const x=s*(z>0?.326:.376)+off;const mesh=new THREE.Mesh(sweep([[x,.080,z+.173],[x,.121,z+.175],[x,.164,z+.14]],[.0023,.003,.001],14,5),toeMat);mesh.name='Subtle toe separation';root.add(mesh);}
 root.updateMatrixWorld(true);return {root,furGroup,body,metrics:{hairs:hairs+22200,resolution,seed:1947}};
}
