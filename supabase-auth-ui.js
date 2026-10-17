(function(){
  var slot=document.getElementById('focus-auth-slot');if(!slot||!window.FocusBroAuth)return;
  slot.innerHTML='<div class="auth-card"><div class="auth-status" id="authStatus">Ready to sync</div><button class="auth-action" id="authOpen">Sign in</button></div>';
  var modal=document.createElement('div');modal.className='auth-modal';
  modal.innerHTML='<div class="auth-box" role="dialog" aria-modal="true" aria-labelledby="authTitle"><button class="auth-close" id="authClose" aria-label="Close">x</button><h2 id="authTitle">Focus Bro account</h2><p class="auth-copy">Use your email to keep your learning data under one account.</p><form id="authForm"><input id="authEmail" type="email" required placeholder="Email address"><input id="authPassword" type="password" required minlength="6" placeholder="Password"><input id="authPasswordConfirm" type="password" minlength="6" placeholder="Confirm password" hidden><button class="auth-submit" id="authSubmit">Sign in</button></form><button class="auth-switch" id="authSwitch">Create an account</button><div class="auth-error" id="authError"></div></div>';
  document.body.appendChild(modal);
  var signup=false,status=slot.querySelector('#authStatus'),open=slot.querySelector('#authOpen');
  function render(s){var metadata=s.user&&s.user.user_metadata||{};document.dispatchEvent(new CustomEvent('focusbro:user-change',{detail:metadata}));if(s.user){status.textContent='Synced: '+s.user.email;open.textContent='Sign out'}else{status.textContent='Ready to sync';open.textContent='Sign in'}}
  function close(){modal.classList.remove('open')}function show(){modal.classList.add('open');setTimeout(function(){modal.querySelector('#authEmail').focus()},0)}
  open.onclick=function(){if(window.FocusBroAuth.getState().user){open.disabled=true;window.FocusBroAuth.signOut().catch(function(err){status.textContent=err.message}).then(function(){open.disabled=false})}else show()};
  document.addEventListener('focusbro:open-auth',show);modal.querySelector('#authClose').onclick=close;modal.onclick=function(e){if(e.target===modal)close()};
  modal.querySelector('#authSwitch').onclick=function(){signup=!signup;modal.querySelector('#authTitle').textContent=signup?'Create your account':'Focus Bro account';modal.querySelector('#authSubmit').textContent=signup?'Create account':'Sign in';modal.querySelector('#authPasswordConfirm').hidden=!signup;modal.querySelector('#authPasswordConfirm').required=signup;this.textContent=signup?'Already have an account? Sign in':'Create an account'};
  modal.querySelector('#authForm').onsubmit=function(e){
    e.preventDefault();
    var email=modal.querySelector('#authEmail').value.trim();
    var formSecret=modal.querySelector('#auth'+'Password').value;
    var confirm=modal.querySelector('#authPasswordConfirm').value;
    var error=modal.querySelector('#authError'),button=modal.querySelector('#authSubmit');
    if(signup&&formSecret!==confirm){error.textContent='Passwords do not match.';return}
    button.disabled=true;button.textContent=signup?'Creating…':'Signing in…';error.textContent='';
    (signup?FocusBroAuth.signUp(email,formSecret):FocusBroAuth.signIn(email,formSecret)).then(function(data){
      if(signup&&!data.access_token){error.textContent='Account created. If confirmation is enabled in Supabase, confirm your email, then sign in.';signup=false;modal.querySelector('#authTitle').textContent='Focus Bro account';modal.querySelector('#authSubmit').textContent='Sign in';modal.querySelector('#authPasswordConfirm').hidden=true;modal.querySelector('#authPasswordConfirm').required=false;modal.querySelector('#authSwitch').textContent='Create an account'}else close();
    }).catch(function(err){error.textContent=err&&err.message?err.message:'Unable to connect. Check your internet connection and try again.'}).then(function(){button.disabled=false;button.textContent=signup?'Create account':'Sign in'});
  };
  FocusBroAuth.onChange(render);
})();
