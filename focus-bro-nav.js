(function(){
  document.body.classList.add('has-site-nav');
  var page=location.pathname.split(/[\\/]/).pop()||'index.html';
  var links=[
    ['The%20Lock-In%20Room.html','Focus room','Video, notes + progress','O'],
    ['Study-Techniques.html','Study techniques','Active recall + memory','>'],
    ['Feyman-techniques.html','Feynman method','Explain to learn','*'],
    ['Self-Tought-room.html','Self-taught room','Goals + atomic habits','+'],
    ['Timetable.html','Timetable','Study, revise + rest','T']
  ];
  var nav=document.createElement('aside');
  nav.className='site-sidebar';
  nav.setAttribute('aria-label','Focus Bro learning menu');
  nav.innerHTML='<a class="site-brand" href="index.html"><img src="Focus%20bro.png" alt="Focus Bro logo"><span><strong>Focus Bro</strong><small>In the pursuit of greatness</small></span></a><div class="site-section">Your learning system</div>'+
    links.map(function(item){
      var active=decodeURIComponent(page).toLowerCase()===decodeURIComponent(item[0]).toLowerCase();
      return '<a class="site-link'+(active?' active':'')+'" href="'+item[0]+'"><span>'+item[3]+'</span><div>'+item[1]+'<small style="display:block;color:var(--focus-muted);font-size:11px;font-weight:400">'+item[2]+'</small></div></a>';
    }).join('')+
    '<div class="site-quote">One lesson. One clear next action. Protect your attention and let consistency compound.</div>';
  var toggle=document.createElement('button');
  toggle.className='site-sidebar-toggle';
  toggle.type='button';
  toggle.setAttribute('aria-label','Open learning menu');
  toggle.textContent='=';
  var backdrop=document.createElement('div');
  backdrop.className='site-sidebar-backdrop';
  document.body.prepend(backdrop);
  document.body.prepend(nav);
  document.body.prepend(toggle);
  function close(){nav.classList.remove('open');backdrop.classList.remove('open');toggle.setAttribute('aria-expanded','false')}
  toggle.onclick=function(){var open=!nav.classList.contains('open');nav.classList.toggle('open',open);backdrop.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open))}
  backdrop.onclick=close;
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
})();
