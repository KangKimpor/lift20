// Run with playwright-cli run-code --filename checks/recovery.js (app on port 4173).
async page => {
  const assert=(ok,message)=>{if(!ok)throw Error(message)};
  const base=new URL('/',page.url()).href,key='lift20_workout',errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
  await page.route(base,async route=>{
    const response=await route.fetch(),html=await response.text();
    await route.fulfill({response,body:html.replace('</script></body>',
      'window.check={act,saveWorkout,get W(){return W},get S(){return S}};</script></body>')});
  });
  await page.goto(base);
  await page.evaluate(()=>{if(check.W)check.act.close();localStorage.clear();localStorage.lift20_seen=1});
  const reload=async()=>{await page.reload();await page.waitForFunction(()=>window.check)};
  await reload();
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>check.act.start('A'));
  await page.locator('#w [data-a="rep"][data-v="1"]').click();
  await reload(); // pagehide flushes the pending rep save.
  assert(await page.locator('#rv').textContent()==='7','Rep selection restored on immediate refresh');
  assert(await page.evaluate(()=>check.W.day==='A'&&check.W.logs.length===0&&document.querySelector('#app').inert),'Workout and background state restored');
  // Reload while the 550ms feedback callback is still pending.
  await page.evaluate(()=>{check.act.done();location.reload()});
  await page.waitForFunction(()=>window.check&&check.W?.rest);
  assert(await page.evaluate(()=>check.W.logs.length===1&&check.W.logs[0].reps===7&&check.W.s===1&&!check.W.busy),'Pending completed set advances exactly once');
  const end=await page.evaluate(()=>check.W.rest.end);
  await reload();
  assert(await page.evaluate(end=>check.W.rest.end===end&&check.W.logs.length===1,end),'Running rest deadline survives refresh');
  assert(await page.evaluate(()=>Math.abs(check.W.rest.left-Math.max(0,Math.ceil((check.W.rest.end-Date.now())/1000)))<=1),'Rest countdown catches up');
  await page.evaluate(()=>{check.act.rp();check.act.rt('15')});
  const paused=await page.evaluate(()=>check.W.rest.left);
  await reload();
  assert(await page.evaluate(left=>check.W.rest.pause&&check.W.rest.left===left,paused),'Paused and adjusted rest survives refresh');
  await page.waitForTimeout(1100);
  assert(await page.evaluate(left=>check.W.rest.left===left,paused),'Paused rest stays paused');
  await page.evaluate(()=>check.act.rp());
  // Instrument storage without changing the app: no draft writes on timer ticks.
  await page.evaluate(()=>{window.writes=[];window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){writes.push({key:k,bytes:v.length});return originalSet.call(this,k,v)}});
  await page.waitForTimeout(1100);
  assert(await page.evaluate(()=>writes.length===0),'Timer has zero storage writes');
  await page.evaluate(()=>{check.act.next();for(let i=0;i<20;i++)check.act.rep('1')});
  await page.waitForTimeout(250);
  assert(await page.evaluate(()=>writes.length===2&&writes.every(w=>w.key==='lift20_workout'&&w.bytes<5000)),'Rapid reps batch into one small draft write');
  await reload();
  assert(await page.locator('#rv').textContent()==='27','Skipped rest and batched reps restored');
  await page.evaluate(()=>{check.act.sww();check.act.pick('pu')});
  await reload();
  assert(await page.evaluate(()=>check.W.ids[0]==='pu'&&check.W.s===1),'Live exercise swap restored');
  await page.evaluate(()=>{check.act.done()});
  await page.waitForFunction(()=>check.W.rest);
  await page.evaluate(()=>{check.W.rest.end=Date.now()-1000;check.saveWorkout()});
  await reload();
  assert(await page.locator('#rt').textContent()==='0:00'&&await page.locator('#nx').textContent()==='Next set','Expired rest restored without restarting');
  await page.evaluate(()=>{check.act.quit();check.act.no()});
  assert(await page.evaluate(key=>!!localStorage.getItem(key),key),'Canceled discard preserves draft');
  await page.evaluate(()=>{check.act.quit();check.act.yes()});
  await reload();
  assert(await page.evaluate(key=>!check.W&&!localStorage.getItem(key)&&check.S.hist.length===0,key),'Discard removes draft without saving history');
  // Skipping keeps logged sets, drops remaining sets from progress and survives refresh.
  await page.evaluate(()=>{check.act.start('A');check.act.done()});
  await page.waitForFunction(()=>check.W.rest);
  await page.locator('#w [data-a="skipex"]').click();
  await reload();
  assert(await page.evaluate(()=>check.W.i===1&&check.W.s===0&&check.W.ids[1]==='gob'&&check.W.logs.length===1&&check.W.total===13&&!check.W.rest),'Skip during rest preserves sets and saves next exercise');
  for(let i=0;i<4;i++)await page.locator('#w [data-a="skipex"]').click();
  assert(await page.evaluate(()=>check.W.fin&&check.S.hist.length===1&&check.S.hist[0].logs.length===1),'Skipping final exercise finishes only logged sets');
  await page.evaluate(()=>{check.act.close();check.S.hist=[];check.S.pr={};localStorage.lift20=JSON.stringify(check.S);check.act.start('A')});
  for(let i=0;i<5;i++)await page.locator('#w [data-a="skipex"]').click();
  assert(await page.evaluate(key=>!check.W&&check.S.hist.length===0&&!localStorage.getItem(key),key),'Skipping every exercise creates no empty history');
  // Skip individual sets without logging reps, restarting rest or replacing video.
  await page.evaluate(()=>{check.act.start('A');check.act.vp()});
  await page.locator('#wv [data-a="play"]').click();
  await page.evaluate(()=>window.skipFrame=document.querySelector('#wv iframe'));
  await page.locator('#w [data-a="skipset"]').click();
  assert(await page.evaluate(()=>check.W.i===0&&check.W.s===1&&check.W.total===14&&check.W.logs.length===0&&!check.W.rest&&skipFrame===document.querySelector('#wv iframe')),'Skip set advances once with video intact and no logged reps');
  await reload();
  assert(await page.evaluate(()=>check.W.i===0&&check.W.s===1&&check.W.skipped===1&&check.W.total===14),'Skipped set survives refresh within same exercise');
  await page.evaluate(()=>{check.act.done();check.act.skipset()});
  assert(await page.evaluate(()=>check.W.s===1&&check.W.skipped===1&&check.W.logs.length===1),'Skip ignored during set feedback');
  await page.waitForFunction(()=>check.W.rest);
  await page.locator('#w [data-a="skipset"]').click();
  await reload();
  assert(await page.evaluate(()=>check.W.i===1&&check.W.s===0&&check.W.skipped===2&&check.W.logs.length===1&&!check.W.rest),'Skipping last set during rest advances exercise and saves');
  for(let i=0;i<4;i++)await page.locator('#w [data-a="skipex"]').click();
  assert(await page.evaluate(()=>check.S.hist.length===1&&check.S.hist[0].logs.length===1),'Mixed skipped/completed sets save only completed sets');
  await page.evaluate(()=>{check.act.close();check.S.hist=[];check.S.pr={};localStorage.lift20=JSON.stringify(check.S);check.S.prog.X=['pu'];check.act.start('X')});
  for(let i=0;i<3;i++)await page.locator('#w [data-a="skipset"]').click();
  await reload();
  assert(await page.evaluate(key=>!check.W&&check.S.hist.length===0&&!localStorage.getItem(key),key),'Skipping all sets ends without an empty history record');
  await page.evaluate(()=>{check.S.prog.X=['pu'];check.act.start('X');check.act.done()});
  await page.waitForFunction(()=>check.W.rest);
  await page.locator('#w [data-a="skipset"]').click();
  await page.locator('#w [data-a="skipset"]').click();
  assert(await page.evaluate(key=>check.W.fin&&check.S.hist.length===1&&check.S.hist[0].logs.length===1&&!localStorage.getItem(key),key),'Skipping final workout set saves only logged sets and clears draft');
  await page.evaluate(()=>{check.act.close();check.S.hist=[];check.S.pr={};localStorage.lift20=JSON.stringify(check.S)});
  // Finish a short workout, refreshing during final set feedback.
  await page.evaluate(()=>{check.S.prog.X=['pu'];check.act.start('X')});
  for(let i=0;i<2;i++){
    await page.evaluate(()=>check.act.done());await page.waitForFunction(()=>check.W.rest);await page.evaluate(()=>check.act.next());
  }
  await page.evaluate(()=>{check.act.done();location.reload()});
  await page.waitForFunction(()=>window.check&&check.W?.fin);
  assert(await page.evaluate(key=>check.S.hist.length===1&&check.S.hist[0].logs.length===3&&!localStorage.getItem(key),key),'Final set recovery completes and clears draft');
  await reload();
  assert(await page.evaluate(()=>!check.W&&check.S.hist.length===1),'Completed workout does not resume or duplicate');
  // A leftover final-set snapshot must not duplicate already-saved history.
  await page.evaluate(key=>{
    const h=check.S.hist[0];localStorage.setItem(key,JSON.stringify({version:1,day:'X',ids:['pu'],i:0,s:2,reps:8,logs:h.logs,prs:[],start:h.d-60000,rest:null,busy:true,setAt:h.d}));
  },key);
  await reload();
  assert(await page.evaluate(()=>check.S.hist.length===1),'Leftover completion draft is idempotent');
  await page.evaluate(()=>check.act.close());
  for(const bad of ['{broken',JSON.stringify({version:1,ids:['unknown']}),JSON.stringify({version:99})]){
    await page.evaluate(({key,bad})=>localStorage.setItem(key,bad),{key,bad});await reload();
    assert(await page.evaluate(key=>!check.W&&!localStorage.getItem(key),key),'Corrupt/incompatible draft ignored safely');
  }
  // Storage failures should warn once and leave the workout usable.
  await page.evaluate(()=>{Storage.prototype.setItem=function(){throw Error('QuotaExceededError')};check.S.prog.A[0]='dip';check.act.start('A');check.act.rep('1');check.saveWorkout();check.saveWorkout()});
  assert(await page.locator('.toast').count()===1&&await page.locator('#rv').textContent()==='7','Blocked storage warns once without breaking workout');
  assert(errors.length===0,'No runtime errors: '+errors.join('; '));
  return 'PASS: immediate refresh; pending/final sets; running/paused/adjusted/expired rest; rep batching; zero timer writes; swaps; skip exercise/set; discard; completion deduplication; corrupt drafts; storage failure.';
}
