import React, { useState, useMemo } from 'react';
import {
  Search,
  TrendingUp,
  TrendingDown,
  MapPin,
  Bell,
  Sparkles,
  CheckCircle2,
  BarChart3,
  ShoppingCart,
} from 'lucide-react';
import { ProductItem, Language } from '../data/marketData';

interface LivePriceBoardSectionProps {
  products: ProductItem[];
  lang: Language;
  selectedProduct: ProductItem;
  onSelectProduct: (p: ProductItem) => void;
  onCreateAlert: (productId: string, productName: string, targetPrice: number) => void;
  onOpenSmartCart: () => void;
}

const UI_TEXT = {
  searchPlaceholder: {
    uz: "Mahsulot nomini yozing (masalan: Shakar, Un, Yog', Kartoshka)...",
    ru: 'Поиск товара (например: Сахар, Мука, Масло, Картофель)...',
    en: 'Search commodity (e.g., Sugar, Flour, Oil, Potatoes)...',
  },
  categories: {
    all: { uz: 'Barchasi', ru: 'Все товары', en: 'All Items' },
    staples: { uz: 'Asosiy oziq-ovqat', ru: 'Бакалея', en: 'Staples' },
    produce: { uz: 'Sabzavotlar', ru: 'Овощи', en: 'Produce' },
    dairy_meat: { uz: 'Sut va Tuxum', ru: 'Молочные и яйцо', en: 'Dairy & Eggs' },
    beverages: { uz: 'Choy va Ichimlik', ru: 'Чай и напитки', en: 'Beverages' },
    household: { uz: 'Xoʻjalik mollari', ru: 'Бытовая химия', en: 'Household' },
  },
  boardTitle: {
    uz: 'Toshkent Ulgurji Bozorlari Narxlar Jadvali',
    ru: 'Оптовые цены рынков Ташкента',
    en: 'Tashkent Wholesale Market Prices',
  },
  boardSub: {
    uz: "Batafsil narx tarixi va AI prognozini ko'rish uchun mahsulotni tanlang",
    ru: 'Выберите товар для просмотра динамики цен и AI-прогноза',
    en: 'Select any item to view price history and 14-day AI forecast',
  },
  colProduct: { uz: 'Mahsulot', ru: 'Товар', en: 'Product' },
  colAvg: { uz: 'Oʻrtacha narx', ru: 'Средняя цена', en: 'Market Avg' },
  colBestGroup: { uz: 'Guruh narxi', ru: 'Групповая цена', en: 'Group Price' },
  colForecast: { uz: '14 kun prognoz', ru: 'Прогноз 14 дн.', en: '14d Forecast' },
  directLabel: { uz: 'Yakkalik:', ru: 'Опт:', en: 'Direct:' },
  aiTitle: {
    uz: '14 kunlik AI prognoz va tavsiya',
    ru: 'AI-прогноз на 14 дней и рекомендация',
    en: '14-Day AI Forecast & Recommendation',
  },
  chartTitle: {
    uz: '30 kunlik tarix va 14 kunlik prognoz',
    ru: 'История за 30 дней и прогноз на 14 дней',
    en: '30-Day History & 14-Day Forecast',
  },
  todayLabel: { uz: 'Bugun', ru: 'Сегодня', en: 'Today' },
  forecastLabel: { uz: '+14 kun', ru: '+14 дней', en: '+14 days' },
  bazaarComparison: {
    uz: 'Bozorlar boʻyicha narxlar',
    ru: 'Сравнение цен по рынкам',
    en: 'Prices Across Markets',
  },
  cheapestBadge: { uz: 'Eng arzon', ru: 'Лучшая цена', en: 'Lowest' },
  checksVerified: { uz: 'ta chek', ru: 'чеков', en: 'receipts' },
  minAgo: { uz: 'daq. oldin', ru: 'мин. назад', en: 'min ago' },
  alertTitle: {
    uz: 'Narx tushganda Telegram orqali xabar olish',
    ru: 'Уведомление в Telegram при снижении цены',
    en: 'Telegram Alert on Price Drop',
  },
  alertBtn: { uz: 'Saqlash', ru: 'Сохранить', en: 'Set Alert' },
  alertSaved: {
    uz: 'Signal yoqildi! Narx tushishi bilan xabar yuboriladi.',
    ru: 'Уведомление активно! Мы сообщим о снижении цены.',
    en: 'Alert saved! You will be notified when the price drops.',
  },
  orderInCartBtn: {
    uz: 'Xarid savatiga oʻtish va buyurtma berish',
    ru: 'Перейти в корзину для заказа',
    en: 'Open in Smart Cart & Order',
  },
};

