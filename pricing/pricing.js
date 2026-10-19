/* Static website pricing. No database, account, or entitlement API. */
(function () {
  'use strict';
  var copies = {
    ar: { title: 'Store Soft — الأسعار والعروض', eyebrow: 'Store Soft · العروض الحالية', heading: 'اختر ما يناسب محلك.', intro: 'أسعار واضحة بالدينار الجزائري. فريقنا يساعدك قبل التفعيل.', devices: 'عدد الأجهزة لحساب المزامنة', refresh: 'تحديث الأسعار', loading: 'جارٍ تحميل العروض…', error: 'تعذّر عرض الأسعار. تواصل معنا عبر واتساب للمساعدة.', empty: 'لا توجد عروض منشورة الآن. تواصل معنا للمساعدة.', fresh: 'الأسعار الحالية · تأكد مع فريقنا قبل الدفع.', contact: 'تواصل عبر واتساب', supportTitle: 'نساعدك في الاختيار.', supportBody: 'تواصل معنا لتأكيد السعر والتفعيل قبل الدفع.', separate: 'هذه الصفحة لعرض الأسعار. التفعيل وتجديد الاشتراك يتمان مع فريق Store Soft.', home: 'الرئيسية', privacy: 'الخصوصية', once: 'دفع مرة واحدة', initial: 'الدفع الأول', renewal: 'التجديد السنوي', activation: 'تفعيل الجهاز الأول', extra: 'لكل جهاز إضافي / سنة', message: 'مرحبًا، أريد معلومات عن عروض Store Soft.' },
    fr: { title: 'Store Soft — Tarifs et offres', eyebrow: 'Store Soft · Offres actuelles', heading: 'Choisissez ce qui convient à votre magasin.', intro: 'Des prix clairs en dinars algériens. Notre équipe vous accompagne avant l’activation.', devices: 'Nombre d’appareils pour le calcul Sync', refresh: 'Actualiser les tarifs', loading: 'Chargement des offres…', error: 'Impossible d’afficher les tarifs. Contactez-nous sur WhatsApp.', empty: 'Aucune offre publiée pour le moment. Contactez-nous.', fresh: 'Tarifs actuels · Confirmez avec notre équipe avant paiement.', contact: 'Nous contacter sur WhatsApp', supportTitle: 'Nous vous aidons à choisir.', supportBody: 'Contactez-nous pour confirmer le prix et l’activation avant paiement.', separate: 'Cette page présente les tarifs. Activation et renouvellement se font avec l’équipe Store Soft.', home: 'Accueil', privacy: 'Confidentialité', once: 'Un seul paiement', initial: 'Premier paiement', renewal: 'Renouvellement annuel', activation: 'Activation du premier appareil', extra: 'Par appareil supplémentaire / an', message: 'Bonjour, je souhaite des informations sur les offres Store Soft.' },
    en: { title: 'Store Soft — Pricing and offers', eyebrow: 'Store Soft · Current offers', heading: 'Choose what fits your shop.', intro: 'Clear prices in Algerian dinars. Our team helps you before activation.', devices: 'Number of devices for the Sync estimate', refresh: 'Refresh prices', loading: 'Loading offers…', error: 'Could not display pricing. Contact us on WhatsApp.', empty: 'No published offers right now. Contact us for help.', fresh: 'Current prices · Confirm with our team before payment.', contact: 'Contact us on WhatsApp', supportTitle: 'We help you choose.', supportBody: 'Contact us to confirm the price and activation before payment.', separate: 'This page displays pricing. Activation and subscription renewal are handled by the Store Soft team.', home: 'Home', privacy: 'Privacy', once: 'One-time payment', initial: 'Initial payment', renewal: 'Yearly renewal', activation: 'First-device activation', extra: 'Per additional device / year', message: 'Hello, I would like information about Store Soft offers.' }
  };
  var language = new URLSearchParams(location.search).get('lang');
  if (!copies[language]) language = 'ar';
  var copy = copies[language];
  var offers = document.getElementById('offers'), status = document.getElementById('status');
  var devices = document.getElementById('devices');
  function node(tag, text, className) { var el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (className) el.className = className; return el; }
  function money(amount) {
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 100000000000) throw new Error('Invalid price');
    var whole = String(Math.floor(amount / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return whole + (amount % 100 ? '.' + ('0' + amount % 100).slice(-2) : '') + ' DA';
  }
  function text(value) { if (typeof value !== 'string' || !value.trim()) throw new Error('Missing content'); return value; }
  function localized(value) { return text(value && value[language]); }
  function priceLine(label, amount) {
    var line = node('p', label + ': '), value = node('bdi', money(amount));
    value.dir = 'ltr'; line.appendChild(value); return line;
  }
  function supportLink(offer) {
    var link = node('a', copy.contact, 'button');
    link.href = 'https://wa.me/213654338649?text=' + encodeURIComponent(copy.message + (offer ? '\n' + offer + '\n' + location.href : ''));
    return link;
  }
  function clear(message, error) {
    offers.textContent = ''; status.textContent = message; status.className = error ? 'error' : '';
    offers.setAttribute('aria-busy', 'false');
  }
  function render(data) {
    if (!data || !Array.isArray(data.offers) || data.devices !== Number(devices.value)) throw new Error('Invalid pricing');
    var fragment = document.createDocumentFragment(), seen = {};
    data.offers.forEach(function (offer) {
      var code = text(offer.code);
      if (seen[code] || ['once', 'activation_and_yearly'].indexOf(offer.billing) < 0) throw new Error('Invalid offer');
      seen[code] = true;
      var card = node('article', undefined, 'offer'); card.setAttribute('data-code', code);
      var title = localized(offer.title);
      card.appendChild(node('h2', title)); card.appendChild(node('p', localized(offer.description), 'description'));
      var amount = node('p', money(offer.initial_centimes), 'amount'); amount.dir = 'ltr'; card.appendChild(amount);
      card.appendChild(node('p', offer.billing === 'once' ? copy.once : copy.initial, 'period'));
      if (offer.billing === 'activation_and_yearly') {
        var breakdown = node('div', undefined, 'breakdown');
        breakdown.appendChild(priceLine(copy.activation, offer.activation_centimes));
        breakdown.appendChild(priceLine(copy.extra, offer.additional_device_year_centimes));
        breakdown.appendChild(priceLine(copy.renewal, offer.renewal_centimes));
        card.appendChild(breakdown);
      }
      card.appendChild(node('p', localized(offer.billing_note), 'billing-note'));
      var list = node('ul', undefined, 'features'), features = offer.features && offer.features[language];
      if (!Array.isArray(features) || !features.length) throw new Error('Missing features');
      features.forEach(function (feature) { list.appendChild(node('li', text(feature))); });
      card.appendChild(list); card.appendChild(supportLink(title)); fragment.appendChild(card);
    });
    clear(data.offers.length ? copy.fresh : copy.empty, false); offers.appendChild(fragment);
  }
  function refresh() {
    try {
      var count = Number(devices.value);
      if (!Number.isInteger(count) || count < 2 || count > 100) throw new Error('Invalid device count');
      var offers = window.storeSoftOffers.map(function (offer) {
        var quote = {};
        Object.keys(offer).forEach(function (key) { quote[key] = offer[key]; });
        quote.renewal_centimes = offer.billing === 'activation_and_yearly' ? (count - 1) * offer.additional_device_year_centimes : null;
        quote.initial_centimes = offer.activation_centimes + (quote.renewal_centimes || 0);
        return quote;
      });
      render({ offers: offers, devices: count });
    } catch (_) { clear(copy.error, true); }
  }
  document.documentElement.lang = language; document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'; document.title = copy.title;
  document.querySelector('meta[name="description"]').content = copy.intro;
  Array.prototype.forEach.call(document.querySelectorAll('[data-ui]'), function (el) { el.textContent = copy[el.getAttribute('data-ui')]; });
  Array.prototype.forEach.call(document.querySelectorAll('[data-lang]'), function (el) { if (el.getAttribute('data-lang') === language) el.setAttribute('aria-current', 'true'); });
  document.getElementById('support').href = supportLink().href;
  for (var count = 3; count <= 100; count++) { var option = node('option', String(count)); option.value = String(count); devices.appendChild(option); }
  devices.onchange = refresh;
  refresh();
})();
