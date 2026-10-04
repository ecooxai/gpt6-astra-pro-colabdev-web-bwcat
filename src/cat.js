import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{x=clamp((x-a)/(b-a));return x*x*(3-2*x);};
function random(seed=1947){return()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};}
let rng=random();
function noise(x,y,z){return Math.sin(x*31.7+y*47.1+Math.sin(z*23.8))*Math.sin(z*41.3-y*26.4+x*19.6);}
const white=new THREE.Color('#dfdcd3'),black=new THREE.Color('#111214');
function coat(p,kind='body'){
 const {x,y,z}=p,a=Math.abs(x),n=noise(x,y,z)*.036;let b=0;
 if(kind==='tail'||kind==='ear')b=1;
 else{
  const shoulder=((z-.12-(1.35-y)*.10)/.41)**2+((y-1.39)/.60)**2+((a-.25)/.90)**2;
  const center=-.98+.17*(1.45-y),width=.375+.055*smooth(1.13,1.67,y);
  const rump=((z-center)/width)**2+((y-1.44)/.445)**2+((a-.28)/.95)**2;
  const fleck=((z+.42)/.20)**2+((y-.68)/.19)**2+((a-.39)/.22)**2;
  b=Math.max(1-smooth(.94+n,1.04+n,shoulder+.060*Math.sin(y*13+z*7)),1-smooth(.93+n,1.07+n,rump+.085*Math.sin(y*15-z*8)),1-smooth(.90+n,1.05+n,fleck));
  const tailJoin=(x/.30)**2+((y-1.56)/.32)**2+((z+1.31)/.29)**2;b=Math.max(b,1-smooth(.94+n,1.06+n,tailJoin));
  if(x<-.22&&z<-.90){const hock=((x+.39)/.14)**2+((y-.425)/.15)**2+((z+1.07)/.14)**2;b=Math.max(b,1-smooth(.86+n*2,1.15+n*2,hock));}
  if(z>.34&&y>1.70){
   const boundary=1.96-.07*smooth(.15,.51,a)-.12*(1-smooth(.87,1.30,z));
   const cap=smooth(boundary-.016+n,boundary+.016+n,y),width=Math.max(.006,.110-(y-2.06)*.28);
   const blaze=(1-smooth(width-.01+n*.18,width+.01+n*.18,a))*smooth(1.24,1.40,z);
   b=cap*(1-blaze);if(z<.69)b*=smooth(1.76,1.94,y);
  }
 }
 return white.clone().lerp(black,b).multiplyScalar(.97+noise(x*2,y*2,z*2)*.027);
}
function ell(x,y,z,c,r){const ax=(x-c[0])/r[0],ay=(y-c[1])/r[1],az=(z-c[2])/r[2];const k=Math.sqrt(ax*ax+ay*ay+az*az);return k*(k-1)/(Math.sqrt((ax/r[0])**2+(ay/r[1])**2+(az/r[2])**2)||1);}
function smin(a,b,k){const h=clamp(.5+.5*(b-a)/k);return b+(a-b)*h-k*h*(1-h);}
function capsule(p,a,b,ra,rb){const ba=b.clone().sub(a),pa=p.clone().sub(a);const h=clamp(pa.dot(ba)/ba.lengthSq());return pa.addScaledVector(ba,-h).length()-THREE.MathUtils.lerp(ra,rb,h);}
let distanceAt=()=>1;
function surfaceOcclusion(p,n){
 let obstruction=0,weight=1;
 for(const h of[.035,.080,.17,.32]){const d=distanceAt(p.x+n.x*h,p.y+n.y*h,p.z+n.z*h);obstruction+=Math.max(0,1-Math.max(d,0)/h)*weight;weight*=.5;}
 return clamp(1-obstruction*.25,.68,1);
}
function bodyGeometry(res=112){
 const shapes=[
 [[0,1.32,-.14],[.54,.55,1.12],.14],[[0,1.33,-.97],[.49,.54,.49],.16],
 [[0,1.39,.64],[.535,.59,.49],.16],[[0,1.73,.84],[.435,.455,.40],.14],
 [[0,2.075,1.015],[.548,.525,.452],.14],
 [[-.285,1.962,1.197],[.279,.255,.246],.09],[[.285,1.962,1.197],[.279,.255,.246],.09],
 [[-.118,1.891,1.443],[.169,.140,.140],.057],[[.118,1.891,1.443],[.169,.140,.140],.057],
 [[0,1.787,1.385],[.188,.066,.132],.067]
 ];
 for(const sign of[-1,1]){
  const x=sign*.326,fd=sign===-1?-.09:0;
  shapes.push([[x,1.015,.690+fd],[.179,.408,.190],.085],[[x,.577,.776+fd],[.117,.319,.126],.065],[[x,.272,.805+fd],[.110,.216,.112],.050],[[x,.127,.865+fd],[.148,.122,.173],.034]);
  for(const offset of[-.095,-.032,.032,.095])shapes.push([[x+offset,.073,.973+fd],[.044,.067,.075],.028]);
  const dz=sign===-1?.07:-.035;
  shapes.push([[sign*.357,1.165,-.942+dz],[.220,.365,.287],.13],[[sign*.36,.718,-.859+dz],[.139,.217,.148],.075],[[sign*.369,.480,-.963+dz],[.105,.212,.143],.050],[[sign*.373,.261,-1.060+dz],[.097,.198,.109],.048],[[sign*.376,.115,-.960+dz],[.140,.109,.179],.037]);
 }
 const lo=V(-.80,-.06,-1.57),range=V(1.60,2.76,3.37);
 const mc=new MarchingCubes(res,new THREE.MeshStandardMaterial(),false,false,320000);mc.isolation=0;
 let index=0;
 for(let z=0;z<res;z++)for(let y=0;y<res;y++)for(let x=0;x<res;x++){
  const px=lo.x+x/res*range.x,py=lo.y+y/res*range.y,pz=lo.z+z/res*range.z;
  let d=100;for(const [c,r,k]of shapes)d=smin(d,ell(px,py,pz,c,r),k);
  if(pz>1.20&&py>1.95&&py<2.35&&Math.abs(px)<.46){d=Math.max(d,-ell(px,py,pz,[-.242,2.147,1.411],[.108,.114,.089]),-ell(px,py,pz,[.242,2.147,1.411],[.108,.114,.089]));}
  mc.field[index++]=-d;
 }
 // The sculpt's own distance field provides baked contact occlusion; no image is sampled.
 const field=mc.field;
 distanceAt=(wx,wy,wz)=>{
  const x=(wx-lo.x)/range.x*res,y=(wy-lo.y)/range.y*res,z=(wz-lo.z)/range.z*res;
  const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z);if(ix<0||iy<0||iz<0||ix>=res-1||iy>=res-1||iz>=res-1)return 1;
  const fx=x-ix,fy=y-iy,fz=z-iz;let value=0;
  for(let k=0;k<2;k++)for(let j=0;j<2;j++)for(let i=0;i<2;i++)value-=field[(iz+k)*res*res+(iy+j)*res+ix+i]*(i?fx:1-fx)*(j?fy:1-fy)*(k?fz:1-fz);
  return value;
 };
 mc.update();const count=mc.count;
 const pos=mc.geometry.attributes.position.array.slice(0,count*3),normal=mc.geometry.attributes.normal.array.slice(0,count*3),col=new Float32Array(count*3);
 for(let i=0;i<count;i++){
  let j=i*3;pos[j]=lo.x+(pos[j]+1)*range.x*.5;pos[j+1]=lo.y+(pos[j+1]+1)*range.y*.5;pos[j+2]=lo.z+(pos[j+2]+1)*range.z*.5;
  const n=V(normal[j]/range.x,normal[j+1]/range.y,normal[j+2]/range.z).normalize();n.toArray(normal,j);
  const point=V(pos[j],pos[j+1],pos[j+2]);coat(point).multiplyScalar(.91*surfaceOcclusion(point,n)).toArray(col,j);
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
function earSurface(sign,u,v){
 const w=1-u-v;
 const A=V(.230,2.390,.960),B=V(.555,2.355,.985),C=V(.575,2.485,1.210),AB=V(.410,2.390,.950),BC=V(.670,2.605,1.080),CA=V(.260,2.750,1.080);
 const p=A.multiplyScalar(w*w).addScaledVector(B,u*u).addScaledVector(C,v*v).addScaledVector(AB,2*w*u).addScaledVector(BC,2*u*v).addScaledVector(CA,2*v*w);
 p.x*=sign;p.z-=.025*27*u*v*w;return p;
}
function earGeometry(sign){
 const N=34,pos=[],color=[],indices=[],lookup=new Map(),dark=new THREE.Color('#111214'),skin=new THREE.Color('#68534e');
 for(let j=0;j<=N;j++)for(let i=0;i<=N-j;i++){
  const u=i/N,v=j/N,w=1-u-v,p=earSurface(sign,u,v),pink=smooth(.065,.155,Math.min(u,v,w))*(1-smooth(.30,.54,v));lookup.set(`${i},${j}`,pos.length/3);pos.push(p.x,p.y,p.z);dark.clone().lerp(skin,pink).toArray(color,color.length);
 }
 const count=pos.length/3;for(let i=0;i<count;i++){pos.push(pos[i*3],pos[i*3+1],pos[i*3+2]-.025);dark.toArray(color,color.length);}
 const tri=(a,b,c)=>sign>0?indices.push(a,b,c):indices.push(a,c,b);
 for(let j=0;j<N;j++)for(let i=0;i<N-j;i++){
  const a=lookup.get(`${i},${j}`),b=lookup.get(`${i+1},${j}`),c=lookup.get(`${i},${j+1}`);tri(a,b,c);tri(a+count,c+count,b+count);
  if(i<N-j-1){const d=lookup.get(`${i+1},${j+1}`);tri(b,d,c);tri(b+count,c+count,d+count);}
 }
 for(const edge of[Array.from({length:N+1},(_,i)=>lookup.get(`${i},0`)),Array.from({length:N+1},(_,j)=>lookup.get(`${N-j},${j}`)),Array.from({length:N+1},(_,j)=>lookup.get(`0,${N-j}`))])for(let i=0;i<N;i++){const a=edge[i],b=edge[i+1];tri(a,a+count,b);tri(b,a+count,b+count);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(color,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function earInterior(root,furGroup,sign){
 const hairs=new THREE.Group();hairs.name='Fine inner-ear hairs';furGroup.add(hairs);const material=new THREE.MeshStandardMaterial({color:'#c4bdb1',roughness:.94});
 for(let i=0;i<48;i++){
  const u=.21+rng()*.21,v=.14+rng()*.15,p=earSurface(sign,u,v);p.z+=.008;
  const dx=sign*(-.018+rng()*.045),dy=.065+rng()*.065;
  const g=sweep([[p.x,p.y,p.z],[p.x+dx*.35,p.y+dy*.40,p.z+.046],[p.x+dx,p.y+dy*.82,p.z+.064],[p.x+dx-sign*.010,p.y+dy,p.z+.045]],[.00035,.00095,.00065,.000035],20,4),hair=new THREE.Mesh(g,material);hair.name='Individual pinna guard hair';hair.userData.fiberCount=1;hair.receiveShadow=true;hairs.add(hair);
 }
}
function colored(g,kind){const p=g.attributes.position,c=new Float32Array(p.count*3);for(let i=0;i<p.count;i++)coat(V(p.getX(i),p.getY(i),p.getZ(i)),kind).toArray(c,i*3);g.setAttribute('color',new THREE.BufferAttribute(c,3));return g;}
function surfaceSampler(geometry){
 const g=geometry.index?geometry.toNonIndexed():geometry;const p=g.attributes.position,n=g.attributes.normal,colors=g.attributes.color;let sum=0;const area=[];const a=V(),b=V(),c=V();
 for(let i=0;i<p.count;i+=3){a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,i+1);c.fromBufferAttribute(p,i+2);sum+=b.sub(a).cross(c.sub(a)).length()*.5;area.push(sum);}
 return()=>{const r=rng()*sum;let l=0,h=area.length-1;while(l<h){let m=(l+h)>>1;if(area[m]<r)l=m+1;else h=m;}const i=l*3,u=Math.sqrt(rng()),v=rng(),aa=1-u,bb=u*(1-v),cc=u*v;
 const P=V().addScaledVector(a.fromBufferAttribute(p,i),aa).addScaledVector(b.fromBufferAttribute(p,i+1),bb).addScaledVector(c.fromBufferAttribute(p,i+2),cc);
 const N=V().addScaledVector(a.fromBufferAttribute(n,i),aa).addScaledVector(b.fromBufferAttribute(n,i+1),bb).addScaledVector(c.fromBufferAttribute(n,i+2),cc).normalize();return[P,N,colors?V(colors.getX(i)*aa+colors.getX(i+1)*bb+colors.getX(i+2)*cc,colors.getY(i)*aa+colors.getY(i+1)*bb+colors.getY(i+2)*cc,colors.getZ(i)*aa+colors.getZ(i+1)*bb+colors.getZ(i+2)*cc):null];};
}
let fiberTextureCache=null;
function fiberTexture(){
 if(fiberTextureCache)return fiberTextureCache;
 // Eight fine, independently curved fibers per tapered 3D tuft. Entirely authored here.
 const w=128,h=256,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const c=canvas.getContext('2d');c.fillStyle='#000';c.fillRect(0,0,w,h);const rand=random(27451);
 for(let i=0;i<8;i++){
  const x=(i+.5)/8*w,lean=(rand()-.5)*12,top=3+rand()*27;
  const g=c.createLinearGradient(0,h,0,0);g.addColorStop(0,'#c6c6c6');g.addColorStop(.18,'#ffffff');g.addColorStop(.70,'#ffffff');g.addColorStop(.94,'#989898');g.addColorStop(1,'#000000');
  c.strokeStyle=g;c.lineWidth=1.6+rand()*1.8;c.lineCap='round';c.beginPath();c.moveTo(x,h+2);c.bezierCurveTo(x+lean*.25,h*.65,x+lean,h*.36,x+lean*.60,top);c.stroke();
 }
 const mask=c.getImageData(0,0,w,h).data,data=new Uint8Array(w*h*4);
 for(let i=0;i<w*h;i++){data[i*4]=255;data[i*4+1]=255;data[i*4+2]=255;data[i*4+3]=mask[((h-1-Math.floor(i/w))*w+i%w)*4+1];}
 const texture=new THREE.DataTexture(data,w,h,THREE.RGBAFormat);texture.name='Original eight-fiber cutout';texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;fiberTextureCache=texture;return texture;
}
function fur(geometry,count,kind='body'){
 const sample=surfaceSampler(geometry),p=[],norm=[],color=[],uv=[];
 for(let i=0;i<count;i++){
  const [o,n,sampledColor]=sample();if(o.y<.075)continue;if(kind==='ear'&&sampledColor&&sampledColor.x>.04&&sampledColor.x>sampledColor.y*1.15)continue;
  if((kind==='body'||kind==='guard')&&o.z>1.31&&((Math.abs(o.x)-.242)/.116)**2+((o.y-2.147)/.123)**2<1)continue;
  let len=(.028+rng()*.030),dir=V(0,-.45,-.70);
  if(o.y>1.78&&o.z>.7){len*=.55;if(o.z>1.30&&o.y<2.045)len*=.48;dir.set(o.x*.8,-.3,-.05);}
  if(o.y>1.0&&o.z>.42&&o.y<1.85)len*=1.25;
  if(kind==='tail'){len=.040+rng()*.040;dir.set(0,.35,.23);}
  if(kind==='ear'){len=.011+rng()*.021;dir.set(o.x*.7,0,.8);}if(kind==='guard'&&o.y<1.78)len*=1.55;
  const tangent=dir.addScaledVector(n,-dir.dot(n)).normalize();const flow=n.clone().multiplyScalar(.36).addScaledVector(tangent,.94).normalize();
  const side=V().crossVectors(n,flow).normalize();if(side.lengthSq()<.2)side.set(1,0,0);
  const width=(.00062+rng()*.00064)*10.0*(kind==='tail'?1.2:kind==='guard'?.50:1);const col=coat(o,kind).multiplyScalar((.77+rng()*.24)*surfaceOcclusion(o,n));
  const wiggle=(rng()-.5)*.015,root=o.clone().addScaledVector(n,.0015),mid=root.clone().addScaledVector(flow,len*.50).addScaledVector(n,len*.075),tip=root.clone().addScaledVector(flow,len).addScaledVector(tangent,len*.20).addScaledVector(side,wiggle*.25);
  const verts=[root.clone().addScaledVector(side,-width),root.clone().addScaledVector(side,width),mid.clone().addScaledVector(side,-width*.48),mid.clone().addScaledVector(side,width*.48),tip];
  for(const k of[0,1,2,1,3,2,2,3,4]){const v=verts[k];p.push(v.x,v.y,v.z);norm.push(n.x,n.y,n.z);const shade=k===4?(col.r<.05?1.58:1.14):k<2?.84:1.04; color.push(col.r*shade,col.g*shade,col.b*shade);uv.push(k===4?.5:k%2,k<2?0:k<4?.5:1);}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(norm,3));g.setAttribute('color',new THREE.Float32BufferAttribute(color,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 const m=new THREE.MeshPhysicalMaterial({vertexColors:true,map:fiberTexture(),roughness:.88,sheen:.30,sheenColor:'#302f2c',sheenRoughness:.78,side:THREE.DoubleSide,transparent:true,blending:THREE.NormalBlending,depthWrite:false,alphaToCoverage:false,forceSinglePass:true});m.userData.fiberCoverage=false;m.userData.portableFiberBlend=true;const mesh=new THREE.Mesh(g,m);mesh.name=`Procedural ${kind} fur`;mesh.castShadow=false;mesh.receiveShadow=true;mesh.userData.fiberCount=p.length/9/3*8;mesh.userData.tuftCount=p.length/9/3;mesh.userData.groomClass='coat';return mesh;
}
function irisTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d'),rnd=random(482);c.fillStyle='#443817';c.fillRect(0,0,512,512);
 const grad=c.createRadialGradient(256,256,20,256,256,250);grad.addColorStop(0,'#b5a75b');grad.addColorStop(.34,'#b29b3a');grad.addColorStop(.65,'#bf9e3d');grad.addColorStop(.85,'#d5bb56');grad.addColorStop(.96,'#687344');grad.addColorStop(1,'#202a22');c.fillStyle=grad;c.beginPath();c.arc(256,256,250,0,Math.PI*2);c.fill();
 for(let i=0;i<2400;i++){const a=rnd()*Math.PI*2,r=50+rnd()*185,l=8+rnd()*67;c.strokeStyle=`rgba(${rnd()>.5?'65,56,20':'237,216,131'},${.08+rnd()*.22})`;c.lineWidth=.4+rnd()*1.1;c.beginPath();c.moveTo(256+Math.cos(a)*r,256+Math.sin(a)*r);c.quadraticCurveTo(256+Math.cos(a+.005)*(r+l*.5),256+Math.sin(a+.005)*(r+l*.5),256+Math.cos(a)*(Math.min(r+l,240)),256+Math.sin(a)*(Math.min(r+l,240)));c.stroke();}
 const lid=c.createLinearGradient(0,8,0,310);lid.addColorStop(0,'rgba(22,17,8,.62)');lid.addColorStop(.42,'rgba(25,30,11,.20)');lid.addColorStop(1,'rgba(20,26,10,0)');c.fillStyle=lid;c.fillRect(0,0,512,512);
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function sphere(group,name,mat,center,scale,detail=40){const o=new THREE.Mesh(new THREE.SphereGeometry(1,detail,Math.ceil(detail*.7)),mat);o.name=name;o.position.set(...center);o.scale.set(...scale);group.add(o);return o;}
function eye(group,s,texture){
 const e=new THREE.Group();e.name=s<0?'Left gold eye':'Right gold eye';e.position.set(s*.185,2.147,1.295);e.scale.set(.75,.75,.90);e.rotation.y=s*.45;group.add(e);
 const globe=new THREE.MeshPhysicalMaterial({color:'#151b12',roughness:.26,clearcoat:1,clearcoatRoughness:.04});sphere(e,'Eyeball',globe,[0,0,.105],[.139,.145,.030]);
 const irisMat=new THREE.MeshPhysicalMaterial({map:texture,roughness:.30,clearcoat:.85,clearcoatRoughness:.045});
 const p=[],uv=[],ids=[];const seg=80,rows=16,r=.124;
 for(let j=0;j<=rows;j++)for(let i=0;i<=seg;i++){const q=j/rows,a=i/seg*Math.PI*2,x=Math.cos(a)*r*q,y=Math.sin(a)*r*q;p.push(x,y,.121+.023*(1-q*q));uv.push(.5+x/r*.5,.5+y/r*.5);if(j<rows&&i<seg){let k=j*(seg+1)+i;ids.push(k,k+seg+1,k+1,k+1,k+seg+1,k+seg+2);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();const iris=new THREE.Mesh(g,irisMat);iris.name='Radially striated golden iris';e.add(iris);
 const cg=g.clone(),cp=cg.attributes.position;for(let i=0;i<cp.count;i++)cp.setZ(i,cp.getZ(i)+.012);cg.computeVertexNormals();const cornea=new THREE.Mesh(cg,new THREE.MeshPhysicalMaterial({color:'#ffffff',roughness:.10,transparent:true,opacity:.055,clearcoat:.12,envMapIntensity:.25,depthWrite:false}));cornea.name='Clear corneal surface';e.add(cornea);

 const pupil=new THREE.MeshPhysicalMaterial({color:'#030706',roughness:.15,clearcoat:1});sphere(e,'Vertical oval pupil',pupil,[0,0,.145],[.046,.083,.006]);
 const catchlight=new THREE.MeshBasicMaterial({color:'#fffdf2'});sphere(e,'Upper softbox reflection',catchlight,[-.029,.046,.151],[.014,.017,.0025]);sphere(e,'Lower softbox reflection',catchlight,[.040,-.044,.143],[.0035,.005,.002]);
 const rimMat=new THREE.MeshStandardMaterial({color:'#151314',roughness:.69});const points=[];for(let i=0;i<=80;i++){let a=i/80*Math.PI*2;points.push([Math.cos(a)*.132,Math.sin(a)*(Math.sin(a)>0?.121:.137),.116+Math.sin(a)*.004]);}const rim=new THREE.Mesh(sweep(points,[.005,.008,.010,.008,.005,.0045,.004,.0045,.005],80,7),rimMat);rim.name='Soft eyelid rim';e.add(rim);return e;
}
function nose(group){
 const muzzle=new THREE.Group();muzzle.name="Sculpted muzzle details";muzzle.position.y=-.033;group.add(muzzle);group=muzzle;
 const m=new THREE.MeshPhysicalMaterial({color:'#211b20',roughness:.63,clearcoat:.2});
 const sh=new THREE.Shape();sh.moveTo(-.081,.021);sh.bezierCurveTo(-.088,.043,-.047,.049,0,.036);sh.bezierCurveTo(.047,.049,.088,.043,.081,.021);sh.bezierCurveTo(.054,-.007,.028,-.008,.021,-.049);sh.quadraticCurveTo(0,-.073,-.021,-.049);sh.bezierCurveTo(-.028,-.008,-.054,-.007,-.081,.021);
 const g=new THREE.ExtrudeGeometry(sh,{depth:.028,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:.008,bevelThickness:.008,curveSegments:18});const n=new THREE.Mesh(g,m);n.name='Sculpted leather nose';n.scale.set(.80,.76,.80);n.position.set(0,1.999,1.570);group.add(n);
 const dark=new THREE.MeshStandardMaterial({color:'#160f12',roughness:.85});
 const follicleMat=new THREE.MeshStandardMaterial({color:'#897f74',roughness:1});for(const sign of[-1,1])for(let j=0;j<12;j++){const x=sign*(.070+(j%4)*.038),y=1.910+Math.floor(j/4)*.027;const f=Math.max(.12,1-((Math.abs(x)-.118)/.169)**2-((y-1.924)/.140)**2),z=1.443+.140*Math.sqrt(f)+.011;sphere(group,'Whisker follicle',follicleMat,[x,y,z],[.0020,.0019,.0014],10);}
for(const s of[-1,1])sphere(group,'Nostril',dark,[s*.041,2.012,1.602],[.012,.005,.0026],20);
 const lineMat=new THREE.MeshStandardMaterial({color:'#675854',roughness:.92});
 for(const points of[[[0,1.958,1.588],[0,1.911,1.589],[0,1.886,1.562]],[[-.126,1.872,1.516],[-.066,1.866,1.561],[0,1.886,1.562]],[[.126,1.872,1.516],[.066,1.866,1.561],[0,1.886,1.562]]]){const line=new THREE.Mesh(sweep(points,[.0028,.0035,.0021],22,6),lineMat);line.name='Muzzle contour';group.add(line);}
}
function whiskers(group){
 const mat=new THREE.MeshStandardMaterial({color:'#faf5e9',roughness:.8});
 for(const s of[-1,1]){
  for(let i=0;i<9;i++){const y=1.892+(i%3)*.025,x=s*(.13+(i%3)*.026),z=1.567-(i%3)*.015,spread=(i-4)*.047;const pts=[[x,y,z],[s*.35,y+spread*.35,z+.027],[s*.61,y+spread*.84,z-.035],[s*(.74+(i%3)*.035),y+spread-.06,z-.16]];const w=new THREE.Mesh(sweep(pts,[.0019,.0015,.0008,.00012],26,5),mat);w.name='Tapered muzzle whisker';group.add(w);}
  for(let i=0;i<3;i++){const w=new THREE.Mesh(sweep([[s*.23,2.331,1.378],[s*.30,2.47,1.408],[s*(.35+i*.058),2.54+i*.018,1.32]],[.0011,.0008,.00012],18,5),mat);w.name='Brow whisker';group.add(w);}
 }
}
// Static batching preserves every triangle and vertex attribute used by its material.
// The fur group remains separate so toggling and exports retain their semantics.
function batchStatic(parent){
 for(const child of [...parent.children])if(!child.isMesh)batchStatic(child);
 const byMaterial=new Map();
 for(const mesh of parent.children){if(!mesh.isMesh||Array.isArray(mesh.material))continue;const key=mesh.material.uuid;if(!byMaterial.has(key))byMaterial.set(key,[]);byMaterial.get(key).push(mesh);}
 for(const parts of byMaterial.values()){
  if(parts.length<2)continue;
  const first=parts[0],mat=first.material,needsUV=!!(mat.map||mat.normalMap||mat.roughnessMap||mat.metalnessMap||mat.anisotropy>0),geometries=[];
  const allowed=new Set(['position','normal',...(mat.vertexColors?['color']:[]),...(needsUV?['uv']:[])]);
  for(const mesh of parts){mesh.updateMatrix();const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();g.applyMatrix4(mesh.matrix);for(const name of Object.keys(g.attributes))if(!allowed.has(name))g.deleteAttribute(name);geometries.push(g);}
  const merged=mergeGeometries(geometries,false);if(!merged)throw new Error('Static batching failed: '+first.name);merged.computeBoundingSphere();
  first.userData.tuftCount=parts.reduce((n,p)=>n+(p.userData.tuftCount||0),0);first.userData.fiberCount=parts.reduce((n,p)=>n+(p.userData.fiberCount||0),0);first.userData.batchedParts=parts.map(p=>p.name);first.castShadow=parts.some(p=>p.castShadow);first.receiveShadow=parts.some(p=>p.receiveShadow);
  for(const mesh of parts){mesh.geometry.dispose();if(mesh!==first)parent.remove(mesh);}first.geometry=merged;first.position.set(0,0,0);first.rotation.set(0,0,0);first.scale.set(1,1,1);first.updateMatrix();for(const g of geometries)g.dispose();
 }
}
export function buildCat({resolution=112,hairs=120000}={}){
 rng=random(1947);
 const root=new THREE.Group();root.name='GPT-6 Astra Pro | ColabDev Web | Bicolor Fold Cat';root.userData={author:'GPT-6 Astra Pro',tools:'ColabDev, Three.js, JavaScript, headless Chromium',source:'Original procedural geometry; reference used only for visual guidance',version:1};
 const furGroup=new THREE.Group();furGroup.name='Procedural fur strands';furGroup.userData.role='fur';root.add(furGroup);
 const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95});const bodyG=bodyGeometry(resolution),body=new THREE.Mesh(bodyG,mat);body.name='Continuous anatomical sculpt';body.userData.role='body';body.castShadow=true;body.receiveShadow=true;root.add(body);furGroup.add(fur(bodyG,hairs));furGroup.add(fur(bodyG,22000,'guard'));
 const tailG=colored(sweep([[0,1.58,-1.37],[-.09,1.66,-1.70],[-.28,1.95,-2.025],[-.65,2.30,-2.215],[-.86,2.72,-2.18]],[.112,.125,.14,.145,.148,.142,.135,.108,.093],92,20),'tail');const tail=new THREE.Mesh(tailG,mat);tail.name='Upright curved tail';tail.castShadow=true;root.add(tail);furGroup.add(fur(tailG,15000,'tail'));
 const tg=new THREE.SphereGeometry(1,32,24);tg.scale(.105,.120,.103);tg.translate(-.86,2.72,-2.18);colored(tg,'tail');const tm=new THREE.Mesh(tg,mat);tm.name='Rounded tail tip';root.add(tm);furGroup.add(fur(tg,4200,'tail'));

 const earMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.99,side:THREE.DoubleSide});
 for(const s of[-1,1]){const eg=earGeometry(s),em=new THREE.Mesh(eg,earMat);em.name='Folded ear cartilage';em.castShadow=true;root.add(em);furGroup.add(fur(eg,3600,'ear'));
 earInterior(root,furGroup,s);}
 const texture=irisTexture();eye(root,-1,texture);eye(root,1,texture);nose(root);whiskers(root);
 const toeMat=new THREE.MeshStandardMaterial({color:'#a8a397',roughness:1});for(const s of[-1,1])for(const z of[.865+(s===-1?-.09:0),-.96+(s===-1?.07:-.035)])for(const off of[-.048,.044]){const x=s*(z>0?.326:.376)+off;const mesh=new THREE.Mesh(sweep([[x,.080,z+.173],[x,.121,z+.175],[x,.164,z+.14]],[.0023,.003,.001],14,5),toeMat);mesh.name='Subtle toe separation';root.add(mesh);}
 root.updateMatrixWorld(true);const sharedFur=furGroup.children.find(o=>o.isMesh&&o.userData.groomClass==='coat').material;for(const mesh of furGroup.children){if(!mesh.isMesh||mesh.userData.groomClass!=='coat')continue;if(mesh.material!==sharedFur)mesh.material.dispose();mesh.material=sharedFur;}batchStatic(root);root.updateMatrixWorld(true);let triangles=0;root.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});let groomCount=0,tuftCount=0;furGroup.traverse(o=>{if(o.isMesh){groomCount+=o.userData.fiberCount||0;tuftCount+=o.userData.tuftCount||0;}});const metrics={hairs:groomCount,tufts:tuftCount,triangles,resolution,seed:1947,fiberMethod:'Eight authored alpha-cutout fibers on each tapered geometric tuft, plus individual swept ear and muzzle hairs.'};root.userData.metrics=metrics;distanceAt=()=>1;return {root,furGroup,body,metrics};
}
