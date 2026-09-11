/* =====================================================
   ごみニコ Service Worker
   戦略: アプリシェル → キャッシュ優先 / データ → ネットワーク優先
===================================================== */

const CACHE_NAME   = 'gomi-nico-v225';
const SHELL_ASSETS = [
  '/shiki/',
  '/shiki/index.html',
  '/warabi/',
  '/warabi/index.html',
  '/toda/',
  '/toda/index.html',
  '/kawaguchi/',
  '/kawaguchi/index.html',
  '/okegawa/',
  '/kitamoto/',
  '/yoshimi/',
  '/yachimata/',
  '/tokigawa/',
  '/sosa/',
  '/oamishirasato/',
  '/choshi/',
  '/isumi/',
  '/kujukuri/',
  '/inashiki/',
  '/tako/',
  '/ryugasaki/',
  '/ushiku/',
  '/ami/',
  '/kasumigaura/',
  '/kawachi/',
  '/miho/',
  '/goka/',
  '/sakai/',
  '/ishioka/',
  '/namegata/',
  '/sakuragawa/',
  '/hokota/',
  '/nogi/',
  '/takanezawa/',
  '/nasu/',
  '/ohtawara/',
  '/nakagawa_tochigi/',
  '/shioya/',
  '/meiwa/',
  '/oi/',
  '/yamakita/',
  '/yugawara/',
  '/oiso/',
  '/ninomiya/',
  '/sodegaura/',
  '/script.js',
  '/data_shiki.json',
  '/data_warabi.json',
  '/data_toda.json',
  '/data_kawaguchi.json',
  '/data_okegawa.json',
  '/data_kitamoto.json',
  '/data_yoshimi.json',
  '/data_yachimata.json',
  '/data_tokigawa.json',
  '/data_sosa.json',
  '/data_oamishirasato.json',
  '/data_choshi.json',
  '/data_isumi.json',
  '/data_kujukuri.json',
  '/data_inashiki.json',
  '/data_tako.json',
  '/data_ryugasaki.json',
  '/data_ushiku.json',
  '/data_ami.json',
  '/data_kasumigaura.json',
  '/data_kawachi.json',
  '/data_miho.json',
  '/data_goka.json',
  '/data_sakai.json',
  '/data_ishioka.json',
  '/data_namegata.json',
  '/data_sakuragawa.json',
  '/data_hokota.json',
  '/data_nogi.json',
  '/data_takanezawa.json',
  '/data_nasu.json',
  '/data_ohtawara.json',
  '/data_nakagawa_tochigi.json',
  '/data_shioya.json',
  '/data_meiwa.json',
  '/data_oi.json',
  '/data_yamakita.json',
  '/data_yugawara.json',
  '/data_oiso.json',
  '/data_ninomiya.json',
  '/data_sodegaura.json',
  '/manifest.json',
  '/favicon.ico',
  '/icons/favicon-32x32.png',
  '/icons/favicon-16x16.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/moeru.svg',
  '/icons/moenai.svg',
  '/icons/recycle.svg',
  '/icons/plastic.svg',
  '/icons/danger.svg',
  '/icons/harmful.svg',
  '/icons/sodai.svg',
  '/icons/none.svg',
  '/icons/common_gomi.svg',
  '/icons/metal.svg',
  '/icons/harmful_light_mercury.svg',
  '/icons/can_drink_only.svg',
];

/* ── インストール: アプリシェルを事前キャッシュ ── */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(SHELL_ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* ── アクティベート: 古いキャッシュを削除 ── */
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k)   { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ── フェッチ: キャッシュ優先（オフライン対応） ── */
self.addEventListener('fetch', function(e) {
  // CDN（Tailwind・Material Symbols）はキャッシュしない
  if (e.request.url.includes('cdn.') || e.request.url.includes('fonts.')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;

      return fetch(e.request).then(function(res) {
        // 正常なレスポンスのみキャッシュに追加
        if (res && res.status === 200 && res.type === 'basic') {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return res;
      }).catch(function() {
        // オフライン時はトップページにフォールバック
        if (e.request.mode === 'navigate') {
          return caches.match('/shiki/');
        }
      });
    })
  );
});
