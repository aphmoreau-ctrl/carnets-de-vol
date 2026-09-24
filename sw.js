/* Carnets de vol : fonctionnement hors ligne */
const CACHE='carnets-v5';
const CORE=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  // Données Firebase : jamais mises en cache ici (Firestore gère son propre mode hors ligne)
  if(u.hostname.includes('googleapis.com')&&!u.hostname.startsWith('fonts.'))return;
  if(u.hostname.includes('firebaseapp.com'))return;
  // Page de l'appli : réseau d'abord pour recevoir les mises à jour, cache si hors ligne
  if(u.origin===location.origin){
    e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(k=>k.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))));
    return;
  }
  // Bibliothèques et polices : cache d'abord
  if(/gstatic\.com|cdnjs\.cloudflare\.com|fonts\.googleapis\.com/.test(u.hostname)){
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const c=res.clone();caches.open(CACHE).then(k=>k.put(e.request,c));return res})));
  }
});
