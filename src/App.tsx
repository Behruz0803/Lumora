import React, { useState } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  BarChart2,
  Camera,
  Users,
  Coins,
  Building2,
} from 'lucide-react';
import {
  PRODUCTS_DATA,
  INITIAL_GROUP_POOLS,
  ProductItem,
  GroupOrderPool,
  SampleReceiptScan,
  Language,
} from './data/marketData';
import { KillerFlowSection } from './components/KillerFlowSection';
import { LivePriceBoardSection } from './components/LivePriceBoardSection';
import { BozorKozAiSection } from './components/BozorKozAiSection';
import { GroupBuyingAndSupplierSection } from './components/GroupBuyingAndSupplierSection';

type MainTab = 'price-board' | 'smart-procurement' | 'group-buying' | 'ai-scanner';

const NAV_LABELS = {
  tagline: {
    uz: 'Ulgurji bozor narxlari va aqlli xarid platformasi',
    ru: 'Платформа оптовых цен и умных закупок',
    en: 'Wholesale Market Prices & Smart Procurement',
  },
  tabs: {
    priceBoard: {
      uz: 'Bozor Narxlari',
      ru: 'Цены рынка',
      en: 'Market Prices',
    },
    smartCart: {
      uz: 'Aqlli Savat',
      ru: 'Умная корзина',
      en: 'Smart Cart',
    },
    groupBuying: {
      uz: 'Birgalikda Xarid',
      ru: 'Совместные закупки',
      en: 'Group Buying',
    },
    aiScanner: {
      uz: 'AI Chek Skaner',
      ru: 'AI Сканер чеков',
      en: 'AI Receipt Scanner',
    },
  },
  footer: {
    uz: "BozorPulse · O'rikzor, Qo'yliq, Sergeli, Bek Baraka va Chorsu ulgurji bozorlari narxlar tizimi",
    ru: 'BozorPulse · Единая база оптовых цен рынков Урикзар, Куйлюк, Сергели, Бек Барака и Чорсу',
    en: 'BozorPulse · Live wholesale price network across Orikzor, Qoyliq, Sergeli, Bek Baraka & Chorsu',
  },
};

