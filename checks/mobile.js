// Run in an isolated touch-enabled Playwright context; see checks/smoke.js.
async page => {
  const assert=(ok,message)=>{if(!ok)throw Error(message)};
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const base='http://127.0.0.1:4173/';
  await page.route('https://www.gstatic.com/firebasejs/**',route=>route.abort());
  await page.route(base,async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:(await response.text()).replace('</script></body>',
      'window.check={act,render,get S(){return S}};</script></body>')});
  });
  await page.addInitScript(()=>localStorage.lift20_seen=1);
  await page.goto(base);
  await page.waitForFunction(()=>window.check);
  await page.emulateMedia({reducedMotion:'reduce'});
  assert(await page.locator('meta[name=viewport]').getAttribute('content').then(s=>s.includes('maximum-scale=1')&&s.includes('user-scalable=no')),'Zoom viewport settings');
  assert(await page.evaluate(()=>getComputedStyle(document.documentElement).touchAction==='pan-x pan-y'),'Scrolling allowed, pinch zoom excluded');
  assert(await page.evaluate(()=>['gesturestart','gesturechange'].every(type=>!document.dispatchEvent(new Event(type,{bubbles:true,cancelable:true})))),'Safari pinch gestures canceled');
  assert(await page.evaluate(()=>['touchstart','touchmove'].every(type=>document.dispatchEvent(new Event(type,{bubbles:true,cancelable:true})))),'Normal touch events are not blocked');
  assert(await page.locator('meta[name=apple-mobile-web-app-capable]').getAttribute('content')==='yes','Apple standalone mode');
  const manifest=await (await page.request.get(new URL(await page.locator('link[rel=manifest]').getAttribute('href'),base).href)).json();
  assert(manifest.display==='standalone'&&manifest.start_url==='./'&&!manifest.orientation,'Standalone manifest allows rotation');
  for(const [path,size] of [['icons/apple-touch-icon.png',180],['icons/icon-512.png',512]]){
    const response=await page.request.get(base+path),png=await response.body();
    assert(response.ok()&&png.readUInt32BE(16)===size&&png.readUInt32BE(20)===size,'Home Screen icon '+size);
  }
  const nav=async view=>page.locator(`nav [data-v="${view}"]`).click();
  // Insets are injected to test geometry; emulation does not reproduce Apple system UI.
  const sizes=[
    ['iphone15-portrait',393,852,59,0,34,0],
    ['iphone15-landscape',852,393,0,59,21,59],
    ['ipad-a16-portrait',820,1180,24,0,20,0],
    ['ipad-a16-landscape',1180,820,24,0,20,0],
    ['ipad-split',540,1000,24,0,20,0]
  ];
  for(const [name,width,height,top,right,bottom,left] of sizes){
    await page.setViewportSize({width,height});
    await page.evaluate(({top,right,bottom,left})=>{
      for(const [side,value] of Object.entries({top,right,bottom,left}))document.documentElement.style.setProperty('--safe-'+side,value+'px');
    },{top,right,bottom,left});
    for(const view of ['home','prog','ex','stats','me']){
      await nav(view);
      const bounds=await page.evaluate(()=>{
        const main=document.querySelector('main'),style=getComputedStyle(main),nav=document.querySelector('nav').getBoundingClientRect();
        return {overflow:document.documentElement.scrollWidth>innerWidth,top:parseFloat(style.paddingTop),left:parseFloat(style.paddingLeft),right:parseFloat(style.paddingRight),nav:{x:nav.x,right:nav.right,bottom:nav.bottom}};
      });
      assert(!bounds.overflow,'No horizontal overflow: '+name+' '+view);
      assert(bounds.top>=top+24&&bounds.left>=left&&bounds.right>=right,'Main safe areas: '+name+' '+view);
      assert(bounds.nav.x>=left+16&&bounds.nav.right<=width-right-16&&bounds.nav.bottom<=height-bottom-16,'Navigation safe areas: '+name);
      await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
      assert(await page.evaluate(()=>document.querySelector('#app').lastElementChild.getBoundingClientRect().bottom<=document.querySelector('nav').getBoundingClientRect().top),'Last content clears navigation: '+name+' '+view);
    }
    await nav('home');
    if(width>=768)assert(await page.evaluate(()=>document.querySelector('.summary-pair').getBoundingClientRect().right<=document.querySelector('.hero').getBoundingClientRect().left),'Tablet dashboard has two columns');
    await page.screenshot({path:`output/playwright/${name}-home.png`,fullPage:true,animations:'disabled'});
    await nav('ex');
    await page.locator('#search').focus();
    assert(await page.evaluate(()=>getComputedStyle(document.querySelector('nav')).visibility==='hidden'),'Navigation hides while typing: '+name);
    assert(await page.locator('#search').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=16),'Input avoids focus zoom');
    await page.locator('#search').evaluate(el=>el.blur());
    assert(await page.evaluate(()=>getComputedStyle(document.querySelector('nav')).visibility==='visible'),'Navigation returns after typing');
    await page.evaluate(()=>check.act.det('dip'));
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const dialog=await page.locator('#dlg').boundingBox();
    assert(dialog.x>=left+16&&dialog.x+dialog.width<=width-right-16&&dialog.y>=top&&dialog.y+dialog.height<=height-bottom,'Dialog safe areas: '+name);
    assert(await page.locator('#dlg').evaluate(el=>el.scrollTop===0&&el.querySelector('h2').getBoundingClientRect().top>=el.getBoundingClientRect().top),'Dialog opens with its title visible: '+name);
    await page.screenshot({path:`output/playwright/${name}-dialog.png`,animations:'disabled'});
    await page.getByRole('button',{name:'Close',exact:true}).click();
    await nav('prog');
    await page.locator('[data-a=start][data-v=A]').click();
    assert(await page.locator('#w').evaluate(el=>parseFloat(getComputedStyle(el).paddingTop))>=top+24,'Workout safe area: '+name);
    await page.screenshot({path:`output/playwright/${name}-workout.png`,fullPage:true,animations:'disabled'});
    await page.locator('#w [data-a=quit]').click();
    await page.locator('#dlg [data-a=yes]').click();
  }
  await page.setViewportSize({width:393,height:852});
  await nav('stats');
  await page.locator('#wi').fill('62.5');
  assert(await page.evaluate(()=>getComputedStyle(document.querySelector('nav')).visibility==='hidden'),'Weight keyboard hides navigation');
  await page.locator('[data-a=logw]').click();
  assert(await page.evaluate(()=>check.S.w.at(-1).kg===62.5),'Touch weight logging');
  assert(errors.length===0,'No runtime errors: '+errors.join('; '));
  return 'PASS: zoom controls; standalone metadata/icons; iPhone 15 and iPad A16 portrait/landscape; iPad split view; simulated safe areas; dialogs; workouts; touch keyboard; weight logging.';
}
