(function(){
  var slot=document.getElementById('focus-auth-slot');if(!slot||!window.FocusBroAuth)return;
  slot.innerHTML='<div class="auth-card"><div class="auth-status" id="authStatus">Checking account...</div><button class="auth-action" id="authOpen">Sign in</button></div>';
  var modal=document.createElement('div');
  modal.className='auth-modal';
  modal.innerHTML='<div class="auth-box" role="dialog" aria-modal="true" aria-labelledby="authTitle"><button class="auth-close" id="authClose" aria-label="Close">x</button><h2 id="authTitle">Focus Bro account</h2><p class="auth-copy">Sign in to sync your lessons, notes, progress, timetable, and tasks across devices.</p><form id="authForm"><input id="authEmail" type="email" required placeholder="Email address"><input id="authPassword" type="password" required minlength="6" placeholder="Password"><button class="auth-submit" id="authSubmit">Sign in</button></form><button class="auth-switch" id="authSwitch">Need an account? Sign up</button><div class="auth-error" id="authError"></div></div>';
  document.body.appendChild(modal);
  var signup=false,status=slot.querySelector('#authStatus'),open=slot.querySelector('#authOpen');
  function render(s){if(s.user){status.textContent='Signed in: '+s.user.email;open.textContent='Sign out'}else{status.textContent='Cloud sync off';open.textContent='Sign in'}}
  function close(){modal.classList.remove('open')}
  open.onclick=function(){if(window.FocusBroAuth.getState().user){window.FocusBroAuth.signOut()}else{modal.classList.add('open')}};
  modal.querySelector('#authClose').onclick=close;
  modal.onclick=function(e){if(e.target===modal)close()};
  modal.querySelector('#authSwitch').onclick=function(){signup=!signup;modal.querySelector('#authTitle').textContent=signup?'Create your Focus Bro account':'Focus Bro account';modal.querySelector('#authSubmit').textContent=signup?'Create account':'Sign in';this.textContent=signup?'Already have an account? Sign in':'Need an account? Sign up'};
  modal.querySelector('#authForm').onsubmit=function(e){
    e.preventDefault();
    var email=modal.querySelector('#authEmail').value;
    var password=modal.querySelector('#authPassword').value;
    var error=modal.querySelector('#authError');
    var button=modal.querySelector('#authSubmit');
    button.disabled=true;error.textContent='';
    (signup?FocusBroAuth.signUp(email,password):FocusBroAuth.signIn(email,password)).then(function(data){if(signup&&!data.access_token)error.textContent='Check your email to confirm your account.';else close()}).catch(function(err){error.textContent=err.message}).then(function(){button.disabled=false});
  };
  FocusBroAuth.onChange(render);
})();
