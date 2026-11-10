# Public deployment assets

The canonical manifest and service worker live in this directory. The root
`service-worker.js` is only a compatibility loader so the worker can retain
root scope while its implementation stays under `public/`.
