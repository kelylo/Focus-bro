(function(){
  var cfg=window.FOCUS_BRO_SUPABASE;
  if(!cfg)return;
  var state={session:null,user:null},listeners=[],memory={},syncing=false,syncTimer=0,hydrating=false,cloudSaveTimer=0,lastCloudSave=0,cloudSaveQueued=false;
  function emit(){listeners.forEach(function(fn){fn(state)})}
  function headers(token){return {'apikey':cfg.publishableKey,'Authorization':'Bearer '+(token||cfg.publishableKey),'Content-Type':'application/json'}}
  function request(path,options){
    options=options||{};options.headers=Object.assign(headers(options.token),options.headers||{});
    var controller=typeof AbortController==='function'?new AbortController():null;
    var timer=controller?setTimeout(function(){controller.abort()},10000):0;
    if(controller)options.signal=controller.signal;
    return fetch(cfg.url+path,options).then(function(r){return r.text().then(function(text){var data=text?JSON.parse(text):{};if(!r.ok){var e=new Error(data.msg||data.error_description||data.message||'Supabase request failed');e.status=r.status;throw e}return data})}).catch(function(error){
      if(error&&error.name==='AbortError')throw new Error('The connection timed out. Check your internet connection and try again.');
      throw error;
    }).then(function(data){if(timer)clearTimeout(timer);return data},function(error){if(timer)clearTimeout(timer);throw error});
  }
  function setSession(session){state.session=session||null;state.user=session&&session.user||null;if(session)sessionStorage.setItem('focusbro.auth.session',JSON.stringify(session));else sessionStorage.removeItem('focusbro.auth.session');emit();if(state.user)syncAfterLogin()}
  function restore(){try{var s=JSON.parse(sessionStorage.getItem('focusbro.auth.session')||'null');if(!s||!s.access_token||!s.refresh_token)return;state.session=s;state.user=s.user||null;emit();syncAfterLogin();var expiresAt=Number(s.expires_at||0)*1000;if(expiresAt>Date.now()+300000)return;request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:s.refresh_token})}).then(setSession).catch(function(){setSession(null)})}catch(e){}}
  function auth(mode,email,password){
    var path=mode==='signup'?'/auth/v1/signup':'/auth/v1/token?grant_type=password';
    return request(path,{method:'POST',body:JSON.stringify({email:email,password:password})}).then(function(data){if(data.access_token)setSession(data);return data});
  }
  function signOut(){return request('/auth/v1/logout',{method:'POST',token:state.session&&state.session.access_token}).catch(function(){}).then(function(){memory={};setSession(null)})}
  function updateProfile(values){
    if(!state.session)return Promise.reject(new Error('Sign in to update your profile.'));
    return request('/auth/v1/user',{method:'PUT',token:state.session.access_token,body:JSON.stringify({data:values})}).then(function(user){state.user=user;state.session.user=user;sessionStorage.setItem('focusbro.auth.session',JSON.stringify(state.session));emit();return user});
  }
  function cloudState(){
    if(!state.user)return Promise.resolve(null);
    return request('/rest/v1/focus_bro_state?select=state&user_id=eq.'+encodeURIComponent(state.user.id),{token:state.session.access_token}).then(function(rows){return rows[0]?rows[0].state:null});
  }
  function saveState(data){
    if(!state.user)return Promise.reject(new Error('Sign in to save your learning data.'));
    return request('/rest/v1/focus_bro_state?on_conflict=user_id',{method:'POST',token:state.session.access_token,headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:state.user.id,state:data,updated_at:new Date().toISOString()})}).then(function(){return true});
  }
  var syncKeys=['lockin.v1','lockin.selftaught.v1','lockin.selftaught.v2','focusbro.feynman.v1','focusbro.feynman.v2','focusbro.timetable.v1','focusbro.timetable.tasks.v1','focusbro.techniques.v1'];
  function collect(){var data={};syncKeys.forEach(function(k){if(memory[k]!==undefined)try{data[k]=JSON.parse(memory[k])}catch(e){data[k]=memory[k]}});return data}
  function apply(data){if(!data)return;syncing=true;Object.keys(data).forEach(function(k){if(syncKeys.indexOf(k)!==-1)memory[k]=typeof data[k]==='string'?data[k]:JSON.stringify(data[k])});syncing=false}
  function syncAfterLogin(){if(hydrating)return;hydrating=true;cloudState().then(function(cloud){if(cloud)apply(cloud);else return saveState(collect());}).then(function(){window.dispatchEvent(new CustomEvent('focusbro:state-ready'))}).catch(function(){}).then(function(){hydrating=false})}
  function queueCloudSave(){
    if(!state.user||syncing)return;
    cloudSaveQueued=true;clearTimeout(cloudSaveTimer);
    var wait=Math.max(500,12000-(Date.now()-lastCloudSave));
    cloudSaveTimer=setTimeout(function(){
      if(!state.user||!cloudSaveQueued)return;
      cloudSaveQueued=false;lastCloudSave=Date.now();
      saveState(collect()).catch(function(){cloudSaveQueued=true});
    },wait);
  }
  localStorage.getItem=function(k){return Object.prototype.hasOwnProperty.call(memory,k)?memory[k]:null};
  localStorage.setItem=function(k,v){memory[k]=String(v);if(syncKeys.indexOf(k)!==-1)queueCloudSave()};
  localStorage.removeItem=function(k){delete memory[k];if(syncKeys.indexOf(k)!==-1)queueCloudSave()};
  function onChange(fn){listeners.push(fn);fn(state)}
  window.FocusBroAuth={onChange:onChange,signIn:function(e,p){return auth('signin',e,p)},signUp:function(e,p){return auth('signup',e,p)},signOut:signOut,updateProfile:updateProfile,getState:function(){return state},loadState:cloudState,saveState:saveState};
  restore();
})();
