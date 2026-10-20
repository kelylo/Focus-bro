(function(){
  var savedTheme=sessionStorage.getItem('focusbro.theme');
  if(savedTheme==='dark'||savedTheme==='light')document.documentElement.setAttribute('data-theme',savedTheme);
  document.body.classList.add('has-site-nav');
  var page=location.pathname.split(/[\\/]/).pop()||'index.html';
  var links=[
    ['Focus-Bro','Focus room','Video, notes + progress','O'],
    ['Study-Techniques','Study techniques','Active recall + memory','>'],
    ['Feyman-techniques','Feynman method','Explain to learn','*'],
    ['Self-Tought-room','Self-taught room','Goals + atomic habits','+'],
    ['Timetable','Timetable','Study, revise + rest','T']
  ];
  var nav=document.createElement('aside');
  nav.className='site-sidebar';
  nav.setAttribute('aria-label','Focus Bro learning menu');
  nav.innerHTML='<a class="site-brand" href="Focus-Bro"><img src="Focus%20bro.png" alt="Focus Bro logo"><span><strong>Focus Bro</strong><small>In the pursuit of greatness</small></span></a><div id="focus-auth-slot"></div><div class="game-status" id="game-status"><div class="game-status-top"><strong>Level 1</strong><span>0 XP</span></div><div class="game-bar"><i></i></div><small>Sign in to keep your streak and XP</small></div><div class="site-section">Your learning system</div>'+
    links.map(function(item){
      var active=decodeURIComponent(page).toLowerCase()===decodeURIComponent(item[0]).toLowerCase();
      return '<a class="site-link'+(active?' active':'')+'" href="'+item[0]+'"><span>'+item[3]+'</span><div>'+item[1]+'<small style="display:block;color:var(--focus-muted);font-size:11px;font-weight:400">'+item[2]+'</small></div></a>';
    }).join('')+
    '<div class="site-quote">One lesson. One clear next action. Protect your attention and let consistency compound.</div>';
  var toggle=document.createElement('button');
  toggle.className='site-sidebar-toggle';
  toggle.type='button';
  toggle.setAttribute('aria-label','Open learning menu');
  toggle.setAttribute('aria-expanded','false');
  toggle.textContent='=';
  var backdrop=document.createElement('div');
  backdrop.className='site-sidebar-backdrop';
  document.body.prepend(backdrop);
  document.body.prepend(nav);
  document.body.prepend(toggle);
  function renderGame(){var status=document.getElementById('game-status');if(!status||!window.FocusBroGame)return;var user=window.FocusBroAuth&&window.FocusBroAuth.getState().user,game=FocusBroGame.get(),floor=(game.level-1)*100,progress=Math.min(100,Math.round((game.xp-floor)/100*100));status.querySelector('strong').textContent='Level '+game.level;status.querySelector('span').textContent=game.xp+' XP';status.querySelector('i').style.width=progress+'%';status.querySelector('small').textContent=user?'Keep going: '+(game.nextLevel-game.xp)+' XP to level '+(game.level+1):'Sign in to keep your streak and XP'}
  document.addEventListener('focusbro:game-change',renderGame);document.addEventListener('focusbro:state-ready',renderGame);setTimeout(renderGame,0);
  function close(){nav.classList.remove('open');backdrop.classList.remove('open');document.body.classList.remove('nav-open');toggle.setAttribute('aria-expanded','false')}
  toggle.onclick=function(){var open=!nav.classList.contains('open');nav.classList.toggle('open',open);backdrop.classList.toggle('open',open);document.body.classList.toggle('nav-open',open);toggle.setAttribute('aria-expanded',String(open))}
  backdrop.onclick=close;
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
  var profile=document.createElement('a');
  profile.className='site-profile-link';
  profile.href='Profile';
  profile.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"></circle><path d="M5 20c.8-3.4 3.1-5.2 7-5.2s6.2 1.8 7 5.2"></path></svg>';
  profile.setAttribute('aria-label','Open account profile');
  profile.title='Account profile';
  profile.addEventListener('click',function(event){
    if(!window.FocusBroAuth||!window.FocusBroAuth.getState().user){
      event.preventDefault();
      document.dispatchEvent(new CustomEvent('focusbro:open-auth'));
    }
  });
  document.addEventListener('focusbro:user-change',function(event){
    var image=event.detail&&event.detail.avatar_url;
    profile.innerHTML=image?'<img src="'+image+'" alt="">':'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"></circle><path d="M5 20c.8-3.4 3.1-5.2 7-5.2s6.2 1.8 7 5.2"></path></svg>';
  });
  var theme=document.getElementById('themeBtn');
  if(theme) theme.insertAdjacentElement('afterend',profile);
  else {profile.classList.add('site-profile-link-floating');document.body.appendChild(profile)}
  function loadAuthUi(){
    var css=document.createElement('link');css.rel='stylesheet';css.href='auth-ui.css';document.head.appendChild(css);
    var auth=document.createElement('script');auth.src='supabase-auth-ui.js';document.body.appendChild(auth);
  }
  loadAuthUi();
  var updateRequested=false;
  function showUpdate(registration){
    if(document.getElementById('focus-update'))return;
    var update=document.createElement('div');
    update.id='focus-update';
    update.className='focus-update';
    update.setAttribute('role','status');
    update.innerHTML='<strong>Update available</strong><span>Refresh Focus Bro to use the latest version.</span><button type="button">Update now</button>';
    document.body.appendChild(update);
    update.querySelector('button').onclick=function(){
      var button=this;
      button.disabled=true;
      button.textContent='Updating…';
      updateRequested=true;
      if(registration.waiting)registration.waiting.postMessage({type:'FOCUS_BRO_ACTIVATE_UPDATE'});
      else window.location.reload();
    };
  }
  if('serviceWorker' in navigator && location.protocol!=='file:'){
    navigator.serviceWorker.register('focus-bro-sw.js?v=15').then(function(registration){
      if(registration.waiting)showUpdate(registration);
      registration.addEventListener('updatefound',function(){
        var worker=registration.installing;
        if(!worker)return;
        worker.addEventListener('statechange',function(){
          if(worker.state==='installed'&&navigator.serviceWorker.controller)showUpdate(registration);
        });
      });
      navigator.serviceWorker.addEventListener('controllerchange',function(){
        if(updateRequested)window.location.reload();
      });
    }).catch(function(){});
  }
})();
