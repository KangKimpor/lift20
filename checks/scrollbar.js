// Run in an isolated touch-enabled Playwright context with the app on port 4173.
async page => {
  const assert=(ok,message)=>{if(!ok)throw Error(message)},errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const base='http://127.0.0.1:4173/';
  await page.route('https://www.gstatic.com/firebasejs/**',route=>route.abort());
  await page.route(base,async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:(await response.text()).replace('</script></body>',
      'window.check={act,render,get S(){return S}};</script></body>')});
  });
  await page.addInitScript(()=>localStorage.lift20_seen=1);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize({width:393,height:852});
  await page.goto(base);
  await page.waitForFunction(()=>window.check);
  const nav=async view=>page.locator(`nav [data-v="${view}"]`).click();
  const guide=page.locator('.scroll-guide'),thumb=guide.locator('i');
  assert(await guide.getAttribute('aria-hidden')==='true'&&await guide.evaluate(el=>getComputedStyle(el).pointerEvents==='none'),'Indicator does not intercept input or screen readers');
  await nav('ex');
  assert(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollbarWidth==='none'),'Native touch page scrollbar hidden');
  await page.evaluate(()=>scrollTo(0,(document.scrollingElement.scrollHeight-innerHeight)/2));
  await page.waitForFunction(()=>document.querySelector('.scroll-guide').classList.contains('visible'));
  const middle=await thumb.boundingBox(),track=await guide.boundingBox();
  assert(middle.width===3&&middle.height>=24&&middle.y>track.y&&middle.y+middle.height<track.y+track.height,'Rounded 3px thumb follows page progress');
  await page.evaluate(()=>visualViewport.dispatchEvent(new Event('scroll')));
  assert(await guide.evaluate(el=>el.classList.contains('visible')),'Viewport scroll events keep the active indicator visible');
  await page.evaluate(()=>scrollTo(0,document.scrollingElement.scrollHeight));
  await page.waitForFunction(()=>{
    const guide=document.querySelector('.scroll-guide'),thumb=guide.firstElementChild;
    return Math.abs(thumb.getBoundingClientRect().bottom-guide.getBoundingClientRect().bottom)<1;
  });
  await page.screenshot({path:'output/playwright/scrollbar-iphone.png'});
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('.scroll-guide')).opacity==='0');
  assert(await page.evaluate(()=>document.scrollingElement.scrollTop>0),'Fading preserves native scroll position');
  await page.setViewportSize({width:852,height:393});
  await page.evaluate(()=>{
    for(const [side,value] of Object.entries({top:0,right:59,bottom:21,left:59}))document.documentElement.style.setProperty('--safe-'+side,value+'px');
    scrollTo(0,100);
  });
  await page.waitForFunction(()=>document.querySelector('.scroll-guide').classList.contains('visible'));
  const landscape=await guide.boundingBox();
  assert(landscape.x+landscape.width<=852-59&&landscape.y+landscape.height<=393-21,'Indicator respects landscape safe areas');
  await nav('prog');
  await page.locator('[data-a=start][data-v=A]').click();
  await page.waitForFunction(()=>!document.querySelector('.scroll-guide').hidden);
  assert(await page.locator('#w').evaluate(el=>getComputedStyle(el).scrollbarWidth==='none'),'Native workout scrollbar hidden');
  await page.locator('#w').evaluate(el=>el.scrollTop=el.scrollHeight);
  await page.waitForFunction(()=>document.querySelector('.scroll-guide').classList.contains('visible'));
  await page.locator('#w [data-a=quit]').click();
  await page.locator('#dlg [data-a=yes]').click();
  await page.setViewportSize({width:820,height:1180});
  await page.evaluate(()=>{
    for(const side of ['top','right','bottom','left'])document.documentElement.style.setProperty('--safe-'+side,'0px');
  });
  await nav('home');
  await page.waitForFunction(()=>document.querySelector('.scroll-guide').hidden);
  assert(await page.evaluate(()=>document.scrollingElement.scrollHeight===document.scrollingElement.clientHeight),'No indicator on a page that fits');
  await nav('stats');
  await page.evaluate(()=>{
    check.S.w=Array.from({length:40},(_,i)=>({d:Date.now()-i*86400000,kg:62.5})).reverse();check.render();
  });
  await page.locator('.weight-history summary').click();
  await page.locator('.weight-entries').evaluate(el=>el.scrollTop=100);
  assert(await page.locator('.weight-entries').evaluate(el=>el.scrollTop===100&&getComputedStyle(el).scrollbarWidth==='thin'),'Inner weight history retains native scrolling');
  await page.emulateMedia({forcedColors:'active'});
  assert(await guide.evaluate(el=>getComputedStyle(el).display==='none')&&await page.evaluate(()=>getComputedStyle(document.documentElement).scrollbarWidth==='auto'),'Forced colors restores native page indicator');
  assert(errors.length===0,'No runtime errors: '+errors.join('; '));
  return 'PASS: touch indicator width/progress/fade; viewport events; safe areas; workout; short pages; inner history; reduced motion; forced colors.';
}
