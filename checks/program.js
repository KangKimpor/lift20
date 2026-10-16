// Run with playwright-cli run-code --filename checks/program.js (app on port 4173).
async page => {
  const assert=(ok,message)=>{if(!ok)throw Error(message)},base='http://127.0.0.1:4173/';
  await page.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
  await page.route(base,async route=>{
    const response=await route.fetch(),html=await response.text();
    await route.fulfill({response,body:html.replace('</script></body>','window.check={E,PROGRAM,act,ensure,fix,mergeData,save,get S(){return S},get W(){return W}};</script></body>')});
  });
  await page.goto(base);
  const legacy={prog:{A:['dip','gob','ohrow','rdl'],B:['sp','rl','pu','bor'],C:['dip','rdl','gob','sp'],X:['tpu','bor','arn','sk']},hist:[{d:123,dur:20,day:'A',logs:[{id:'dip',reps:10}]}],eq:{dip:1,db:1,bar:0},pr:{dip:10},w:[{d:123,kg:60}],vids:{dip:'3j4YTFsHodc'},hdel:[122]};
  await page.evaluate(data=>{localStorage.clear();localStorage.lift20=JSON.stringify(data);localStorage.lift20_seen=1},legacy);
  await page.reload();
  assert(await page.evaluate(()=>check.S.programVersion===2&&JSON.stringify(check.S.prog)===JSON.stringify(check.PROGRAM)),'Legacy saved routines migrate to all four coached days');
  assert(await page.evaluate(data=>['hist','eq','pr','w','vids','hdel'].every(k=>JSON.stringify(check.S[k])===JSON.stringify(data[k])),legacy),'Migration preserves history, equipment, PRs, weight, video overrides and deletions');
  assert(await page.evaluate(()=>JSON.parse(localStorage.lift20).programVersion===2),'Migration persists without a user action');
  const targets={dip:[3,5,8,180],ohrow:[3,12,25,120],rl:[3,8,15,120],rdl:[3,12,25,120],sp:[3,8,15,120],bor:[3,12,25,120],pu:[3,10,15,120],gob:[3,12,25,120],split:[3,10,20,120],ssrdl:[3,10,20,120],ham:[2,10,20,75],slcalf:[2,12,25,60],dead:[2,8,12,60],ptr:[2,10,20,60]};
  assert(await page.evaluate(targets=>Object.entries(targets).every(([id,t])=>{const e=check.E[id];return JSON.stringify([e.s,e.lo,e.hi,e.r])===JSON.stringify(t)}),targets),'All programmed sets, rep ranges and rests match coaching plan');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('nav [data-v="prog"]').click();
  assert(await page.locator('.day-card').nth(2).textContent().then(t=>t.includes('Static Split Squat')&&t.includes('Staggered-Stance DB RDL')&&t.includes('/ side')&&t.includes('120s rest')),'Day C shows new movements, per-side reps and rest');
  assert(await page.locator('.day-card').nth(3).textContent().then(t=>t.includes('2 sets')&&t.includes('Optional')&&!t.includes('Arnold')),'Day X is an optional accessory session');
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'output/playwright/new-program-390.png',fullPage:true,animations:'disabled'});
  for(const [day,ids] of Object.entries(await page.evaluate(()=>check.PROGRAM))){
    await page.evaluate(day=>{check.act.start(day);check.act.go()},day);
    assert(await page.evaluate(day=>check.W.total===(day==='X'?8:12),day),'Set total for '+day);
    for(let i=0;i<ids.length;i++){
      await page.evaluate(i=>{if(check.W.rest)check.act.next();check.W.i=i;check.W.s=0;check.act.done()},i);
      await page.waitForFunction(()=>check.W.rest);
      assert(await page.evaluate(seconds=>check.W.rest.tot===seconds,targets[ids[i]][3]),'Actual timer for '+ids[i]);
    }
    await page.evaluate(()=>{check.act.quit();check.act.yes()});
  }
  await page.evaluate(()=>{check.S.prog.A=['pu'];check.save();check.ensure()});
  await page.reload();
  assert(await page.evaluate(()=>check.S.prog.A.join()==='pu'),'Later customizations survive ensure and refresh');
  await page.evaluate(()=>{const data=check.mergeData(check.S,{hist:[]});Object.assign(check.S,data);check.ensure()});
  assert(await page.evaluate(()=>check.S.prog.A.join()==='pu'),'Cloud merge does not restore old defaults');
  await page.evaluate(()=>{check.S.eq.db=0;check.S.eq.dip=0;check.fix()});
  assert(await page.evaluate(()=>Object.values(check.S.prog).flat().every(id=>check.E[id].q==='bw')),'New movements respect equipment gates');
  return 'PASS: saved-program migration and data preservation; all four days and 14 exercise prescriptions; actual rest timers; per-side UI; 12/8-set totals; later customizations; cloud merge; equipment gates.';
}
