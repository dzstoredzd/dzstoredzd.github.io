// Privacy and Terms pages: show one language (ar, fr or en).
// Order: ?lang= in the link (the app sends it), then the browser language,
// then English. Without JavaScript all three languages stay visible.
(function () {
  var supported = ['ar', 'fr', 'en'];
  var labels = {
    ar: {
      tagline: 'برنامج تسيير المحلات', features: 'المميزات', backup: 'النسخ الاحتياطي',
      pricing: 'الأسعار', privacy: 'الخصوصية', terms: 'الشروط', getApp: 'حمّل التطبيق',
      back: '→ العودة إلى الرئيسية', about: 'برنامج بيع وتسيير المحل يعمل دون إنترنت.',
      product: 'المنتج', drive: 'نسخ Google Drive', download: 'التحميل', legal: 'قانوني',
      privacyPolicy: 'سياسة الخصوصية', termsOfService: 'شروط الاستخدام',
      deleteData: 'حذف بياناتك', contact: 'اتصل بنا', email: 'البريد الإلكتروني',
      rights: 'جميع الحقوق محفوظة.', openMenu: 'فتح القائمة'
    },
    fr: {
      tagline: 'Gestion de magasin', features: 'Fonctions', backup: 'Sauvegarde',
      pricing: 'Prix', privacy: 'Confidentialité', terms: 'Conditions', getApp: 'Obtenir l’app',
      back: '← Retour à l’accueil', about: 'Caisse et gestion de magasin qui marche sans Internet.',
      product: 'Produit', drive: 'Sauvegarde Drive', download: 'Télécharger', legal: 'Légal',
      privacyPolicy: 'Politique de confidentialité', termsOfService: 'Conditions d’utilisation',
      deleteData: 'Supprimer vos données', contact: 'Contact', email: 'E-mail',
      rights: 'Tous droits réservés.', openMenu: 'Ouvrir le menu'
    },
    en: {
      tagline: 'Store management for shops', features: 'Features', backup: 'Backup',
      pricing: 'Pricing', privacy: 'Privacy', terms: 'Terms', getApp: 'Get the app',
      back: '← Back to home', about: 'Offline-first point-of-sale & store management built for shops.',
      product: 'Product', drive: 'Drive backup', download: 'Download', legal: 'Legal',
      privacyPolicy: 'Privacy Policy', termsOfService: 'Terms of Service',
      deleteData: 'Delete your data', contact: 'Contact', email: 'Email support',
      rights: 'All rights reserved.', openMenu: 'Open menu'
    }
  };

  function pick() {
    var asked = new URLSearchParams(window.location.search).get('lang');
    if (supported.indexOf(asked) >= 0) return asked;
    var langs = navigator.languages || [navigator.language || ''];
    for (var i = 0; i < langs.length; i++) {
      var code = String(langs[i]).slice(0, 2).toLowerCase();
      if (supported.indexOf(code) >= 0) return code;
    }
    return 'en';
  }

  // English sections keep the old ids (#analytics, #retention...) that the
  // app and other pages link to; Arabic and French use "ar-" / "fr-" ids.
  function scrollToHash(lang) {
    var id = window.location.hash.slice(1);
    if (!id) return;
    var target = document.getElementById(lang === 'en' ? id : lang + '-' + id) ||
      document.getElementById(id);
    if (!target || target.closest('[hidden]')) return;
    try { target.scrollIntoView({ behavior: 'instant' }); } catch (error) { target.scrollIntoView(); }
  }

  function show(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-legal-lang]').forEach(function (block) {
      block.hidden = block.getAttribute('data-legal-lang') !== lang;
    });
    document.querySelectorAll('[data-legal-switch]').forEach(function (link) {
      var on = link.getAttribute('data-legal-switch') === lang;
      if (on) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
    });
    document.querySelectorAll('[data-legal-t]').forEach(function (element) {
      element.textContent = labels[lang][element.getAttribute('data-legal-t')];
    });
    // Links between the two pages keep the chosen language.
    document.querySelectorAll('a[href^="privacy.html"], a[href^="terms.html"]').forEach(function (link) {
      link.setAttribute('href', link.getAttribute('href').split(/[?#]/)[0] + '?lang=' + lang);
    });
    // The homepage knows Arabic and French only.
    document.querySelectorAll('[data-legal-home]').forEach(function (link) {
      link.href = 'index.html' + (lang === 'fr' ? '?lang=fr' : '') + link.getAttribute('data-legal-home');
    });
    var toggle = document.getElementById('navToggle');
    if (toggle) toggle.setAttribute('aria-label', labels[lang].openMenu);
    var title = document.querySelector('[data-legal-lang="' + lang + '"] h1');
    if (title) document.title = title.textContent + ' — Store Soft';
  }

  document.querySelectorAll('[data-legal-switch]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      var lang = link.getAttribute('data-legal-switch');
      var url = new URL(window.location.href);
      url.searchParams.set('lang', lang);
      url.hash = '';
      window.history.replaceState(null, '', url);
      show(lang);
      window.scrollTo(0, 0);
    });
  });

  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.getElementById('year').textContent = new Date().getFullYear();

  var lang = pick();
  show(lang);
  scrollToHash(lang);
})();
