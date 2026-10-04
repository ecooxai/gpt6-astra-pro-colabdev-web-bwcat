import * as THREE from 'three';import fs from 'node:fs/promises';import path from 'node:path';import {fitCamera,projectedBounds} from '../src/framing.js';
const root=path.resolve(import.meta.dirname,'..');const data=JSON.parse(await fs.readFile(root+'/public/process/model-bounds.json','utf8'));const box=new THREE.Box3(new THREE.Vector3(...data.min),new THREE.Vector3(...data.max));
const views={three:[5.2,2.85,5.4],front:[0,1.88,8],left:[-8,1.88,-.32],right:[8,1.88,-.32],back:[0,1.88,-8]};
let cases=0,passed=0,baselineClipped=0,minMargin=Infinity;const failures=[],rows=['case,view,width_css,height_css,device_pixel_ratio,projection_score,passed,min_ndc_x,max_ndc_x,min_ndc_y,max_ndc_y,camera_distance,baseline_clipped'];
const started=performance.now();
for(const [view,position] of Object.entries(views))for(let wi=0;wi<40;wi++)for(let hi=0;hi<25;hi++)for(const dpr of[1,1.25,1.7,2]){
 const width=Math.round(280+wi*(2560-280)/39),height=Math.round(320+hi*(1440-320)/24),target=new THREE.Vector3(0,view==='three'?1.30:1.43,-.32),aspect=width/height;
 const camera=view==='three'?new THREE.PerspectiveCamera(width<600?44:30,aspect,.1,100):new THREE.OrthographicCamera(-1,1,1,-1,.1,100);camera.position.set(...position);camera.lookAt(target);
 if(camera.isOrthographicCamera){const h=Math.max(3.4,(['left','right'].includes(view)?4.4:2.25)/aspect);camera.left=-h*aspect/2;camera.right=h*aspect/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();}
 const before=projectedBounds(camera,box),baseline=[before.minX,before.minY].some(v=>v< -1)||[before.maxX,before.maxY].some(v=>v>1);if(baseline)baselineClipped++;
 const baseDistance=camera.position.distanceTo(target),fit=fitCamera(camera,box,target,width,height,{baseDistance});const bounds=projectedBounds(camera,box);
 const finite=Object.values(bounds).every(Number.isFinite);const margin=Math.min(1+bounds.minX,1-bounds.maxX,1+bounds.minY,1-bounds.maxY);minMargin=Math.min(minMargin,margin);
 const pass=finite&&bounds.minX>=-.881&&bounds.maxX<=.881&&bounds.minY>=-fit.fillY-.001&&bounds.maxY<=fit.fillY+.001&&bounds.minZ>=-1&&bounds.maxZ<=1;
 const score=pass?100:Math.max(0,100-Math.max(0,-margin)*100);cases++;if(pass)passed++;else if(failures.length<100)failures.push({case:cases,view,width,height,dpr,bounds});
 rows.push([cases,view,width,height,dpr,score.toFixed(2),pass,...['minX','maxX','minY','maxY'].map(k=>bounds[k].toFixed(6)),fit.distance.toFixed(6),baseline].join(','));
}
const report={cases,passed,failed:cases-passed,baselineClipped,minNormalizedMargin:minMargin,durationMs:performance.now()-started,modelBounds:data,method:'20,000 distinct camera/viewport/DPR configurations are constructed and numerically projected using the same fitting helper as the live viewer. No reference pixels are inspected. These are computational projection tests, not 20,000 rendered or manually reviewed visual iterations.',scoreMeaning:'Each per-case score measures framing constraints only. It is not a reference-similarity score or an AAA quality rating.',failures};
await fs.writeFile(root+'/public/process/GPT6-Astra-Pro_ColabDev_Web_framing-trials.csv',rows.join('\n')+'\n');await fs.writeFile(root+'/public/process/framing-validation.json',JSON.stringify(report,null,2));
const manifestPath=root+'/public/manifest.json',m=JSON.parse(await fs.readFile(manifestPath,'utf8'));m.qa={cases,passed,failed:cases-passed,baselineClipped,report:'process/framing-validation.json',trials:'process/GPT6-Astra-Pro_ColabDev_Web_framing-trials.csv'};m.revision=new Date().toISOString();await fs.writeFile(manifestPath,JSON.stringify(m,null,2));
console.log(JSON.stringify(report,null,2));if(passed!==cases)process.exitCode=1;
