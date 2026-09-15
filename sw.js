/* FormFuel service worker.
   The app is one HTML file with everything inlined, so caching the shell
   makes it work with no network at all. Bump CACHE on every deploy or
   people keep the old build forever. */
var CACHE = "formfuel-v13";
var SHELL = ["./", "./index.html", "./manifest.json",
             "./icon-180.png", "./icon-192.png", "./icon-512.png",
             "./icon-512-maskable.png", "./favicon.ico", "./FreeFont-LICENSE.txt"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); })
              .then(function(){ return self.skipWaiting(); }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; })
                           .map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  var url = new URL(req.url);

  /* Food lookups must never be served stale, and a failed lookup must
     never be cached — the app has its own cache for successful ones. */
  if(url.hostname.indexOf("openfoodfacts") >= 0){
    e.respondWith(fetch(req).catch(function(){
      return new Response(JSON.stringify({status:0, offline:true}),
                          {headers:{"Content-Type":"application/json"}});
    }));
    return;
  }

  /* Everything else: serve from cache, refresh in the background. */
  e.respondWith(caches.match(req).then(function(hit){
    var live = fetch(req).then(function(res){
      if(res && res.status === 200 && res.type === "basic"){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
      }
      return res;
    }).catch(function(){ return hit; });
    return hit || live;
  }));
});
