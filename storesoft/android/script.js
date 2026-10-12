(function () {
  'use strict';
  var endpoint = 'https://blczhiusyvpkxrktgwng.supabase.co/functions/v1/submit-store-soft-lead';
  var play = 'https://play.google.com/store/apps/details?id=com.yousoft.storesoft';
  var startedAt = Date.now();
  var language = 'ar';
  var submitting = false;
  var saved = false;
  var formStarted = false;
  var copies = {
    ar: {
      pageTitle: 'Store Soft — تطبيق تسيير المحلات على Android',
      brandTagline: 'تسيير بسيط لمحلك', title: 'محلك معك،<br><span>في هاتفك.</span>',
      intro: 'البيع، المخزون والكريدي في تطبيق واحد. سيّر محلك ببساطة، حتى بدون إنترنت.',
      jumpToForm: 'جرّب التطبيق على هاتفك', videoTitle: 'شاهد التطبيق في دقيقة',
      videoFrameTitle: 'شاهد Store Soft على Android', watchOnYoutube: 'شاهد على YouTube ↗',
      installStep: 'ثبّت التطبيق وابدأ التجربة', available: 'متاح على Google Play',
      pricingTitle: 'أسعار واضحة', basePriceTitle: 'التطبيق لجهاز واحد', insteadOf: 'بدلًا من',
      basePriceNote: 'دفع مرة واحدة. يعمل بدون إنترنت.', syncPriceTitle: 'Sync — المزامنة',
      syncPriceNote: 'سنويًا لكل جهاز إضافي.', syncPriceHint: 'اختياري، لربط أجهزة نفس المحل.',
      formTitle: 'ابدأ بمعلومات بسيطة', formIntro: 'عمّر معلوماتك وسنفتح Google Play مباشرة لتثبيت التطبيق.',
      nameLabel: 'الاسم', namePlaceholder: 'مثال: محمد', phoneLabel: 'رقم الهاتف / واتساب',
      phoneHint: 'رقم نقدر نساعدك من خلاله في استعمال التطبيق.', shopLabel: 'نوع النشاط / المحل',
      shopPlaceholder: 'اختر نوع المحل', shopGrocery: 'مواد غذائية / سوبرات', shopClothing: 'ملابس وأحذية',
      shopCosmetics: 'مواد تجميل', shopParts: 'قطع غيار', shopRepair: 'محل تصليح', shopOther: 'نشاط آخر',
      submit: 'تثبيت من Google Play', submitting: 'جاري إرسال معلوماتك…',
      privacyNote: 'نستعمل معلوماتك لمساعدتك في تجربة Store Soft.', privacyLink: 'سياسة الخصوصية', terms: 'شروط الاستخدام',
      successTitle: 'جاري فتح Google Play…', successText: 'تم حفظ معلوماتك. إذا لم يفتح المتجر، اضغط على الزر أدناه.',
      openPlay: 'فتح Google Play', needHelp: 'تحتاج مساعدة؟', whatsappCta: 'راسلنا على واتساب ↗',
      required: 'هذا الحقل مطلوب.', invalidName: 'اكتب اسمًا من حرفين إلى 80 حرفًا.',
      invalidPhone: 'أدخل رقم هاتف صحيحًا من 8 إلى 15 رقمًا.',
      generalError: 'تعذّر إرسال المعلومات. تحقق من الإنترنت وحاول مرة أخرى.'
    },
    fr: {
      pageTitle: 'Store Soft — Gestion de magasin sur Android',
      brandTagline: 'La gestion simple du magasin', title: 'Votre commerce,<br><span>dans votre poche.</span>',
      intro: 'Ventes, stock et crédit client dans une seule application. Gérez simplement votre magasin, même sans Internet.',
      jumpToForm: 'Essayer sur mon téléphone', videoTitle: 'Découvrez l’application en une minute',
      videoFrameTitle: 'Découvrir Store Soft sur Android', watchOnYoutube: 'Voir sur YouTube ↗',
      installStep: 'Installez et commencez votre essai', available: 'Disponible sur Google Play',
      pricingTitle: 'Des prix clairs', basePriceTitle: 'L’application pour un appareil', insteadOf: 'au lieu de',
      basePriceNote: 'Paiement unique. Fonctionne sans Internet.', syncPriceTitle: 'Sync — Synchronisation',
      syncPriceNote: 'Par an et par appareil supplémentaire.', syncPriceHint: 'Facultatif, pour relier les appareils du même magasin.',
      formTitle: 'Quelques informations pour commencer', formIntro: 'Remplissez le formulaire. Google Play s’ouvrira directement pour installer l’application.',
      nameLabel: 'Nom', namePlaceholder: 'Exemple : Mohamed', phoneLabel: 'Téléphone / WhatsApp',
      phoneHint: 'Un numéro pour vous aider à utiliser l’application.', shopLabel: 'Type d’activité / magasin',
      shopPlaceholder: 'Choisissez votre activité', shopGrocery: 'Alimentation / supérette', shopClothing: 'Vêtements et chaussures',
      shopCosmetics: 'Cosmétiques', shopParts: 'Pièces détachées', shopRepair: 'Atelier de réparation', shopOther: 'Autre activité',
      submit: 'Installer depuis Google Play', submitting: 'Envoi de vos informations…',
      privacyNote: 'Nous utilisons vos informations pour vous aider à essayer Store Soft.', privacyLink: 'Confidentialité', terms: 'Conditions',
      successTitle: 'Ouverture de Google Play…', successText: 'Vos informations sont enregistrées. Si le magasin ne s’ouvre pas, appuyez ci-dessous.',
      openPlay: 'Ouvrir Google Play', needHelp: 'Besoin d’aide ?', whatsappCta: 'Écrivez-nous sur WhatsApp ↗',
      required: 'Ce champ est obligatoire.', invalidName: 'Saisissez un nom de 2 à 80 caractères.',
      invalidPhone: 'Saisissez un numéro de téléphone valide de 8 à 15 chiffres.',
      generalError: 'Envoi impossible. Vérifiez votre connexion et réessayez.'
    }
  };
  var form = document.getElementById('leadForm');
  var button = document.getElementById('submitButton');
  var submitLabel = button.querySelector('[data-copy]');
  var submitError = document.getElementById('submitError');
  var switcher = document.getElementById('languageSwitch');
  var download = document.getElementById('downloadAndroid');
  var activities = ['grocery', 'clothing', 'cosmetics', 'spare_parts', 'repair_shop', 'other'];
  window.dataLayer = window.dataLayer || [];
  function copy(key) { return copies[language][key]; }
  function campaignData() {
    var params = new URLSearchParams(window.location.search);
    return { source: params.get('utm_source') || '', medium: params.get('utm_medium') || '',
      campaign: params.get('utm_campaign') || '', content: params.get('utm_content') || '',
      term: params.get('utm_term') || '', referrer: document.referrer || '', landing_page: window.location.href };
  }
  // Analytics failures must never interrupt a saved submission or store navigation.
  function track(name, properties, standard) {
    try {
      var campaign = campaignData();
      var detail = Object.assign({ language: language, content_name: 'Store Soft Android',
        utm_source: campaign.source, utm_medium: campaign.medium, utm_campaign: campaign.campaign }, properties || {});
      window.dataLayer.push(Object.assign({ event: name }, detail));
      window.dispatchEvent(new CustomEvent('storesoft:tracking', { detail: { event: name, properties: detail } }));
      if (typeof window.fbq === 'function') window.fbq(standard ? 'track' : 'trackCustom', name, detail);
    } catch (_) { /* Best effort. */ }
  }
  function funnel(method, value) {
    try { window.StoreSoftDownloadTracking?.[method](value); } catch (_) { /* Best effort. */ }
  }
  function clearErrors() {
    ['name', 'phone', 'shopType'].forEach(function (id) {
      document.getElementById(id).removeAttribute('aria-invalid');
      document.getElementById(id + 'Error').textContent = '';
    });
    submitError.textContent = '';
  }
  function setLanguage(next) {
    language = next;
    document.documentElement.lang = next;
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
    document.title = copy('pageTitle');
    switcher.textContent = next === 'ar' ? 'FR' : 'ع';
    switcher.setAttribute('aria-label', next === 'ar' ? 'Afficher en français' : 'عرض الصفحة بالعربية');
    document.querySelectorAll('[data-copy]').forEach(function (el) { el.innerHTML = copy(el.dataset.copy); });
    document.querySelectorAll('[data-copy-placeholder]').forEach(function (el) { el.placeholder = copy(el.dataset.copyPlaceholder); });
    document.querySelectorAll('[data-copy-title]').forEach(function (el) { el.title = copy(el.dataset.copyTitle); });
    if (submitting) submitLabel.textContent = copy('submitting');
    clearErrors();
  }
  function validate(values) {
    clearErrors();
    var errors = {};
    if (!values.name) errors.name = copy('required');
    else if (values.name.length < 2 || values.name.length > 80) errors.name = copy('invalidName');
    var digits = values.phone.replace(/\D/g, '');
    if (!values.phone) errors.phone = copy('required');
    else if (values.phone.length > 24 || !/^[+\d\s().-]+$/.test(values.phone) || digits.length < 8 || digits.length > 15) errors.phone = copy('invalidPhone');
    if (!activities.includes(values.shop_type)) errors.shopType = copy('required');
    Object.keys(errors).forEach(function (id) {
      document.getElementById(id).setAttribute('aria-invalid', 'true');
      document.getElementById(id + 'Error').textContent = errors[id];
    });
    var first = Object.keys(errors)[0];
    if (first) document.getElementById(first).focus();
    return !first;
  }
  switcher.addEventListener('click', function () { setLanguage(language === 'ar' ? 'fr' : 'ar'); });
  form.addEventListener('focusin', function () {
    if (!formStarted) { formStarted = true; track('FormStarted'); }
  });
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (submitting || saved) return;
    var data = new FormData(form);
    var values = { name: String(data.get('name') || '').trim(), phone: String(data.get('phone') || '').trim(),
      shop_type: String(data.get('shop_type') || '').trim(), website: String(data.get('website') || ''),
      form_started_at: startedAt, language: language, form_version: 'phone_shop_select_v4', requested_platform: 'phone' };
    if (!validate(values)) return;
    Object.assign(values, campaignData());
    submitting = true;
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    submitLabel.textContent = copy('submitting');
    track('FormSubmitAttempt');
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 20000);
    try {
      var response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values), signal: controller.signal });
      var result = await response.json();
      if (!response.ok || !result.ok) throw new Error('submit_failed');
      saved = true;
      // Only an opaque code may enter the URL; contact details never leave via navigation.
      var target = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/.test(result.tracking_code || '')
        ? '/storesoft/try/?t=' + encodeURIComponent(result.tracking_code) : play;
      download.href = target;
      document.getElementById('formView').hidden = true;
      document.getElementById('successView').hidden = false;
      document.getElementById('successView').focus();
      funnel('submitted', result.tracking_code);
      track('FormSubmitted');
      track('Lead', {}, true);
      funnel('click', 'android');
      track('DownloadClicked', { platform: 'android' });
      // Same-tab navigation works after async saves without depending on popup permissions.
      window.location.assign(target);
    } catch (_) {
      if (!saved) submitError.textContent = copy('generalError');
    } finally {
      clearTimeout(timeout);
      submitting = false;
      button.disabled = saved;
      form.removeAttribute('aria-busy');
      submitLabel.textContent = copy('submit');
    }
  });
  download.addEventListener('click', function () { funnel('click', 'android'); track('DownloadClicked', { platform: 'android' }); });
  document.querySelector('.js-whatsapp').addEventListener('click', function () { track('WhatsAppCTAClick'); });
  document.querySelector('.install-jump').addEventListener('click', function () { track('TrialCTAClick', { cta_location: 'android_hero' }); });
  document.getElementById('year').textContent = new Date().getFullYear();
  setLanguage('ar');
  track('LandingPageView');
  funnel('visit');
}());
