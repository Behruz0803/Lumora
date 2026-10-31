export type Language = 'uz' | 'ru' | 'en';

export interface MarketPriceEntry {
  marketId: string;
  marketName: Record<Language, string>;
  district: Record<Language, string>;
  price: number; // in UZS
  minOrderQty: number;
  verifiedCount: number;
  updatedMinutesAgo: number;
}

export interface SupplierOffer {
  id: string;
  supplierName: string;
  marketName: Record<Language, string>;
  rating: number;
  reviewsCount: number;
  verified: boolean;
  depositGuaranteeUzs: number;
  price: number;
  groupTierPrice: number;
  moq: number;
  deliveryHours: Record<Language, string>;
  nasiyaAvailable: boolean;
}

export interface ProductItem {
  id: string;
  sku: string;
  name: Record<Language, string>;
  category: 'staples' | 'produce' | 'dairy_meat' | 'beverages' | 'household';
  categoryLabel: Record<Language, string>;
  unit: Record<Language, string>;
  defaultQty: number;
  aiRecommendedQty: number;
  oldPaidPrice: number;
  avgMarketPrice: number;
  bestDirectPrice: number;
  bestGroupPrice: number;
  bestMarketName: Record<Language, string>;
  change7dPct: number;
  forecast14dPct: number;
  supplyBadge: Record<Language, string>;
  aiInsight: Record<Language, string>;
  aiAction: 'buy_more_now' | 'buy_normal' | 'wait_for_drop';
  history30d: number[];
  forecast14d: number[];
  marketPrices: MarketPriceEntry[];
  suppliers: SupplierOffer[];
}

export interface GroupOrderPool {
  id: string;
  title: Record<Language, string>;
  district: Record<Language, string>;
  radiusKm: number;
  productId: string;
  productName: Record<Language, string>;
  unit: Record<Language, string>;
  regularPrice: number;
  groupPrice: number;
  discountPct: number;
  currentQty: number;
  targetQty: number;
  participantsCount: number;
  expiresInHours: number;
  supplierName: string;
  shopsJoined: { name: string; qty: number; distanceKm: number }[];
}

export interface SampleReceiptScan {
  id: string;
  title: Record<Language, string>;
  sourceType: 'handwritten_nakladnoy' | 'fiscal_qr' | 'fake_bait_test';
  bazaarName: Record<Language, string>;
  sellerName: string;
  rawTextPreview: string;
  extractedItems: {
    productId: string;
    productName: Record<Language, string>;
    unit: Record<Language, string>;
    extractedPrice: number;
    marketMedianPrice: number;
    deviationPct: number;
    zScore: number;
    status: 'verified' | 'blocked_fake';
    statusNote: Record<Language, string>;
  }[];
  cashbackRewardUzs: number;
}

export const TASHKENT_MARKETS = [
  {
    id: 'orikzor',
    name: {
      uz: "O'rikzor Ulgurji Bozori",
      ru: 'Оптовый рынок Урикзар',
      en: 'Orikzor Wholesale Market',
    },
    district: { uz: 'Uchtepa', ru: 'Учтепа', en: 'Uchtepa' },
    avgSavingPct: 8.4,
  },
  {
    id: 'qoyliq',
    name: {
      uz: "Qo'yliq Agro Ulgurji",
      ru: 'Агро-оптовый рынок Куйлюк',
      en: 'Qoyliq Agro Wholesale',
    },
    district: { uz: 'Bektemir', ru: 'Бектемир', en: 'Bektemir' },
    avgSavingPct: 9.1,
  },
  {
    id: 'sergeli',
    name: {
      uz: 'Sergeli Vagon-Ombor Hub',
      ru: 'Вагонные склады Сергели',
      en: 'Sergeli Rail Depot Hub',
    },
    district: { uz: 'Sergeli', ru: 'Сергели', en: 'Sergeli' },
    avgSavingPct: 9.8,
  },
  {
    id: 'bekbaraka',
    name: {
      uz: 'Bek Baraka Ulgurji',
      ru: 'Оптовый центр Бек Барака',
      en: 'Bek Baraka Wholesale',
    },
    district: { uz: 'Chilonzor', ru: 'Чиланзар', en: 'Chilonzor' },
    avgSavingPct: 7.2,
  },
  {
    id: 'chorsu',
    name: {
      uz: 'Eskijuva (Chorsu) Ulgurji',
      ru: 'Оптовые ряды Чорсу',
      en: 'Chorsu Wholesale Row',
    },
    district: { uz: 'Shayxontohur', ru: 'Шайхантахур', en: 'Shaykhantakhur' },
    avgSavingPct: 6.5,
  },
];

