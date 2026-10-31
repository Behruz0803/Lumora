import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Truck,
  Wallet,
  QrCode,
  RotateCcw,
  Plus,
  Minus,
} from 'lucide-react';
import { ProductItem, Language } from '../data/marketData';

interface KillerFlowSectionProps {
  products: ProductItem[];
  lang: Language;
  onCompleteDelivery: (cashbackEarned: number, verifiedCount: number) => void;
  onInspectProduct: (product: ProductItem) => void;
}

const TEXT = {
  headerTitle: {
    uz: 'Aqlli Xarid Savati va Optimizator',
    ru: 'Умная корзина и оптимизатор закупок',
    en: 'Smart Procurement Cart & Optimizer',
  },
  headerSub: {
    uz: "Do'koningizning haftalik xarid ro'yxatini eng arzon ulgurji omborlar va mahalla kooperatsiyasi orqali shakllantiring",
    ru: 'Сформируйте еженедельную закупку по лучшим оптовым ценам через совместный пул соседей',
    en: 'Optimize your weekly store restock across verified wholesale depots and neighborhood group pools',
  },
  oldCost: { uz: 'Odatiy xarajat', ru: 'Обычная цена', en: 'Standard Cost' },
  optimalCost: { uz: 'Optimal jami', ru: 'Со скидкой', en: 'Optimized Total' },
  netSavings: { uz: 'Tejalgan pul', ru: 'Экономия', en: 'Net Savings' },
  step1: {
    uz: '1. Roʻyxat va AI Miqdor',
    ru: '1. Список и AI-объем',
    en: '1. Restock List & AI Qty',
  },
  step2: {
    uz: '2. Taʼminotchi va Guruh Xaridi',
    ru: '2. Поставщики и Группа',
    en: '2. Suppliers & Group Pool',
  },
  step3: {
    uz: '3. Tasdiqlash va Natija',
    ru: '3. Приемка и Итог',
    en: '3. Confirmation & Summary',
  },
  aiOptimizeBtn: {
    uz: 'AI prognoz boʻyicha miqdorni moslash',
    ru: 'Оптимизировать объем по AI-прогнозу',
    en: 'Optimize Quantities with AI Forecast',
  },
  resetBtn: { uz: 'Asliga qaytarish', ru: 'Сбросить', en: 'Reset' },
  colItem: { uz: 'Mahsulot', ru: 'Товар', en: 'Product' },
  colQty: { uz: 'Miqdor', ru: 'Кол-во', en: 'Qty' },
  colOldPrice: { uz: 'Avvalgi narx', ru: 'Старая цена', en: 'Old Price' },
  colGroupPrice: { uz: 'Guruh narxi', ru: 'Групповая цена', en: 'Group Price' },
  colTrend: { uz: '14 kun prognoz', ru: 'Прогноз 14 дн.', en: '14d Forecast' },
  colSaved: { uz: 'Foyda', ru: 'Выгода', en: 'Savings' },
  nextToSuppliers: {
    uz: 'Keyingi: Taʼminotchi va yetkazishni tanlash',
    ru: 'Далее: Выбор поставщика и доставки',
    en: 'Next: Select Supplier & Delivery',
  },
  backBtn: { uz: 'Orqaga', ru: 'Назад', en: 'Back' },
  groupOptionBadge: {
    uz: 'Tavsiya etiladi · Mahalla Kooperatsiyasi',
    ru: 'Рекомендуем · Совместная закупка',
    en: 'Recommended · Neighborhood Group Pool',
  },
  groupOptionTitle: {
    uz: 'Chilonzor 9-10 kvartal Yigʻma Buyurtmasi',
    ru: 'Сборный заказ Чиланзар 9-10 квартал',
    en: 'Chilonzor Blocks 9-10 Consolidated Pool',
  },
  groupOptionDesc: {
    uz: "1.8 km radiusdagi 7 ta qo'shni do'kon bilan bitta Isuzu reysida yetkaziladi. Yetkazib berish bepul va zavod ulgurji narxi qo'llanadi.",
    ru: 'Доставка одним рейсом Isuzu вместе с 7 соседними магазинами в радиусе 1.8 км. Бесплатная доставка и крупнооптовая цена.',
    en: 'Delivered on a single Isuzu truck run alongside 7 nearby shops within 1.8km. Free delivery and factory-tier pricing.',
  },
  directOptionBadge: {
    uz: 'Yakkalik buyurtma',
    ru: 'Индивидуальный заказ',
    en: 'Individual Direct Order',
  },
  directOptionTitle: {
    uz: 'Alohida transportda tezkor yetkazish (2 soat)',
    ru: 'Индивидуальная экспресс-доставка (2 часа)',
    en: 'Dedicated Express Delivery (2 hours)',
  },
  directOptionDesc: {
    uz: "Guruh to'lishini kutmasdan to'g'ridan-to'g'ri ombordan jo'natiladi, ammo guruh chegirmasi qo'llanmaydi.",
    ru: 'Отправка сразу со склада без ожидания соседей, но без групповой скидки.',
    en: 'Dispatched immediately without waiting for neighbors, at standard wholesale prices.',
  },
  suppliersHeading: {
    uz: 'Tasdiqlangan ulgurji taʼminotchilar (Halol narx kafolati bilan)',
    ru: 'Проверенные оптовые поставщики (с депозитной гарантией цены)',
    en: 'Verified Wholesale Suppliers (Backed by Price Guarantee Deposits)',
  },
  nasiyaLabel: {
    uz: '14 kunlik foizsiz Halol Nasiya orqali rasmiylashtirish (Escrow himoyali)',
    ru: 'Оформить в беспроцентную рассрочку Насия на 14 дней (с защитой Escrow)',
    en: 'Use 14-day zero-interest Nasiya credit line (Escrow protected)',
  },
  placeOrderBtn: {
    uz: 'Buyurtmani tasdiqlash va qabul oynasiga oʻtish',
    ru: 'Подтвердить заказ и перейти к приемке',
    en: 'Confirm Order & Proceed to Delivery Sign-Off',
  },
  deliveryTitle: {
    uz: 'Yetkazib berish va Elektron Nakladnoy qabuli',
    ru: 'Приемка доставки и проверка накладной',
    en: 'Delivery Verification & Invoice Sign-Off',
  },
  deliveryMatched: {
    uz: 'Barcha pozitsiyalar shartnoma narxiga 100% mos keldi',
    ru: 'Все позиции на 100% совпадают с ценой заказа',
    en: 'All items match locked order prices 100%',
  },
  confirmReceiptBtn: {
    uz: 'Yukni qabul qilish va QR orqali tasdiqlash (+28,500 UZS Cashback)',
    ru: 'Подтвердить приемку по QR (+28 500 сум кешбэк)',
    en: 'Confirm Delivery via QR (+28,500 UZS Cashback)',
  },
  completedBanner: {
    uz: 'Buyurtma muvaffaqiyatli yakunlandi!',
    ru: 'Заказ успешно выполнен!',
    en: 'Order Successfully Completed!',
  },
  statSavedWeek: {
    uz: 'Ushbu xaridda tejalgan pul',
    ru: 'Сэкономлено на этом заказе',
    en: 'Saved on This Order',
  },
  statSavedYear: {
    uz: 'Yillik prognoz tejamkorlik (52 hafta)',
    ru: 'Прогноз экономии за год (52 недели)',
    en: 'Projected Annual Savings (52 weeks)',
  },
  statTime: {
    uz: 'Xaridga ketgan vaqt',
    ru: 'Время на закупку',
    en: 'Procurement Time',
  },
  statTimeSub: {
    uz: '15 daqiqa (2 kun bozor aylanish oʻrniga)',
    ru: '15 минут (вместо 2 дней на базарах)',
    en: '15 mins (vs 2 days visiting markets)',
  },
  statCashback: {
    uz: 'Hamyonga tushgan Cashback',
    ru: 'Начисленный кешбэк',
    en: 'Cashback Credited',
  },
};

