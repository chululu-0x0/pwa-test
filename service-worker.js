const CACHE_NAME = "habits-cache-v11";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.png",
  "./hanamaru.png",
  "./memo_heart.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(APP_FILES);
      })
  );

  self.skipWaiting();
});


self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name !== CACHE_NAME;
            })
            .map((name) => {
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});


self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  /*
    ページ遷移はネット優先。
    GitHub Pages上の最新版を取りやすくする。
  */
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();

          caches
            .open(CACHE_NAME)
            .then((cache) => {
              cache.put(
                "./index.html",
                copy
              );
            });

          return response;
        })
        .catch(async () => {
          const cached =
            await caches.match(
              "./index.html"
            );

          return (
            cached ||
            caches.match("./")
          );
        })
    );

    return;
  }

  /*
    その他の画像・CSS・フォントなどは
    キャッシュがあれば即表示しつつ、
    裏で最新版へ更新。
  */
  event.respondWith(
    caches
      .match(request)
      .then((cached) => {

        const networkFetch =
          fetch(request)
            .then((response) => {

              if (
                response &&
                (
                  response.status === 200 ||
                  response.type === "opaque"
                )
              ) {
                const copy =
                  response.clone();

                caches
                  .open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(
                      request,
                      copy
                    );
                  });
              }

              return response;
            });

        return (
          cached ||
          networkFetch
        );
      })
  );
});
