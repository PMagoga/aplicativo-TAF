const CACHE_NAME = "taf-cache-v1";
const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/js/script.js",
  "./assets/js/utils.js",
  "./assets/js/indices.js",
  "./assets/js/desempenho.js",
  "./assets/css/style.css",
  "./assets/images/discobulo.png",
  "./assets/images/botao-home.png",
];

// Instala o service worker e adiciona os arquivos ao cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Ativa e remove caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
  );
});

// Intercepta requisições e responde do cache quando possível
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
