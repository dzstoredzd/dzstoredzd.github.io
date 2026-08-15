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
      help: 'تحتاج مساعدة؟',
      eyebrow: 'نسخة مجانية للمحلات الجزائرية',
      title: 'محلك كامل<br><span>تحت عينك</span>',
      intro: 'جرّب Store Soft مجانًا لمدة 7 أيام: سجّل المبيعات، تابع المخزون وديون الزبائن، واعرف أرباح محلك بوضوح.',
      primaryCta: 'احصل على النسخة المجانية',
      whatsappCta: 'تواصل عبر واتساب',
      offlineShort: '7 أيام مجانًا',
      languagesShort: 'الرابط يصلك عبر البريد',
      algeriaShort: 'جرّب قبل أن تقرر',
      supportTitle: 'ابدأ بلا تعقيد',
      supportText: 'لا نطلب رقم هاتف. يكفي بريدك الإلكتروني لاستلام رابط التطبيق.',
      available: 'النسخة المجانية متاحة',
      formTitle: 'احصل على النسخة المجانية',
      formIntro: 'اكتب اسمك وبريدك الإلكتروني ونرسل لك رابط تحميل Store Soft مباشرة إلى بريدك.',
      freeOfferLabel: 'نسخة مجانية للتجربة',
      freeOfferValue: '7 أيام مجانًا',
      freeOfferText: 'جرّب تسجيل المبيعات ومتابعة المخزون والديون والأرباح قبل أن تقرر.',
      nameLabel: 'الاسم',
      namePlaceholder: 'مثال: محمد',
      emailLabel: 'البريد الإلكتروني',
      emailHint: 'سنرسل رابط تحميل التطبيق إلى هذا البريد.',
      shopLabel: 'نوع المحل',
      shopPlaceholder: 'اختر نوع المحل',
      shopGrocery: 'مواد غذائية / سوبرات',
      shopClothing: 'ملابس وأحذية',
      shopCosmetics: 'مواد تجميل',
      shopParts: 'قطع غيار',
      shopRepair: 'محل تصليح',
      shopOther: 'نشاط آخر',
      submit: 'أرسل لي رابط النسخة المجانية',
      submitting: 'جاري إرسال معلوماتك…',
      privacyCopy: 'معلوماتك تُستعمل لإرسال رابط التطبيق فقط.',
      privacyLink: 'سياسة الخصوصية',
      terms: 'شروط الاستخدام',
      successTitle: 'تم استلام معلوماتك ✅',
      successText: 'سنرسل لك رابط تحميل النسخة المجانية من Store Soft على بريدك الإلكتروني.',
      sentTo: 'البريد المسجّل',
      successNote: 'إذا لم تجد الرسالة، تحقق من مجلد الرسائل غير المرغوب فيها (Spam / Junk).',
      editEmail: 'تصحيح البريد',
      valueEyebrow: 'قيمة حقيقية تبدأ بها مجانًا',
      valueTitle: 'جرّب مهام محلك اليومية في تطبيق واحد',
      benefitSales: 'تسجيل المبيعات بسرعة',
      benefitStock: 'متابعة المخزون تلقائيًا',
      benefitDebts: 'إدارة ديون الزبائن',
      benefitProfit: 'معرفة المبيعات والأرباح',
      benefitBarcode: 'البيع بالباركود أو كاميرا الهاتف',
      benefitOffline: 'يعمل بدون إنترنت',
      benefitLanguages: 'العربية والفرنسية',
      benefitSync: 'المزامنة بين عدة أجهزة',
      proofEyebrow: 'شاهد ما ستحصل عليه مجانًا',
      proofTitle: 'تطبيق حقيقي لمهام محلك اليومية',
      proofIntro: 'هذه صور حقيقية من التطبيق على هاتف Android.',
      shotSaleTitle: 'إنشاء عملية بيع',
      shotSaleText: 'ابحث عن السلعة أو امسح الباركود.',
      shotStockTitle: 'المخزون يتحدث تلقائيًا',
      shotStockText: 'شاهد الكمية المتوفرة لكل سلعة.',
      shotDebtTitle: 'ديون الزبائن',
      shotDebtText: 'اعرف من عليه دين وكم بقي عليه.',
      shotReportTitle: 'المبيعات والأرباح',
      shotReportText: 'أرقام واضحة تساعدك تعرف وضع محلك.',
      stepsEyebrow: 'كيف يصلك التطبيق؟',
      stepsTitle: 'ثلاث خطوات بسيطة',
      stepOneTitle: 'عمّر معلوماتك',
      stepOneText: 'اكتب اسمك وبريدك الإلكتروني ونوع محلك.',
      stepTwoTitle: 'يصلك رابط التطبيق',
      stepTwoText: 'نرسل الرابط مباشرة إلى بريدك الإلكتروني.',
      stepThreeTitle: 'ابدأ مجانًا',
      stepThreeText: 'نزّل Store Soft وجرّبه 7 أيام قبل أن تقرر.',
      storiesEyebrow: 'تجارب أصحاب المحلات',
      storiesTitle: 'ماذا يقول زبائن Store Soft؟',
      required: 'هذا الحقل مطلوب.',
      invalidEmail: 'أدخل بريدًا إلكترونيًا صحيحًا.',
      generalError: 'تعذّر إرسال المعلومات. تحقق من الإنترنت وحاول مرة أخرى.'
    },
    fr: {
      brandTagline: 'La gestion simple du magasin',
      help: 'Besoin d’aide ?',
      eyebrow: 'Version gratuite pour les commerces algériens',
      title: 'Tout votre commerce<br><span>sous les yeux</span>',
      intro: 'Essayez Store Soft gratuitement pendant 7 jours : ventes, stock, dettes clients et bénéfices, réunis dans une application simple.',
      primaryCta: 'Recevoir la version gratuite',
      whatsappCta: 'Contacter sur WhatsApp',
      offlineShort: '7 jours gratuits',
      languagesShort: 'Lien envoyé par e-mail',
      algeriaShort: 'Essayez avant de décider',
      supportTitle: 'Commencez simplement',
      supportText: 'Aucun numéro de téléphone demandé. Votre e-mail suffit pour recevoir l’application.',
      available: 'La version gratuite est disponible',
      formTitle: 'Recevoir la version gratuite',
      formIntro: 'Indiquez votre nom et votre e-mail : nous y enverrons directement le lien de téléchargement de Store Soft.',
      freeOfferLabel: 'Version d’essai gratuite',
      freeOfferValue: '7 jours gratuits',
      freeOfferText: 'Testez les ventes, le stock, les dettes et les bénéfices avant de décider.',
      nameLabel: 'Nom',
      namePlaceholder: 'Exemple : Mohamed',
      emailLabel: 'E-mail',
      emailHint: 'Nous enverrons le lien de l’application à cette adresse.',
      shopLabel: 'Type de magasin',
      shopPlaceholder: 'Choisissez votre activité',
      shopGrocery: 'Alimentation / supérette',
      shopClothing: 'Vêtements et chaussures',
      shopCosmetics: 'Cosmétiques',
      shopParts: 'Pièces détachées',
      shopRepair: 'Atelier de réparation',
      shopOther: 'Autre activité',
      submit: 'Envoyez-moi la version gratuite',
      submitting: 'Envoi de vos informations…',
      privacyCopy: 'Vos informations servent uniquement à envoyer le lien de l’application.',
      privacyLink: 'Confidentialité',
      terms: 'Conditions',
      successTitle: 'Informations reçues ✅',
      successText: 'Nous vous enverrons le lien de téléchargement de la version gratuite de Store Soft par e-mail.',
      sentTo: 'E-mail enregistré',
      successNote: 'Si le message n’apparaît pas, vérifiez le dossier Spam / Courrier indésirable.',
      editEmail: 'Corriger l’e-mail',
      valueEyebrow: 'Une vraie valeur, gratuite pour commencer',
      valueTitle: 'Essayez les tâches quotidiennes de votre magasin dans une seule application',
      benefitSales: 'Enregistrer les ventes rapidement',
      benefitStock: 'Suivre le stock automatiquement',
      benefitDebts: 'Gérer les dettes clients',
      benefitProfit: 'Connaître les ventes et bénéfices',
      benefitBarcode: 'Vendre avec un code-barres ou la caméra',
      benefitOffline: 'Fonctionner sans Internet',
      benefitLanguages: 'Arabe et français',
      benefitSync: 'Synchroniser plusieurs appareils',
      proofEyebrow: 'Découvrez ce que vous obtenez gratuitement',
      proofTitle: 'Une vraie application pour le quotidien du magasin',
      proofIntro: 'Voici de vraies captures de l’application sur Android.',
      shotSaleTitle: 'Créer une vente',
      shotSaleText: 'Recherchez le produit ou scannez son code-barres.',
      shotStockTitle: 'Stock mis à jour automatiquement',
      shotStockText: 'Voyez la quantité disponible pour chaque produit.',
      shotDebtTitle: 'Dettes clients',
      shotDebtText: 'Voyez qui doit quoi et le solde restant.',
      shotReportTitle: 'Ventes et bénéfices',
      shotReportText: 'Des chiffres clairs pour suivre votre commerce.',
      stepsEyebrow: 'Comment recevoir l’application ?',
      stepsTitle: 'Trois étapes simples',
      stepOneTitle: 'Remplissez vos informations',
      stepOneText: 'Indiquez votre nom, votre e-mail et votre activité.',
      stepTwoTitle: 'Recevez le lien de l’application',
      stepTwoText: 'Nous l’envoyons directement à votre adresse e-mail.',
      stepThreeTitle: 'Commencez gratuitement',
      stepThreeText: 'Téléchargez Store Soft et essayez-le 7 jours avant de décider.',
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
