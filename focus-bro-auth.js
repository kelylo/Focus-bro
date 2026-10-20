(function(){
  var cfg=window.FOCUS_BRO_SUPABASE;
  if(!cfg)return;
  var state={session:null,user:null},listeners=[],memory={},syncing=false,hydrating=false,cloudSaveTimer=0,lastCloudSave=0,cloudSaveQueued=false,stateCacheKey='focusbro.cloud.state',status='idle';
  function emit(){listeners.slice().forEach(function(fn){try{fn(state)}catch(e){}})}
  function sessionGet(key){try{return sessionStorage.getItem(key)}catch(e){return null}}
  function sessionSet(key,value){try{sessionStorage.setItem(key,value)}catch(e){}}
  function sessionRemove(key){try{sessionStorage.removeItem(key)}catch(e){}}
  function localGet(key){try{return localStorage.getItem(key)}catch(e){return null}}
  function localSet(key,value){try{localStorage.setItem(key,value)}catch(e){}}
  function cacheKey(){return state.user?'focusbro.cloud.state.'+state.user.id:stateCacheKey}
  function cachedState(){try{var raw=sessionGet(stateCacheKey)||localGet(cacheKey()),item=JSON.parse(raw||'null');if(item&&item.userId===state.user.id&&Date.now()-item.savedAt<86400000)return item.state}catch(e){}return null}
  function cacheState(data){try{var value=JSON.stringify({userId:state.user.id,savedAt:Date.now(),state:data});sessionSet(stateCacheKey,value);localSet(cacheKey(),value)}catch(e){}}
  function setStatus(next,message){status=next;window.dispatchEvent(new CustomEvent('focusbro:sync-status',{detail:{status:next,message:message||''}}))}
  function headers(token){return {'apikey':cfg.publishableKey,'Authorization':'Bearer '+(token||cfg.publishableKey),'Content-Type':'application/json'}}
  function request(path,options){
    options=options||{};options.headers=Object.assign(headers(options.token),options.headers||{});
    var controller=typeof AbortController==='function'?new AbortController():null;
    var timer=controller?setTimeout(function(){controller.abort()},10000):0;
    if(controller)options.signal=controller.signal;
    return fetch(cfg.url+path,options).then(function(r){return r.text().then(function(text){var data={};try{data=text?JSON.parse(text):{}}catch(e){data={message:text}}if(!r.ok){var error=new Error(data.msg||data.error_description||data.message||('Supabase request failed ('+r.status+')'));error.status=r.status;throw error}return data})}).catch(function(error){
      if(error&&error.name==='AbortError')throw new Error('The connection timed out. Check your internet connection and try again.');
      throw error;
    }).then(function(data){if(timer)clearTimeout(timer);return data},function(error){if(timer)clearTimeout(timer);throw error});
  }
  function setSession(session){state.session=session||null;state.user=session&&session.user||null;if(session)sessionSet('focusbro.auth.session',JSON.stringify(session));else{sessionRemove('focusbro.auth.session');memory={}};if(state.user){var cached=cachedState();if(cached)apply(cached)}emit();if(state.user)syncAfterLogin()}
  function restore(){try{var s=JSON.parse(sessionGet('focusbro.auth.session')||'null');if(!s||!s.access_token||!s.refresh_token){window.dispatchEvent(new CustomEvent('focusbro:state-ready'));return}state.session=s;state.user=s.user||null;var cached=cachedState();if(cached)apply(cached);emit();var expiresAt=Number(s.expires_at||0)*1000;if(expiresAt>Date.now()+300000){syncAfterLogin();return}request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:s.refresh_token})}).then(setSession).catch(function(){setSession(null)})}catch(e){setSession(null)}}
  function auth(mode,email,password){
    var path=mode==='signup'?'/auth/v1/signup':'/auth/v1/token?grant_type=password';
    return request(path,{method:'POST',body:JSON.stringify({email:email,password:password})}).then(function(data){if(data.access_token)setSession(data);return data});
  }
  function resetPassword(email){
    if(!email)return Promise.reject(new Error('Enter your email address first.'));
    return request('/auth/v1/recover',{method:'POST',body:JSON.stringify({email:email,redirect_to:location.origin+location.pathname})});
  }
  function signOut(){return request('/auth/v1/logout',{method:'POST',token:state.session&&state.session.access_token}).catch(function(){}).then(function(){memory={};setSession(null)})}
  function updateProfile(values){
    if(!state.session)return Promise.reject(new Error('Sign in to update your profile.'));
    return request('/auth/v1/user',{method:'PUT',token:state.session.access_token,body:JSON.stringify({data:values})}).then(function(user){state.user=user;state.session.user=user;sessionSet('focusbro.auth.session',JSON.stringify(state.session));emit();return user});
  }
  function cloudState(){
    if(!state.user)return Promise.resolve(null);
    return request('/rest/v1/focus_bro_state?select=state&user_id=eq.'+encodeURIComponent(state.user.id),{token:state.session.access_token}).then(function(rows){return rows[0]?rows[0].state:null});
  }
  function saveState(data,options){
    if(!state.user)return Promise.reject(new Error('Sign in to save your learning data.'));
    options=options||{};cacheState(data);setStatus('saving');
    return request('/rest/v1/focus_bro_state?on_conflict=user_id',{method:'POST',token:state.session.access_token,keepalive:!!options.keepalive,headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:state.user.id,state:data,updated_at:new Date().toISOString()})}).then(function(){lastCloudSave=Date.now();setStatus('saved');return true},function(error){setStatus('error',error.message);throw error});
  }
  var syncKeys=['lockin.v1','lockin.selftaught.v1','lockin.selftaught.v2','focusbro.feynman.v1','focusbro.feynman.v2','focusbro.game.v1','focusbro.mindmap.v1','focusbro.timetable.v1','focusbro.timetable.tasks.v1','focusbro.techniques.v1'];
  function collect(){var data={};syncKeys.forEach(function(k){if(memory[k]!==undefined)try{data[k]=JSON.parse(memory[k])}catch(e){data[k]=memory[k]}});return data}
  function apply(data){if(!data)return;syncing=true;syncKeys.forEach(function(k){delete memory[k]});Object.keys(data).forEach(function(k){if(syncKeys.indexOf(k)!==-1)memory[k]=typeof data[k]==='string'?data[k]:JSON.stringify(data[k])});syncing=false}
  function syncAfterLogin(){
    if(hydrating)return;
    hydrating=true;
    var cached=cachedState();
    if(cached)apply(cached);
    cloudState().then(function(cloud){
      if(cloud){apply(cloud);cacheState(cloud);return}
      var current=collect();
      if(Object.keys(current).length)return saveState(current);
    }).then(function(){
      window.dispatchEvent(new CustomEvent('focusbro:state-ready'));
    }).catch(function(){
      window.dispatchEvent(new CustomEvent('focusbro:state-ready'));
    }).then(function(){hydrating=false});
  }
  function queueCloudSave(){
    if(!state.user||syncing)return;
    cloudSaveQueued=true;setStatus('pending');clearTimeout(cloudSaveTimer);
    var wait=Math.max(700,1200-(Date.now()-lastCloudSave));
    cloudSaveTimer=setTimeout(function(){
      if(!state.user||!cloudSaveQueued)return;
      cloudSaveQueued=false;lastCloudSave=Date.now();
      saveState(collect()).catch(function(){cloudSaveQueued=true});
    },wait);
  }
  function flushCloudSave(){
    if(!state.user||!cloudSaveQueued)return;
    clearTimeout(cloudSaveTimer);cloudSaveQueued=false;
    saveState(collect(),{keepalive:true}).catch(function(){cloudSaveQueued=true});
  }
  window.addEventListener('pagehide',flushCloudSave);
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')flushCloudSave()});
  window.FocusBroStore={
    getItem:function(k){return Object.prototype.hasOwnProperty.call(memory,k)?memory[k]:null},
    setItem:function(k,v){memory[k]=String(v);if(syncKeys.indexOf(k)!==-1)queueCloudSave()},
    removeItem:function(k){delete memory[k];if(syncKeys.indexOf(k)!==-1)queueCloudSave()}
  };
  var gameKey='focusbro.game.v1',defaultGame={xp:0,awards:{}};
  function gameData(){var game=defaultGame;try{game=Object.assign({},defaultGame,JSON.parse(window.FocusBroStore.getItem(gameKey)||'{}'));game.awards=game.awards||{}}catch(e){}return game}
  function gameLevel(xp){return Math.floor(Math.max(0,xp||0)/100)+1}
  window.FocusBroGame={
    get:function(){var game=gameData();game.level=gameLevel(game.xp);game.nextLevel=game.level*100;return game},
    award:function(id,points){if(!state.user)return false;var game=gameData();if(game.awards[id])return false;game.awards[id]={points:points,at:new Date().toISOString()};game.xp+=points;window.FocusBroStore.setItem(gameKey,JSON.stringify(game));document.dispatchEvent(new CustomEvent('focusbro:game-change'));return true},
    level:gameLevel
  };
  function onChange(fn){listeners.push(fn);fn(state)}
  window.FocusBroAuth={onChange:onChange,signIn:function(e,p){return auth('signin',e,p)},signUp:function(e,p){return auth('signup',e,p)},resetPassword:resetPassword,signOut:signOut,updateProfile:updateProfile,getState:function(){return state},loadState:cloudState,saveState:saveState,getSyncStatus:function(){return status}};
  restore();
})();