export const PRODUCTS_DATA: ProductItem[] = [
  {
    id: 'sugar-50kg',
    sku: 'UZ-001',
    name: {
      uz: 'Shakar Xorazm Oliy nav (50 kg)',
      ru: 'Сахар Хорезм высший сорт (50 кг)',
      en: 'Refined White Sugar Khorezm (50 kg)',
    },
    category: 'staples',
    categoryLabel: {
      uz: 'Asosiy oziq-ovqat',
      ru: 'Бакалея и сыпучие',
      en: 'Core Staples',
    },
    unit: { uz: '50 kg qop', ru: 'мешок 50 кг', en: '50 kg bag' },
    defaultQty: 10,
    aiRecommendedQty: 14,
    oldPaidPrice: 645000,
    avgMarketPrice: 622000,
    bestDirectPrice: 608000,
    bestGroupPrice: 579000,
    bestMarketName: {
      uz: 'Sergeli Vagon-Ombor',
      ru: 'Склады Сергели',
      en: 'Sergeli Rail Depot',
    },
    change7dPct: +2.8,
    forecast14dPct: +6.4,
    supplyBadge: {
      uz: 'Talab oshmoqda (+6.4%)',
      ru: 'Рост спроса (+6.4%)',
      en: 'Rising Demand (+6.4%)',
    },
    aiInsight: {
      uz: "Mavsumiy talab sababli keyingi 10 kunda shakar narxi ~645,000 so'mgacha ko'tarilishi kutilmoqda. Hozir guruh xaridi orqali 579,000 so'mdan 14 qop zaxira qilish tavsiya etiladi.",
      ru: 'Из-за сезонного спроса цена на сахар вырастет на +6.4% в ближайшие 10 дней. Рекомендуем закупить 14 мешков сейчас по групповой цене 579 000 сум.',
      en: 'Seasonal demand is projected to push sugar up +6.4% within 10 days. Lock in 14 bags now at the 579,000 UZS group rate.',
    },
    aiAction: 'buy_more_now',
    history30d: [595000, 598000, 600000, 602000, 605000, 604000, 609000, 614000, 618000, 622000],
    forecast14d: [626000, 632000, 639000, 646000, 652000],
    marketPrices: [
      {
        marketId: 'sergeli',
        marketName: { uz: 'Sergeli Vagon-Ombor', ru: 'Склады Сергели', en: 'Sergeli Rail Depot' },
        district: { uz: 'Sergeli', ru: 'Сергели', en: 'Sergeli' },
        price: 608000,
        minOrderQty: 10,
        verifiedCount: 48,
        updatedMinutesAgo: 6,
      },
      {
        marketId: 'orikzor',
        marketName: { uz: "O'rikzor Ulgurji Bozori", ru: 'Рынок Урикзар', en: 'Orikzor Market' },
        district: { uz: 'Uchtepa', ru: 'Учтепа', en: 'Uchtepa' },
        price: 612000,
        minOrderQty: 5,
        verifiedCount: 94,
        updatedMinutesAgo: 4,
      },
      {
        marketId: 'qoyliq',
        marketName: { uz: "Qo'yliq Agro Ulgurji", ru: 'Рынок Куйлюк', en: 'Qoyliq Agro' },
        district: { uz: 'Bektemir', ru: 'Бектемир', en: 'Bektemir' },
        price: 619000,
        minOrderQty: 5,
        verifiedCount: 51,
        updatedMinutesAgo: 12,
      },
      {
        marketId: 'chorsu',
        marketName: { uz: 'Eskijuva (Chorsu)', ru: 'Рынок Чорсу', en: 'Chorsu Market' },
        district: { uz: 'Shayxontohur', ru: 'Шайхантахур', en: 'Shaykhantakhur' },
        price: 632000,
        minOrderQty: 2,
        verifiedCount: 37,
        updatedMinutesAgo: 9,
      },
    ],
    suppliers: [
      {
        id: 'sup-1',
        supplierName: 'Sergeli Shakar-Don Vagon MChJ',
        marketName: { uz: 'Sergeli Vagon-Ombor', ru: 'Склады Сергели', en: 'Sergeli Rail Depot' },
        rating: 4.9,
        reviewsCount: 312,
        verified: true,
        depositGuaranteeUzs: 15000000,
        price: 608000,
        groupTierPrice: 579000,
        moq: 10,
        deliveryHours: { uz: '3 soatda', ru: 'за 3 часа', en: 'in 3 hours' },
        nasiyaAvailable: true,
      },
      {
        id: 'sup-2',
        supplierName: "O'rikzor Agro Gold (4-qator 18-ombor)",
        marketName: { uz: "O'rikzor Ulgurji Bozori", ru: 'Рынок Урикзар', en: 'Orikzor Market' },
        rating: 4.8,
        reviewsCount: 428,
        verified: true,
        depositGuaranteeUzs: 10000000,
        price: 612000,
        groupTierPrice: 584000,
        moq: 5,
        deliveryHours: { uz: '2 soatda', ru: 'за 2 часа', en: 'in 2 hours' },
        nasiyaAvailable: true,
      },
      {
        id: 'sup-3',
        supplierName: 'Xorazm Shakar Rasmiy Diler',
        marketName: { uz: "O'rikzor Ulgurji Bozori", ru: 'Рынок Урикзар', en: 'Orikzor Market' },
        rating: 4.9,
        reviewsCount: 519,
        verified: true,
        depositGuaranteeUzs: 25000000,
        price: 610000,
        groupTierPrice: 580000,
        moq: 15,
        deliveryHours: { uz: '4 soatda', ru: 'за 4 часа', en: 'in 4 hours' },
        nasiyaAvailable: true,
      },
    ],
  },
  {
    id: 'flour-50kg',
    sku: 'UZ-002',
    name: {
      uz: "Un Qozog'iston 'Elita' 1-nav (50 kg)",
      ru: 'Мука Казахстан «Элита» 1-сорт (50 кг)',
      en: "Kazakh Wheat Flour 'Elita' Grade 1 (50 kg)",
    },
    category: 'staples',
    categoryLabel: {
      uz: 'Asosiy oziq-ovqat',
      ru: 'Бакалея и сыпучие',
      en: 'Core Staples',
    },
    unit: { uz: '50 kg qop', ru: 'мешок 50 кг', en: '50 kg bag' },
    defaultQty: 12,
    aiRecommendedQty: 15,
    oldPaidPrice: 342000,
    avgMarketPrice: 324000,
    bestDirectPrice: 314000,
    bestGroupPrice: 298000,
    bestMarketName: {
      uz: 'Sergeli Vagon-Ombor',
      ru: 'Склады Сергели',
      en: 'Sergeli Rail Depot',
    },
    change7dPct: +1.9,
    forecast14dPct: +4.5,
    supplyBadge: {
      uz: 'Vagon kechikishi (+4.5%)',
      ru: 'Задержка вагонов (+4.5%)',
      en: 'Rail Transit Delay (+4.5%)',
    },
    aiInsight: {
      uz: "Temiryo'l o'tkazuv punktida vagonlar kechikishi tufayli un narxi +4.5% oshishi kutilmoqda. Sergeli omboridan 298,000 so'mda 15 qop olish tavsiya etiladi.",
      ru: 'Из-за задержки вагонов на границе ожидается рост цены на муку на +4.5%. Рекомендуем взять 15 мешков по 298 000 сум со склада Сергели.',
      en: 'Border rail delays are tightening Kazakh flour supply (+4.5% forecast). Stock 15 bags now at 298,000 UZS.',
    },
    aiAction: 'buy_more_now',
    history30d: [310000, 312000, 311000, 314000, 315000, 318000, 319000, 321000, 322000, 324000],
    forecast14d: [327000, 331000, 334000, 337000, 339000],
    marketPrices: [
      {
        marketId: 'sergeli',
        marketName: { uz: 'Sergeli Vagon-Ombor', ru: 'Склады Сергели', en: 'Sergeli Rail Depot' },
        district: { uz: 'Sergeli', ru: 'Сергели', en: 'Sergeli' },
        price: 314000,
        minOrderQty: 10,
        verifiedCount: 72,
        updatedMinutesAgo: 5,
      },
      {
        marketId: 'orikzor',
        marketName: { uz: "O'rikzor Ulgurji Bozori", ru: 'Рынок Урикзар', en: 'Orikzor Market' },
        district: { uz: 'Uchtepa', ru: 'Учтепа', en: 'Uchtepa' },
        price: 318000,
        minOrderQty: 5,
        verifiedCount: 83,
        updatedMinutesAgo: 8,
      },
      {
        marketId: 'qoyliq',
        marketName: { uz: "Qo'yliq Agro Ulgurji", ru: 'Рынок Куйлюк', en: 'Qoyliq Agro' },
        district: { uz: 'Bektemir', ru: 'Бектемир', en: 'Bektemir' },
        price: 322000,
        minOrderQty: 5,
        verifiedCount: 64,
        updatedMinutesAgo: 11,
      },
    ],
    suppliers: [
      {
        id: 'sup-f1',
        supplierName: 'Astana-Toshkent Grain Express',
        marketName: { uz: 'Sergeli Vagon-Ombor', ru: 'Склады Сергели', en: 'Sergeli Rail Depot' },
        rating: 4.9,
        reviewsCount: 390,
        verified: true,
        depositGuaranteeUzs: 20000000,
        price: 314000,
        groupTierPrice: 298000,
        moq: 10,
        deliveryHours: { uz: '3 soatda', ru: 'за 3 часа', en: 'in 3 hours' },
        nasiyaAvailable: true,
      },
    ],
  },
  {
    id: 'oil-5l',
    sku: 'UZ-003',
    name: {
      uz: "Kungaboqar yog'i 'Oltin Dala' (5 litr)",
      ru: 'Масло подсолнечное «Oltin Dala» (5 л)',
      en: "Refined Sunflower Oil 'Oltin Dala' (5L)",
    },
    category: 'staples',
    categoryLabel: {
      uz: 'Asosiy oziq-ovqat',
      ru: 'Бакалея и сыпучие',
      en: 'Core Staples',
    },
    unit: { uz: '5L qadoq', ru: 'бутыль 5 л', en: '5L bottle' },
    defaultQty: 25,
    aiRecommendedQty: 12,
    oldPaidPrice: 89000,
    avgMarketPrice: 83500,
    bestDirectPrice: 80500,
    bestGroupPrice: 76500,
    bestMarketName: {
      uz: "O'rikzor Ulgurji Bozori",
      ru: 'Рынок Урикзар',
      en: 'Orikzor Market',
    },
    change7dPct: -2.4,
    forecast14dPct: -4.8,
    supplyBadge: {
      uz: 'Narx tushmoqda (-4.8%)',
      ru: 'Снижение цены (-4.8%)',
      en: 'Price Dropping (-4.8%)',
    },
    aiInsight: {
      uz: "Yangi import partiyasi (42 vagon) Toshkentga kirib keldi. Narx keyingi 5 kunda yana -4.8% ga tushadi! Hozir 25 dona o'rniga 12 dona olish maqsadga muvofiq.",
      ru: 'Прибыла крупная партия импортного масла (42 вагона). В течение 5 дней цена снизится еще на -4.8%. Рекомендуем сократить заказ с 25 до 12 шт.',
      en: '42 railcars of imported sunflower oil just cleared customs. Prices will drop -4.8% in 5 days — reduce current order from 25 to 12 bottles.',
    },
    aiAction: 'wait_for_drop',
    history30d: [88000, 87500, 87000, 86500, 86000, 85500, 85000, 84500, 84000, 83500],
    forecast14d: [82000, 81000, 80000, 79500, 79000],
    marketPrices: [
      {
        marketId: 'orikzor',
        marketName: { uz: "O'rikzor Ulgurji Bozori", ru: 'Рынок Урикзар', en: 'Orikzor Market' },
        district: { uz: 'Uchtepa', ru: 'Учтепа', en: 'Uchtepa' },
        price: 80500,
        minOrderQty: 12,
        verifiedCount: 112,
        updatedMinutesAgo: 3,
      },
      {
        marketId: 'sergeli',
        marketName: { uz: 'Sergeli Vagon-Ombor', ru: 'Склады Сергели', en: 'Sergeli Rail Depot' },
        district: { uz: 'Sergeli', ru: 'Сергели', en: 'Sergeli' },
        price: 81000,
        minOrderQty: 20,
        verifiedCount: 65,
        updatedMinutesAgo: 9,
      },
      {
        marketId: 'qoyliq',
        marketName: { uz: "Qo'yliq Agro Ulgurji", ru: 'Рынок Куйлюк', en: 'Qoyliq Agro' },
        district: { uz: 'Bektemir', ru: 'Бектемир', en: 'Bektemir' },
        price: 83000,
        minOrderQty: 10,
        verifiedCount: 44,
        updatedMinutesAgo: 15,
      },
    ],
    suppliers: [
      {
        id: 'sup-o1',
        supplierName: 'Yug-Oil Import Toshkent',
        marketName: { uz: "O'rikzor Ulgurji Bozori", ru: 'Рынок Урикзар', en: 'Orikzor Market' },
        rating: 4.9,
        reviewsCount: 480,
        verified: true,
        depositGuaranteeUzs: 18000000,
        price: 80500,
        groupTierPrice: 76500,
        moq: 12,
        deliveryHours: { uz: '2 soatda', ru: 'за 2 часа', en: 'in 2 hours' },
        nasiyaAvailable: true,
      },
    ],
  },
  {
    id: 'rice-lazer-25kg',
    sku: 'UZ-004',
    name: {
      uz: 'Guruch Xorazm Lazer Toza (25 kg)',
      ru: 'Рис Хорезм Лазер отборный (25 кг)',
      en: 'Khorezm Laser Premium Rice (25 kg)',
    },
    category: 'staples',
    categoryLabel: {
      uz: 'Asosiy oziq-ovqat',
      ru: 'Бакалея и сыпучие',
      en: 'Core Staples',
    },
    unit: { uz: '25 kg qop', ru: 'мешок 25 кг', en: '25 kg bag' },
    defaultQty: 6,
    aiRecommendedQty: 6,
    oldPaidPrice: 495000,
    avgMarketPrice: 468000,
    bestDirectPrice: 452000,
    bestGroupPrice: 432000,
    bestMarketName: {
      uz: "Qo'yliq Agro Ulgurji",
      ru: 'Рынок Куйлюк',
      en: 'Qoyliq Agro',
    },
    change7dPct: +0.6,
    forecast14dPct: +1.2,
    supplyBadge: {
      uz: 'Barqaror (+1.2%)',
      ru: 'Стабильно (+1.2%)',
      en: 'Stable (+1.2%)',
    },
    aiInsight: {
      uz: "Yangi hosil guruch bozorga to'liq chiqqan. Qo'yliq ulgurji qatorida guruh narxi 432,000 so'm (har qopda 63,000 so'm tejaladi).",
      ru: 'Новый урожай полностью поступил на рынок. На оптовых рядах Куйлюка групповая цена — 432 000 сум (экономия 63 000 сум с мешка).',
      en: 'New harvest rice is fully stocked at Qoyliq Agro. Group price locks 432,000 UZS/bag, saving 63,000 UZS per bag.',
    },
    aiAction: 'buy_normal',
    history30d: [462000, 463000, 464000, 465000, 464000, 466000, 465000, 467000, 467000, 468000],
    forecast14d: [469000, 470000, 471000, 472000, 473000],
    marketPrices: [
      {
        marketId: 'qoyliq',
        marketName: { uz: "Qo'yliq Agro Ulgurji", ru: 'Рынок Куйлюк', en: 'Qoyliq Agro' },
        district: { uz: 'Bektemir', ru: 'Бектемир', en: 'Bektemir' },
        price: 452000,
        minOrderQty: 4,
        verifiedCount: 88,
        updatedMinutesAgo: 7,
      },
      {
        marketId: 'chorsu',
        marketName: { uz: 'Eskijuva (Chorsu)', ru: 'Рынок Чорсу', en: 'Chorsu Market' },
        district: { uz: 'Shayxontohur', ru: 'Шайхантахур', en: 'Shaykhantakhur' },
        price: 458000,
        minOrderQty: 3,
        verifiedCount: 62,
        updatedMinutesAgo: 10,
      },
      {
        marketId: 'orikzor',
        marketName: { uz: "O'rikzor Ulgurji Bozori", ru: 'Рынок Урикзар', en: 'Orikzor Market' },
        district: { uz: 'Uchtepa', ru: 'Учтепа', en: 'Uchtepa' },
        price: 465000,
        minOrderQty: 4,
        verifiedCount: 54,
        updatedMinutesAgo: 12,
      },
    ],
    suppliers: [
      {
        id: 'sup-r1',
        supplierName: 'Gurlan Guruch Klaster #12',
        marketName: { uz: "Qo'yliq Agro Ulgurji", ru: 'Рынок Куйлюк', en: 'Qoyliq Agro' },
        rating: 4.9,
        reviewsCount: 275,
        verified: true,
        depositGuaranteeUzs: 12000000,
        price: 452000,
        groupTierPrice: 432000,
        moq: 4,
        deliveryHours: { uz: '3 soatda', ru: 'за 3 часа', en: 'in 3 hours' },
        nasiyaAvailable: true,
      },
    ],
  },
  {
    id: 'potato-30kg',
    sku: 'UZ-005',
    name: {
      uz: 'Kartoshka Samarqand yirik (30 kg)',
      ru: 'Картофель Самарканд крупный (30 кг)',
      en: 'Fresh Large Potatoes Samarkand (30 kg)',
    },
    category: 'produce',
    categoryLabel: {
      uz: 'Sabzavot va meva',
      ru: 'Овощи и фрукты',
      en: 'Fresh Produce',
    },
    unit: { uz: '30 kg qop', ru: 'сетка 30 кг', en: '30 kg bag' },
    defaultQty: 15,
    aiRecommendedQty: 18,
    oldPaidPrice: 138000,
    avgMarketPrice: 126000,
    bestDirectPrice: 118000,
    bestGroupPrice: 111000,
    bestMarketName: {
      uz: "Qo'yliq Agro Ulgurji",
      ru: 'Рынок Куйлюк',
      en: 'Qoyliq Agro',
    },
    change7dPct: +3.4,
    forecast14dPct: +7.8,
    supplyBadge: {
      uz: 'Sovuq mavsum (+7.8%)',
      ru: 'Похолодание (+7.8%)',
      en: 'Cold Snap (+7.8%)',
    },
    aiInsight: {
      uz: "Sovuq tushishi sababli ombor saqlash xarajati oshadi (+7.8% prognoz). Qo'yliq ulgurji qatoridan 111,000 so'mdan 18 qop olish tavsiya etiladi.",
      ru: 'С похолоданием расходы на хранение вырастут (+7.8%). Рекомендуем закупить 18 сеток по 111 000 сум с оптового ряда Куйлюка.',
      en: 'Cold weather will raise storage costs by +7.8%. Stock 18 bags at 111,000 UZS from Qoyliq Agro today.',
    },
    aiAction: 'buy_more_now',
    history30d: [115000, 116000, 118000, 119000, 120000, 121000, 122000, 123000, 125000, 126000],
    forecast14d: [128000, 130000, 132000, 134000, 136000],
    marketPrices: [
      {
        marketId: 'qoyliq',
        marketName: { uz: "Qo'yliq Agro Ulgurji", ru: 'Рынок Куйлюк', en: 'Qoyliq Agro' },
        district: { uz: 'Bektemir', ru: 'Бектемир', en: 'Bektemir' },
        price: 118000,
        minOrderQty: 10,
        verifiedCount: 134,
        updatedMinutesAgo: 5,
      },
      {
        marketId: 'orikzor',
        marketName: { uz: "O'rikzor Ulgurji Bozori", ru: 'Рынок Урикзар', en: 'Orikzor Market' },
        district: { uz: 'Uchtepa', ru: 'Учтепа', en: 'Uchtepa' },
        price: 124000,
        minOrderQty: 5,
        verifiedCount: 59,
        updatedMinutesAgo: 14,
      },
    ],
    suppliers: [
      {
        id: 'sup-p1',
        supplierName: 'Bulungʻur Agro Klaster',
        marketName: { uz: "Qo'yliq Agro Ulgurji", ru: 'Рынок Куйлюк', en: 'Qoyliq Agro' },
        rating: 4.8,
        reviewsCount: 340,
        verified: true,
        depositGuaranteeUzs: 10000000,
        price: 118000,
        groupTierPrice: 111000,
        moq: 10,
        deliveryHours: { uz: '3 soatda', ru: 'за 3 часа', en: 'in 3 hours' },
        nasiyaAvailable: true,
      },
    ],
  },
  {
    id: 'eggs-360',
    sku: 'UZ-006',
    name: {
      uz: 'Tuxum parhez yirik D0 (360 dona korobka)',
      ru: 'Яйцо отборное D0 (коробка 360 шт)',
      en: 'Fresh Large Eggs Grade D0 (360-egg case)',
    },
    category: 'dairy_meat',
    categoryLabel: {
      uz: 'Sut, tuxum va goʻsht',
      ru: 'Молочные, яйцо и мясо',
      en: 'Dairy, Eggs & Meat',
    },
    unit: { uz: '360 dona korobka', ru: 'коробка 360 шт', en: '360-egg case' },
    defaultQty: 6,
    aiRecommendedQty: 7,
    oldPaidPrice: 468000,
    avgMarketPrice: 442000,
    bestDirectPrice: 428000,
    bestGroupPrice: 410000,
    bestMarketName: {
      uz: 'Sergeli Vagon-Ombor',
      ru: 'Склады Сергели',
      en: 'Sergeli Rail Depot',
    },
    change7dPct: +2.1,
    forecast14dPct: +5.2,
    supplyBadge: {
      uz: 'Mavsumiy oʻsish (+5.2%)',
      ru: 'Сезонный рост (+5.2%)',
      en: 'Seasonal Rise (+5.2%)',
    },
    aiInsight: {
      uz: "Kuz-qish mavsumida parranda ozuqasi va isitish xarajati sababli ulgurji narx o'smoqda. Yangiyo'l parranda dileridan 410,000 so'mda olish foydali.",
      ru: 'В осенне-зимний период оптовая цена растет на +5.2%. Выгодно заказать напрямую от дилера птицефабрики по 410 000 сум.',
      en: 'Seasonal poultry heating costs are lifting egg prices +5.2%. Order via factory group pool at 410,000 UZS/case.',
    },
    aiAction: 'buy_more_now',
    history30d: [420000, 422000, 425000, 426000, 429000, 432000, 435000, 437000, 440000, 442000],
    forecast14d: [446000, 451000, 456000, 461000, 465000],
    marketPrices: [
      {
        marketId: 'sergeli',
        marketName: { uz: 'Sergeli Vagon-Ombor', ru: 'Склады Сергели', en: 'Sergeli Rail Depot' },
        district: { uz: 'Sergeli', ru: 'Сергели', en: 'Sergeli' },
        price: 428000,
        minOrderQty: 5,
        verifiedCount: 79,
        updatedMinutesAgo: 6,
      },
      {
        marketId: 'qoyliq',
        marketName: { uz: "Qo'yliq Agro Ulgurji", ru: 'Рынок Куйлюк', en: 'Qoyliq Agro' },
        district: { uz: 'Bektemir', ru: 'Бектемир', en: 'Bektemir' },
        price: 434000,
        minOrderQty: 3,
        verifiedCount: 91,
        updatedMinutesAgo: 9,
      },
    ],
    suppliers: [
      {
        id: 'sup-e1',
        supplierName: 'Yangiyoʻl Parranda Zavod Dileri',
        marketName: { uz: 'Sergeli Vagon-Ombor', ru: 'Склады Сергели', en: 'Sergeli Rail Depot' },
        rating: 4.9,
        reviewsCount: 412,
        verified: true,
        depositGuaranteeUzs: 15000000,
        price: 428000,
        groupTierPrice: 410000,
        moq: 5,
        deliveryHours: { uz: '2 soatda', ru: 'за 2 часа', en: 'in 2 hours' },
        nasiyaAvailable: true,
      },
    ],
  },
  {
    id: 'tea-green-10kg',
    sku: 'UZ-007',
    name: {
      uz: "Ko'k choy '95 Oliy nav' (10 kg yashik)",
      ru: 'Чай зеленый «95 Высший сорт» (ящик 10 кг)',
      en: "Green Tea '95 Imperial' (10 kg crate)",
    },
    category: 'beverages',
    categoryLabel: {
      uz: 'Choy va ichimliklar',
      ru: 'Чай и напитки',
      en: 'Tea & Beverages',
    },
    unit: { uz: '10 kg yashik', ru: 'ящик 10 кг', en: '10 kg crate' },
    defaultQty: 4,
    aiRecommendedQty: 5,
    oldPaidPrice: 540000,
    avgMarketPrice: 505000,
    bestDirectPrice: 488000,
    bestGroupPrice: 465000,
    bestMarketName: {
      uz: "O'rikzor Ulgurji Bozori",
      ru: 'Рынок Урикзар',
      en: 'Orikzor Market',
    },
    change7dPct: +1.4,
    forecast14dPct: +3.6,
    supplyBadge: {
      uz: 'Talab +3.6%',
      ru: 'Спрос +3.6%',
      en: 'Demand +3.6%',
    },
    aiInsight: {
      uz: "Salqin mavsumda choy savdosi 22% ga oshadi. O'rikzor choy qatoridan guruh narxida 465,000 so'mdan olish tavsiya etiladi.",
      ru: 'В прохладный сезон продажи чая растут на 22%. Рекомендуем заказать по групповой цене 465 000 сум с чайного ряда Урикзара.',
      en: 'Tea sales climb 22% in cooler weather. Lock in 465,000 UZS/crate via Orikzor group order.',
    },
    aiAction: 'buy_more_now',
    history30d: [492000, 494000, 495000, 497000, 498000, 500000, 501000, 503000, 504000, 505000],
    forecast14d: [509000, 513000, 517000, 520000, 523000],
    marketPrices: [
      {
        marketId: 'orikzor',
        marketName: { uz: "O'rikzor Ulgurji Bozori", ru: 'Рынок Урикзар', en: 'Orikzor Market' },
        district: { uz: 'Uchtepa', ru: 'Учтепа', en: 'Uchtepa' },
        price: 488000,
        minOrderQty: 3,
        verifiedCount: 68,
        updatedMinutesAgo: 11,
      },
    ],
    suppliers: [
      {
        id: 'sup-t1',
        supplierName: 'Sharq Choy Import Ombori',
        marketName: { uz: "O'rikzor Ulgurji Bozori", ru: 'Рынок Урикзар', en: 'Orikzor Market' },
        rating: 4.9,
        reviewsCount: 304,
        verified: true,
        depositGuaranteeUzs: 15000000,
        price: 488000,
        groupTierPrice: 465000,
        moq: 3,
        deliveryHours: { uz: '2 soatda', ru: 'за 2 часа', en: 'in 2 hours' },
        nasiyaAvailable: true,
      },
    ],
  },
  {
    id: 'milk-uht-12',
    sku: 'UZ-008',
    name: {
      uz: "Sut 'Musaffo / Lactel' 3.2% (12×1L blok)",
      ru: 'Молоко «Musaffo / Lactel» 3.2% (блок 12×1 л)',
      en: "UHT Milk 'Musaffo / Lactel' 3.2% (12×1L pack)",
    },
    category: 'dairy_meat',
    categoryLabel: {
      uz: 'Sut, tuxum va goʻsht',
      ru: 'Молочные, яйцо и мясо',
      en: 'Dairy, Eggs & Meat',
    },
    unit: { uz: '12×1L blok', ru: 'блок 12×1 л', en: '12×1L pack' },
    defaultQty: 15,
    aiRecommendedQty: 15,
    oldPaidPrice: 156000,
    avgMarketPrice: 144000,
    bestDirectPrice: 138000,
    bestGroupPrice: 131000,
    bestMarketName: {
      uz: "O'rikzor Ulgurji Bozori",
      ru: 'Рынок Урикзар',
      en: 'Orikzor Market',
    },
    change7dPct: +0.8,
    forecast14dPct: +1.5,
    supplyBadge: {
      uz: 'Barqaror yetkazish',
      ru: 'Стабильные поставки',
      en: 'Stable Supply',
    },
    aiInsight: {
      uz: "Rasmiy distribyutor guruh xaridida 131,000 so'm/blok (1 litr = 10,916 so'm) narx bermoqda.",
      ru: 'Официальный дистрибьютор дает цену 131 000 сум за блок (10 916 сум/л) при групповом заказе.',
      en: 'Direct distributor group rate is 131,000 UZS/pack (10,916 UZS/L).',
    },
    aiAction: 'buy_normal',
    history30d: [142000, 142000, 142500, 143000, 143000, 143500, 143500, 144000, 144000, 144000],
    forecast14d: [144500, 145000, 145500, 146000, 146200],
    marketPrices: [
      {
        marketId: 'orikzor',
        marketName: { uz: "O'rikzor Ulgurji Bozori", ru: 'Рынок Урикзар', en: 'Orikzor Market' },
        district: { uz: 'Uchtepa', ru: 'Учтепа', en: 'Uchtepa' },
        price: 138000,
        minOrderQty: 10,
        verifiedCount: 82,
        updatedMinutesAgo: 6,
      },
    ],
    suppliers: [
      {
        id: 'sup-m1',
        supplierName: 'Toshkent Sut Distribyutor',
        marketName: { uz: "O'rikzor Ulgurji Bozori", ru: 'Рынок Урикзар', en: 'Orikzor Market' },
        rating: 4.8,
        reviewsCount: 265,
        verified: true,
        depositGuaranteeUzs: 15000000,
        price: 138000,
        groupTierPrice: 131000,
        moq: 10,
        deliveryHours: { uz: '2 soatda', ru: 'за 2 часа', en: 'in 2 hours' },
        nasiyaAvailable: true,
      },
    ],
  },
  {
    id: 'pasta-10kg',
    sku: 'UZ-009',
    name: {
      uz: "Makaron 'Sultan / Makiz' (10 kg qop)",
      ru: 'Макароны «Sultan / Makiz» твердых сортов (10 кг)',
      en: "Durum Pasta 'Sultan / Makiz' (10 kg bag)",
    },
    category: 'staples',
    categoryLabel: {
      uz: 'Asosiy oziq-ovqat',
      ru: 'Бакалея и сыпучие',
      en: 'Core Staples',
    },
    unit: { uz: '10 kg qop', ru: 'мешок 10 кг', en: '10 kg bag' },
    defaultQty: 15,
    aiRecommendedQty: 15,
    oldPaidPrice: 108000,
    avgMarketPrice: 98000,
    bestDirectPrice: 93000,
    bestGroupPrice: 88000,
    bestMarketName: {
      uz: "O'rikzor Ulgurji Bozori",
      ru: 'Рынок Урикзар',
      en: 'Orikzor Market',
    },
    change7dPct: +0.5,
    forecast14dPct: +1.8,
    supplyBadge: {
      uz: 'Barqaror (+1.8%)',
      ru: 'Стабильно (+1.8%)',
      en: 'Stable (+1.8%)',
    },
    aiInsight: {
      uz: "O'rikzor ulgurji omborlarida zavod aksiyasi — guruh xaridida 88,000 so'm/qop.",
      ru: 'Заводская акция на складах Урикзара — 88 000 сум за мешок в групповом заказе.',
      en: 'Factory promotion at Orikzor depot locks 88,000 UZS/bag.',
    },
    aiAction: 'buy_normal',
    history30d: [96000, 96500, 96500, 97000, 97000, 97500, 97500, 98000, 98000, 98000],
    forecast14d: [98500, 99000, 99200, 99500, 99800],
    marketPrices: [
      {
        marketId: 'orikzor',
        marketName: { uz: "O'rikzor Ulgurji Bozori", ru: 'Рынок Урикзар', en: 'Orikzor Market' },
        district: { uz: 'Uchtepa', ru: 'Учтепа', en: 'Uchtepa' },
        price: 93000,
        minOrderQty: 10,
        verifiedCount: 74,
        updatedMinutesAgo: 10,
      },
    ],
    suppliers: [
      {
        id: 'sup-pa1',
        supplierName: "O'rikzor Agro Gold",
        marketName: { uz: "O'rikzor Ulgurji Bozori", ru: 'Рынок Урикзар', en: 'Orikzor Market' },
        rating: 4.8,
        reviewsCount: 428,
        verified: true,
        depositGuaranteeUzs: 10000000,
        price: 93000,
        groupTierPrice: 88000,
        moq: 10,
        deliveryHours: { uz: '2 soatda', ru: 'за 2 часа', en: 'in 2 hours' },
        nasiyaAvailable: true,
      },
    ],
  },
  {
    id: 'detergent-3kg-6',
    sku: 'UZ-010',
    name: {
      uz: 'Kir yuvish kukuni Avtomat 3kg (6 dona blok)',
      ru: 'Стиральный порошок Автомат 3 кг (блок 6 шт)',
      en: 'Laundry Detergent Automatic 3kg (6-pack)',
    },
    category: 'household',
    categoryLabel: {
      uz: 'Xoʻjalik mollari',
      ru: 'Бытовая химия',
      en: 'Household Goods',
    },
    unit: { uz: '6×3kg blok', ru: 'блок 6×3 кг', en: '6×3kg pack' },
    defaultQty: 6,
    aiRecommendedQty: 6,
    oldPaidPrice: 318000,
    avgMarketPrice: 292000,
    bestDirectPrice: 279000,
    bestGroupPrice: 264000,
    bestMarketName: {
      uz: 'Bek Baraka Ulgurji',
      ru: 'Бек Барака',
      en: 'Bek Baraka Wholesale',
    },
    change7dPct: +0.3,
    forecast14dPct: +0.7,
    supplyBadge: {
      uz: 'Zavod skladi',
      ru: 'Прямой склад',
      en: 'Direct Depot',
    },
    aiInsight: {
      uz: "Bek Baraka maishiy kimyo qatorida 6×3kg blok 264,000 so'm (har blokda 54,000 so'm tejaladi).",
      ru: 'В ряду бытовой химии Бек Барака блок 6×3 кг стоит 264 000 сум (экономия 54 000 сум с блока).',
      en: 'Bek Baraka Household Row offers 6×3kg packs at 264,000 UZS, saving 54,000 UZS per pack.',
    },
    aiAction: 'buy_normal',
    history30d: [290000, 290000, 291000, 291000, 291000, 291500, 291500, 292000, 292000, 292000],
    forecast14d: [292500, 293000, 293000, 293500, 294000],
    marketPrices: [
      {
        marketId: 'bekbaraka',
        marketName: { uz: 'Bek Baraka Ulgurji', ru: 'Бек Барака', en: 'Bek Baraka Wholesale' },
        district: { uz: 'Chilonzor', ru: 'Чиланзар', en: 'Chilonzor' },
        price: 279000,
        minOrderQty: 4,
        verifiedCount: 77,
        updatedMinutesAgo: 8,
      },
    ],
    suppliers: [
      {
        id: 'sup-d1',
        supplierName: 'Bek Baraka Kimyo-Savdo #44',
        marketName: { uz: 'Bek Baraka Ulgurji', ru: 'Бек Барака', en: 'Bek Baraka Wholesale' },
        rating: 4.8,
        reviewsCount: 289,
        verified: true,
        depositGuaranteeUzs: 12000000,
        price: 279000,
        groupTierPrice: 264000,
        moq: 4,
        deliveryHours: { uz: '3 soatda', ru: 'за 3 часа', en: 'in 3 hours' },
        nasiyaAvailable: true,
      },
    ],
  },
];

