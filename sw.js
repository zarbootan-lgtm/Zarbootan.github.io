/* Service worker : fonctionnement hors connexion */
const V="epaves-v9",FILES=["./","./index.html","./manifest.webmanifest","./icon-180.png","./icon-192.png","./icon-512.png"],TILES="epaves-tuiles",MAXT=400;
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!==TILES).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
async function trim(c){const ks=await c.keys();if(ks.length>MAXT)for(const k of ks.slice(0,ks.length-MAXT))await c.delete(k)}
self.addEventListener("fetch",e=>{
 const r=e.request;if(r.method!=="GET")return;const u=new URL(r.url);
 if(u.origin===location.origin){
  /* Application : réseau d'abord (mises à jour), sinon copie locale */
  e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res}).catch(()=>caches.match(r).then(m=>m||(r.mode==="navigate"?caches.match("./index.html"):Response.error()))));
  return}
 /* Fonds de carte : on garde ceux déjà vus */
 if(/tile|basemaps|openstreetmap|cartocdn/.test(u.hostname)){
  e.respondWith(caches.open(TILES).then(async c=>{const m=await c.match(r);if(m)return m;try{const res=await fetch(r);if(res.ok||res.type==="opaque"){c.put(r,res.clone());trim(c)}return res}catch(x){return Response.error()}}))}
});
