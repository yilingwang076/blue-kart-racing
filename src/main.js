import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './style.css';

const $ = (id) => document.getElementById(id);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdceaf6);
scene.fog = new THREE.FogExp2(0xdceaf6, 0.0038);
const camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, 0.1, 1500);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = false;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
$('scene').appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xf3f8ff, 0x92a4b2, 1.6));
const sun = new THREE.DirectionalLight(0xffffff, 1.7);
sun.position.set(-60, 100, -40);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -45; sun.shadow.camera.right = 45;
sun.shadow.camera.top = 45; sun.shadow.camera.bottom = -45;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 220;
sun.shadow.bias = -0.0003;
scene.add(sun, sun.target);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshLambertMaterial({ color: 0xdce8f1 }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.12; ground.receiveShadow = true;
scene.add(ground);

const anchors = [[0,0],[55,0],[120,-7],[195,-33],[265,-40],[345,-16],[445,9],[535,-14],[650,-48],[760,-42],[900,-5],[1040,-19]];
function centerAt(s) {
  s = Math.max(0, Math.min(1040, s));
  let i = 0;
  while (i < anchors.length - 2 && s > anchors[i+1][0]) i++;
  const a = anchors[i], b = anchors[i+1];
  const t = (s-a[0])/(b[0]-a[0]);
  const p0 = anchors[Math.max(0,i-1)][1], p1 = a[1], p2 = b[1], p3 = anchors[Math.min(anchors.length-1,i+2)][1];
  return .5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t);
}
function roadFrame(s) {
  const dx = (centerAt(s+0.2)-centerAt(s-0.2)) / 0.4;
  const l = Math.hypot(1, dx);
  return { x: centerAt(s), rx: 1/l, rz: dx/l };
}
const roadWidth = 18;
function strip(width, offset, color, height = 0.015, start = -20, end = 1040, step = 2) {
  const vertices = [], indices = [];
  for (let s = start; s < end; s = Math.min(end, s + step)) {
    const f = roadFrame(s);
    for (const side of [-1, 1]) vertices.push(f.x+f.rx*(offset+side*width/2), height, -s+f.rz*(offset+side*width/2));
  }
  const f = roadFrame(end);
  for (const side of [-1, 1]) vertices.push(f.x+f.rx*(offset+side*width/2), height, -end+f.rz*(offset+side*width/2));
  const count = vertices.length/6;
  for (let i=0;i<count-1;i++) {const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2)}
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices,3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide, emissive: color, emissiveIntensity: width<.3?.16:0 }));
  mesh.receiveShadow = true; scene.add(mesh); return mesh;
}
strip(roadWidth,0,0x748599,0.002);
strip(.16,-roadWidth/2+.12,0xffcc66,0.02);
strip(.16, roadWidth/2-.12,0x9cffff,0.02);
// Every dash follows the road centerline; all dashes share one draw call.
const dashVertices=[], dashIndices=[];
for (let s=12;s<1030;s+=14) {
  const base=dashVertices.length/3;
  for(let j=0;j<=8;j++) {
    const p=s+j*.4, f=roadFrame(p);
    for(const side of [-1,1])dashVertices.push(f.x+f.rx*side*.08,.035,-p+f.rz*side*.08);
    if(j<8){const k=base+j*2;dashIndices.push(k,k+1,k+2,k+1,k+3,k+2)}
  }
}
const dashGeometry=new THREE.BufferGeometry();
dashGeometry.setAttribute('position',new THREE.Float32BufferAttribute(dashVertices,3));
dashGeometry.setIndex(dashIndices);dashGeometry.computeVertexNormals();
scene.add(new THREE.Mesh(dashGeometry,new THREE.MeshBasicMaterial({color:0xf7f9fb,side:THREE.DoubleSide})));
const postMat = new THREE.MeshLambertMaterial({color:0x87949c});
const postGeometry = new THREE.BoxGeometry(.12,.7,.12);
const postPositions=[];
for(let s=60;s<1040;s+=23) for(const side of [-1,1]) {
  const f=roadFrame(s);
  postPositions.push([f.x+f.rx*side*11.2,.35,-s+f.rz*side*11.2]);
}
const posts=new THREE.InstancedMesh(postGeometry,postMat,postPositions.length);
const postObject=new THREE.Object3D();
postPositions.forEach((p,i)=>{postObject.position.set(...p);postObject.updateMatrix();posts.setMatrixAt(i,postObject.matrix)});
posts.instanceMatrix.needsUpdate=true;scene.add(posts);
// Simple white massing on both sides: varied heights and setbacks, no textures.
const buildingBlocks=[];
const variation=n=>{const v=Math.sin(n*127.1+78.233)*43758.5453;return v-Math.floor(v)};
for(let s=38;s<1030;s+=25) for(const side of [-1,1]) {
  for(let row=0;row<2;row++) {
    const seed=s*3+side*71+row*19;
    if(row===1&&variation(seed)<.32)continue;
    const f=roadFrame(s+(variation(seed+1)-.5)*7);
    const offset=side*(row===0?22+variation(seed+2)*5:36+variation(seed+3)*7);
    const width=7+variation(seed+4)*8;
    const depth=9+variation(seed+5)*11;
    const height=(row===0?7:12)+variation(seed+6)*(row===0?17:23);
    const x=f.x+f.rx*offset, z=-s+f.rz*offset;
    const rotation=Math.atan2(-f.rz,f.rx);
    buildingBlocks.push({x,z,width,depth,height,rotation,shade:variation(seed+7)});
    if(variation(seed+8)>.73)buildingBlocks.push({x:x+f.rx*side*width*.21,z:z+f.rz*side*width*.21,width:width*.54,depth:depth*.62,height:height+3+variation(seed+9)*5,rotation,shade:variation(seed+10)});
  }
}
const buildingGeometry=new THREE.BoxGeometry(1,1,1);
const buildingMaterial=new THREE.MeshLambertMaterial({color:0xffffff});
const buildings=new THREE.InstancedMesh(buildingGeometry,buildingMaterial,buildingBlocks.length);
const object=new THREE.Object3D();
buildingBlocks.forEach((b,i)=>{
  object.position.set(b.x,b.height/2-.12,b.z);
  object.rotation.set(0,b.rotation,0);
  object.scale.set(b.width,b.height,b.depth);
  object.updateMatrix();buildings.setMatrixAt(i,object.matrix);
  buildings.setColorAt(i,new THREE.Color().setHSL(.57,.12,.83+b.shade*.10));
});
buildings.instanceMatrix.needsUpdate=true;
buildings.castShadow=false;buildings.receiveShadow=false;
scene.add(buildings);
const checkpoints = [170,390,680,920];
const checkpointObjects=[];
for(const s of checkpoints) {
  const f=roadFrame(s), group=new THREE.Group();
  group.position.set(f.x,0,-s);
  const glow = new THREE.Mesh(new THREE.TorusGeometry(1.45,.09,6,32),new THREE.MeshBasicMaterial({color:0x9ffaf5}));
  glow.rotation.x=Math.PI/2;glow.position.y=.075;group.add(glow);
  for(const side of [-1,1]) {
    const marker = new THREE.Mesh(new THREE.BoxGeometry(.22,1.7,.22),new THREE.MeshBasicMaterial({color:0xa8fbf5}));
    marker.position.set(side*8.4,.85,0);group.add(marker);
  }
  scene.add(group);checkpointObjects.push(group);
}

