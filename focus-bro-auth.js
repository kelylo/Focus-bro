(function(){
  var cfg=window.FOCUS_BRO_SUPABASE;
  if(!cfg)return;
  var state={session:null,user:null};
  var listeners=[];
  function emit(){listeners.forEach(function(fn){fn(state)})}
  function headers(token){return {'apikey':cfg.publishableKey,'Authorization':'Bearer '+(token||cfg.publishableKey),'Content-Type':'application/json'}}
  function request(path,options){
    options=options||{}; options.headers=Object.assign(headers(options.token),options.headers||{});
    return fetch(cfg.url+path,options).then(function(r){return r.text().then(function(text){var data=text?JSON.parse(text):{};if(!r.ok){var e=new Error(data.msg||data.error_description||data.message||'Supabase request failed');e.status=r.status;throw e}return data})});
  }
  function setSession(session){state.session=session||null;state.user=session&&session.user||null;if(session)localStorage.setItem('focusbro.auth.session',JSON.stringify(session));else localStorage.removeItem('focusbro.auth.session');emit()}
  function restore(){try{var s=JSON.parse(localStorage.getItem('focusbro.auth.session')||'null');if(!s||!s.access_token||!s.refresh_token)return;state.session=s;state.user=s.user||null;emit();var expiresAt=Number(s.expires_at||0)*1000;if(expiresAt>Date.now()+300000)return;request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:s.refresh_token})}).then(setSession).catch(function(){setSession(null)})}catch(e){}}
  function auth(mode,email,password){
    var path=mode==='signup'?'/auth/v1/signup':'/auth/v1/token?grant_type=password';
    return request(path,{method:'POST',body:JSON.stringify({email:email,password:password})}).then(function(data){if(data.access_token)setSession(data);return data});
  }
  function signOut(){return request('/auth/v1/logout',{method:'POST',token:state.session&&state.session.access_token}).catch(function(){}).then(function(){setSession(null)})}
  function updateProfile(values){
    if(!state.session)return Promise.reject(new Error('Sign in to update your profile.'));
    return request('/auth/v1/user',{method:'PUT',token:state.session.access_token,body:JSON.stringify({data:values})}).then(function(user){state.user=user;state.session.user=user;localStorage.setItem('focusbro.auth.session',JSON.stringify(state.session));emit();return user});
  }
  function cloudState(){
    if(!state.user)return Promise.resolve(null);
    return request('/rest/v1/focus_bro_state?select=state&user_id=eq.'+encodeURIComponent(state.user.id),{token:state.session.access_token}).then(function(rows){return rows[0]?rows[0].state:null})
  }
  function saveState(data){
    if(!state.user)return Promise.resolve(false);
    return request('/rest/v1/focus_bro_state?on_conflict=user_id',{method:'POST',token:state.session.access_token,headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:state.user.id,state:data,updated_at:new Date().toISOString()})}).then(function(){return true})
  }
  var syncKeys=['lockin.v1','lockin.selftaught.v1','lockin.selftaught.v2','focusbro.feynman.v1','focusbro.feynman.v2','focusbro.timetable.v1','focusbro.timetable.tasks.v1','focusbro.techniques.v1'];
  var nativeSet=localStorage.setItem.bind(localStorage), syncing=false;
  function collect(){var data={};syncKeys.forEach(function(k){var v=localStorage.getItem(k);if(v!==null)try{data[k]=JSON.parse(v)}catch(e){data[k]=v}});return data}
  function apply(data){if(!data)return;syncing=true;Object.keys(data).forEach(function(k){if(syncKeys.indexOf(k)!==-1)nativeSet(k,typeof data[k]==='string'?data[k]:JSON.stringify(data[k]))});syncing=false}
  function syncAfterLogin(){cloudState().then(function(cloud){if(cloud)apply(cloud);else saveState(collect())}).catch(function(){})}
  function emit(){listeners.forEach(function(fn){fn(state)});if(state.user)syncAfterLogin()}
  localStorage.setItem=function(k,v){nativeSet(k,v);if(!syncing&&state.user&&syncKeys.indexOf(k)!==-1){clearTimeout(localStorage._focusSyncTimer);localStorage._focusSyncTimer=setTimeout(function(){saveState(collect()).catch(function(){})},700)}};
  window.FocusBroAuth={onChange:function(fn){listeners.push(fn);fn(state)},signIn:function(e,p){return auth('signin',e,p)},signUp:function(e,p){return auth('signup',e,p)},signOut:signOut,updateProfile:updateProfile,getState:function(){return state},loadState:cloudState,saveState:saveState};
  restore();
})();
