import React, { useState } from 'react';
import {
  Users,
  MapPin,
  Clock,
  CheckCircle2,
  Bell,
  Store,
  PackagePlus,
} from 'lucide-react';
import {
  GroupOrderPool,
  ProductItem,
  Language,
  TASHKENT_MARKETS,
} from '../data/marketData';

interface GroupBuyingAndSupplierSectionProps {
  lang: Language;
  pools: GroupOrderPool[];
  products: ProductItem[];
  alerts: { id: string; productId: string; productName: string; targetPrice: number; triggered: boolean }[];
  onJoinPool: (poolId: string, shopName: string, qty: number) => void;
  onPostSupplierOffer: (
    productId: string,
    supplierName: string,
    marketName: Record<Language, string>,
    newDirectPrice: number,
    newGroupPrice: number
  ) => void;
  onTriggerAlertSimulation: (alertId: string) => void;
}

const TXT = {
  sectionTitle: {
    uz: 'Mahalla Kooperatsiyasi (Birgalikda Xaridlar)',
    ru: 'Совместные закупки по районам (Кооперация)',
    en: 'Neighborhood Group Buying Pools',
  },
  sectionSub: {
    uz: "Yaqin atrofdagi do'konlar bilan birlashib, ulgurji omborlardan 1-qo'l narxda va bepul yetkazib berish bilan xarid qiling",
    ru: 'Объединяйтесь с соседними магазинами для получения крупнооптовых цен и бесплатной доставки',
    en: 'Pool orders with nearby shops to unlock factory-tier prices and free consolidated delivery',
  },
  soloPrice: { uz: 'Odatiy narx', ru: 'Обычная цена', en: 'Standard Price' },
  groupPrice: { uz: 'Guruh narxi', ru: 'Групповая цена', en: 'Group Price' },
  hoursLeft: { uz: 'soat qoldi', ru: 'ч. осталось', en: 'hrs left' },
  joinedShops: { uz: 'Qoʻshilgan doʻkonlar', ru: 'Участники пула', en: 'Participating Shops' },
  yourQty: { uz: 'Miqdor:', ru: 'Ваш объем:', en: 'Your Qty:' },
  savingLabel: { uz: 'Foyda:', ru: 'Выгода:', en: 'Savings:' },
  joinBtn: { uz: 'Guruhga qoʻshilish', ru: 'Присоединиться', en: 'Join Pool' },
  joinedBtn: { uz: 'Qoʻshildingiz', ru: 'Вы в группе', en: 'Joined Pool' },
  supplierTitle: {
    uz: 'Taʼminotchi Kabineti: Yangi Ulgurji Taklif Qoʻshish',
    ru: 'Кабинет поставщика: Опубликовать оптовую цену',
    en: 'Supplier Portal: Publish Wholesale Offer',
  },
  selectProduct: { uz: 'Mahsulot', ru: 'Товар', en: 'Product' },
  selectMarket: { uz: 'Ulgurji bozor', ru: 'Оптовый рынок', en: 'Wholesale Market' },
  directPriceLbl: { uz: 'Yakkalik narx (UZS)', ru: 'Оптовая цена (UZS)', en: 'Direct Price (UZS)' },
  groupPriceLbl: { uz: 'Guruh narxi (UZS)', ru: 'Групповая цена (UZS)', en: 'Group Price (UZS)' },
  publishBtn: {
    uz: 'Narxni jadvalga chiqarish',
    ru: 'Опубликовать в прайс-лист',
    en: 'Publish to Live Price Board',
  },
  publishedMsg: {
    uz: 'Yangi narx jadvalga qoʻshildi!',
    ru: 'Новая цена успешно опубликована!',
    en: 'New price published to the board!',
  },
  alertsTitle: {
    uz: 'Telegram Narx Tushishi Signallari (@BozorPulseBot)',
    ru: 'Уведомления о снижении цен в Telegram (@BozorPulseBot)',
    en: 'Telegram Price-Drop Alerts (@BozorPulseBot)',
  },
  targetPriceLbl: { uz: 'Maqsadli narx:', ru: 'Целевая цена:', en: 'Target price:' },
  testAlertBtn: { uz: 'Sinab koʻrish', ru: 'Проверить', en: 'Test Alert' },
  triggeredBtn: { uz: 'Xabar yuborildi', ru: 'Отправлено', en: 'Triggered' },
  telegramMsg: {
    uz: 'Telegram xabar: Narx belgilangan chegaraga tushdi!',
    ru: 'Telegram: Цена достигла вашего порога!',
    en: 'Telegram: Price reached your target threshold!',
  },
};