export const LivePriceBoardSection: React.FC<LivePriceBoardSectionProps> = ({
  products,
  lang,
  selectedProduct,
  onSelectProduct,
  onCreateAlert,
  onOpenSmartCart,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [alertPriceInput, setAlertPriceInput] = useState<string>('');
  const [alertCreatedToast, setAlertCreatedToast] = useState<boolean>(false);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        p.name.uz.toLowerCase().includes(q) ||
        p.name.ru.toLowerCase().includes(q) ||
        p.name.en.toLowerCase().includes(q) ||
        p.bestMarketName[lang].toLowerCase().includes(q);
      const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, categoryFilter, lang]);

  const handleSetAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const target = Number(alertPriceInput) || Math.round(selectedProduct.bestDirectPrice * 0.97);
    onCreateAlert(selectedProduct.id, selectedProduct.name[lang], target);
    setAlertCreatedToast(true);
    setTimeout(() => setAlertCreatedToast(false), 3500);
  };

  const chartPoints = useMemo(() => {
    const all = [...selectedProduct.history30d, ...selectedProduct.forecast14d];
    const min = Math.min(...all) * 0.985;
    const max = Math.max(...all) * 1.015;
    const width = 540;
    const height = 160;

    const toCoords = (val: number, idx: number) => {
      const x = (idx / (all.length - 1)) * (width - 44) + 22;
      const y = height - 24 - ((val - min) / (max - min || 1)) * (height - 48);
      return { x, y, val, isForecast: idx >= selectedProduct.history30d.length };
    };

    const coords = all.map(toCoords);
    const histCoords = coords.slice(0, selectedProduct.history30d.length);
    const foreCoords = coords.slice(selectedProduct.history30d.length - 1);

    const histPath = histCoords
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(' ');
    const forePath = foreCoords
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(' ');

    return { coords, histPath, forePath, width, height };
  }, [selectedProduct]);

  return (
    <div className="space-y-6">
      {/* Clean Search & Filter Bar */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={UI_TEXT.searchPlaceholder[lang]}
            className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            ['all', 'staples', 'produce', 'dairy_meat', 'beverages', 'household'] as const
          ).map((catKey) => (
            <button
              key={catKey}
              onClick={() => setCategoryFilter(catKey)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                categoryFilter === catKey
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {UI_TEXT.categories[catKey][lang]}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Clean Wholesale Price List */}
        <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">{UI_TEXT.boardTitle[lang]}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{UI_TEXT.boardSub[lang]}</p>
            </div>
            <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg">
              {filteredProducts.length} SKU
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase text-slate-500">
                  <th className="py-3 px-4">{UI_TEXT.colProduct[lang]}</th>
                  <th className="py-3 px-3">{UI_TEXT.colAvg[lang]}</th>
                  <th className="py-3 px-3">{UI_TEXT.colBestGroup[lang]}</th>
                  <th className="py-3 px-4">{UI_TEXT.colForecast[lang]}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((item) => {
                  const isSelected = selectedProduct.id === item.id;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectProduct(item)}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? 'bg-teal-50/60 border-l-4 border-l-teal-600'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 text-sm">
                          {item.name[lang]}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <span className="text-teal-700 font-medium">
                            {item.bestMarketName[lang]}
                          </span>
                          <span>·</span>
                          <span>{item.unit[lang]}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-500">
                        {item.avgMarketPrice.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-mono font-bold text-teal-700 text-sm">
                          {item.bestGroupPrice.toLocaleString()} UZS
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {UI_TEXT.directLabel[lang]} {item.bestDirectPrice.toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            item.forecast14dPct > 2
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : item.forecast14dPct < -1
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.forecast14dPct > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : item.forecast14dPct < 0 ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : null}
                          {item.forecast14dPct > 0
                            ? `+${item.forecast14dPct}%`
                            : `${item.forecast14dPct}%`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 5 Cols: Selected Product Details & Forecast Chart */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl bg-white border border-slate-200/80 p-5 space-y-5 shadow-xs">
            {/* Title & Price */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-medium text-teal-700">
                  {selectedProduct.categoryLabel[lang]} · {selectedProduct.unit[lang]}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {selectedProduct.name[lang]}
                </h3>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-mono font-bold text-teal-700">
                  {selectedProduct.bestGroupPrice.toLocaleString()} UZS
                </div>
                <div className="text-[11px] text-slate-400">
                  {selectedProduct.supplyBadge[lang]}
                </div>
              </div>
            </div>

            {/* AI Insight Callout */}
            <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-3.5 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  {UI_TEXT.aiTitle[lang]}
                </span>
                <span className="font-mono">
                  {selectedProduct.forecast14dPct > 0
                    ? `+${selectedProduct.forecast14dPct}%`
                    : `${selectedProduct.forecast14dPct}%`}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {selectedProduct.aiInsight[lang]}
              </p>
            </div>

            {/* Clean Light SVG Chart */}
            <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-teal-600" />
                  {UI_TEXT.chartTitle[lang]}
                </span>
              </div>

              <svg
                viewBox={`0 0 ${chartPoints.width} ${chartPoints.height}`}
                className="w-full h-36 overflow-visible"
              >
                {[0.25, 0.55, 0.85].map((ratio, idx) => (
                  <line
                    key={idx}
                    x1={20}
                    x2={chartPoints.width - 20}
                    y1={chartPoints.height * ratio}
                    y2={chartPoints.height * ratio}
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                  />
                ))}

                <path
                  d={chartPoints.histPath}
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />

                <path
                  d={chartPoints.forePath}
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="2.8"
                  strokeDasharray="5 4"
                  strokeLinecap="round"
                />

                {chartPoints.coords.map((pt, idx) => (
                  <g key={idx}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={
                        idx === selectedProduct.history30d.length - 1 ||
                        idx === chartPoints.coords.length - 1
                          ? 4.5
                          : 2.5
                      }
                      fill={pt.isForecast ? '#d97706' : '#0d9488'}
                    />
                    {(idx === 0 ||
                      idx === selectedProduct.history30d.length - 1 ||
                      idx === chartPoints.coords.length - 1) && (
                      <text
                        x={pt.x}
                        y={pt.y - 8}
                        textAnchor={
                          idx === 0
                            ? 'start'
                            : idx === chartPoints.coords.length - 1
                            ? 'end'
                            : 'middle'
                        }
                        className="fill-slate-700 text-[10px] font-mono font-bold"
                      >
                        {(pt.val / 1000).toFixed(0)}k
                      </text>
                    )}
                  </g>
                ))}
              </svg>

              <div className="flex justify-between text-[11px] text-slate-400 px-2">
                <span>-30d</span>
                <span className="text-teal-700 font-semibold">{UI_TEXT.todayLabel[lang]}</span>
                <span className="text-amber-700 font-semibold">{UI_TEXT.forecastLabel[lang]}</span>
              </div>
            </div>

            {/* Market Price Breakdown */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700">
                {UI_TEXT.bazaarComparison[lang]}
              </div>
              <div className="space-y-1.5">
                {selectedProduct.marketPrices.map((mp, idx) => (
                  <div
                    key={mp.marketId}
                    className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs border ${
                      idx === 0
                        ? 'bg-teal-50/60 border-teal-200 text-slate-900'
                        : 'bg-slate-50/70 border-slate-200/60 text-slate-600'
                    }`}
                  >
                    <div>
                      <div className="font-semibold flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-teal-600" />
                        <span>{mp.marketName[lang]}</span>
                        {idx === 0 && (
                          <span className="rounded-md bg-teal-600 text-white px-1.5 py-0.5 text-[10px] font-bold">
                            {UI_TEXT.cheapestBadge[lang]}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 ml-5">
                        {mp.verifiedCount} {UI_TEXT.checksVerified[lang]} · {mp.updatedMinutesAgo}{' '}
                        {UI_TEXT.minAgo[lang]}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-slate-900">
                      {mp.price.toLocaleString()} UZS
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Alert Form */}
            <form
              onSubmit={handleSetAlert}
              className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-2"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Bell className="w-3.5 h-3.5 text-teal-600" />
                <span>{UI_TEXT.alertTitle[lang]}</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={alertPriceInput}
                  onChange={(e) => setAlertPriceInput(e.target.value)}
                  placeholder={`${Math.round(selectedProduct.bestDirectPrice * 0.97)} UZS`}
                  className="flex-1 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-teal-600"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-white transition cursor-pointer"
                >
                  {UI_TEXT.alertBtn[lang]}
                </button>
              </div>
              {alertCreatedToast && (
                <div className="flex items-center gap-1.5 text-[11px] text-teal-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{UI_TEXT.alertSaved[lang]}</span>
                </div>
              )}
            </form>

            {/* Primary CTA */}
            <button
              onClick={onOpenSmartCart}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 px-4 py-3 text-xs font-bold text-white shadow-sm transition cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{UI_TEXT.orderInCartBtn[lang]}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
