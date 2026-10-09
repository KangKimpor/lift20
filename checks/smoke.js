// Run with the app served on port 4173:
// npx --yes --package @playwright/cli playwright-cli open http://127.0.0.1:4173
// npx --yes --package @playwright/cli playwright-cli run-code --filename checks/smoke.js
async page => {
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const base = 'http://127.0.0.1:4173/';
  // Test-only access to module state; the shipped page exports nothing.
  await page.route(base, async route => {
    const response = await route.fetch();
    const html = await response.text();
    await route.fulfill({response, body:html.replace('</script></body>',
      `window.check={E,YT,DAY,parseVideo,act,save,render,rePR,home,fix,ensure,me,get S(){return S},get W(){return W},set FB(value){FB=value}};</script></body>`)});
  });
  await page.goto(base);
  await page.evaluate(() => {localStorage.removeItem('lift20');localStorage.removeItem('lift20_seen');});
  await page.reload();
  await page.waitForFunction(() => window.check);
  assert(await page.locator('#lg').isVisible(), 'First visit gate');
  await page.getByRole('button',{name:'Skip for now'}).click();
  await page.reload();
  await page.waitForFunction(() => window.check);
  assert(!await page.locator('#lg').isVisible(), 'Skip persists');
  await page.emulateMedia({reducedMotion:'reduce'});
  // Freeze local time to verify greeting boundaries and the Monday-based summary.
  for(const [hour,greeting] of [[0,'Good morning'],[11,'Good morning'],[12,'Good afternoon'],[17,'Good afternoon'],[18,'Good evening'],[23,'Good evening']]) {
    await page.clock.setFixedTime(new Date(2026,9,9,hour));
    await page.evaluate(()=>check.render());
    assert(await page.locator('#app h1').textContent()===greeting+', Por.','Greeting at '+hour);
    assert(!await page.locator('#app').textContent().then(t=>t.includes('Lift20')),'Brand and breadcrumb removed');
  }
  await page.clock.setFixedTime(new Date(2026,9,9,10));
  assert(await page.locator('.summary-tile').first().textContent().then(t=>t.includes('0 workouts')&&t.includes('Start your week strong')),'Empty weekly summary');
  await page.evaluate(()=>{
    check.S.hist=[{d:+new Date(2026,9,4,23,59),dur:99,logs:[]},{d:+new Date(2026,9,5),dur:20,logs:[]},{d:+new Date(2026,9,9,9),dur:25,logs:[]},{d:+new Date(2026,9,10),dur:99,logs:[]}];check.render();
  });
  assert(await page.locator('.summary-tile').first().textContent().then(t=>t.includes('2 workouts')&&t.includes('45 min trained')),'Weekly summary excludes previous week and future');
  await page.locator('.summary-tile').first().click();
  assert(await page.locator('.weight-card').count()===1,'Weekly summary opens Progress');
  await page.evaluate(()=>{check.S.hist=[];check.render();});
  await page.clock.setFixedTime(new Date());
  const coverage = await page.evaluate(() => {
    const {E,YT,parseVideo}=check;
    const valid=['https://youtube.com/shorts/04FqT6lC0i4','https://youtu.be/04FqT6lC0i4?t=2','https://www.youtube.com/watch?v=04FqT6lC0i4','https://www.youtube-nocookie.com/embed/04FqT6lC0i4'];
    const invalid=['https://evil.com/shorts/04FqT6lC0i4','https://youtube.com.evil.com/watch?v=04FqT6lC0i4','javascript:alert(1)','https://youtube.com/shorts/04FqT6lC0i4junk','https://youtu.be/short'];
    return {count:Object.keys(E).length,full:Object.keys(E).every(id=>/^[\w-]{11}$/.test(YT[id]))&&Object.keys(YT).every(id=>E[id]),parser:valid.every(x=>parseVideo(x)==='04FqT6lC0i4')&&invalid.every(x=>parseVideo(x)===null)};
  });
  assert(coverage.count===58&&coverage.full, 'All 58 tutorial mappings');
  assert(coverage.parser,'YouTube host and ID validation');
  const nav = async v => {await page.locator(`nav [data-v="${v}"]`).click();};
  for(const width of [390,820,1280]) {
    await page.setViewportSize({width,height:width===820?1180:844});
    for (const v of ['home','prog','ex','stats','me']) {
      await nav(v);
      assert(await page.locator('#app h1').count()===1, 'View renders: '+v);
      await page.screenshot({path:`output/playwright/empty-${v}-${width}.png`,fullPage:true,animations:'disabled'});
    }
  }
  await page.setViewportSize({width:390,height:844});
  await nav('prog');
  assert(await page.locator('.day-card').count()===4,'A/B/C/X visible');
  const ids=await page.evaluate(()=>Object.keys(check.E));
  for (const id of ids) {
    await page.evaluate(id=>check.act.det(id),id);
    assert(await page.locator('#dlg .vp').count()===1,'Tutorial in details: '+id);
    assert(await page.locator('#dlg [data-a="play"]').getAttribute('data-v')!==null,'Playable poster: '+id);
    await page.keyboard.press('Escape');
  }
  await page.locator('.day-card [data-a="det"]').first().click();
  await page.locator('#dlg img').evaluate(img=>img.decode().catch(()=>{}));
  await page.screenshot({path:'output/playwright/details-390.png',animations:'disabled'});
  await page.locator('#dlg [data-a="play"]').click();
  assert(await page.locator('#dlg iframe').count()===1,'Details player loads on click');
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.querySelector('#dlg iframe'));
  assert(await page.locator('#dlg iframe').count()===0,'Escape stops details playback');
  await page.locator('.day-card [data-a="det"]').first().click();
  await page.locator('#dlg [data-a="vset"]').click();
  await page.locator('#vl').fill('https://evil.com/shorts/04FqT6lC0i4');
  await page.locator('#dlg [data-a="vsave"]').click();
  assert(await page.locator('#vl').count()===1,'Invalid override rejected');
  await page.locator('#vl').fill('https://youtu.be/04FqT6lC0i4');
  await page.locator('#dlg [data-a="vsave"]').click();
  assert(await page.locator('#dlg [data-a="play"]').getAttribute('data-v')==='04FqT6lC0i4','Saved override wins and open details update');
  await page.locator('#dlg [data-a="vset"]').click();
  await page.locator('#vl').fill('');
  await page.locator('#dlg [data-a="vsave"]').click();
  assert(await page.locator('#dlg [data-a="play"]').getAttribute('data-v')===await page.evaluate(()=>check.YT.dip),'Empty override restores built-in');
  await page.keyboard.press('Escape');
  await page.locator('[data-a="add"][data-v="A"]').click();
  assert(await page.locator('#dlg [data-a="addp"][data-v="pup"]').count()===0,'Equipment gate excludes pull-ups');
  await page.locator('#dlg [data-a="addp"][data-v="pu"]').click();
  assert(await page.evaluate(()=>check.S.prog.A.includes('pu')),'Add saves');
  await page.locator('[data-a="del"][data-v="A5"]').click();
  await page.locator('[data-a="swap"][data-v="A0"]').click();
  const swapped=await page.locator('#dlg [data-a="pick"]').first().getAttribute('data-v');
  await page.locator('#dlg [data-a="pick"]').first().click();
  assert(await page.evaluate(()=>check.S.prog.A[0])===swapped,'Program swap saves');
  await page.evaluate(()=>{check.S.prog.A=['dip','gob','ohrow','rdl','curl'];check.save();check.render();});
  await nav('me');
  assert(await page.getByRole('button',{name:'Continue with Google'}).count()===1,'Signed-out profile');
  for(const q of ['dip','db','bar']) {
    await page.locator(`[data-k="eq"][value="${q}"]`).check();
    await page.locator(`[data-k="eq"][value="${q}"]`).uncheck();
    assert(await page.evaluate(()=>Object.values(check.S.prog).flat().every(i=>check.E[i].q==='bw'||check.S.eq[check.E[i].q])),'Equipment toggle repairs all days: '+q);
  }
  await page.evaluate(()=>{Object.assign(check.S.eq,{dip:1,db:1,bar:0});check.S.prog={A:['dip','gob','ohrow','rdl','curl'],B:['sp','rl','pu','bor','lat'],C:['dip','rdl','gob','sp','ham'],X:['tpu','bor','arn','sk','dead']};check.save();});
  await nav('prog');
  await page.evaluate(()=>{const ids=[...check.S.prog.X];check.S.prog.X=['dead'];check.act.del('X0');if(check.S.prog.X.length!==1)throw Error('Last-exercise guard');check.S.prog.X=ids;check.save();check.render();});
  await page.locator('[data-a="start"][data-v="A"]').click();
  assert(await page.evaluate(()=>document.querySelector('#app').inert&&document.querySelector('nav').inert),'Background inert during workout');
  await page.locator('#w [data-a="rep"][data-v="1"]').click();
  assert(await page.locator('#rv').textContent()==='7','Rep stepper');
  await page.locator('#w [data-a="vp"]').click();
  await page.waitForFunction(()=>!document.querySelector('.toast'));
  await page.locator('#wv img').evaluate(img=>img.decode().catch(()=>{}));
  await page.screenshot({path:'output/playwright/workout-390.png',animations:'disabled'});
  await page.locator('#wv [data-a="play"]').click();
  await page.evaluate(()=>window.frameBefore=document.querySelector('#wv iframe'));
  await page.locator('#cs').click();
  await page.waitForSelector('#rt');
  assert(await page.evaluate(()=>window.frameBefore===document.querySelector('#wv iframe')),'Same iframe survives set/rest render');
  await page.locator('[data-a="rp"]').click();
  const paused=await page.locator('#rt').textContent();
  await page.locator('[data-a="rt"][data-v="15"]').click();
  await page.locator('[data-a="rt"][data-v="-15"]').click();
  assert(await page.locator('#rt').textContent()===paused,'Rest +/-15');
  await page.locator('[data-a="rp"]').click();
  await page.evaluate(()=>{check.W.rest.end=Date.now()-1000;});
  await page.waitForFunction(()=>document.querySelector('#rt').textContent==='0:00');
  assert(await page.locator('#nx').textContent()==='Next set','Rest uses end timestamp');
  await page.locator('#nx').click();
  assert(await page.evaluate(()=>window.frameBefore===document.querySelector('#wv iframe')),'Same iframe survives next set');
  await page.locator('#w [data-a="vp"]').click();
  assert(await page.locator('#wv iframe').count()===0,'Video toggle stops playback');
  await page.locator('#w [data-a="sww"]').click();
  const live=await page.locator('#dlg [data-a="pick"]').first().getAttribute('data-v');
  await page.locator('#dlg [data-a="pick"]').first().click();
  assert(await page.evaluate(()=>check.W.ids[0])===live,'Live swap');
  // Restore the original exercise so this completes a full default Day A.
  await page.evaluate(()=>{check.W.ids[0]='dip';check.S.prog.A[0]='dip';check.act.next();});
  for(let sets=1;sets<15;sets++) {
    await page.locator('#cs').click();
    await page.waitForFunction(()=>!check.W.busy);
    if(await page.locator('#nx').count())await page.locator('#nx').click();
  }
  assert(await page.locator('#w h1').textContent()==='Workout complete','Workout summary');
  assert(await page.evaluate(()=>check.S.hist.at(-1).logs.length)===15,'All 15 sets saved');
  await page.locator('#w [data-a="close"]').click();
  assert(!await page.evaluate(()=>document.querySelector('#app').inert),'Background restored');
  await page.waitForFunction(()=>document.activeElement.closest('nav'));
  await page.reload();
  await page.waitForFunction(()=>window.check);
  assert(await page.evaluate(()=>check.S.hist.length)===1,'Completed history persists across refresh');
  await nav('stats');
  await page.locator('#wi').fill('62.5');
  await page.locator('[data-a="logw"]').click();
  assert(await page.evaluate(()=>check.S.w.at(-1).kg)===62.5,'Fractional weight saved');
  await page.locator('#wi').fill('62.6');
  await page.locator('[data-a="logw"]').click();
  assert(await page.evaluate(()=>check.S.w.length===1&&check.S.w[0].kg===62.6),'Same-day weight update');
  assert(!await page.locator('.weight-history').evaluate(el=>el.open),'Weight history collapsed initially');
  await page.locator('.weight-history summary').click();
  await page.locator('[data-a="delw"]').click();
  assert(await page.evaluate(()=>check.S.w.length)===0,'Weight delete');
  assert(await page.locator('.weight-history').count()===0,'Last deletion clears history section');
  assert(await page.locator('#wi').evaluate(el=>el===document.activeElement),'Last deletion restores input focus');
  await page.locator('[data-a="hv"]').click();
  await page.locator('[data-a="hrep"][data-v="0:1"]').click();
  await page.locator('[data-a="hadd"]').first().click();
  assert(await page.evaluate(()=>check.S.hist[0].logs.length)===16,'History add set');
  await page.locator('[data-a="hset"]').first().click();
  await page.getByRole('button',{name:'Done',exact:true}).click();
  assert(await page.evaluate(()=>check.S.pr.dip===Math.max(...check.S.hist[0].logs.filter(l=>l.id==='dip').map(l=>l.reps))),'PR recalculated after edit');
  await page.locator('[data-a="hv"]').click();
  await page.locator('[data-a="hdel"]').click();
  await page.locator('[data-a="yes"]').click();
  assert(await page.evaluate(()=>check.S.hist.length===0&&Object.keys(check.S.pr).length===0&&check.S.hdel.length===1),'History delete recalculates PR');
  // Seed only this isolated browser for populated screenshots and layout checks.
  await page.evaluate(()=>{
    const now=Date.now();check.S.hist=Array.from({length:18},(_,i)=>({d:now-(17-i)*86400000,dur:25,day:['A','B','C'][i%3],logs:[{id:'dip',reps:8+i%4},{id:'gob',reps:12}]}));
    check.S.w=[{d:now-7*86400000,kg:63},{d:now,kg:62.5}];check.rePR();check.save();check.render();
  });
  await nav('stats');
  await page.evaluate(()=>{const now=Date.now();check.S.w=Array.from({length:40},(_,i)=>({d:now-(39-i)*86400000,kg:63-i/10}));check.render();});
  assert(await page.locator('.weight-history .wl').count()===40,'All weight entries accessible');
  await page.locator('.weight-history summary').focus();
  await page.keyboard.press('Enter');
  assert(await page.locator('.weight-history').evaluate(el=>el.open),'Weight history opens with keyboard');
  assert(await page.locator('.weight-entries').evaluate(el=>el.clientHeight<=270&&el.scrollHeight>el.clientHeight),'Long weight history scrolls within a bounded section');
  assert(await page.locator('.weight-history .wl b').first().textContent()==='59.1 kg','Weight history newest first');
  await page.locator('[data-a="delw"]').first().click();
  assert(await page.evaluate(()=>check.S.w.length)===39&&await page.locator('.weight-history').evaluate(el=>el.open),'Deletion preserves expanded history');
  await page.reload();
  await page.waitForFunction(()=>window.check);
  await nav('stats');
  assert(await page.evaluate(()=>check.S.w.length)===39,'Weight history deletion persists');
  await page.evaluate(()=>{const now=Date.now();check.S.w=[{d:now-7*86400000,kg:63},{d:now,kg:62.5}];check.save();check.render();});
  await page.waitForFunction(()=>!document.querySelector('.toast'));
  for (const width of [320,390,820,1280]) {
    await page.setViewportSize({width,height:width===820?1180:844});
    for(const view of ['home','prog','ex','stats','me']) {
      await nav(view);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No overflow: '+view+' '+width);
      if(width!==320)await page.screenshot({path:`output/playwright/demo-${view}-${width}.png`,fullPage:true,animations:'disabled'});
    }
  }
  await page.setViewportSize({width:844,height:390});
  await nav('prog');
  await page.locator('[data-a="start"][data-v="X"]').click();
  await page.locator('#w [data-a="vp"]').click();
  assert(await page.evaluate(()=>document.querySelector('.vp').getBoundingClientRect().width<=innerWidth),'Landscape video bounded');
  await page.screenshot({path:'output/playwright/workout-landscape.png',animations:'disabled'});
  await page.locator('#w [data-a="quit"]').click();
  await page.locator('#dlg [data-a="yes"]').click();
  await page.waitForFunction(()=>document.activeElement.matches('[data-a="start"]'));
  await page.evaluate(()=>{check.act.start('X');check.act.done();check.act.quit();check.act.yes();});
  await page.waitForTimeout(650); // Let the canceled set's delayed callback run.
  assert(await page.evaluate(()=>check.W===null),'Ending during set feedback stays closed');
  await page.setViewportSize({width:390,height:844});
  await nav('home');
  assert((await page.locator('.wn').textContent()).includes('62.5'),'Decimal home weight');
  await page.evaluate(()=>document.documentElement.dataset.theme='light');
  await page.screenshot({path:'output/playwright/light-390.png',fullPage:true,animations:'disabled'});
  await page.evaluate(()=>delete document.documentElement.dataset.theme);
  await nav('me');
  await page.evaluate(()=>{check.FB={auth:{currentUser:{email:'test@example.com'}}};check.render();});
  assert(await page.locator('.account').textContent().then(t=>t.includes('Signed in as test@example.com')),'Signed-in profile markup');
  assert(await page.locator('.account p').last().evaluate(el=>getComputedStyle(el).borderBottomStyle==='none'),'No divider above sign out');
  await page.screenshot({path:'output/playwright/account-390.png',fullPage:true,animations:'disabled'});
  await page.evaluate(()=>{check.FB=null;check.render();});
  await page.locator('nav [data-v="ex"]').focus();
  await page.keyboard.press('Enter');
  await page.locator('#search').fill('skull');
  assert(await page.locator('.exercise-card').count()===1,'Native search');
  await page.locator('.exercise-card .lnk').click();
  await page.keyboard.press('Escape');
  assert(!await page.locator('#dlg').isVisible(),'Keyboard dialog closes');
  assert(errors.length===0,'No app runtime errors: '+errors.join('; '));
  return 'PASS: 58 tutorial mappings; five views; A/B/C/X; full 15-set Day A; player continuity; timer; swaps/equipment; history/PR; decimal weight; persistence; 320/390/820/1280 layouts; landscape; keyboard focus; light; reduced motion.';
}
