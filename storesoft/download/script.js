(function () {
  'use strict';

  var endpoint = 'https://blczhiusyvpkxrktgwng.supabase.co/functions/v1/submit-store-soft-lead';
  var formStartedAt = Date.now();
  var currentLanguage = 'ar';
  var formStartTracked = false;
  var submissionTracked = false;
  window.dataLayer = window.dataLayer || [];

  var copies = {
    ar: {
      brandTagline: 'تسيير بسيط لمحلك',
      eyebrow: 'نسخة مجانية للمحلات الجزائرية',
      title: 'محلك كامل<br><span>تحت عينك</span>',
      intro: 'المبيعات، المخزون، ديون الزبائن والأرباح في تطبيق واحد. جرّبه مجانًا لمدة 7 أيام.',
      primaryCta: 'استلم رابط النسخة المجانية',
      whatsappCta: 'واتساب',
      offlineShort: 'يعمل بدون إنترنت',
      languagesShort: 'العربية والفرنسية',
      algeriaShort: 'الرابط يصلك عبر البريد',
      available: '7 أيام مجانًا',
      formTitle: 'استلم رابط التطبيق',
      formIntro: 'عمّر معلوماتك ونرسل الرابط إلى بريدك.',
      freeOfferValue: '7 أيام مجانًا',
      freeOfferText: 'المبيعات، المخزون، الديون والأرباح.',
      priceMain: 'بعد التجربة: 7000 دج للجهاز الأول',
      priceExtra: 'الأجهزة الإضافية فقط: +3000 دج سنويًا لكل جهاز',
      nameLabel: 'الاسم',
      namePlaceholder: 'مثال: محمد',
      emailLabel: 'البريد الإلكتروني',
      shopLabel: 'نوع المحل',
      shopPlaceholder: 'اختر نوع المحل',
      shopGrocery: 'مواد غذائية / سوبرات',
      shopClothing: 'ملابس وأحذية',
      shopCosmetics: 'مواد تجميل',
      shopParts: 'قطع غيار',
      shopRepair: 'محل تصليح',
      shopOther: 'نشاط آخر',
      submit: 'أرسل الرابط إلى بريدي',
      submitting: 'جاري إرسال معلوماتك…',
      privacyCopy: 'معلوماتك تُستعمل لإرسال رابط التطبيق فقط.',
      privacyLink: 'سياسة الخصوصية',
      terms: 'شروط الاستخدام',
      successTitle: 'تم استلام معلوماتك ✅',
      successText: 'سنرسل رابط تحميل Store Soft إلى بريدك الإلكتروني.',
      sentTo: 'البريد المسجّل',
      successNote: 'إذا لم تجد الرسالة، تحقق من مجلد الرسائل غير المرغوب فيها (Spam / Junk).',
      editEmail: 'تصحيح البريد',
      valueTitle: 'كل ما يحتاجه محلك',
      benefitSales: 'تسجيل المبيعات بسرعة',
      benefitStock: 'متابعة المخزون تلقائيًا',
      benefitDebts: 'إدارة ديون الزبائن',
      benefitProfit: 'معرفة المبيعات والأرباح',
      benefitBarcode: 'البيع بالباركود أو كاميرا الهاتف',
      benefitOffline: 'يعمل بدون إنترنت',
      benefitLanguages: 'العربية والفرنسية',
      benefitSync: 'المزامنة بين عدة أجهزة',
      proofTitle: 'شاهد التطبيق قبل التحميل',
      shotSaleTitle: 'إنشاء عملية بيع',
      shotStockTitle: 'المخزون',
      shotDebtTitle: 'ديون الزبائن',
      shotReportTitle: 'المبيعات والأرباح',
      closingTitle: 'جرّب Store Soft مجانًا',
      closingText: 'الرابط يصلك عبر البريد الإلكتروني.',
      storiesEyebrow: 'تجارب أصحاب المحلات',
      storiesTitle: 'ماذا يقول زبائن Store Soft؟',
      required: 'هذا الحقل مطلوب.',
      invalidEmail: 'أدخل بريدًا إلكترونيًا صحيحًا.',
      generalError: 'تعذّر إرسال المعلومات. تحقق من الإنترنت وحاول مرة أخرى.'
    },
    fr: {
      brandTagline: 'La gestion simple du magasin',
      eyebrow: 'Version gratuite pour les commerces algériens',
      title: 'Tout votre commerce<br><span>sous les yeux</span>',
      intro: 'Ventes, stock, dettes et bénéfices dans une seule application. Essayez-la gratuitement pendant 7 jours.',
      primaryCta: 'Recevoir la version gratuite',
      whatsappCta: 'WhatsApp',
      offlineShort: 'Fonctionne sans Internet',
      languagesShort: 'Arabe et français',
      algeriaShort: 'Lien envoyé par e-mail',
      available: '7 jours gratuits',
      formTitle: 'Recevoir l’application',
      formIntro: 'Remplissez le formulaire. Le lien arrive par e-mail.',
      freeOfferValue: '7 jours gratuits',
      freeOfferText: 'Ventes, stock, dettes et bénéfices.',
      priceMain: 'Après l’essai : 7 000 DA pour le premier appareil',
      priceExtra: 'Appareils supplémentaires uniquement : +3 000 DA par appareil et par an',
      nameLabel: 'Nom',
      namePlaceholder: 'Exemple : Mohamed',
      emailLabel: 'E-mail',
      shopLabel: 'Type de magasin',
      shopPlaceholder: 'Choisissez votre activité',
      shopGrocery: 'Alimentation / supérette',
      shopClothing: 'Vêtements et chaussures',
      shopCosmetics: 'Cosmétiques',
      shopParts: 'Pièces détachées',
      shopRepair: 'Atelier de réparation',
      shopOther: 'Autre activité',
      submit: 'Envoyer le lien à mon e-mail',
      submitting: 'Envoi de vos informations…',
      privacyCopy: 'Vos informations servent uniquement à envoyer le lien de l’application.',
      privacyLink: 'Confidentialité',
      terms: 'Conditions',
      successTitle: 'Informations reçues ✅',
      successText: 'Nous enverrons le lien de téléchargement de Store Soft à votre adresse e-mail.',
      sentTo: 'E-mail enregistré',
      successNote: 'Si le message n’apparaît pas, vérifiez le dossier Spam / Courrier indésirable.',
      editEmail: 'Corriger l’e-mail',
      valueTitle: 'L’essentiel pour votre commerce',
      benefitSales: 'Enregistrer les ventes rapidement',
      benefitStock: 'Suivre le stock automatiquement',
      benefitDebts: 'Gérer les dettes clients',
      benefitProfit: 'Connaître les ventes et bénéfices',
      benefitBarcode: 'Vendre avec un code-barres ou la caméra',
      benefitOffline: 'Fonctionner sans Internet',
      benefitLanguages: 'Arabe et français',
      benefitSync: 'Synchroniser plusieurs appareils',
      proofTitle: 'Voir l’application avant de la télécharger',
      shotSaleTitle: 'Créer une vente',
      shotStockTitle: 'Stock',
      shotDebtTitle: 'Dettes clients',
      shotReportTitle: 'Ventes et bénéfices',
      closingTitle: 'Essayez Store Soft gratuitement',
      closingText: 'Le lien arrive directement par e-mail.',
      storiesEyebrow: 'Expériences de commerçants',
      storiesTitle: 'Que disent les clients Store Soft ?',
      required: 'Ce champ est obligatoire.',
      invalidEmail: 'Saisissez une adresse e-mail valide.',
      generalError: 'Les informations n’ont pas pu être envoyées. Vérifiez votre connexion et réessayez.'
    }
  };

  var form = document.getElementById('leadForm');
  var button = document.getElementById('submitButton');
  var submitLabel = button.querySelector('span');
  var formView = document.getElementById('formView');
  var successView = document.getElementById('successView');
  var submitError = document.getElementById('submitError');
  var languageSwitch = document.getElementById('languageSwitch');

  function copy(key) {
    return copies[currentLanguage][key];
  }

  function trackEvent(name, properties, standardEvent) {
    var detail = Object.assign({ language: currentLanguage }, properties || {});
    var trackedEvents = document.documentElement.getAttribute('data-tracking-events');
    document.documentElement.setAttribute('data-tracking-events', trackedEvents ? trackedEvents + ',' + name : name);

    window.dispatchEvent(new CustomEvent('storesoft:tracking', {
      detail: { event: name, properties: detail }
    }));

    window.dataLayer.push(Object.assign({ event: name }, detail));

    if (typeof window.fbq === 'function') {
      window.fbq(standardEvent ? 'track' : 'trackCustom', name, detail);
    }
  }

  function setLanguage(language) {
    currentLanguage = language;
    var isArabic = language === 'ar';
    document.documentElement.lang = language;
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
    languageSwitch.textContent = isArabic ? 'FR' : 'ع';
    languageSwitch.setAttribute('aria-label', isArabic ? 'Afficher en français' : 'عرض الصفحة بالعربية');

    document.querySelectorAll('[data-copy]').forEach(function (element) {
      var value = copy(element.getAttribute('data-copy'));
      if (value !== undefined) element.innerHTML = value;
    });

    document.querySelectorAll('[data-copy-placeholder]').forEach(function (element) {
      element.placeholder = copy(element.getAttribute('data-copy-placeholder'));
    });

    clearErrors();
  }

  function clearErrors() {
    ['name', 'email', 'shopType'].forEach(function (id) {
      document.getElementById(id).removeAttribute('aria-invalid');
      document.getElementById(id + 'Error').textContent = '';
    });
    submitError.textContent = '';
  }

  function fieldError(id, message) {
    document.getElementById(id).setAttribute('aria-invalid', 'true');
    document.getElementById(id + 'Error').textContent = message;
  }

  function validate(values) {
    clearErrors();
    var valid = true;

    if (!values.name) {
      fieldError('name', copy('required'));
      valid = false;
    }
    if (!values.email) {
      fieldError('email', copy('required'));
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      fieldError('email', copy('invalidEmail'));
      valid = false;
    }
    if (!values.shop_type) {
      fieldError('shopType', copy('required'));
      valid = false;
    }

    return valid;
  }

  function campaignData() {
    var params = new URLSearchParams(window.location.search);
    return {
      source: params.get('utm_source') || '',
      medium: params.get('utm_medium') || '',
      campaign: params.get('utm_campaign') || '',
      content: params.get('utm_content') || '',
      term: params.get('utm_term') || '',
      referrer: document.referrer || '',
      landing_page: window.location.href
    };
  }

  languageSwitch.addEventListener('click', function () {
    setLanguage(currentLanguage === 'ar' ? 'fr' : 'ar');
  });

  document.querySelectorAll('a[href="#download-form"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      document.getElementById('download-form').scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'start'
      });
    });
  });

  document.querySelectorAll('.js-whatsapp').forEach(function (link) {
    link.addEventListener('click', function () {
      trackEvent('WhatsAppCTAClick', { content_name: 'Store Soft download landing page' }, false);
    });
  });

  form.addEventListener('focusin', function () {
    if (formStartTracked) return;
    formStartTracked = true;
    trackEvent('FormStarted', { content_name: 'Store Soft download request' }, false);
  });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    var data = new FormData(form);
    var values = {
      name: String(data.get('name') || '').trim(),
      email: String(data.get('email') || '').trim().toLowerCase(),
      shop_type: String(data.get('shop_type') || ''),
      website: String(data.get('website') || ''),
      form_started_at: formStartedAt,
      language: currentLanguage
    };

    if (!validate(values)) return;

    Object.assign(values, campaignData());
    button.disabled = true;
    submitLabel.textContent = copy('submitting');

    try {
      var response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      var result = await response.json().catch(function () { return {}; });
      if (!response.ok || !result.ok) throw new Error(result.error || 'submit_failed');

      document.getElementById('submittedEmail').textContent = values.email;
      formView.hidden = true;
      successView.hidden = false;

      if (!submissionTracked) {
        submissionTracked = true;
        trackEvent('FormSubmitted', { content_name: 'Store Soft download request' }, false);
        trackEvent('Lead', { content_name: 'Store Soft download request' }, true);
      }

      successView.focus();
    } catch (_) {
      submitError.textContent = copy('generalError');
    } finally {
      button.disabled = false;
      submitLabel.textContent = copy('submit');
    }
  });

  document.getElementById('editEmail').addEventListener('click', function () {
    successView.hidden = true;
    formView.hidden = false;
    document.getElementById('email').focus();
  });

  document.getElementById('year').textContent = new Date().getFullYear();
  setLanguage('ar');
  trackEvent('LandingPageView', { content_name: 'Store Soft download landing page' }, false);
}());
