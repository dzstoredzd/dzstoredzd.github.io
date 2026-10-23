import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import vm from 'node:vm';
test('website owns complete localized offers and integer-centime prices without a pricing API', async()=>{
  const script = await readFile(new URL('../pricing/pricing.js',import.meta.url),'utf8');
  assert.doesNotMatch(script,/supabase|apikey|XMLHttpRequest|fetch\(|setInterval/);
  const context = {window:{}};
  vm.runInNewContext(await readFile(new URL('../pricing/offers.js',import.meta.url),'utf8'),context);
  const offers=context.window.storeSoftOffers;
  assert.equal(offers.map(offer=>offer.code).join(','),'lifetime,yearly');
  const [lifetime,yearly]=offers;
  for(const offer of offers){
    assert.equal(offer.additional_device_year_centimes,300000);
    for(const lang of ['ar','fr','en']) assert.ok(offer.title[lang].length);
  }
  // The lifetime strip shows only its title, price and days left.
  assert.equal(lifetime.billing,'lifetime');
  assert.equal(lifetime.first_device_once_centimes,700000);
  assert.equal(lifetime.available_until,'2026-10-31');
  assert.equal(yearly.billing,'yearly');
  assert.equal(yearly.first_device_year_centimes,690000);
  assert.equal(yearly.available_until,undefined);
  for(const lang of ['ar','fr','en']){
    assert.equal(yearly.features[lang].length,7);
    assert.ok(yearly.billing_note[lang].length);
  }
  assert.match(yearly.billing_note.ar,/يحتفظون بتفعيلهم الحالي/);
  assert.match(script,/today <= offer\.available_until/);
});
test('home page and welcome email show the yearly price, not a one-time payment', async()=>{
  const read=file=>readFile(new URL('../'+file,import.meta.url),'utf8');
  const [home,page,email]=await Promise.all([read('home.js'),read('index.html'),read('google-apps-script/Code.gs')]);
  assert.match(home,/"yearly": "اشتراك سنوي بسيط"/);
  assert.match(home,/"yearly": "Abonnement annuel simple"/);
  assert.match(page,/data-home-copy="yearly"/);
  assert.doesNotMatch(home+page,/دفع مرة واحدة|paiement unique/);
  assert.equal((email.match(/6900 دج سنويًا للجهاز الأول/g)||[]).length,2);
  assert.equal((email.match(/3000 دج سنويًا لكل جهاز إضافي/g)||[]).length,2);
  assert.equal((email.match(/ابتداءً من 1 نوفمبر 2026/g)||[]).length,2);
  assert.doesNotMatch(email,/7000 دج|مرة واحدة للجهاز الأول/);
});
test('every Store Soft page uses the self-hosted app font (IBM Plex Sans Arabic), no Google Fonts', async()=>{
  const read=file=>readFile(new URL('../'+file,import.meta.url),'utf8');
  const fontCss=await read('assets/fonts/plex.css');
  for(const weight of ['Regular','Medium','SemiBold','Bold']){
    assert.match(fontCss,new RegExp(`IBMPlexSansArabic-${weight}\\.woff2`));
    assert.ok((await readFile(new URL(`../assets/fonts/IBMPlexSansArabic-${weight}.woff2`,import.meta.url))).length>10000);
  }
  for(const page of ['index.html','privacy.html','terms.html','delete-account.html','pricing/index.html','storesoft/download/index.html','storesoft/v1/android/index.html','storesoft/try/index.html']){
    const html=await read(page);
    assert.match(html,/href="\/assets\/fonts\/plex\.css/,page);
    assert.doesNotMatch(html,/fonts\.googleapis|fonts\.gstatic/,page);
  }
  assert.match(await read('storesoft/try/index.html'),/font-src 'self'/);
  for(const css of ['styles.css','pricing/pricing.css','storesoft/download/styles.css','storesoft/try/styles.css']){
    assert.match(await read(css),/"IBM Plex Sans Arabic"/,css);
    assert.doesNotMatch(await read(css),/Alexandria/,css);
  }
});
