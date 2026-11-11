export function registerUpdates(): void {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  navigator.serviceWorker.register('../service-worker.js?v=22').then((registration) => {
    registration.update();
  }).catch((error: unknown) => {
    console.warn('Focus Bro update check failed.', error);
  });
}
