/* FormFuel service worker.
   The app is one HTML file with everything inlined, so caching the shell
   makes it work with no network at all. Bump CACHE on every deploy or
   people keep the old build forever. */
var CACHE = "formfuel-v16";
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

/* The page asks which cache is serving it, so a half-landed deploy shows up
   as a warning in the console instead of looking like the fix failed. */
self.addEventListener("message", function(e){
  if(e.data && e.data.q === "cache" && e.ports && e.ports[0]){
    e.ports[0].postMessage({cache: CACHE});
  }
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

  /* The page itself is network-first.

     It used to be cache-first like everything else, which meant a deploy
     did not appear until the SECOND load: the first one served the old
     HTML from cache and only then fetched the new copy into it. Someone
     who pushed a fix, reloaded, and saw no change was looking at a real
     symptom of this, not at a failed fix.

     Offline still works — the cache is the fallback, and the shell is
     already there from install. */
  if(req.mode === "navigate" || req.destination === "document"){
    e.respondWith(
      fetch(req).then(function(res){
        if(res && res.status === 200 && res.type === "basic"){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      }).catch(function(){
        return caches.match(req).then(function(hit){
          return hit || caches.match("./index.html");
        });
      })
    );
    return;
  }

  /* Icons, the manifest, the licence: cache first, refreshed behind you.
     These change rarely and are not worth a round trip on every load. */
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
