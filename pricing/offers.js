// Website-owned commercial content. Amounts are integer centimes; edit and publish this file.
// available_until (last day, Algeria time) hides an offer automatically after that day.
// A "yearly" offer is the main card; a "lifetime" offer is the small strip above it.
window.storeSoftOffers = [
  {
    "code": "lifetime",
    "title": {
      "ar": "عرض مدى الحياة",
      "en": "Lifetime offer",
      "fr": "Offre à vie"
    },
    "billing": "lifetime",
    "available_until": "2026-10-31",
    "first_device_once_centimes": 700000,
    "additional_device_year_centimes": 300000
  },
  {
    "code": "yearly",
    "title": {
      "ar": "اشتراك سنوي",
      "en": "Yearly subscription",
      "fr": "Abonnement annuel"
    },
    "billing": "yearly",
    "features": {
      "ar": [
        "تبيع حتى بدون إنترنت",
        "تعرف ربحك كل يوم",
        "لا تضيع كريدي أي زبون",
        "تعرف ما بقي في المخزون، مع الباركود",
        "بياناتك محفوظة بالنسخ الاحتياطي",
        "نفس المحل على كل أجهزتك",
        "حسابات للبائعين بصلاحيات"
      ],
      "en": [
        "Sell even without internet",
        "Know your profit every day",
        "Never lose track of customer credit",
        "Know what is left in stock, with barcodes",
        "Your data stays backed up",
        "The same shop on all your devices",
        "Accounts for your staff, with permissions"
      ],
      "fr": [
        "Vendez même sans internet",
        "Connaissez votre bénéfice chaque jour",
        "Ne perdez plus aucun crédit client",
        "Sachez ce qui reste en stock, avec codes-barres",
        "Vos données restent sauvegardées",
        "La même boutique sur tous vos appareils",
        "Des comptes pour vos vendeurs, avec permissions"
      ]
    },
    "billing_note": {
      "ar": "الزبائن الذين دفعوا من قبل يحتفظون بتفعيلهم الحالي.",
      "en": "Customers who already paid keep their current activation.",
      "fr": "Les clients ayant déjà payé gardent leur activation actuelle."
    },
    "first_device_year_centimes": 690000,
    "additional_device_year_centimes": 300000
  }
];