export function App() {
  const [lang, setLang] = useState<Language>('uz');
  const [activeTab, setActiveTab] = useState<MainTab>('price-board');
  const [products, setProducts] = useState<ProductItem[]>(PRODUCTS_DATA);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem>(PRODUCTS_DATA[0]);
  const [pools, setPools] = useState<GroupOrderPool[]>(INITIAL_GROUP_POOLS);
  const [storeCashbackUzs, setStoreCashbackUzs] = useState<number>(42000);

  const [alerts, setAlerts] = useState<
    { id: string; productId: string; productName: string; targetPrice: number; triggered: boolean }[]
  >([
    {
      id: 'al-1',
      productId: 'sugar-50kg',
      productName: 'Shakar Xorazm Oliy nav (50 kg)',
      targetPrice: 605000,
      triggered: false,
    },
    {
      id: 'al-2',
      productId: 'oil-5l',
      productName: "Kungaboqar yog'i 'Oltin Dala' (5 litr)",
      targetPrice: 79000,
      triggered: true,
    },
  ]);

  const handleCompleteDelivery = (cashbackEarned: number) => {
    setStoreCashbackUzs((prev) => prev + cashbackEarned);
  };

  const handleInspectProduct = (product: ProductItem) => {
    setSelectedProduct(product);
    setActiveTab('price-board');
  };

  const handleCreateAlert = (productId: string, productName: string, targetPrice: number) => {
    setAlerts((prev) => [
      {
        id: 'al-' + Date.now(),
        productId,
        productName,
        targetPrice,
        triggered: false,
      },
      ...prev,
    ]);
  };

  const handleApplyVerifiedScan = (scan: SampleReceiptScan) => {
    if (scan.cashbackRewardUzs > 0) {
      setStoreCashbackUzs((prev) => prev + scan.cashbackRewardUzs);
    }

    setProducts((prev) =>
      prev.map((p) => {
        const match = scan.extractedItems.find(
          (ext) => ext.productId === p.id && ext.status === 'verified'
        );
        if (!match) return p;
        const newBestDirect = Math.min(p.bestDirectPrice, match.extractedPrice);
        return {
          ...p,
          bestDirectPrice: newBestDirect,
          marketPrices: p.marketPrices.map((mp, idx) =>
            idx === 0
              ? {
                  ...mp,
                  price: newBestDirect,
                  verifiedCount: mp.verifiedCount + 1,
                  updatedMinutesAgo: 1,
                }
              : mp
          ),
        };
      })
    );
  };

  const handleJoinPool = (poolId: string, shopName: string, qty: number) => {
    setPools((prev) =>
      prev.map((pl) =>
        pl.id === poolId
          ? {
              ...pl,
              currentQty: pl.currentQty + qty,
              participantsCount: pl.participantsCount + 1,
              shopsJoined: [
                { name: shopName, qty, distanceKm: 0.2 },
                ...pl.shopsJoined,
              ],
            }
          : pl
      )
    );
  };

  const handlePostSupplierOffer = (
    productId: string,
    supplierName: string,
    marketName: Record<Language, string>,
    newDirectPrice: number,
    newGroupPrice: number
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const updated: ProductItem = {
          ...p,
          bestDirectPrice: Math.min(p.bestDirectPrice, newDirectPrice),
          bestGroupPrice: Math.min(p.bestGroupPrice, newGroupPrice),
          bestMarketName: marketName,
          suppliers: [
            {
              id: 'sup-live-' + Date.now(),
              supplierName,
              marketName,
              rating: 4.9,
              reviewsCount: 430,
              verified: true,
              depositGuaranteeUzs: 15000000,
              price: newDirectPrice,
              groupTierPrice: newGroupPrice,
              moq: 5,
              deliveryHours: { uz: '2 soatda', ru: 'за 2 часа', en: 'in 2 hours' },
              nasiyaAvailable: true,
            },
            ...p.suppliers,
          ],
        };
        if (selectedProduct.id === p.id) {
          setSelectedProduct(updated);
        }
        return updated;
      })
    );

    setAlerts((prev) =>
      prev.map((al) =>
        al.productId === productId && newDirectPrice <= al.targetPrice
          ? { ...al, triggered: true }
          : al
      )
    );
  };

  const handleTriggerAlertSimulation = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((al) => (al.id === alertId ? { ...al, triggered: true } : al))
    );
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] text-slate-800 flex flex-col">
      {/* Clean, Calm Light Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900">
                Bozor<span className="text-teal-600">Pulse</span>
              </span>
              <p className="hidden sm:block text-[11px] text-slate-400 leading-none mt-0.5">
                {NAV_LABELS.tagline[lang]}
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl">
            {[
              { id: 'price-board', label: NAV_LABELS.tabs.priceBoard[lang], icon: BarChart2 },
              { id: 'smart-procurement', label: NAV_LABELS.tabs.smartCart[lang], icon: ShoppingCart },
              { id: 'group-buying', label: NAV_LABELS.tabs.groupBuying[lang], icon: Users },
              { id: 'ai-scanner', label: NAV_LABELS.tabs.aiScanner[lang], icon: Camera },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as MainTab)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-white text-teal-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Store Profile, Cashback & 3-Language Switcher */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden lg:inline-flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-1.5 text-xs text-slate-600">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-700">Baraka Minimarket</span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200/80 px-3 py-1.5 text-xs">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-mono font-bold text-amber-800">
                {storeCashbackUzs.toLocaleString()} UZS
              </span>
            </div>

            {/* 3-Language Switcher: O'ZB | РУС | ENG */}
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200/70">
              {(
                [
                  { code: 'uz', label: "O'ZB" },
                  { code: 'ru', label: 'РУС' },
                  { code: 'en', label: 'ENG' },
                ] as const
              ).map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                    lang === l.code
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden px-4 pb-2.5 flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'price-board', label: NAV_LABELS.tabs.priceBoard[lang], icon: BarChart2 },
            { id: 'smart-procurement', label: NAV_LABELS.tabs.smartCart[lang], icon: ShoppingCart },
            { id: 'group-buying', label: NAV_LABELS.tabs.groupBuying[lang], icon: Users },
            { id: 'ai-scanner', label: NAV_LABELS.tabs.aiScanner[lang], icon: Camera },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as MainTab)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'price-board' && (
          <LivePriceBoardSection
            products={products}
            lang={lang}
            selectedProduct={selectedProduct}
            onSelectProduct={setSelectedProduct}
            onCreateAlert={handleCreateAlert}
            onOpenSmartCart={() => setActiveTab('smart-procurement')}
          />
        )}

        {activeTab === 'smart-procurement' && (
          <KillerFlowSection
            products={products}
            lang={lang}
            onCompleteDelivery={handleCompleteDelivery}
            onInspectProduct={handleInspectProduct}
          />
        )}

        {activeTab === 'group-buying' && (
          <GroupBuyingAndSupplierSection
            lang={lang}
            pools={pools}
            products={products}
            alerts={alerts}
            onJoinPool={handleJoinPool}
            onPostSupplierOffer={handlePostSupplierOffer}
            onTriggerAlertSimulation={handleTriggerAlertSimulation}
          />
        )}

        {activeTab === 'ai-scanner' && (
          <BozorKozAiSection
            lang={lang}
            products={products}
            onApplyVerifiedScan={handleApplyVerifiedScan}
          />
        )}
      </main>

      {/* Simple Minimal Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 px-4 sm:px-6 mt-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
          <span>{NAV_LABELS.footer[lang]}</span>
          <span>Telegram: @BozorPulseBot</span>
        </div>
      </footer>
    </div>
  );
}
export default App;
