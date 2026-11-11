interface FocusGame {
  level: number;
  xp: number;
  nextLevel: number;
}

interface FocusGameApi {
  get(): FocusGame;
}

interface FocusAuthApi {
  getState(): { user: unknown };
}

declare global {
  interface Window {
    FocusBroGame?: FocusGameApi;
    FocusBroAuth?: FocusAuthApi;
  }
}

const links = [
  ['dashboard', 'Focus room', 'Video, notes + progress', 'O'],
  ['focus-room', 'Self-taught room', 'Goals + atomic habits', '+'],
  ['timetable', 'Timetable', 'Study, revise + rest', 'T'],
  ['tasks', 'Tasks', 'Plan the next action', '-'],
  ['analytics', 'Analytics', 'See your learning signals', 'A']
] as const;

function renderGame(): void {
  const status = document.getElementById('game-status');
  const gameApi = window.FocusBroGame;
  if (!status || !gameApi) return;
  const game = gameApi.get();
  const level = status.querySelector('strong');
  const xp = status.querySelector('span');
  const bar = status.querySelector('i');
  const message = status.querySelector('small');
  if (!level || !xp || !bar || !message) return;
  const floor = (game.level - 1) * 100;
  level.textContent = `Level ${game.level}`;
  xp.textContent = `${game.xp} XP`;
  bar.style.width = `${Math.min(100, Math.round(((game.xp - floor) / 100) * 100))}%`;
  message.textContent = window.FocusBroAuth?.getState().user
    ? `Keep going: ${game.nextLevel - game.xp} XP to level ${game.level + 1}`
    : 'Sign in to keep your streak and XP';
}

function createNavigation(): void {
  const page = (location.pathname.split(/[\\/]/).pop() || 'dashboard').replace(/\.html$/i, '');
  const nav = document.createElement('aside');
  nav.className = 'site-sidebar';
  nav.setAttribute('aria-label', 'Focus Bro learning menu');
  const items = links.map(([href, title, description, icon]) => {
    const active = page.toLowerCase() === href.toLowerCase();
    return `<a class="site-link${active ? ' active' : ''}" href="${href}"><span>${icon}</span><div>${title}<small>${description}</small></div></a>`;
  }).join('');
  nav.innerHTML = `<a class="site-brand" href="dashboard"><img src="../assets/images/Focus%20bro.png" alt="Focus Bro logo"><span><strong>Focus Bro</strong><small>In the pursuit of greatness</small></span></a><div id="focus-auth-slot"></div><div class="game-status" id="game-status"><div class="game-status-top"><strong>Level 1</strong><span>0 XP</span></div><div class="game-bar"><i></i></div><small>Sign in to keep your streak and XP</small></div><div class="site-section">Your learning system</div>${items}<div class="site-quote">One lesson. One clear next action. Protect your attention and let consistency compound.</div>`;
  const toggle = document.createElement('button');
  toggle.className = 'site-sidebar-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Open learning menu');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.textContent = '=';
  const backdrop = document.createElement('div');
  backdrop.className = 'site-sidebar-backdrop';
  const close = (): void => {
    nav.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
  };
  toggle.onclick = (): void => {
    const open = !nav.classList.contains('open');
    nav.classList.toggle('open', open);
    backdrop.classList.toggle('open', open);
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  backdrop.onclick = close;
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
  document.body.prepend(backdrop, nav, toggle);
  document.addEventListener('focusbro:game-change', renderGame);
  document.addEventListener('focusbro:state-ready', renderGame);
  setTimeout(renderGame, 0);
}

if (document.body) createNavigation();
