(function () {
  'use strict';

  var endpoint = 'https://blczhiusyvpkxrktgwng.supabase.co/functions/v1/submit-store-soft-lead';
  var formStartedAt = Date.now();
  var currentLanguage = 'ar';
  var formStartTracked = false;
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
      algeriaShort: 'نتواصل معك عبر واتساب',
      available: '7 أيام مجانًا',
      formTitle: 'استلم رابط التطبيق',
      formIntro: 'عمّر معلوماتك وسنتواصل معك عبر واتساب.',
      freeOfferValue: '7 أيام مجانًا',
      freeOfferText: 'المبيعات، المخزون، الديون والأرباح.',
      priceMain: 'بعد التجربة: 7000 دج للجهاز الأول',
      priceExtra: 'الأجهزة الإضافية فقط: +3000 دج سنويًا لكل جهاز',
      nameLabel: 'الاسم',
      namePlaceholder: 'مثال: محمد',
      shopLabel: 'نوع النشاط / المحل',
      shopPlaceholder: 'اختر نوع المحل',
      shopGrocery: 'مواد غذائية / سوبرات',
      shopClothing: 'ملابس وأحذية',
      shopCosmetics: 'مواد تجميل',
      shopParts: 'قطع غيار',
      shopRepair: 'محل تصليح',
      shopOther: 'نشاط آخر',
      emailLabel: 'البريد الإلكتروني',
      emailPlaceholder: 'name@gmail.com',
      submit: 'أرسل طلبي',
      submitting: 'جاري إرسال معلوماتك…',
      privacyCopy: 'معلوماتك تُستعمل لمعالجة طلبك والتواصل معك فقط.',
      privacyLink: 'سياسة الخصوصية',
      terms: 'شروط الاستخدام',
      successTitle: 'تم استلام معلوماتك ✅',
      successText: 'تم حفظ طلبك. تواصل معنا على واتساب لمعرفة المزيد.',
      contactPrompt: 'اضغط هنا لفتح محادثة واتساب معنا.',
      contactWhatsApp: 'تواصل معنا على WhatsApp',
      editDetails: 'تصحيح المعلومات',
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
      proofHint: '37 شاشة حقيقية من التطبيق.',
      proofGalleryLabel: 'صور ميزات Store Soft',
      shot01: 'اختر المنتج المطلوب',
      shot02: 'اختر وحدة البيع والكمية',
      shot03: 'راجع سلة المبيعات',
      shot04: 'سجّل طريقة الدفع',
      shot05: 'راجع سجل العمليات',
      shot06: 'تابع قائمة المنتجات',
      shot07: 'أضف منتجًا جديدًا',
      shot08: 'راجع عروض التخفيضات',
      shot09: 'أنشئ عرضًا جديدًا',
      shot10: 'تابع ديون الزبائن',
      shot11: 'راجع حساب الزبون',
      shot12: 'سجّل دفعة الزبون',
      shot13: 'تابع ديون الموردين',
      shot14: 'راجع حساب المورد',
      shot15: 'راجع سجل الواردات',
      shot16: 'أضف بضاعة واردة',
      shot17: 'تابع حركة الصندوق',
      shot18: 'أضف مبلغًا للصندوق',
      shot19: 'راجع سجل المصاريف',
      shot20: 'سجّل مصروفًا جديدًا',
      shot21: 'راجع المبيعات والأرباح',
      shot22: 'راجع حالة المخزون',
      shot23: 'اكتشف المنتجات الأكثر ربحًا',
      shot24: 'راجع ملخص الديون',
      shot25: 'احسب قيمة الزكاة',
      shot26: 'راجع أداء البائعين',
      shot27: 'تابع طلبات التصليح',
      shot28: 'خصّص إعدادات المحل',
      shot29: 'أنشئ حساب مالك المحل',
      shot30: 'سجّل دخول الموظف',
      shot31: 'تابع المستخدمين والأجهزة',
      shot32: 'أضف مستخدمًا جديدًا',
      shot33: 'حدّد صلاحيات المستخدم',
      shot34: 'راجع جميع الصلاحيات',
      shot35: 'احصل على المساعدة',
      shot36: 'تابع مركز الإشعارات',
      shot37: 'استعرض كل الميزات',
      closingTitle: 'جرّب Store Soft مجانًا',
      closingText: 'أرسل طلبك وسنتواصل معك عبر واتساب.',
      storiesEyebrow: 'تجارب أصحاب المحلات',
      storiesTitle: 'ماذا يقول زبائن Store Soft؟',
      required: 'هذا الحقل مطلوب.',
      tooShort: 'اكتب حرفين على الأقل.',
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
      algeriaShort: 'Nous vous contactons sur WhatsApp',
      available: '7 jours gratuits',
      formTitle: 'Recevoir l’application',
      formIntro: 'Remplissez le formulaire. Nous vous contacterons sur WhatsApp.',
      freeOfferValue: '7 jours gratuits',
      freeOfferText: 'Ventes, stock, dettes et bénéfices.',
      priceMain: 'Après l’essai : 7 000 DA pour le premier appareil',
      priceExtra: 'Appareils supplémentaires uniquement : +3 000 DA par appareil et par an',
      nameLabel: 'Nom',
      namePlaceholder: 'Exemple : Mohamed',
      shopLabel: 'Type d’activité / magasin',
      shopPlaceholder: 'Choisissez le type de magasin',
      shopGrocery: 'Alimentation / supérette',
      shopClothing: 'Vêtements et chaussures',
      shopCosmetics: 'Cosmétiques',
      shopParts: 'Pièces détachées',
      shopRepair: 'Atelier de réparation',
      shopOther: 'Autre activité',
      emailLabel: 'Adresse e-mail',
      emailPlaceholder: 'nom@gmail.com',
      submit: 'Envoyer ma demande',
      submitting: 'Envoi de vos informations…',
      privacyCopy: 'Vos informations servent uniquement à traiter votre demande et à vous contacter.',
      privacyLink: 'Confidentialité',
      terms: 'Conditions',
      successTitle: 'Informations reçues ✅',
      successText: 'Votre demande est enregistrée. Contactez-nous sur WhatsApp pour en savoir plus.',
      contactPrompt: 'Appuyez ici pour ouvrir une discussion WhatsApp avec nous.',
      contactWhatsApp: 'Nous contacter sur WhatsApp',
      editDetails: 'Corriger les informations',
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
      proofHint: '37 écrans réels de l’application.',
      proofGalleryLabel: 'Captures des fonctions de Store Soft',
      shot01: 'Choisir le produit souhaité',
      shot02: 'Choisir l’unité et la quantité',
      shot03: 'Vérifier le panier de vente',
      shot04: 'Enregistrer le mode de paiement',
      shot05: 'Consulter l’historique des opérations',
      shot06: 'Suivre la liste des produits',
      shot07: 'Ajouter un nouveau produit',
      shot08: 'Consulter les offres promotionnelles',
      shot09: 'Créer une nouvelle offre',
      shot10: 'Suivre les dettes clients',
      shot11: 'Consulter le compte client',
      shot12: 'Enregistrer un paiement client',
      shot13: 'Suivre les dettes fournisseurs',
      shot14: 'Consulter le compte fournisseur',
      shot15: 'Consulter l’historique des arrivages',
      shot16: 'Ajouter un nouvel arrivage',
      shot17: 'Suivre les mouvements de caisse',
      shot18: 'Ajouter une entrée en caisse',
      shot19: 'Consulter l’historique des dépenses',
      shot20: 'Ajouter une nouvelle dépense',
      shot21: 'Consulter les ventes et bénéfices',
      shot22: 'Consulter l’état du stock',
      shot23: 'Voir les produits les plus rentables',
      shot24: 'Consulter le résumé des dettes',
      shot25: 'Estimer le montant de la zakat',
      shot26: 'Consulter la performance des vendeurs',
      shot27: 'Suivre les demandes de réparation',
      shot28: 'Personnaliser les réglages du magasin',
      shot29: 'Créer le compte du propriétaire',
      shot30: 'Connecter le compte employé',
      shot31: 'Suivre les utilisateurs et appareils',
      shot32: 'Ajouter un nouvel utilisateur',
      shot33: 'Définir les autorisations utilisateur',
      shot34: 'Consulter toutes les autorisations',
      shot35: 'Accéder au centre d’aide',
      shot36: 'Consulter le centre de notifications',
      shot37: 'Découvrir toutes les fonctions',
      closingTitle: 'Essayez Store Soft gratuitement',
      closingText: 'Envoyez votre demande et nous vous contacterons sur WhatsApp.',
      storiesEyebrow: 'Expériences de commerçants',
      storiesTitle: 'Que disent les clients Store Soft ?',
      required: 'Ce champ est obligatoire.',
      tooShort: 'Saisissez au moins deux caractères.',
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

    document.querySelectorAll('[data-copy-aria-label]').forEach(function (element) {
      var value = copy(element.getAttribute('data-copy-aria-label'));
      if (value !== undefined) element.setAttribute('aria-label', value);
    });

    document.querySelectorAll('[data-copy-placeholder]').forEach(function (element) {
      element.placeholder = copy(element.getAttribute('data-copy-placeholder'));
    });

    clearErrors();
  }

  function clearErrors() {
    ['name', 'shopType', 'email'].forEach(function (id) {
      document.getElementById(id).removeAttribute('aria-invalid');
      document.getElementById(id + 'Error').textContent = '';
    });
    submitError.textContent = '';
  }

  function fieldError(id, message) {
    document.getElementById(id).setAttribute('aria-invalid', 'true');
    document.getElementById(id + 'Error').textContent = message;
  }

  function clearFieldError(id) {
    document.getElementById(id).removeAttribute('aria-invalid');
    document.getElementById(id + 'Error').textContent = '';
  }

  function isValidEmail(value) {
    if (!value || value.length > 254 || /\s/.test(value)) return false;
    var parts = value.split('@');
    if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
    var localPart = parts[0];
    var domain = parts[1].toLowerCase();
    if (localPart.length > 64 || localPart.charAt(0) === '.' ||
        localPart.charAt(localPart.length - 1) === '.' || localPart.indexOf('..') !== -1) return false;
    if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(localPart)) return false;
    if (domain.length > 253 || domain.indexOf('.') === -1 || domain.indexOf('..') !== -1) return false;
    var labels = domain.split('.');
    var labelsAreValid = labels.every(function (label) {
      return label.length > 0 && label.length <= 63 &&
        /^[a-z0-9-]+$/i.test(label) && label.charAt(0) !== '-' &&
        label.charAt(label.length - 1) !== '-';
    });
    return labelsAreValid && /^[a-z]{2,63}$/i.test(labels[labels.length - 1]);
  }

  function validate(values) {
    clearErrors();
    var valid = true;

    if (!values.name) {
      fieldError('name', copy('required'));
      valid = false;
    } else if (values.name.length < 2) {
      fieldError('name', copy('tooShort'));
      valid = false;
    }
    if (!values.shop_type) {
      fieldError('shopType', copy('required'));
      valid = false;
    }
    if (!values.email) {
      fieldError('email', copy('required'));
      valid = false;
    } else if (!isValidEmail(values.email)) {
      fieldError('email', copy('invalidEmail'));
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
      shop_type: String(data.get('shop_type') || '').trim(),
      email: String(data.get('email') || '').trim().toLowerCase(),
      website: String(data.get('website') || ''),
      form_started_at: formStartedAt,
      language: currentLanguage,
      form_version: 'email_shop_select_v3'
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

      formView.hidden = true;
      successView.hidden = false;

      trackEvent('FormSubmitted', { content_name: 'Store Soft download request' }, false);
      trackEvent('Lead', { content_name: 'Store Soft download request' }, true);

      successView.focus();
    } catch (_) {
      submitError.textContent = copy('generalError');
    } finally {
      button.disabled = false;
      submitLabel.textContent = copy('submit');
    }
  });

  document.getElementById('editDetails').addEventListener('click', function () {
    successView.hidden = true;
    formView.hidden = false;
    document.getElementById('name').focus();
  });

  document.getElementById('year').textContent = new Date().getFullYear();
  setLanguage('ar');
  trackEvent('LandingPageView', { content_name: 'Store Soft download landing page' }, false);
}());
