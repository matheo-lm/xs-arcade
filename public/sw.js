const CACHE_NAME = "xs-arcade-shell-v3";
const SHELL_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/assets/icon.svg"
];

const isSameOrigin = (request) => {
  const url = new URL(request.url);
  return url.origin === self.location.origin;
};

const isAssetRequest = (request) => {
  const url = new URL(request.url);
  return url.pathname.startsWith("/assets/");
};

const isNavigationRequest = (request) => request.mode === "navigate";

const putInCache = async (request, response) => {
  if (!response.ok || !isSameOrigin(request)) return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    })
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (!isSameOrigin(event.request)) {
    return;
  }

  if (isNavigationRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          void putInCache(event.request, response);
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(event.request);
          if (cachedPage) return cachedPage;
          return caches.match("/");
        })
    );
    return;
  }

  if (isAssetRequest(event.request)) {
    event.respondWith(
      caches.match(event.request).then(async (cached) => {
        const network = fetch(event.request)
          .then((response) => {
            void putInCache(event.request, response);
            return response;
          })
          .catch(() => undefined);

        if (cached) {
          void network;
          return cached;
        }

        const fresh = await network;
        if (fresh) return fresh;
        return caches.match("/");
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          void putInCache(event.request, response);
          return response;
        })
        .catch(() => caches.match("/"));
    })
  );
});
