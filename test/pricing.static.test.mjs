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
  assert.equal(offers.length,2);
  for(const offer of offers){
    assert.ok(Number.isSafeInteger(offer.activation_centimes)&&offer.activation_centimes>0);
    if(offer.billing==='activation_and_yearly') assert.ok(Number.isSafeInteger(offer.additional_device_year_centimes));
    for(const lang of ['ar','fr','en']) for(const field of ['title','description','billing_note','features']) assert.ok(offer[field][lang].length);
  }
});
