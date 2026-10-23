// Static website QA. Every non-local request is blocked.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const server=createServer(async(req,res)=>{
  const relative=new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html');
  const target=path.resolve(root,'.'+relative);
  if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.png':'image/png','.woff2':'font/woff2'})[path.extname(target)]||'text/plain'}).end(await readFile(target));}catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
let browser;
try{
  browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'msedge',headless:true});
  for(const width of [320,390,599,600,900,1200,1440]){
    const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();
    const errors=[],external=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/*',route=>{if(route.request().url().startsWith(base))return route.continue();external.push(route.request().url());return route.abort();});
    // Before 1 November 2026 (Algeria time): one yearly card plus the lifetime strip.
    await page.clock.setFixedTime(new Date('2026-10-31T22:30:00Z'));
    for(const language of ['ar','fr','en']){
      await page.goto(base+'/pricing/?lang='+language);
      await page.locator('.offer').first().waitFor();
      assert.equal(await page.locator('html').getAttribute('dir'),language==='ar'?'rtl':'ltr');
      assert.equal(await page.locator('html').getAttribute('lang'),language);
      const card=page.locator('[data-code="yearly"]'),strip=page.locator('.last-offer');
      assert.equal(await page.locator('.offer').count(),1,'One clear card');
      assert.equal(await card.locator('.count').innerText(),'1');
      assert.ok(await card.locator('.less').isDisabled(),'Cannot go below one device');
      assert.equal(await card.locator('.amount').innerText(),'6 900 DA');
      assert.match(await card.locator('.per-day').innerText(),/19 DA/);
      assert.match(await card.locator('.extra').innerText(),/3 000 DA/);
      assert.equal(await card.locator('.features li').count(),7);
      assert.match(await card.locator('.payment').innerText(),/CCP[\s\S]*BaridiMob/);
      // 31 October 23:30 in Algeria: the lifetime strip says it is the last day.
      assert.ok(await strip.isVisible());
      assert.match(await strip.innerText(),/7 000 DA/);
      assert.equal(await strip.locator('.badge').innerText(),{ar:'⏳ اليوم آخر يوم',fr:'⏳ Dernier jour aujourd’hui',en:'⏳ Last day today'}[language]);
      assert.match(await strip.getAttribute('href'),/^https:\/\/wa\.me\/213654338649\?text=/);
      assert.equal(await page.locator('#status').isVisible(),false,'No status line when prices show');
      assert.equal(await page.locator('#help').isVisible(),false,'One WhatsApp button when prices show');
      assert.doesNotMatch(await page.locator('.offers').innerText()+await strip.innerText(),/دج|7000|6900/,'One price format: "7 000 DA"');
      assert.ok(await page.evaluate(async()=>{await document.fonts.ready;return document.fonts.check('700 16px "IBM Plex Sans Arabic"')&&getComputedStyle(document.body).fontFamily.startsWith('"IBM Plex Sans Arabic"');}),'App font is loaded');
      await card.locator('.more').click();await card.locator('.more').click();
      assert.equal(await card.locator('.count').innerText(),'3');
      assert.equal(await card.locator('.amount').innerText(),'12 900 DA');
      assert.match(await card.locator('.per-day').innerText(),/36 DA/);
      const order=decodeURIComponent((await card.locator('.button').getAttribute('href')).split('?text=')[1]);
      assert.ok(order.includes('3')&&order.includes('12 900 DA'),'WhatsApp order carries devices and total');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}/${language} overflow`);
      for(const selector of ['[data-code="yearly"] .less','[data-code="yearly"] .more','[data-code="yearly"] .button','.last-offer','[data-lang="ar"]']){
        const box=await page.locator(selector).boundingBox();assert.ok(box.height>=48&&box.width>=48,`${selector} touch target`);
      }
      await context.setOffline(true);
      await page.evaluate(()=>window.dispatchEvent(new Event('offline')));
      assert.equal(await page.locator('.offer').count(),1,'Loaded static prices remain available offline');
      await card.locator('.more').click();
      assert.equal(await card.locator('.amount').innerText(),'15 900 DA');
      await card.locator('.less').click();await card.locator('.less').click();await card.locator('.less').click();
      assert.equal(await card.locator('.amount').innerText(),'6 900 DA');
      await context.setOffline(false);
      if(process.env.QA_OUTPUT_DIR&&[390,1440].includes(width)){await mkdir(process.env.QA_OUTPUT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.QA_OUTPUT_DIR,`static-pricing-${width}-${language}.png`),fullPage:true});}
    }
    // Days left count today and 31 October (Algeria time).
    for(const [time,label] of [['2026-10-22T10:00:00Z','⏳ باقي 10 أيام فقط'],['2026-10-30T09:00:00Z','⏳ باقي يومان فقط'],['2026-10-19T23:30:00Z','⏳ باقي 12 يومًا فقط']]){
      await page.clock.setFixedTime(new Date(time));
      await page.goto(base+'/pricing/?lang=ar');
      assert.equal(await page.locator('.last-offer .badge').innerText(),label);
    }
    await page.goto(base+'/pricing/?lang=fr');
    assert.equal(await page.locator('.last-offer .badge').innerText(),'⏳ Plus que 12 jours');
    // From 1 November 2026 00:00 Algeria time the lifetime strip is gone.
    await page.clock.setFixedTime(new Date('2026-10-31T23:00:00Z'));
    await page.goto(base+'/pricing/?lang=ar');
    await page.locator('.offer').first().waitFor();
    assert.equal(await page.locator('.offer').count(),1);
    assert.equal(await page.locator('.last-offer').count(),0);
    assert.equal(await page.locator('[data-code="yearly"] .amount').innerText(),'6 900 DA');
    await page.goto(base+'/pricing/?lang=invalid');assert.equal(await page.locator('html').getAttribute('lang'),'ar');
    // Missing offers: error line and the WhatsApp help box.
    await page.route('**/pricing/offers.js*',route=>route.fulfill({status:200,contentType:'text/javascript',body:''}));
    await page.goto(base+'/pricing/?lang=ar');
    assert.equal(await page.locator('.offer').count(),0);
    assert.ok(await page.locator('#status.error').isVisible());assert.ok(await page.locator('#support').isVisible());
    assert.match(await page.locator('#support').getAttribute('href'),/^https:\/\/wa.me\/213654338649/);
    await page.unroute('**/pricing/offers.js*');
    assert.deepEqual(external,[],'No Supabase or other API requests');assert.deepEqual(errors,[]);
    await context.close();console.log(`PASS static pricing AR/FR/EN, local totals, offline and layout ${width}px; zero external requests`);
  }
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