export const KillerFlowSection: React.FC<KillerFlowSectionProps> = ({
  products,
  lang,
  onCompleteDelivery,
  onInspectProduct,
}) => {
  const [step, setStep] = useState<number>(1);
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    products.forEach((p) => {
      initial[p.id] = p.defaultQty;
    });
    return initial;
  });
  const [aiOptimized, setAiOptimized] = useState<boolean>(false);
  const [buyingMode, setBuyingMode] = useState<'group' | 'direct'>('group');
  const [useNasiya, setUseNasiya] = useState<boolean>(false);
  const [deliveryConfirmed, setDeliveryConfirmed] = useState<boolean>(false);

  const updateQty = (id: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta),
    }));
  };

  const applyAiOptimization = () => {
    const next: Record<string, number> = {};
    products.forEach((p) => {
      next[p.id] = p.aiRecommendedQty;
    });
    setQuantities(next);
    setAiOptimized(true);
  };

  const resetQuantities = () => {
    const initial: Record<string, number> = {};
    products.forEach((p) => {
      initial[p.id] = p.defaultQty;
    });
    setQuantities(initial);
    setAiOptimized(false);
    setDeliveryConfirmed(false);
  };

  const basketSummary = useMemo(() => {
    let oldTotal = 0;
    let directTotal = 0;
    let groupTotal = 0;

    products.forEach((p) => {
      const q = quantities[p.id] || 0;
      oldTotal += p.oldPaidPrice * q;
      directTotal += p.bestDirectPrice * q;
      groupTotal += p.bestGroupPrice * q;
    });

    const chosenTotal = buyingMode === 'group' ? groupTotal : directTotal;
    const savedUzs = oldTotal - chosenTotal;
    const savedPct = oldTotal > 0 ? ((savedUzs / oldTotal) * 100).toFixed(1) : '0.0';
    const cashbackUzs = 28500;

    return {
      oldTotal,
      directTotal,
      groupTotal,
      chosenTotal,
      savedUzs,
      savedPct,
      cashbackUzs,
    };
  }, [products, quantities, buyingMode]);

  const handleConfirmDelivery = () => {
    if (!deliveryConfirmed) {
      setDeliveryConfirmed(true);
      onCompleteDelivery(basketSummary.cashbackUzs, products.length);
    }
  };

  return (
    <div className="space-y-6">
      {/* Clean Top Summary Card */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{TEXT.headerTitle[lang]}</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">{TEXT.headerSub[lang]}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 shrink-0">
          <div>
            <div className="text-[11px] text-slate-400">{TEXT.oldCost[lang]}</div>
            <div className="text-sm font-mono line-through text-slate-400">
              {basketSummary.oldTotal.toLocaleString()} UZS
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300" />
          <div>
            <div className="text-[11px] text-teal-700 font-semibold">{TEXT.optimalCost[lang]}</div>
            <div className="text-base font-mono font-bold text-slate-900">
              {basketSummary.chosenTotal.toLocaleString()} UZS
            </div>
          </div>
          <div className="rounded-lg bg-teal-600 text-white px-3 py-1.5 text-center">
            <div className="text-[10px] uppercase font-semibold opacity-90">
              {TEXT.netSavings[lang]}
            </div>
            <div className="text-xs font-mono font-bold">
              -{basketSummary.savedUzs.toLocaleString()} ({basketSummary.savedPct}%)
            </div>
          </div>
        </div>
      </div>

      {/* Simple 3-Step Navigation Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { num: 1, label: TEXT.step1[lang], icon: ShoppingBag },
          { num: 2, label: TEXT.step2[lang], icon: Users },
          { num: 3, label: TEXT.step3[lang], icon: QrCode },
        ].map((s) => {
          const Icon = s.icon;
          const active = step === s.num;
          const done = step > s.num || (s.num === 3 && deliveryConfirmed);
          return (
            <button
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition cursor-pointer ${
                active
                  ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                  : done
                  ? 'bg-teal-50/70 border-teal-200 text-teal-900'
                  : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  active
                    ? 'bg-white/20 text-white'
                    : done
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {done && !active ? '✓' : <Icon className="w-4 h-4" />}
              </div>
              <span className="text-xs sm:text-sm font-bold">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* STEP 1: Shopping List & AI Quantities */}
      {step === 1 && (
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="text-sm font-bold text-slate-800">
              {TEXT.step1[lang]} ({products.length} SKU)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={applyAiOptimization}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                  aiOptimized
                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                {TEXT.aiOptimizeBtn[lang]}
              </button>
              <button
                onClick={resetQuantities}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {TEXT.resetBtn[lang]}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase text-slate-500">
                  <th className="py-3 px-3">{TEXT.colItem[lang]}</th>
                  <th className="py-3 px-3">{TEXT.colQty[lang]}</th>
                  <th className="py-3 px-3">{TEXT.colOldPrice[lang]}</th>
                  <th className="py-3 px-3">{TEXT.colGroupPrice[lang]}</th>
                  <th className="py-3 px-3">{TEXT.colTrend[lang]}</th>
                  <th className="py-3 px-3 text-right">{TEXT.colSaved[lang]}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const q = quantities[p.id] || 0;
                  const lineSaved = (p.oldPaidPrice - p.bestGroupPrice) * q;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3">
                        <button
                          onClick={() => onInspectProduct(p)}
                          className="font-semibold text-slate-900 hover:text-teal-700 text-left cursor-pointer"
                        >
                          {p.name[lang]}
                        </button>
                        <div className="text-[11px] text-slate-400">
                          {p.bestMarketName[lang]} · {p.unit[lang]}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-1.5 py-1">
                          <button
                            onClick={() => updateQty(p.id, -1)}
                            className="p-0.5 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono font-bold text-slate-800 min-w-[24px] text-center">
                            {q}
                          </span>
                          <button
                            onClick={() => updateQty(p.id, 1)}
                            className="p-0.5 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400 line-through">
                        {p.oldPaidPrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-teal-700">
                        {p.bestGroupPrice.toLocaleString()} UZS
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                            p.forecast14dPct > 2
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : p.forecast14dPct < -1
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p. supplyBadge[lang]}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-teal-700">
                        +{lineSaved.toLocaleString()} UZS
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
            >
              <span>{TEXT.nextToSuppliers[lang]}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Group Order vs Individual + Suppliers */}
      {step === 2 && (
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Group Option */}
            <div
              onClick={() => setBuyingMode('group')}
              className={`rounded-xl border p-4 cursor-pointer transition ${
                buyingMode === 'group'
                  ? 'border-teal-600 bg-teal-50/40 ring-1 ring-teal-600/30'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-600 text-white px-2.5 py-0.5 text-[11px] font-bold">
                  <Users className="w-3 h-3" />
                  {TEXT.groupOptionBadge[lang]}
                </span>
                <span className="font-mono text-xs font-bold text-teal-700">
                  -{basketSummary.savedPct}%
                </span>
              </div>
              <h4 className="text-base font-bold text-slate-900 mt-2">
                {TEXT.groupOptionTitle[lang]}
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {TEXT.groupOptionDesc[lang]}
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between">
                <span className="text-xs text-slate-500">{TEXT.optimalCost[lang]}:</span>
                <span className="font-mono text-base font-bold text-teal-700">
                  {basketSummary.groupTotal.toLocaleString()} UZS
                </span>
              </div>
            </div>

            {/* Direct Option */}
            <div
              onClick={() => setBuyingMode('direct')}
              className={`rounded-xl border p-4 cursor-pointer transition flex flex-col justify-between ${
                buyingMode === 'direct'
                  ? 'border-teal-600 bg-teal-50/40 ring-1 ring-teal-600/30'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-[11px] font-semibold">
                    <Truck className="w-3 h-3" />
                    {TEXT.directOptionBadge[lang]}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 mt-2">
                  {TEXT.directOptionTitle[lang]}
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {TEXT.directOptionDesc[lang]}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between">
                <span className="text-xs text-slate-500">{TEXT.optimalCost[lang]}:</span>
                <span className="font-mono text-base font-bold text-slate-800">
                  {basketSummary.directTotal.toLocaleString()} UZS
                </span>
              </div>
            </div>
          </div>

          {/* Verified Suppliers List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700">{TEXT.suppliersHeading[lang]}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {products[0].suppliers.map((sup) => (
                <div
                  key={sup.id}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 space-y-1.5 text-xs"
                >
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="truncate">{sup.supplierName}</span>
                  </div>
                  <div className="text-slate-500">{sup.marketName[lang]}</div>
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-amber-600 font-semibold">★ {sup.rating}</span>
                    <span className="text-teal-700 font-mono font-bold">
                      {sup.deliveryHours[lang]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nasiya Checkbox */}
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 flex items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={useNasiya}
                onChange={(e) => setUseNasiya(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <Wallet className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{TEXT.nasiyaLabel[lang]}</span>
            </label>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              {TEXT.backBtn[lang]}
            </button>
            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs cursor-pointer"
            >
              <span>{TEXT.placeOrderBtn[lang]}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Delivery Verification & Summary */}
      {step === 3 && (
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">{TEXT.deliveryTitle[lang]}</h3>
              <p className="text-xs text-teal-700 font-medium mt-0.5">
                ✓ {TEXT.deliveryMatched[lang]}
              </p>
            </div>
            {!deliveryConfirmed ? (
              <button
                onClick={handleConfirmDelivery}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{TEXT.confirmReceiptBtn[lang]}</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-teal-50 border border-teal-200 px-3.5 py-2 text-xs font-bold text-teal-700">
                <CheckCircle2 className="w-4 h-4" />
                {TEXT.completedBanner[lang]}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl bg-teal-50/50 border border-teal-200/80 p-4 space-y-1">
              <div className="text-xs text-slate-500">{TEXT.statSavedWeek[lang]}</div>
              <div className="text-xl font-mono font-bold text-teal-700">
                {basketSummary.savedUzs.toLocaleString()} UZS
              </div>
              <div className="text-[11px] text-teal-600 font-medium">
                -{basketSummary.savedPct}%
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-1">
              <div className="text-xs text-slate-500">{TEXT.statSavedYear[lang]}</div>
              <div className="text-xl font-mono font-bold text-slate-900">
                {(basketSummary.savedUzs * 52).toLocaleString()} UZS
              </div>
              <div className="text-[11px] text-slate-500">52×</div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-1">
              <div className="text-xs text-slate-500">{TEXT.statTime[lang]}</div>
              <div className="text-xl font-bold text-slate-900">15 min</div>
              <div className="text-[11px] text-slate-500">{TEXT.statTimeSub[lang]}</div>
            </div>

            <div className="rounded-xl bg-amber-50/60 border border-amber-200/80 p-4 space-y-1">
              <div className="text-xs text-slate-500">{TEXT.statCashback[lang]}</div>
              <div className="text-xl font-mono font-bold text-amber-700">+28,500 UZS</div>
              <div className="text-[11px] text-amber-700">BozorPulse Bonus</div>
            </div>
          </div>

          <div className="flex justify-start pt-2">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              {TEXT.backBtn[lang]}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