export const GroupBuyingAndSupplierSection: React.FC<GroupBuyingAndSupplierSectionProps> = ({
  lang,
  pools,
  products,
  alerts,
  onJoinPool,
  onPostSupplierOffer,
  onTriggerAlertSimulation,
}) => {
  const [joinQtyMap, setJoinQtyMap] = useState<Record<string, number>>({
    'pool-chilonzor-1': 14,
    'pool-yunusobod-2': 10,
    'pool-sergeli-3': 18,
  });
  const [joinedPoolIds, setJoinedPoolIds] = useState<string[]>([]);

  const [supProductId, setSupProductId] = useState<string>('sugar-50kg');
  const [supMarketId, setSupMarketId] = useState<string>('orikzor');
  const [supDirectPrice, setSupDirectPrice] = useState<string>('602000');
  const [supGroupPrice, setSupGroupPrice] = useState<string>('574000');
  const [offerSuccessToast, setOfferSuccessToast] = useState<boolean>(false);

  const handleJoin = (pool: GroupOrderPool) => {
    const qty = joinQtyMap[pool.id] || 10;
    onJoinPool(pool.id, 'Baraka Minimarket (Chilonzor-9)', qty);
    setJoinedPoolIds((prev) => [...prev, pool.id]);
  };

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const direct = Number(supDirectPrice) || 602000;
    const group = Number(supGroupPrice) || Math.round(direct * 0.955);
    const marketObj =
      TASHKENT_MARKETS.find((m) => m.id === supMarketId) || TASHKENT_MARKETS[0];

    onPostSupplierOffer(
      supProductId,
      "O'rikzor Agro Gold MChJ",
      marketObj.name,
      direct,
      group
    );
    setOfferSuccessToast(true);
    setTimeout(() => setOfferSuccessToast(false), 3500);
  };

  return (
    <div className="space-y-8">
      {/* Group Buying Pools */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{TXT.sectionTitle[lang]}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{TXT.sectionSub[lang]}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {pools.map((pool) => {
            const pct = Math.min(100, Math.round((pool.currentQty / pool.targetQty) * 100));
            const isJoined = joinedPoolIds.includes(pool.id);
            const myQty = joinQtyMap[pool.id] || 10;
            const mySavings = (pool.regularPrice - pool.groupPrice) * myQty;

            return (
              <div
                key={pool.id}
                className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700">
                      <MapPin className="w-3 h-3" />
                      {pool.district[lang]} ({pool.radiusKm} km)
                    </span>
                    <span className="rounded-md bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 text-xs font-mono font-bold">
                      -{pool.discountPct}%
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {pool.title[lang]}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{pool.supplierName}</p>
                  </div>

                  {/* Price Box */}
                  <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">
                        {TXT.soloPrice[lang]}
                      </div>
                      <div className="text-xs font-mono line-through text-slate-400">
                        {pool.regularPrice.toLocaleString()} UZS
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase text-teal-700 font-bold">
                        {TXT.groupPrice[lang]}
                      </div>
                      <div className="text-base font-mono font-bold text-teal-700">
                        {pool.groupPrice.toLocaleString()} UZS
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">
                        {pool.currentQty} / {pool.targetQty} {pool.unit[lang]} ({pct}%)
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        {pool.expiresInHours} {TXT.hoursLeft[lang]}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-teal-600 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Participants */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-medium text-slate-400">
                      {TXT.joinedShops[lang]} ({pool.participantsCount}):
                    </div>
                    <div className="space-y-1">
                      {pool.shopsJoined.slice(0, 3).map((sh, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-[11px] bg-slate-50 rounded-lg px-2.5 py-1 text-slate-600"
                        >
                          <span className="truncate">{sh.name}</span>
                          <span className="font-mono text-teal-700 font-medium shrink-0 ml-2">
                            {sh.qty} {pool.unit[lang]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Join Controls */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-500">{TXT.yourQty[lang]}</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={myQty}
                      onChange={(e) =>
                        setJoinQtyMap((prev) => ({
                          ...prev,
                          [pool.id]: Math.max(1, Number(e.target.value)),
                        }))
                      }
                      className="w-20 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs font-mono text-slate-800 text-center"
                    />
                    <span className="font-mono font-bold text-teal-700">
                      +{mySavings.toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => handleJoin(pool)}
                    disabled={isJoined}
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
                      isJoined
                        ? 'bg-teal-50 border border-teal-200 text-teal-700'
                        : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isJoined
                        ? `✓ ${TXT.joinedBtn[lang]}`
                        : `${TXT.joinBtn[lang]} (${myQty} ${pool.unit[lang]})`}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Supplier Offer Form & Telegram Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        <form
          onSubmit={handleSupplierSubmit}
          className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs space-y-4"
        >
          <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase">
            <Store className="w-4 h-4" />
            <span>{TXT.supplierTitle[lang]}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-500 mb-1">{TXT.selectProduct[lang]}</label>
              <select
                value={supProductId}
                onChange={(e) => {
                  const pid = e.target.value;
                  setSupProductId(pid);
                  const found = products.find((p) => p.id === pid);
                  if (found) {
                    setSupDirectPrice(String(found.bestDirectPrice - 3000));
                    setSupGroupPrice(String(found.bestGroupPrice - 3000));
                  }
                }}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-slate-800"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name[lang]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1">{TXT.selectMarket[lang]}</label>
              <select
                value={supMarketId}
                onChange={(e) => setSupMarketId(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-slate-800"
              >
                {TASHKENT_MARKETS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name[lang]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1">{TXT.directPriceLbl[lang]}</label>
              <input
                type="number"
                value={supDirectPrice}
                onChange={(e) => setSupDirectPrice(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1">{TXT.groupPriceLbl[lang]}</label>
              <input
                type="number"
                value={supGroupPrice}
                onChange={(e) => setSupGroupPrice(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 font-mono text-teal-700 font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-white transition cursor-pointer"
          >
            <PackagePlus className="w-4 h-4" />
            <span>{TXT.publishBtn[lang]}</span>
          </button>

          {offerSuccessToast && (
            <div className="rounded-xl bg-teal-50 border border-teal-200 p-3 text-xs text-teal-800 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600" />
              <span>{TXT.publishedMsg[lang]}</span>
            </div>
          )}
        </form>

        {/* Telegram Alerts */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sky-700 text-xs font-bold uppercase">
            <Bell className="w-4 h-4" />
            <span>{TXT.alertsTitle[lang]}</span>
          </div>

          <div className="space-y-2.5">
            {alerts.map((al) => (
              <div
                key={al.id}
                className={`rounded-xl border p-3.5 flex items-center justify-between gap-3 ${
                  al.triggered
                    ? 'border-teal-200 bg-teal-50/50'
                    : 'border-slate-200/80 bg-slate-50/60'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">{al.productName}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {TXT.targetPriceLbl[lang]}{' '}
                    <span className="font-mono text-teal-700 font-bold">
                      ≤ {al.targetPrice.toLocaleString()} UZS
                    </span>
                  </div>
                  {al.triggered && (
                    <div className="text-[11px] text-teal-700 font-medium mt-1">
                      ✓ {TXT.telegramMsg[lang]}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onTriggerAlertSimulation(al.id)}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold shrink-0 cursor-pointer transition ${
                    al.triggered
                      ? 'bg-teal-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {al.triggered ? TXT.triggeredBtn[lang] : TXT.testAlertBtn[lang]}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
