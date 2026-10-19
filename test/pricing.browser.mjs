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
  try{res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.png':'image/png'})[path.extname(target)]||'text/plain'}).end(await readFile(target));}catch{res.writeHead(404).end();}
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
    for(const language of ['ar','fr','en']){
      await page.goto(base+'/pricing/?lang='+language);
      await page.locator('.offer').first().waitFor();
      assert.equal(await page.locator('html').getAttribute('dir'),language==='ar'?'rtl':'ltr');
      assert.equal(await page.locator('html').getAttribute('lang'),language);
      assert.equal(await page.locator('.offer').count(),2);
      assert.equal(await page.locator('[data-code="solo"] .amount').innerText(),'7 000 DA');
      assert.equal(await page.locator('[data-code="sync"] .amount').innerText(),'10 000 DA');
      await page.locator('#devices').selectOption('3');
      assert.equal(await page.locator('[data-code="sync"] .amount').innerText(),'13 000 DA');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}/${language} overflow`);
      for(const selector of ['#devices','#support','[data-lang="ar"]']){
        const box=await page.locator(selector).boundingBox();assert.ok(box.height>=48&&box.width>=48,`${selector} touch target`);
      }
      assert.match(await page.locator('#support').getAttribute('href'),/^https:\/\/wa.me\/213654338649/);
      await context.setOffline(true);
      await page.evaluate(()=>window.dispatchEvent(new Event('offline')));
      assert.equal(await page.locator('.offer').count(),2,'Loaded static prices remain available offline');
      await page.locator('#devices').selectOption('4');
      assert.equal(await page.locator('[data-code="sync"] .amount').innerText(),'16 000 DA');
      await context.setOffline(false);
      if(process.env.QA_OUTPUT_DIR&&[390,1440].includes(width)){await mkdir(process.env.QA_OUTPUT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.QA_OUTPUT_DIR,`static-pricing-${width}-${language}.png`),fullPage:true});}
    }
    await page.goto(base+'/pricing/?lang=invalid');assert.equal(await page.locator('html').getAttribute('lang'),'ar');
    await page.evaluate(()=>{window.storeSoftOffers=undefined;document.getElementById('devices').dispatchEvent(new Event('change'));});
    assert.equal(await page.locator('.offer').count(),0);assert.ok(await page.locator('#support').isVisible());
    assert.deepEqual(external,[],'No Supabase or other API requests');assert.deepEqual(errors,[]);
    await context.close();console.log(`PASS static pricing AR/FR/EN, local totals, offline and layout ${width}px; zero external requests`);
  }
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
