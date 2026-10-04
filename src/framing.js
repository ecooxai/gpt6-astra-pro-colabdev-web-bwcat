import * as THREE from 'three';
export function boxCorners(box){
 const points=[];for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z])points.push(new THREE.Vector3(x,y,z));return points;
}
/** Fit a real world-space bounding box, including ears, whiskers and tail.
 * Only preset/resize operations call this; free orbit and intentional close-up zoom remain unrestricted.
 */
export function fitCamera(camera,box,target,width,height,{baseDistance=0,minHeight=3.4}={}){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0||box.isEmpty())throw new Error('Invalid camera framing inputs');
 const aspect=width/height,fillX=.88,fillY=Math.min(.86,Math.max(.45,1-112/height));
 let direction=camera.position.clone().sub(target);if(direction.lengthSq()<1e-8)direction.set(0,.1,1);direction.normalize();
 camera.lookAt(target);camera.updateMatrixWorld(true);const inverse=camera.quaternion.clone().invert();const points=boxCorners(box).map(p=>p.sub(target).applyQuaternion(inverse));
 let distance=Math.max(baseDistance,4);
 if(camera.isPerspectiveCamera){
  camera.aspect=aspect;camera.fov=width<600?44:30;const tanV=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),tanH=tanV*aspect;
  for(const p of points)distance=Math.max(distance,p.z+Math.abs(p.x)/(tanH*fillX),p.z+Math.abs(p.y)/(tanV*fillY),p.z+camera.near*2);
  distance*=1.005;
 }else if(camera.isOrthographicCamera){
  let h=minHeight;for(const p of points)h=Math.max(h,2*Math.abs(p.y)/fillY,2*Math.abs(p.x)/(aspect*fillX));h*=1.005;
  camera.left=-h*aspect/2;camera.right=h*aspect/2;camera.top=h/2;camera.bottom=-h/2;camera.zoom=1;distance=Math.max(distance,8);
 }else throw new Error('Unsupported camera type');
 camera.position.copy(target).addScaledVector(direction,distance);camera.far=Math.max(100,distance+box.getSize(new THREE.Vector3()).length()*2);camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
 return {distance,fillX,fillY,aspect};
}
export function projectedBounds(camera,box){
 camera.updateMatrixWorld(true);let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
 for(const p of boxCorners(box)){p.project(camera);minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);minZ=Math.min(minZ,p.z);maxZ=Math.max(maxZ,p.z);}
 return {minX,maxX,minY,maxY,minZ,maxZ};
}
