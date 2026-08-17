const CACHE_NAME =
  "habits-cache-v4";


const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.png"
];


/* ==========================================
   インストール
========================================== */

self.addEventListener(
  "install",
  event => {

    event.waitUntil(

      caches
        .open(
          CACHE_NAME
        )
        .then(
          cache =>
            cache.addAll(
              APP_FILES
            )
        )

    );


    self.skipWaiting();
  }
);


/* ==========================================
   古いキャッシュ削除
========================================== */

self.addEventListener(
  "activate",
  event => {

    event.waitUntil(

      caches
        .keys()
        .then(
          keys => {

            return Promise.all(

              keys
                .filter(
                  key =>
                    key
                    !== CACHE_NAME
                )
                .map(
                  key =>
                    caches.delete(
                      key
                    )
                )

            );

          }
        )

    );


    self.clients.claim();
  }
);


/* ==========================================
   通信
========================================== */

self.addEventListener(
  "fetch",
  event => {

    const request =
      event.request;


    if (
      request.method
      !== "GET"
    ) {

      return;
    }


    /*
      HTML画面は
      ネットがあれば最新版優先。

      オフラインなら
      キャッシュを使う。
    */

    if (
      request.mode
      === "navigate"
    ) {

      event.respondWith(

        fetch(request)

          .then(
            response => {

              const copy =
                response.clone();


              caches
                .open(
                  CACHE_NAME
                )
                .then(
                  cache => {

                    cache.put(
                      "./index.html",
                      copy
                    );

                  }
                );


              return response;
            }
          )

          .catch(
            async () => {

              return (
                await caches.match(
                  "./index.html"
                )
                ||
                await caches.match(
                  "./"
                )
              );

            }
          )

      );


      return;
    }


    /*
      その他の画像・フォントなどは
      キャッシュ優先。

      裏で最新版も取りにいく。
    */

    event.respondWith(

      caches
        .match(
          request
        )
        .then(
          cached => {

            const network =
              fetch(request)

                .then(
                  response => {

                    if (
                      response.ok
                      ||
                      response.type
                      === "opaque"
                    ) {

                      const copy =
                        response.clone();


                      caches
                        .open(
                          CACHE_NAME
                        )
                        .then(
                          cache => {

                            cache.put(
                              request,
                              copy
                            );

                          }
                        );
                    }


                    return response;
                  }
                )

                .catch(
                  () => null
                );


            if (cached) {

              return cached;
            }


            return network
              .then(
                response => {

                  return (
                    response
                    ||
                    new Response(
                      "",
                      {
                        status: 504
                      }
                    )
                  );

                }
              );

          }
        )

    );

  }
);
