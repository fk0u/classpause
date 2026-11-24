// ClassPause service worker: cache-first for immutable build assets,
// network-first for pages (offline fallback), never touches API or live streams.
const CACHE = "classpause-v3";
const SHELL = ["/icon.svg", "/offline.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/") || req.headers.get("accept")?.includes("text/event-stream")) return;

  // Only content-hashed build files are immutable (dev chunks have no hash, so they stay network-only).
  if ((url.pathname.startsWith("/_next/static/") && /[-.][0-9a-f]{8,}\./.test(url.pathname)) || url.pathname === "/icon.svg") {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    })));
    return;
  }

  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/offline.html")));
  }
});

// ---------- Web Push ----------
self.addEventListener("push", (e) => {
  let data = { title: "ClassPause", body: "", url: "/", tag: "classpause" };
  try { data = { ...data, ...e.data.json() }; } catch { if (e.data) data.body = e.data.text(); }
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, tag: data.tag, renotify: true, icon: "/icons/192", badge: "/icons/192",
    data: { url: data.url }, vibrate: [80, 40, 80],
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || "/", self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
    const same = wins.find((w) => w.url.startsWith(self.location.origin));
    if (same) { same.focus(); return same.navigate(url); }
    return self.clients.openWindow(url);
  }));
});
