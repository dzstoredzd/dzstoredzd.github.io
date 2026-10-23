/* Static website pricing. No database, account, or entitlement API. */
(function () {
  'use strict';
  var copies = {
    ar: { title: 'Store Soft — الأسعار والعروض', intro: 'أسعار واضحة بالدينار الجزائري. فريقنا يساعدك قبل التفعيل.', loading: 'جارٍ تحميل العروض…', error: 'تعذّر عرض الأسعار. تواصل معنا عبر واتساب للمساعدة.', empty: 'لا توجد عروض منشورة الآن. تواصل معنا للمساعدة.', contact: 'تواصل عبر واتساب', supportTitle: 'نساعدك في الاختيار.', supportBody: 'تواصل معنا لتأكيد السعر والتفعيل قبل الدفع.', home: 'الرئيسية', privacy: 'الخصوصية', devices: 'عدد الأجهزة', less: 'جهاز أقل', more: 'جهاز إضافي', perYear: '/ السنة', perDay: ['أقل من ', ' في اليوم'], extra: ['كل جهاز إضافي: ', ' في السنة'], gains: 'ما تربحه', subscribe: 'اشترك عبر واتساب', payment: 'الدفع عبر CCP أو BaridiMob', colon: ': ', firstOnce: 'مرة واحدة للجهاز الأول', ask: 'اطلبه عبر واتساب', order: 'مرحبًا، أريد هذا العرض من Store Soft:', countLine: 'عدد الأجهزة: ', totalLine: function (amount) { return 'المجموع: ' + amount + ' في السنة'; }, message: 'مرحبًا، أريد معلومات عن عروض Store Soft.', lastDay: '⏳ اليوم آخر يوم', twoDays: '⏳ باقي يومان فقط', daysLeft: function (n) { return '⏳ باقي ' + n + (n <= 10 ? ' أيام' : ' يومًا') + ' فقط'; } },
    fr: { title: 'Store Soft — Tarifs et offres', intro: 'Des prix clairs en dinars algériens. Notre équipe vous accompagne avant l’activation.', loading: 'Chargement des offres…', error: 'Impossible d’afficher les tarifs. Contactez-nous sur WhatsApp.', empty: 'Aucune offre publiée pour le moment. Contactez-nous.', contact: 'Nous contacter sur WhatsApp', supportTitle: 'Nous vous aidons à choisir.', supportBody: 'Contactez-nous pour confirmer le prix et l’activation avant paiement.', home: 'Accueil', privacy: 'Confidentialité', devices: 'Nombre d’appareils', less: 'Un appareil de moins', more: 'Un appareil de plus', perYear: '/ an', perDay: ['Moins de ', ' par jour'], extra: ['Chaque appareil en plus : ', ' par an'], gains: 'Ce que vous gagnez', subscribe: 'S’abonner sur WhatsApp', payment: 'Paiement par CCP ou BaridiMob', colon: ' : ', firstOnce: 'une seule fois pour le premier appareil', ask: 'Le demander sur WhatsApp', order: 'Bonjour, je veux cette offre Store Soft :', countLine: 'Nombre d’appareils : ', totalLine: function (amount) { return 'Total : ' + amount + ' par an'; }, message: 'Bonjour, je souhaite des informations sur les offres Store Soft.', lastDay: '⏳ Dernier jour aujourd’hui', twoDays: '⏳ Plus que 2 jours', daysLeft: function (n) { return '⏳ Plus que ' + n + ' jours'; } },
    en: { title: 'Store Soft — Pricing and offers', intro: 'Clear prices in Algerian dinars. Our team helps you before activation.', loading: 'Loading offers…', error: 'Could not display pricing. Contact us on WhatsApp.', empty: 'No published offers right now. Contact us for help.', contact: 'Contact us on WhatsApp', supportTitle: 'We help you choose.', supportBody: 'Contact us to confirm the price and activation before payment.', home: 'Home', privacy: 'Privacy', devices: 'Number of devices', less: 'One device less', more: 'One more device', perYear: '/ year', perDay: ['Less than ', ' a day'], extra: ['Each extra device: ', ' a year'], gains: 'What you get', subscribe: 'Subscribe on WhatsApp', payment: 'Pay by CCP or BaridiMob', colon: ': ', firstOnce: 'once for the first device', ask: 'Ask on WhatsApp', order: 'Hello, I want this Store Soft offer:', countLine: 'Number of devices: ', totalLine: function (amount) { return 'Total: ' + amount + ' a year'; }, message: 'Hello, I would like information about Store Soft offers.', lastDay: '⏳ Last day today', twoDays: '⏳ Only 2 days left', daysLeft: function (n) { return '⏳ Only ' + n + ' days left'; } }
  };
  var params = new URLSearchParams(location.search), language = params.get('lang');
  if (!copies[language]) language = 'ar';
  var copy = copies[language];
  // ?embed=1: only the prices, shown inside the download and Android pages (same site).
  var embed = params.get('embed') === '1' && window.parent !== window;
  if (embed) document.documentElement.className += ' embed';
  // Tells the page around the frame how tall the prices are, and opens links outside the frame.
  function fitParent() {
    if (!embed) return;
    Array.prototype.forEach.call(document.querySelectorAll('a[href^="https://"]'), function (link) { link.target = '_blank'; link.rel = 'noopener'; });
    window.parent.postMessage({ type: 'storesoft-pricing-height', height: Math.ceil(document.body.getBoundingClientRect().height) }, location.origin);
  }
  var offers = document.getElementById('offers'), status = document.getElementById('status');
  var last = document.getElementById('last'), help = document.getElementById('help');
  // One device count for the page; cards update in place so the +/- buttons keep focus.
  var count = 1, cards = [];
  function node(tag, text, className) { var el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (className) el.className = className; return el; }
  function money(amount) {
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 100000000000) throw new Error('Invalid price');
    var whole = String(Math.floor(amount / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return whole + (amount % 100 ? '.' + ('0' + amount % 100).slice(-2) : '') + ' DA';
  }
  function text(value) { if (typeof value !== 'string' || !value.trim()) throw new Error('Missing content'); return value; }
  function localized(value) { return text(value && value[language]); }
  // A line like "Less than <19 DA> a day"; returns the line and its price node.
  function pricedLine(parts, className) {
    var line = node('p', parts[0], className), value = node('bdi');
    value.dir = 'ltr'; line.appendChild(value); line.appendChild(document.createTextNode(parts[1]));
    return { line: line, value: value };
  }
  // "Less than N DA a day": N is the next whole dinar above the yearly total / 365.
  function perDay(yearCentimes) { return (Math.floor(yearCentimes / 36500) + 1) * 100; }
  // Days left counts today and the last day, both in Algeria time.
  function daysLeftLabel(today, until) {
    var n = Math.round((Date.parse(until) - Date.parse(today)) / 86400000) + 1;
    return n <= 1 ? copy.lastDay : n === 2 ? copy.twoDays : copy.daysLeft(n);
  }
  function whatsApp(lines) { return 'https://wa.me/213654338649?text=' + encodeURIComponent(lines.join('\n')); }
  function total(offer) { return offer.first_device_year_centimes + (count - 1) * offer.additional_device_year_centimes; }
  function update() {
    cards.forEach(function (card) {
      var sum = total(card.offer);
      card.amount.textContent = money(sum);
      card.perDay.textContent = money(perDay(sum));
      card.count.textContent = String(count);
      card.less.disabled = count <= 1; card.more.disabled = count >= 100;
      card.link.href = whatsApp([copy.order, card.title, copy.countLine + count, copy.totalLine(money(sum))]);
    });
    fitParent();
  }
  function change(step) { var next = count + step; if (next >= 1 && next <= 100) { count = next; update(); } }
  function yearlyCard(offer) {
    money(offer.first_device_year_centimes); money(offer.additional_device_year_centimes);
    var title = localized(offer.title), card = node('article', undefined, 'offer');
    card.setAttribute('data-code', offer.code);
    card.appendChild(node('h2', title));
    var price = node('p', undefined, 'price'), amount = node('bdi', undefined, 'amount');
    amount.dir = 'ltr'; price.appendChild(amount); price.appendChild(node('span', copy.perYear, 'period'));
    card.appendChild(price);
    var day = pricedLine(copy.perDay, 'per-day'); card.appendChild(day.line);
    var devices = node('div', undefined, 'devices'), label = node('span', copy.devices, 'devices-label');
    var stepper = node('div', undefined, 'stepper'), less = node('button', '−', 'less'), more = node('button', '+', 'more'), shown = node('output', '1', 'count');
    label.id = 'devices-' + offer.code;
    stepper.setAttribute('role', 'group'); stepper.setAttribute('aria-labelledby', label.id);
    less.type = 'button'; more.type = 'button';
    less.setAttribute('aria-label', copy.less); more.setAttribute('aria-label', copy.more); shown.setAttribute('aria-live', 'polite');
    less.onclick = function () { change(-1); }; more.onclick = function () { change(1); };
    stepper.appendChild(less); stepper.appendChild(shown); stepper.appendChild(more);
    devices.appendChild(label); devices.appendChild(stepper); card.appendChild(devices);
    var extra = pricedLine(copy.extra, 'extra'); extra.value.textContent = money(offer.additional_device_year_centimes); card.appendChild(extra.line);
    card.appendChild(node('h3', copy.gains, 'gains'));
    var list = node('ul', undefined, 'features'), features = offer.features && offer.features[language];
    if (!Array.isArray(features) || !features.length) throw new Error('Missing features');
    features.forEach(function (feature) { list.appendChild(node('li', text(feature))); });
    card.appendChild(list);
    var link = node('a', copy.subscribe, 'button'); card.appendChild(link);
    card.appendChild(node('p', copy.payment, 'payment'));
    card.appendChild(node('p', localized(offer.billing_note), 'billing-note'));
    cards.push({ offer: offer, title: title, amount: amount, perDay: day.value, count: shown, less: less, more: more, link: link });
    return card;
  }
  // The old lifetime offer is a small strip above the card until it ends.
  function lifetimeStrip(offer, today) {
    var title = localized(offer.title), price = money(offer.first_device_once_centimes);
    var strip = node('a', undefined, 'last-offer'), line = node('span', title + copy.colon, 'last-title'), value = node('bdi', price);
    strip.setAttribute('data-code', offer.code);
    value.dir = 'ltr'; line.appendChild(value); line.appendChild(document.createTextNode(' ' + copy.firstOnce));
    strip.appendChild(line);
    var row = node('span', undefined, 'last-row');
    if (offer.available_until) row.appendChild(node('span', daysLeftLabel(today, offer.available_until), 'badge'));
    row.appendChild(node('span', copy.ask, 'ask'));
    strip.appendChild(row);
    strip.href = whatsApp([copy.order, title + copy.colon + price + ' ' + copy.firstOnce]);
    return strip;
  }
  function clear(message, error) {
    cards = []; offers.textContent = ''; last.textContent = ''; last.hidden = true;
    status.textContent = message; status.className = error ? 'error' : '';
    offers.setAttribute('aria-busy', 'false'); help.hidden = false;
    fitParent();
  }
  function render(data) {
    if (!data || !Array.isArray(data.offers)) throw new Error('Invalid pricing');
    var fragment = document.createDocumentFragment(), strip = null, seen = {};
    data.offers.forEach(function (offer) {
      var code = text(offer.code);
      if (seen[code] || ['lifetime', 'yearly'].indexOf(offer.billing) < 0) throw new Error('Invalid offer');
      seen[code] = true;
      if (offer.billing === 'yearly') fragment.appendChild(yearlyCard(offer));
      else if (strip) throw new Error('Two lifetime offers');
      else strip = lifetimeStrip(offer, data.today);
    });
    if (!cards.length && !strip) { clear(copy.empty, false); return; }
    update();
    status.textContent = ''; status.className = '';
    offers.appendChild(fragment); offers.setAttribute('aria-busy', 'false');
    if (strip) { last.appendChild(strip); last.hidden = false; }
    help.hidden = true;
    fitParent();
  }
  function start() {
    try {
      // Today in Algeria (UTC+1, no daylight saving), as YYYY-MM-DD.
      var today = new Date(Date.now() + 3600000).toISOString().slice(0, 10);
      if (!Array.isArray(window.storeSoftOffers)) throw new Error('Missing offers');
      render({ today: today, offers: window.storeSoftOffers.filter(function (offer) {
        return !offer.available_until || today <= offer.available_until;
      }) });
    } catch (_) { clear(copy.error, true); }
  }
  document.documentElement.lang = language; document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'; document.title = copy.title;
  document.querySelector('meta[name="description"]').content = copy.intro;
  Array.prototype.forEach.call(document.querySelectorAll('[data-ui]'), function (el) { el.textContent = copy[el.getAttribute('data-ui')]; });
  Array.prototype.forEach.call(document.querySelectorAll('[data-lang]'), function (el) { if (el.getAttribute('data-lang') === language) el.setAttribute('aria-current', 'true'); });
  document.getElementById('support').href = whatsApp([copy.message]);
  start();
  if (embed) {
    window.addEventListener('resize', fitParent);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitParent);
  }
})();