export const INITIAL_GROUP_POOLS: GroupOrderPool[] = [
  {
    id: 'pool-chilonzor-1',
    title: {
      uz: 'Chilonzor 9-10 kvartal: Haftalik Oziq-Ovqat Guruh Reysi',
      ru: 'Чиланзар 9-10 квартал: Еженедельная совместная закупка',
      en: 'Chilonzor Blocks 9-10: Weekly Grocery Group Order',
    },
    district: { uz: 'Chilonzor tumani', ru: 'Чиланзарский район', en: 'Chilonzor District' },
    radiusKm: 1.8,
    productId: 'sugar-50kg',
    productName: {
      uz: 'Shakar Xorazm 50kg + Asosiy savat',
      ru: 'Сахар Хорезм 50 кг + Базовая корзина',
      en: 'Khorezm Sugar 50kg + Core Basket',
    },
    unit: { uz: 'qop', ru: 'мешок', en: 'bag' },
    regularPrice: 645000,
    groupPrice: 579000,
    discountPct: 10.2,
    currentQty: 86,
    targetQty: 100,
    participantsCount: 7,
    expiresInHours: 3,
    supplierName: "Sergeli Shakar-Don Vagon MChJ",
    shopsJoined: [
      { name: 'Nur Minimarket (Chilonzor-9)', qty: 22, distanceKm: 0.3 },
      { name: 'Fayz Baraka Savdo (Qatortol)', qty: 24, distanceKm: 0.7 },
      { name: 'Ideal Oziq-Ovqat (Chilonzor-10)', qty: 20, distanceKm: 0.9 },
      { name: 'Novza Oilaviy Market (Chilonzor-7)', qty: 20, distanceKm: 1.4 },
    ],
  },
  {
    id: 'pool-yunusobod-2',
    title: {
      uz: "Yunusobod 11-14 mavze: Qozog'iston 'Elita' Un Vagon Xaridi",
      ru: 'Юнусабад 11-14 квартал: Вагонная закупка муки «Элита»',
      en: "Yunusobod Blocks 11-14: Kazakh 'Elita' Flour Railcar Pool",
    },
    district: { uz: 'Yunusobod tumani', ru: 'Юнусабадский район', en: 'Yunusobod District' },
    radiusKm: 2.1,
    productId: 'flour-50kg',
    productName: {
      uz: "Un Qozog'iston 'Elita' 1-nav (50 kg)",
      ru: 'Мука Казахстан «Элита» 1-сорт (50 кг)',
      en: "Kazakh Flour 'Elita' Grade 1 (50 kg)",
    },
    unit: { uz: 'qop', ru: 'мешок', en: 'bag' },
    regularPrice: 342000,
    groupPrice: 298000,
    discountPct: 12.8,
    currentQty: 110,
    targetQty: 120,
    participantsCount: 9,
    expiresInHours: 2,
    supplierName: 'Astana-Toshkent Grain Express',
    shopsJoined: [
      { name: 'Yunusobod Nonvoyxonasi #4', qty: 40, distanceKm: 0.4 },
      { name: 'Mega Savdo Minimarket', qty: 35, distanceKm: 0.6 },
      { name: 'Chinobod Oziq-Ovqat', qty: 35, distanceKm: 1.2 },
    ],
  },
  {
    id: 'pool-sergeli-3',
    title: {
      uz: "Sergeli Yangi Hayot: Qo'yliq Kartoshka va Piyoz To'g'ridan-To'g'ri Fura",
      ru: 'Сергели Янги Хаёт: Прямая фура картофеля и лука с Куйлюка',
      en: 'Sergeli Yangi Hayot: Direct Farm Truck Potato Pool',
    },
    district: { uz: 'Sergeli tumani', ru: 'Сергелийский район', en: 'Sergeli District' },
    radiusKm: 2.4,
    productId: 'potato-30kg',
    productName: {
      uz: 'Kartoshka Samarqand yirik (30 kg)',
      ru: 'Картофель Самарканд крупный (30 кг)',
      en: 'Samarkand Large Potatoes (30 kg)',
    },
    unit: { uz: 'qop', ru: 'сетка', en: 'bag' },
    regularPrice: 138000,
    groupPrice: 111000,
    discountPct: 19.5,
    currentQty: 145,
    targetQty: 180,
    participantsCount: 11,
    expiresInHours: 5,
    supplierName: 'Bulungʻur Agro Klaster',
    shopsJoined: [
      { name: 'Yangi Hayot Dehqon Burchagi', qty: 55, distanceKm: 0.5 },
      { name: 'Sergeli-5 Minimarket', qty: 50, distanceKm: 0.8 },
      { name: 'Fayz Oshxonasi & Doʻkoni', qty: 40, distanceKm: 1.3 },
    ],
  },
];

