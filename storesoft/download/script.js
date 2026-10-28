(function () {
  'use strict';

  var endpoint = 'https://blczhiusyvpkxrktgwng.supabase.co/functions/v1/submit-store-soft-lead';
  var formStartedAt = Date.now();
  var currentLanguage = 'ar';
  var formStartTracked = false;
  var submitting = false;
  var galleryExpanded = false;
  var lightboxIndex = 0;
  window.dataLayer = window.dataLayer || [];

  var copies = {
    ar: {
      viewPricing: 'عرض الأسعار الحالية',
      brandTagline: 'تسيير بسيط لمحلك',
      eyebrow: 'تجربة مجانية لمدة 14 يومًا',
      title: 'سيّر محلك ببساطة<br><span>حتى بدون إنترنت</span>',
      intro: 'البيع، المخزون، الكريدي، الأرباح والموردون في تطبيق واحد مناسب لاحتياجات المحلات الجزائرية.',
      platformsLabel: 'المنصات والمزايا الأساسية',
      offlineShort: 'يعمل بدون إنترنت',
      primaryCta: 'ابدأ تجربتي المجانية',
      whatsappCta: 'اسألنا على واتساب',
      trialShort: '14 يومًا للتجربة',
      languagesShort: 'العربية، الفرنسية، الإنجليزية',
      priceShort: 'اشتراك سنوي بسيط',
      heroPreviewLabel: 'صورة حقيقية من Store Soft',
      readyOffline: 'جاهز للبيع بدون إنترنت',
      heroImageAlt: 'شاشة البيع في Store Soft',
      heroPreviewTitle: 'ابدأ البيع من أول شاشة',
      heroPreviewText: 'واجهة واضحة للهاتف والكمبيوتر، مع بقاء بيانات محلك على جهازك.',
      benefitsEyebrow: 'الأهم في يومك',
      benefitsTitle: 'تابع ما يهم محلك فعلًا',
      benefitsIntro: 'اختر الميزات التي يحتاجها نشاطك؛ لا نفترض أن كل المحلات تعمل بنفس الطريقة.',
      benefitSales: 'بيع سريع وواضح',
      benefitSalesText: 'ابحث، امسح الباركود وسجّل الدفع.',
      benefitStock: 'مخزون تحت عينك',
      benefitStockText: 'اعرف الكمية والتنبيهات وحركة السلع.',
      benefitDebts: 'الكريدي بلا نسيان',
      benefitDebtsText: 'تابع ما على الزبائن وسجّل دفعاتهم.',
      benefitProfit: 'أرباح مفهومة',
      benefitProfitText: 'راجع المبيعات والربح حسب الفترة.',
      benefitSuppliers: 'حسابات الموردين',
      benefitSuppliersText: 'تابع الواردات والدفعات وما عليك.',
      benefitOffline: 'يعمل بدون إنترنت',
      benefitOfflineText: 'واصل البيع حتى عند انقطاع الشبكة.',
      howEyebrow: 'بثلاث خطوات',
      howTitle: 'ابدأ بسرعة',
      stepOneTitle: 'عمّر معلوماتك',
      stepOneText: 'الاسم، رقم الهاتف أو واتساب ونوع النشاط.',
      stepTwoTitle: 'اختر نسختك وحمّلها',
      stepTwoText: 'رابط Android من Google Play ورابط Windows للكمبيوتر.',
      stepThreeTitle: 'جرّبه 14 يومًا',
      stepThreeText: 'أضف محلك ومنتجاتك وجرّب أول عملية بيع.',
      proofEyebrow: 'من داخل التطبيق',
      proofTitle: 'شاهد أهم الشاشات',
      proofHint: 'نعرض أولًا 8 صور فقط. اضغط على أي صورة لفتحها بحجم أكبر.',
      proofGalleryLabel: 'صور ميزات Store Soft',
      showAllFeatures: 'عرض جميع الميزات',
      showLess: 'عرض أقل',
      openImage: 'فتح الصورة بحجم أكبر: ',
      closeImage: 'إغلاق الصورة',
      previousImage: 'الصورة السابقة',
      nextImage: 'الصورة التالية',
      pricingTitle: 'الأسعار والعروض الحالية',
      trialEyebrow: 'تجربة مجانية لمدة 14 يومًا',
      trialTitle: 'ابدأ تجربتك الآن',
      trialIntro: 'عمّر معلوماتك ثم حمّل نسخة Android أو Windows مباشرة. جرّب البيع والمخزون والكريدي والأرباح قبل الدفع.',
      trialPointOne: 'لا تحتاج بطاقة دفع',
      trialPointTwo: 'رابطا التحميل يظهران مباشرة',
      trialPointThree: 'نساعدك عبر واتساب عند الحاجة',
      available: 'متاحة الآن',
      formTitle: 'ابدأ تجربتي المجانية',
      formIntro: 'بعد الإرسال، اختر التحميل للهاتف أو الكمبيوتر.',
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
      phoneLabel: 'رقم الهاتف / واتساب',
      phonePlaceholder: '0550 12 34 56',
      phoneHint: 'رقم يمكننا التواصل معك عليه لمساعدتك في التجربة.',
      submit: 'ابدأ تجربتي المجانية',
      submitting: 'جاري إرسال معلوماتك…',
      successTitle: 'تم استلام طلبك',
      successText: 'اختر نسختك وابدأ التجربة. يمكنك تحميل النسختين دون إعادة ملء المعلومات.',
      downloadAndroid: 'تحميل Android',
      downloadWindows: 'تحميل Windows',
      recommendedDevice: 'مناسب لجهازك الحالي',
      faqTitle: 'أسئلة سريعة قبل التجربة',
      faqOfflineQ: 'هل يعمل بدون إنترنت؟',
      faqOfflineA: 'نعم. البيع والمخزون والكريدي والتقارير تعمل بدون إنترنت. تحتاج الشبكة فقط عند استعمال خدمات اختيارية مثل Sync أو النسخ إلى Google Drive.',
      faqSubscriptionQ: 'هل يوجد اشتراك شهري؟',
      faqSubscriptionA: 'لا. الاشتراك سنوي، تدفعه مرة في السنة. السعر والتفاصيل في قسم الأسعار أعلاه.',
      faqWindowsQ: 'هل يعمل على Windows؟',
      faqWindowsA: 'نعم، يعمل على أجهزة Windows. يظهر رابط التثبيت مباشرة بعد إرسال معلوماتك.',
      faqAndroidQ: 'هل يعمل على Android؟',
      faqAndroidA: 'نعم، يعمل على هواتف وأجهزة Android اللوحية عبر Google Play.',
      faqAfterTrialQ: 'ماذا يحدث بعد 14 يومًا؟',
      faqAfterTrialA: 'تنتهي التجربة المجانية. تواصل معنا للتفعيل واطّلع على العروض الحالية في صفحة الأسعار.',
      privacyLink: 'سياسة الخصوصية',
      terms: 'شروط الاستخدام',
      required: 'هذا الحقل مطلوب.',
      tooShort: 'اكتب حرفين على الأقل.',
      invalidPhone: 'أدخل رقم هاتف صحيحًا من 8 إلى 15 رقمًا.',
      generalError: 'تعذّر إرسال المعلومات. تحقق من الإنترنت وحاول مرة أخرى.'
    },
    fr: {
      viewPricing: 'Voir les tarifs actuels',
      brandTagline: 'La gestion simple du magasin',
      eyebrow: 'Essai gratuit de 14 jours',
      title: 'Gérez simplement votre commerce<br><span>même sans Internet</span>',
      intro: 'Ventes, stock, crédit client, bénéfices et fournisseurs dans une seule application adaptée aux commerces algériens.',
      platformsLabel: 'Plateformes et avantages principaux',
      offlineShort: 'Fonctionne sans Internet',
      primaryCta: 'Commencer mon essai gratuit',
      whatsappCta: 'Nous écrire sur WhatsApp',
      trialShort: '14 jours d’essai',
      languagesShort: 'Arabe, français et anglais',
      priceShort: 'Abonnement annuel simple',
      heroPreviewLabel: 'Capture réelle de Store Soft',
      readyOffline: 'Prêt à vendre sans Internet',
      heroImageAlt: 'Écran de vente de Store Soft',
      heroPreviewTitle: 'Commencez à vendre dès le premier écran',
      heroPreviewText: 'Une interface claire sur téléphone et ordinateur, avec les données du commerce sur votre appareil.',
      benefitsEyebrow: 'L’essentiel au quotidien',
      benefitsTitle: 'Suivez ce qui compte vraiment',
      benefitsIntro: 'Choisissez les fonctions utiles à votre activité : tous les commerces n’ont pas les mêmes besoins.',
      benefitSales: 'Ventes rapides et claires',
      benefitSalesText: 'Recherchez, scannez et enregistrez le paiement.',
      benefitStock: 'Stock sous contrôle',
      benefitStockText: 'Suivez quantités, alertes et mouvements.',
      benefitDebts: 'Crédit client sans oubli',
      benefitDebtsText: 'Suivez les dettes et les règlements clients.',
      benefitProfit: 'Bénéfices compréhensibles',
      benefitProfitText: 'Consultez ventes et bénéfices par période.',
      benefitSuppliers: 'Comptes fournisseurs',
      benefitSuppliersText: 'Suivez arrivages, paiements et montants dus.',
      benefitOffline: 'Fonctionne sans Internet',
      benefitOfflineText: 'Continuez à vendre même sans réseau.',
      howEyebrow: 'En trois étapes',
      howTitle: 'Démarrez rapidement',
      stepOneTitle: 'Remplissez vos informations',
      stepOneText: 'Nom, numéro de téléphone ou WhatsApp et activité.',
      stepTwoTitle: 'Choisissez votre version et téléchargez-la',
      stepTwoText: 'Le lien Android sur Google Play et le lien Windows.',
      stepThreeTitle: 'Essayez pendant 14 jours',
      stepThreeText: 'Créez votre magasin, ajoutez vos produits et faites une première vente.',
      proofEyebrow: 'Dans l’application',
      proofTitle: 'Découvrez les écrans principaux',
      proofHint: 'Nous affichons d’abord 8 captures. Touchez une image pour l’agrandir.',
      proofGalleryLabel: 'Captures des fonctions de Store Soft',
      showAllFeatures: 'Voir toutes les fonctions',
      showLess: 'Voir moins',
      openImage: 'Agrandir l’image : ',
      closeImage: 'Fermer l’image',
      previousImage: 'Image précédente',
      nextImage: 'Image suivante',
      pricingTitle: 'Tarifs et offres actuels',
      trialEyebrow: 'Essai gratuit de 14 jours',
      trialTitle: 'Commencez votre essai',
      trialIntro: 'Remplissez vos informations, puis téléchargez directement la version Android ou Windows. Essayez ventes, stock, crédit et bénéfices avant de payer.',
      trialPointOne: 'Aucune carte bancaire requise',
      trialPointTwo: 'Les deux liens sont disponibles immédiatement',
      trialPointThree: 'Aide sur WhatsApp si nécessaire',
      available: 'Disponible maintenant',
      formTitle: 'Commencer mon essai gratuit',
      formIntro: 'Après l’envoi, choisissez la version téléphone ou ordinateur.',
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
      phoneLabel: 'Téléphone / WhatsApp',
      phonePlaceholder: '0550 12 34 56',
      phoneHint: 'Un numéro pour vous joindre et vous aider pendant l’essai.',
      submit: 'Commencer mon essai gratuit',
      submitting: 'Envoi de vos informations…',
      successTitle: 'Demande reçue',
      successText: 'Choisissez votre version et commencez l’essai. Vous pouvez télécharger les deux sans remplir à nouveau le formulaire.',
      downloadAndroid: 'Télécharger Android',
      downloadWindows: 'Télécharger Windows',
      recommendedDevice: 'Adapté à votre appareil actuel',
      faqTitle: 'Questions rapides avant l’essai',
      faqOfflineQ: 'L’application fonctionne-t-elle sans Internet ?',
      faqOfflineA: 'Oui. Les ventes, le stock, le crédit et les rapports fonctionnent sans Internet. Le réseau sert uniquement aux services facultatifs comme Sync ou la sauvegarde Google Drive.',
      faqSubscriptionQ: 'Y a-t-il un abonnement mensuel ?',
      faqSubscriptionA: 'Non. L’abonnement est annuel : vous payez une fois par an. Le prix et les détails sont dans la section Tarifs ci-dessus.',
      faqWindowsQ: 'L’application fonctionne-t-elle sur Windows ?',
      faqWindowsA: 'Oui. Le lien d’installation Windows apparaît dès que vos informations sont envoyées.',
      faqAndroidQ: 'L’application fonctionne-t-elle sur Android ?',
      faqAndroidA: 'Oui, sur les téléphones et tablettes Android via Google Play.',
      faqAfterTrialQ: 'Que se passe-t-il après 14 jours ?',
      faqAfterTrialA: 'L’essai gratuit se termine. Contactez-nous pour l’activation et consultez les offres sur la page Tarifs.',
      privacyLink: 'Confidentialité',
      terms: 'Conditions',
      required: 'Ce champ est obligatoire.',
      tooShort: 'Saisissez au moins deux caractères.',
      invalidPhone: 'Saisissez un numéro de téléphone valide de 8 à 15 chiffres.',
      generalError: 'Les informations n’ont pas pu être envoyées. Vérifiez votre connexion et réessayez.'
    }
  };

  var galleryItems = [
    ['features/01-pos/01-catalog-ar.png', 'اختر المنتج المطلوب', 'Choisir le produit souhaité'],
    ['features/01-pos/02-cart-preview-ar.png?v=20260831-quantity-v2', 'اختر وحدة البيع والكمية', 'Choisir l’unité et la quantité'],
    ['features/01-pos/03-cart-ar.png', 'راجع سلة المبيعات', 'Vérifier le panier de vente'],
    ['features/01-pos/04-payment-ar.png', 'سجّل طريقة الدفع', 'Enregistrer le mode de paiement'],
    ['features/02-sales-history/01-sales-list-ar.png', 'راجع سجل العمليات', 'Consulter l’historique des opérations'],
    ['features/03-products/01-products-list-ar.png', 'تابع قائمة المنتجات', 'Suivre la liste des produits'],
    ['features/03-products/02-quick-add-ar.png', 'أضف منتجًا جديدًا', 'Ajouter un nouveau produit'],
    ['features/05-customers-and-credit/01-customers-list-ar.png', 'تابع ديون الزبائن', 'Suivre les dettes clients'],
    ['features/04-promotions/01-promotions-list-ar.png', 'راجع عروض التخفيضات', 'Consulter les promotions'],
    ['features/04-promotions/02-new-promotion-ar.png', 'أنشئ عرضًا جديدًا', 'Créer une nouvelle promotion'],
    ['features/05-customers-and-credit/02-customer-account-ar.png', 'راجع حساب الزبون', 'Consulter le compte client'],
    ['features/05-customers-and-credit/03-record-payment-ar.png', 'سجّل دفعة الزبون', 'Enregistrer un paiement client'],
    ['features/06-suppliers/01-suppliers-list-ar.png', 'تابع ديون الموردين', 'Suivre les dettes fournisseurs'],
    ['features/06-suppliers/02-supplier-account-ar.png', 'راجع حساب المورد', 'Consulter le compte fournisseur'],
    ['features/07-deliveries/01-deliveries-list-ar.png', 'راجع سجل الواردات', 'Consulter l’historique des arrivages'],
    ['features/07-deliveries/02-new-delivery-ar.png', 'أضف بضاعة واردة', 'Ajouter un nouvel arrivage'],
    ['features/08-cash-drawer/01-open-drawer-ar.png', 'تابع حركة الصندوق', 'Suivre les mouvements de caisse'],
    ['features/08-cash-drawer/02-cash-in-ar.png', 'أضف مبلغًا للصندوق', 'Ajouter une entrée en caisse'],
    ['features/09-expenses/01-expenses-list-ar.png', 'راجع سجل المصاريف', 'Consulter les dépenses'],
    ['features/09-expenses/02-add-expense-ar.png', 'سجّل مصروفًا جديدًا', 'Ajouter une dépense'],
    ['features/10-reports/01-overview-ar.png', 'راجع المبيعات والأرباح', 'Consulter ventes et bénéfices'],
    ['features/10-reports/02-inventory-ar.png', 'راجع حالة المخزون', 'Consulter l’état du stock'],
    ['features/10-reports/03-profitability-ar.png', 'اكتشف المنتجات الأكثر ربحًا', 'Voir les produits les plus rentables'],
    ['features/10-reports/04-debts-ar.png', 'راجع ملخص الديون', 'Consulter le résumé des dettes'],
    ['features/10-reports/05-zakat-ar.png', 'احسب قيمة الزكاة', 'Estimer le montant de la zakat'],
    ['features/10-reports/06-sellers-ar.png', 'راجع أداء البائعين', 'Consulter la performance des vendeurs'],
    ['features/11-repairs/01-repairs-list-ar.png', 'تابع طلبات التصليح', 'Suivre les réparations'],
    ['features/12-settings/01-settings-ar.png', 'خصّص إعدادات المحل', 'Personnaliser les réglages'],
    ['features/13-sync-and-staff/01-create-owner-account-ar.png', 'أنشئ حساب مالك المحل', 'Créer le compte propriétaire'],
    ['features/13-sync-and-staff/02-staff-login-ar.png', 'سجّل دخول الموظف', 'Connecter le compte employé'],
    ['features/13-sync-and-staff/03-sync-users-ar.png', 'تابع المستخدمين والأجهزة', 'Suivre utilisateurs et appareils'],
    ['features/13-sync-and-staff/04-add-user-ar.png', 'أضف مستخدمًا جديدًا', 'Ajouter un utilisateur'],
    ['features/13-sync-and-staff/05-permissions-ar.png', 'حدّد صلاحيات المستخدم', 'Définir les autorisations'],
    ['features/13-sync-and-staff/06-permissions-more-ar.png', 'راجع جميع الصلاحيات', 'Consulter toutes les autorisations'],
    ['features/14-help-center/01-help-center-ar.png', 'احصل على المساعدة', 'Accéder au centre d’aide'],
    ['features/15-notifications/01-notification-center-ar.png', 'تابع مركز الإشعارات', 'Consulter les notifications'],
    ['features/16-navigation/01-all-features-ar.png', 'استعرض كل الميزات', 'Découvrir toutes les fonctions']
  ];

  var form = document.getElementById('leadForm');
  var button = document.getElementById('submitButton');
  var submitLabel = button.querySelector('span');
  var formView = document.getElementById('formView');
  var successView = document.getElementById('successView');
  var submitError = document.getElementById('submitError');
  var languageSwitch = document.getElementById('languageSwitch');
  var screenshots = document.getElementById('screenshots');
  var galleryToggle = document.getElementById('galleryToggle');
  var lightbox = document.getElementById('lightbox');
  var lightboxImage = document.getElementById('lightboxImage');
  var lightboxCaption = document.getElementById('lightboxCaption');
  var mobileTrialCta = document.getElementById('mobileTrialCta');

  function copy(key) { return copies[currentLanguage][key]; }

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

  function trafficSource() {
    var data = campaignData();
    var source = (data.source || data.referrer || '').toLowerCase();
    if (/facebook|(^|[^a-z])fb([^a-z]|$)/.test(source)) return 'facebook';
    if (/instagram|(^|[^a-z])ig([^a-z]|$)/.test(source)) return 'instagram';
    if (/tiktok|tik-tok/.test(source)) return 'tiktok';
    if (data.source) return 'other_campaign';
    if (data.referrer) return 'referral';
    return 'direct';
  }

  function trackEvent(name, properties, standardEvent) {
    var campaign = campaignData();
    var detail = Object.assign({
      language: currentLanguage,
      traffic_source: trafficSource(),
      utm_source: campaign.source,
      utm_medium: campaign.medium,
      utm_campaign: campaign.campaign
    }, properties || {});
    var trackedEvents = document.documentElement.getAttribute('data-tracking-events');
    document.documentElement.setAttribute('data-tracking-events', trackedEvents ? trackedEvents + ',' + name : name);
    window.dispatchEvent(new CustomEvent('storesoft:tracking', { detail: { event: name, properties: detail } }));
    window.dataLayer.push(Object.assign({ event: name }, detail));
    if (typeof window.fbq === 'function') window.fbq(standardEvent ? 'track' : 'trackCustom', name, detail);
  }

  // Meta advanced matching wants digits with the country code: 0550 12 34 56 -> 213550123456.
  function metaPhone(value) {
    var digits = value.replace(/\D/g, '');
    if (digits.indexOf('00') === 0) digits = digits.slice(2);
    else if (digits.charAt(0) === '0') digits = '213' + digits.slice(1);
    return /^213\d{8,9}$/.test(digits) ? digits : '';
  }

  // Re-init with user data (same Pixel ID as index.html). The Pixel hashes it (SHA-256) before sending.
  // Analytics failures must never interrupt a saved submission.
  function setMetaUser(phone) {
    try {
      var ph = metaPhone(phone);
      if (ph && typeof window.fbq === 'function') window.fbq('init', '2176257146284643', { ph: ph, country: 'dz' });
    } catch (_) { /* Best effort. */ }
  }

  function galleryCaption(index) { return galleryItems[index][currentLanguage === 'ar' ? 1 : 2]; }

  function renderGallery() {
    screenshots.textContent = '';
    galleryItems.forEach(function (item, index) {
      var figure = document.createElement('figure');
      figure.hidden = !galleryExpanded && index >= 8;
      var shot = document.createElement('button');
      shot.className = 'phone-shot';
      shot.type = 'button';
      shot.setAttribute('aria-label', copy('openImage') + galleryCaption(index));
      shot.addEventListener('click', function () { openLightbox(index); });
      var image = document.createElement('img');
      image.src = 'assets/' + item[0];
      image.width = 1080;
      image.height = 2400;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      var caption = document.createElement('figcaption');
      var strong = document.createElement('b');
      strong.textContent = galleryCaption(index);
      caption.appendChild(strong);
      shot.appendChild(image);
      figure.appendChild(shot);
      figure.appendChild(caption);
      screenshots.appendChild(figure);
    });
  }

  function updateLightbox() {
    lightboxImage.src = 'assets/' + galleryItems[lightboxIndex][0];
    lightboxImage.alt = galleryCaption(lightboxIndex);
    lightboxCaption.textContent = galleryCaption(lightboxIndex);
  }

  function openLightbox(index) {
    lightboxIndex = index;
    updateLightbox();
    if (typeof lightbox.showModal === 'function') lightbox.showModal();
    else lightbox.setAttribute('open', '');
    trackEvent('ScreenshotOpened', { screenshot_index: index + 1 }, false);
  }

  function closeLightbox() {
    if (typeof lightbox.close === 'function') lightbox.close();
    else lightbox.removeAttribute('open');
  }

  function setLanguage(language) {
    currentLanguage = language;
    var isArabic = language === 'ar';
    document.querySelectorAll('[data-pricing-frame]').forEach(function (frame) {
      var src = '/pricing/?lang=' + language + '&embed=1';
      if (frame.getAttribute('src') !== src) frame.setAttribute('src', src);
    });
    document.querySelectorAll("[data-pricing-link]").forEach(function (link) { link.href = "/pricing/?lang=" + language; });
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
    document.querySelectorAll('[data-copy-alt]').forEach(function (element) {
      var value = copy(element.getAttribute('data-copy-alt'));
      if (value !== undefined) element.alt = value;
    });
    document.querySelectorAll('[data-copy-placeholder]').forEach(function (element) {
      element.placeholder = copy(element.getAttribute('data-copy-placeholder'));
    });
    galleryToggle.textContent = copy(galleryExpanded ? 'showLess' : 'showAllFeatures');
    renderGallery();
    if (lightbox.hasAttribute('open')) updateLightbox();
    clearErrors();
  }

  function clearErrors() {
    ['name', 'phone', 'shopType'].forEach(function (id) {
      document.getElementById(id).removeAttribute('aria-invalid');
      document.getElementById(id + 'Error').textContent = '';
    });
    submitError.textContent = '';
  }

  function fieldError(id, message) {
    document.getElementById(id).setAttribute('aria-invalid', 'true');
    document.getElementById(id + 'Error').textContent = message;
  }

  function isValidPhone(value) {
    var digits = value.replace(/\D/g, '');
    return value.length <= 24 && /^[+\d\s().-]+$/.test(value) && digits.length >= 8 && digits.length <= 15;
  }

  function validate(values) {
    clearErrors();
    var valid = true;
    if (!values.name) { fieldError('name', copy('required')); valid = false; }
    else if (values.name.length < 2) { fieldError('name', copy('tooShort')); valid = false; }
    if (!values.shop_type) { fieldError('shopType', copy('required')); valid = false; }
    if (!values.phone) { fieldError('phone', copy('required')); valid = false; }
    else if (!isValidPhone(values.phone)) { fieldError('phone', copy('invalidPhone')); valid = false; }
    return valid;
  }

  languageSwitch.addEventListener('click', function () { setLanguage(currentLanguage === 'ar' ? 'fr' : 'ar'); });

  document.querySelectorAll('.js-trial-cta').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      trackEvent('TrialCTAClick', { cta_location: link.getAttribute('data-cta-location') || 'unknown' }, false);
      document.getElementById('free-trial').scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start'
      });
    });
  });

  document.querySelectorAll('.js-whatsapp').forEach(function (link) {
    link.addEventListener('click', function () { trackEvent('WhatsAppCTAClick', { cta_location: 'hero' }, false); });
  });

  galleryToggle.addEventListener('click', function () {
    galleryExpanded = !galleryExpanded;
    galleryToggle.setAttribute('aria-expanded', String(galleryExpanded));
    galleryToggle.textContent = copy(galleryExpanded ? 'showLess' : 'showAllFeatures');
    renderGallery();
    trackEvent(galleryExpanded ? 'GalleryExpanded' : 'GalleryCollapsed', { visible_screenshots: galleryExpanded ? galleryItems.length : 8 }, false);
    if (!galleryExpanded) document.getElementById('proofTitle').scrollIntoView({ block: 'start' });
  });

  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  document.getElementById('lightboxPrev').addEventListener('click', function () { lightboxIndex = (lightboxIndex - 1 + galleryItems.length) % galleryItems.length; updateLightbox(); });
  document.getElementById('lightboxNext').addEventListener('click', function () { lightboxIndex = (lightboxIndex + 1) % galleryItems.length; updateLightbox(); });
  lightbox.addEventListener('click', function (event) { if (event.target === lightbox) closeLightbox(); });
  lightbox.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft') document.getElementById('lightboxPrev').click();
    if (event.key === 'ArrowRight') document.getElementById('lightboxNext').click();
  });

  form.addEventListener('focusin', function () {
    if (formStartTracked) return;
    formStartTracked = true;
    trackEvent('FormStarted', { content_name: 'Store Soft download request' }, false);
  });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (submitting || !successView.hidden) return;
    var data = new FormData(form);
    var values = {
      name: String(data.get('name') || '').trim(),
      shop_type: String(data.get('shop_type') || '').trim(),
      phone: String(data.get('phone') || '').trim(),
      website: String(data.get('website') || ''),
      form_started_at: formStartedAt,
      language: currentLanguage,
      form_version: 'phone_shop_select_v4'
    };
    if (!validate(values)) return;
    trackEvent('FormSubmitAttempt', { content_name: 'Store Soft download request' }, false);
    Object.assign(values, campaignData());
    submitting = true;
    button.disabled = true;
    submitLabel.textContent = copy('submitting');
    try {
      var response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      var result = await response.json().catch(function () { return {}; });
      if (!response.ok || !result.ok) throw new Error(result.error || 'submit_failed');
      showDownloads(result.tracking_code);
      window.StoreSoftDownloadTracking?.submitted(result.tracking_code);
      formView.hidden = true;
      successView.hidden = false;
      mobileTrialCta.classList.add('is-hidden');
      setMetaUser(values.phone);
      trackEvent('FormSubmitted', { content_name: 'Store Soft download request' }, false);
      trackEvent('Lead', { content_name: 'Store Soft download request' }, true);
      successView.focus();
    } catch (_) {
      submitError.textContent = copy('generalError');
    } finally {
      submitting = false;
      button.disabled = false;
      submitLabel.textContent = copy('submit');
    }
  });

  function showDownloads(code) {
    var android = document.getElementById('downloadAndroid');
    var windows = document.getElementById('downloadWindows');
    window.StoreSoftWindowsDownload.update(windows);
    // Never interpret an API response as a URL. Only the opaque code is public.
    android.href = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/.test(code || '')
      ? '/storesoft/try/?t=' + encodeURIComponent(code)
      : 'https://play.google.com/store/apps/details?id=com.yousoft.storesoft';
    var userAgent = navigator.userAgent || '';
    var preferred = /Android/i.test(userAgent) ? android : /Windows/i.test(userAgent) ? windows : null;
    if (preferred) {
      preferred.classList.replace('secondary-cta', 'primary-cta');
      preferred.querySelector('.download-recommendation').hidden = false;
    }
  }

  document.querySelectorAll('[data-download-platform]').forEach(function (link) {
    link.addEventListener('click', function () {
      trackEvent('DownloadClicked', { platform: link.getAttribute('data-download-platform') }, false);
      window.StoreSoftDownloadTracking?.click(link.getAttribute('data-download-platform'));
    });
  });

  function updateMobileTrialCta() {
    var heroRect = document.querySelector('.hero').getBoundingClientRect();
    var trialRect = document.getElementById('free-trial').getBoundingClientRect();
    var heroVisible = heroRect.bottom > 0 && heroRect.top < window.innerHeight;
    var trialVisible = trialRect.bottom > 0 && trialRect.top < window.innerHeight;
    mobileTrialCta.classList.toggle('is-near-form', heroVisible || trialVisible);
  }
  window.addEventListener('scroll', updateMobileTrialCta, { passive: true });
  window.addEventListener('resize', updateMobileTrialCta);
  updateMobileTrialCta();

  // The embedded pricing page reports its height so the frame never scrolls.
  window.addEventListener('message', function (event) {
    if (event.origin !== window.location.origin || !event.data || event.data.type !== 'storesoft-pricing-height') return;
    document.querySelectorAll('[data-pricing-frame]').forEach(function (frame) {
      if (frame.contentWindow === event.source && event.data.height > 0) frame.style.height = event.data.height + 'px';
    });
  });

  document.getElementById('year').textContent = new Date().getFullYear();
  setLanguage('ar');
  trackEvent('LandingPageView', { content_name: 'Store Soft download landing page' }, false);
  window.StoreSoftDownloadTracking?.visit();
}());
