const CACHE_NAME =
  "habits-cache-v1";


const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.png"
];


/*
  最初にアプリ本体を保存
*/

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


/*
  新しいService Workerを
  すぐ有効化
*/

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


/*
  通信時

  キャッシュがあればまず利用。
  なければネットから取得して保存。
*/

self.addEventListener(
  "fetch",
  event => {

    if (
      event.request.method
      !== "GET"
    ) {

      return;
    }


    event.respondWith(

      caches
        .match(
          event.request
        )
        .then(
          cached => {

            if (cached) {

              /*
                裏では最新版を
                取りに行っておく
              */

              fetch(
                event.request
              )
                .then(
                  response => {

                    if (
                      response
                      &&
                      response.ok
                    ) {

                      caches
                        .open(
                          CACHE_NAME
                        )
                        .then(
                          cache => {

                            cache.put(
                              event.request,
                              response.clone()
                            );

                          }
                        );

                    }

                  }
                )
                .catch(
                  () => {}
                );


              return cached;
            }


            return fetch(
              event.request
            )
              .then(
                response => {

                  if (
                    !response
                    ||
                    !response.ok
                  ) {

                    return response;
                  }


                  const copy =
                    response.clone();


                  caches
                    .open(
                      CACHE_NAME
                    )
                    .then(
                      cache => {

                        cache.put(
                          event.request,
                          copy
                        );

                      }
                    );


                  return response;
                }
              );

          }
        )

    );

  }
);
