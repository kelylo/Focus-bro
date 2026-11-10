let updateRequested = false;

function showUpdate(registration: ServiceWorkerRegistration): void {
  if (document.getElementById('focus-update')) return;
  const update = document.createElement('div');
  update.id = 'focus-update';
  update.className = 'focus-update';
  update.setAttribute('role', 'status');
  update.innerHTML = '<strong>Update available</strong><span>Refresh Focus Bro to use the latest version.</span><button type="button">Update now</button>';
  document.body.appendChild(update);
  const button = update.querySelector('button');
  if (!button) return;
  button.onclick = (): void => {
    button.disabled = true;
    button.textContent = 'Updating…';
    updateRequested = true;
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'FOCUS_BRO_ACTIVATE_UPDATE' });
    } else {
      update.remove();
      window.location.reload();
    }
  };
}

export function registerUpdates(): void {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  navigator.serviceWorker.register('../service-worker.js?v=16').then((registration) => {
    registration.update();
    if (registration.waiting) showUpdate(registration);
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate(registration);
      });
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!updateRequested) return;
      document.getElementById('focus-update')?.remove();
      window.location.reload();
    });
  }).catch((error: unknown) => {
    console.warn('Focus Bro update check failed.', error);
  });
}