const kart = new THREE.Group();
scene.add(kart);
const carVisual = new THREE.Group();kart.add(carVisual);
new GLTFLoader().load('/models/SU7_Kart_LowPoly.glb', gltf => {
  const model=gltf.scene;
  model.traverse(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true}});
  const bounds=new THREE.Box3().setFromObject(model);
  const center=bounds.getCenter(new THREE.Vector3());
  model.position.set(-center.x,-bounds.min.y,-center.z);
  carVisual.add(model);
}, undefined, error=>{$('message').textContent='蓝车模型加载失败：请检查 public/models 中的文件';console.error(error)});
const shadow = new THREE.Mesh(new THREE.CircleGeometry(2.1,32),new THREE.MeshBasicMaterial({color:0x344458,transparent:true,opacity:.19,depthWrite:false}));
shadow.rotation.x=-Math.PI/2;shadow.position.y=.043;scene.add(shadow);

const state={x:0,z:8,y:0,vy:0,yaw:0,speed:0,steer:0,lane:0,lateralSpeed:0,progress:-8,slip:0,boost:0,distance:0,checkpoints:0,paused:false,camera:0};
const keys=new Set(), touch=new Set();
function pressed(...names){return names.some(k=>keys.has(k)||touch.has(k))}
function reset(){Object.assign(state,{x:0,z:8,y:0,vy:0,yaw:0,speed:0,steer:0,lane:0,lateralSpeed:0,progress:-8,slip:0,boost:0,distance:0,checkpoints:0,paused:false});kart.position.set(0,0,8);kart.rotation.y=Math.PI;$('message').textContent='W / ↑ 沿路前进 · A / D 在车道内移动 · 空格漂移';checkpointObjects.forEach(o=>o.visible=true)}
function action(name){
  if(name==='reset')reset();
  if(name==='camera')state.camera=(state.camera+1)%2;
  if(name==='pause'){state.paused=!state.paused;$('message').textContent=state.paused?'已暂停 · 按 P 继续':'继续驾驶';}
  if(name==='fullscreen'){if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.()}
  if(name==='help')$('help').classList.toggle('hidden');
}
window.addEventListener('keydown',e=>{
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
  keys.add(e.code);
  if(e.repeat)return;
  const actions={KeyR:'reset',KeyT:'reset',KeyC:'camera',KeyP:'pause',KeyF:'fullscreen',KeyH:'help'};
  if(actions[e.code])action(actions[e.code]);
  if(e.code==='KeyJ'&&state.y===0)state.vy=7.4;
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{keys.clear();touch.clear()});
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>action(b.dataset.action)));
document.querySelectorAll('[data-hold]').forEach(b=>{
  const set=on=>on?touch.add(b.dataset.hold):touch.delete(b.dataset.hold);
  b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);set(true)});
  b.addEventListener('pointerup',()=>set(false));b.addEventListener('pointercancel',()=>set(false));
});
function update(dt){
  if(state.paused||!$('help').classList.contains('hidden'))return;
  const gas=pressed('ArrowUp','KeyW','gas'), brake=pressed('ArrowDown','KeyS','brake');
  const left=pressed('ArrowLeft','KeyA','left'),right=pressed('ArrowRight','KeyD','right');
  const drift=pressed('Space'), boosting=pressed('ShiftLeft','ShiftRight','KeyL')&&state.speed>2;
  const wantedSteer=(right?1:0)-(left?1:0);
  state.steer+=(wantedSteer-state.steer)*Math.min(1,dt*7);
  const accel=boosting?29:16;
  if(gas)state.speed+=accel*dt;
  if(brake)state.speed-=((state.speed>0)?30:10)*dt;
  if(!gas&&!brake)state.speed-=Math.sign(state.speed)*Math.min(Math.abs(state.speed), (4+Math.abs(state.speed)*.12)*dt);
  state.speed=THREE.MathUtils.clamp(state.speed,-8,boosting?44:32);
  // Longitudinal motion follows the road. Steering changes lane position only.
  const lateralTarget=state.steer*Math.min(7,Math.abs(state.speed)*.3)*(drift?1.55:1);
  state.lateralSpeed+=(lateralTarget-state.lateralSpeed)*Math.min(1,dt*(drift?3:7));
  const laneLimit=roadWidth/2-1.75; // car body stays inside invisible road walls
  const nextLane=state.lane+state.lateralSpeed*dt;
  state.lane=THREE.MathUtils.clamp(nextLane,-laneLimit,laneLimit);
  if(state.lane!==nextLane)state.lateralSpeed=0;
  state.progress=THREE.MathUtils.clamp(state.progress+state.speed*dt,-8,1035);
  if(state.progress>=1035&&state.speed>0){state.speed=0;$('message').textContent='终点已到！按 R 重新开始'}
  if(state.progress<=-8&&state.speed<0)state.speed=0;
  const f=roadFrame(state.progress);
  state.x=f.x+f.rx*state.lane;
  state.z=-state.progress+f.rz*state.lane;
  const roadSlope=(centerAt(state.progress+.2)-centerAt(state.progress-.2))/.4;
  state.yaw=Math.atan(roadSlope)+Math.atan2(state.lateralSpeed,Math.max(5,Math.abs(state.speed)))*.8;
  const targetSlip=drift?state.steer*Math.min(1,Math.abs(state.speed)/20)*.35:0;
  state.slip+=(targetSlip-state.slip)*Math.min(1,dt*(drift?3.5:5));
  state.vy-=18*dt;state.y+=state.vy*dt;
  if(state.y<0){state.y=0;state.vy=0}
  if(boosting)state.boost+=dt;else state.boost=Math.max(0,state.boost-dt*1.2);
  state.distance+=Math.abs(state.speed)*dt;
  checkpoints.forEach((s,i)=>{if(i===state.checkpoints&&state.progress>=s-2&&state.progress<s+15&&Math.abs(state.lane)<7){state.checkpoints++;checkpointObjects[i].visible=false;$('message').textContent=`检查点 ${state.checkpoints} / ${checkpoints.length}`}});
  kart.position.set(state.x,state.y,state.z);kart.rotation.y=state.yaw+Math.PI;
  carVisual.rotation.z=-state.steer*Math.min(1,Math.abs(state.speed)/22)*.035;
  shadow.position.set(state.x,.044,state.z);shadow.material.opacity=.19/(1+state.y*.5);shadow.scale.setScalar(1+state.y*.12);
  $('speed').innerHTML=`${Math.abs(state.speed).toFixed(1)} <small>u/s</small>`;
  $('throttle').textContent=gas?'ON':'OFF';
  $('steering').textContent=(state.steer>=0?'+':'')+state.steer.toFixed(2);
  $('steering-dot').style.left=`${50+state.steer*46}%`;
  $('drift').textContent=drift&&Math.abs(state.speed)>2?'ON':'OFF';
  $('change').textContent=Math.abs(state.slip).toFixed(2);
  $('boost').textContent=`${state.boost.toFixed(2)} s`;
  $('altitude').textContent=`${state.y.toFixed(1)} m`;
  $('handbrake').textContent=drift?'ENGAGED':'STOWED';
  $('distance').textContent=`${(state.distance/1000).toFixed(2)} km`;
  $('checkpoint').textContent=`${state.checkpoints} checkpoints`;
}
const look=new THREE.Vector3(), desired=new THREE.Vector3();
function renderCamera(dt){
  const forward=new THREE.Vector3(Math.sin(state.yaw),0,-Math.cos(state.yaw));
  const behind=state.camera===0?12:17, height=state.camera===0?8.3:16;
  desired.set(state.x-forward.x*behind,state.y+height,state.z-forward.z*behind);
  if(camera.position.lengthSq()<.001)camera.position.copy(desired);
  camera.position.lerp(desired,1-Math.exp(-dt*4.5));
  look.set(state.x+forward.x*(state.camera===0?16:7),state.y+1.1,state.z+forward.z*(state.camera===0?16:7));
  camera.lookAt(look);
  sun.position.set(state.x-60,100,state.z-40);sun.target.position.set(state.x,0,state.z);sun.target.updateMatrixWorld();
}
reset();kart.position.set(0,0,8);camera.position.set(0,8.3,20);
if(import.meta.env.DEV&&new URLSearchParams(location.search).has('selftest')){
  keys.add('KeyW');
  for(let i=0;i<720;i++)update(1/60);
  const follow={progress:state.progress,lane:state.lane,centerError:state.x-centerAt(state.progress)};
  keys.add('KeyD');
  for(let i=0;i<480;i++)update(1/60);
  const rightWall=state.lane;
  keys.delete('KeyD');keys.add('KeyA');
  for(let i=0;i<480;i++)update(1/60);
  document.body.dataset.drivingSelftest=JSON.stringify({follow,walls:{left:state.lane,right:rightWall,limit:roadWidth/2-1.75}});
  keys.clear();reset();
}
let previous=performance.now(),accumulator=0,frames=0,fpsTime=0;
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(.05,(now-previous)/1000);previous=now;accumulator+=dt;
  while(accumulator>=1/60){update(1/60);accumulator-=1/60}
  renderCamera(dt);renderer.render(scene,camera);
  frames++;fpsTime+=dt;if(fpsTime>=.5){$('fps').textContent=`${Math.round(frames/fpsTime)} FPS`;frames=0;fpsTime=0}
}
requestAnimationFrame(frame);
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
