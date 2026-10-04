import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup,weld,prune,quantize,meshopt} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptDecoder} from 'meshoptimizer';
const root=path.resolve(import.meta.dirname,'..');
const portable=path.join(root,'public/downloads/GPT6-Astra-Pro_ColabDev_ThreeJS_BWCat.glb');
const input=path.resolve(root,process.argv[2]||'public/downloads/GPT6-Astra-Pro_ColabDev_ThreeJS_BWCat.glb');
const raw=path.join(root,'.logs/original-export.glb');
const web=path.join(root,'public/assets/mono.meshopt.glb');
await fs.mkdir(path.dirname(web),{recursive:true});
await fs.mkdir(path.dirname(raw),{recursive:true});
if(input!==raw)await fs.copyFile(input,raw);
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const doc=await io.read(raw);
function countTriangles(document){let n=0;for(const mesh of document.getRoot().listMeshes())for(const p of mesh.listPrimitives()){if(p.getMode()===4)n+=(p.getIndices()?.getCount()||p.getAttribute('POSITION').getCount())/3;}return n;}
const originalTriangles=countTriangles(doc);
// Weld equivalent vertices and remove unreferenced data. Never simplify, flatten, join or replace this project's authored surfaces.
await doc.transform(dedup(),weld(),prune({keepExtras:true}));
const options={quantizePosition:16,quantizeNormal:12,quantizeColor:12,quantizeTexcoord:12};
await doc.transform(quantize(options));
if(countTriangles(doc)!==originalTriangles)throw new Error('Triangle count changed: refusing to publish an altered model.');
await io.write(portable,doc);
await doc.transform(meshopt({...options,encoder:MeshoptEncoder,level:'high'}));
if(countTriangles(doc)!==originalTriangles)throw new Error('Compression unexpectedly changed the triangle count.');
await io.write(web,doc);
const bytes={};for(const [name,file]of[['original',raw],['portable',portable],['web',web]]){const b=await fs.readFile(file);if(b.toString('ascii',0,4)!=='glTF'||b.readUInt32LE(8)!==b.length)throw new Error('Invalid GLB header: '+file);bytes[name]=b.length;}
const report={ready:true,file:'./assets/mono.meshopt.glb',source:'Precomputed copy of the original procedural cat authored in this project; no third-party model assets.',generatorSHA256:createHash('sha256').update(await fs.readFile(root+'/src/cat.js')).digest('hex'),bytes,geometrySimplified:false,triangles:originalTriangles,portableQuantization:{positionBits:16,normalBits:12,colorBits:12,texcoordBits:12},webCompression:'meshopt high, with encoder normal filtering',toolchain:'glTF-Transform direct API; unused glob-based CLI removed'};
await fs.writeFile(root+'/public/model-status.json',JSON.stringify(report,null,2));
await fs.writeFile(root+'/public/process/asset-optimization.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