export const SAMPLE_RECEIPT_SCANS: SampleReceiptScan[] = [
  {
    id: 'scan-orikzor-nakladnoy',
    title: {
      uz: "O'rikzor qo'lyozma nakladnoy #418",
      ru: 'Рукописная накладная с Урикзара №418',
      en: 'Orikzor Handwritten Invoice #418',
    },
    sourceType: 'handwritten_nakladnoy',
    bazaarName: {
      uz: "O'rikzor Ulgurji Bozori (4-qator, 18-ombor)",
      ru: 'Оптовый рынок Урикзар (ряд 4, склад 18)',
      en: 'Orikzor Wholesale Market (Row 4, Depot 18)',
    },
    sellerName: "O'rikzor Agro Gold MChJ",
    rawTextPreview: `НАКЛАДНАЯ № 418 от 31.10.2026
Рынок: Урикзар оптовый, ряд 4, склад 18
Покупатель: Baraka Minimarket (Чиланзар-9)
1. Шакар Хоразм олий 50кг × 10 = 610,000 сум
2. Ун Козогистон Элита 50кг × 12 = 316,000 сум
3. Ёг Олтин Дала 5л × 12 = 80,000 сум
ИТОГО: 10,852,000 сум. Оплачено.`,
    extractedItems: [
      {
        productId: 'sugar-50kg',
        productName: {
          uz: 'Shakar Xorazm Oliy nav (50 kg)',
          ru: 'Сахар Хорезм высший сорт (50 кг)',
          en: 'White Sugar Khorezm (50 kg)',
        },
        unit: { uz: '50 kg qop', ru: 'мешок 50 кг', en: '50 kg bag' },
        extractedPrice: 610000,
        marketMedianPrice: 612000,
        deviationPct: -0.3,
        zScore: -0.18,
        status: 'verified',
        statusNote: {
          uz: "Tasdiqlandi: O'rikzor o'rtacha narxiga mos",
          ru: 'Подтверждено: соответствует рыночной медиане Урикзара',
          en: 'Verified: Matches Orikzor market median',
        },
      },
      {
        productId: 'flour-50kg',
        productName: {
          uz: "Un Qozog'iston 'Elita' (50 kg)",
          ru: 'Мука Казахстан «Элита» (50 кг)',
          en: "Kazakh Flour 'Elita' (50 kg)",
        },
        unit: { uz: '50 kg qop', ru: 'мешок 50 кг', en: '50 kg bag' },
        extractedPrice: 316000,
        marketMedianPrice: 318000,
        deviationPct: -0.6,
        zScore: -0.31,
        status: 'verified',
        statusNote: {
          uz: 'Tasdiqlandi: Normal ulgurji diapazon',
          ru: 'Подтверждено: в пределах оптового диапазона',
          en: 'Verified: Within normal wholesale band',
        },
      },
    ],
    cashbackRewardUzs: 4000,
  },
  {
    id: 'scan-qoyliq-fiscal',
    title: {
      uz: "Qo'yliq Agro Soliq.uz Fiskal QR-Chek #99201",
      ru: 'Фискальный QR-чек Soliq.uz с Куйлюка №99201',
      en: 'Qoyliq Agro Fiscal QR Receipt #99201',
    },
    sourceType: 'fiscal_qr',
    bazaarName: {
      uz: "Qo'yliq Agro Ulgurji Bozori",
      ru: 'Агро-оптовый рынок Куйлюк',
      en: 'Qoyliq Agro Wholesale Market',
    },
    sellerName: 'Bulungʻur Agro Klaster MChJ',
    rawTextPreview: `SOLIQ.UZ FISKAL CHEK #99201
Sotuvchi: Bulung'ur Agro Klaster MChJ
1. Kartoshka Samarqand 30kg × 18 = 116,000 so'm
2. Guruch Xorazm Lazer 25kg × 6 = 450,000 so'm
Fiskal belgi: 884920194812 (Tasdiqlangan)`,
    extractedItems: [
      {
        productId: 'potato-30kg',
        productName: {
          uz: 'Kartoshka Samarqand yirik (30 kg)',
          ru: 'Картофель Самарканд крупный (30 кг)',
          en: 'Samarkand Large Potatoes (30 kg)',
        },
        unit: { uz: '30 kg qop', ru: 'сетка 30 кг', en: '30 kg bag' },
        extractedPrice: 116000,
        marketMedianPrice: 118000,
        deviationPct: -1.7,
        zScore: -0.62,
        status: 'verified',
        statusNote: {
          uz: 'Fiskal QR orqali 100% tasdiqlandi',
          ru: '100% подтверждено через фискальный QR',
          en: '100% Fiscal QR Verified',
        },
      },
      {
        productId: 'rice-lazer-25kg',
        productName: {
          uz: 'Guruch Xorazm Lazer (25 kg)',
          ru: 'Рис Хорезм Лазер (25 кг)',
          en: 'Khorezm Laser Rice (25 kg)',
        },
        unit: { uz: '25 kg qop', ru: 'мешок 25 кг', en: '25 kg bag' },
        extractedPrice: 450000,
        marketMedianPrice: 452000,
        deviationPct: -0.4,
        zScore: -0.21,
        status: 'verified',
        statusNote: {
          uz: 'Fiskal QR orqali tasdiqlandi',
          ru: 'Подтверждено фискальным чеком',
          en: 'Fiscal QR Verified',
        },
      },
    ],
    cashbackRewardUzs: 4000,
  },
  {
    id: 'scan-fake-bait-test',
    title: {
      uz: "Shubhali 'Primanka' E'lon Tekshiruvi (Anti-Fraud Filtr)",
      ru: 'Проверка фейковой «приманки» (Антифрод-фильтр)',
      en: 'Suspicious Bait-Price Check (Anti-Fraud Shield)',
    },
    sourceType: 'fake_bait_test',
    bazaarName: {
      uz: 'Nomaʼlum Telegram eʼloni',
      ru: 'Неизвестный Telegram-канал',
      en: 'Unverified Telegram Post',
    },
    sellerName: 'Tasdiqlanmagan sotuvchi',
    rawTextPreview: `SHOSHILING AKSIYA!
Shakar Xorazm 50 kg — 445,000 so'm! (Bozorda 612,000 so'm)
Qozog'iston Elita un 50 kg — 210,000 so'm!
Oldindan 50% karta raqamga o'tkazing.`,
    extractedItems: [
      {
        productId: 'sugar-50kg',
        productName: {
          uz: 'Shakar Xorazm Oliy nav (50 kg)',
          ru: 'Сахар Хорезм высший сорт (50 кг)',
          en: 'White Sugar Khorezm (50 kg)',
        },
        unit: { uz: '50 kg qop', ru: 'мешок 50 кг', en: '50 kg bag' },
        extractedPrice: 445000,
        marketMedianPrice: 612000,
        deviationPct: -27.3,
        zScore: -4.85,
        status: 'blocked_fake',
        statusNote: {
          uz: "Bloklandi: Bozor narxidan 27.3% past! Aldov ('primanka') e'lon.",
          ru: 'Заблокировано: на 27.3% ниже рынка! Обнаружена ценовая приманка.',
          en: 'Blocked: 27.3% below market floor! Flagged as bait scam.',
        },
      },
    ],
    cashbackRewardUzs: 0,
  },
];
