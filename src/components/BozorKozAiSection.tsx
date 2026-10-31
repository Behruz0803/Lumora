import React, { useState } from 'react';
import {
  Mic,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Upload,
  FileText,
  Coins,
  Cpu,
} from 'lucide-react';
import {
  SAMPLE_RECEIPT_SCANS,
  SampleReceiptScan,
  Language,
  ProductItem,
} from '../data/marketData';

interface BozorKozAiSectionProps {
  lang: Language;
  products: ProductItem[];
  onApplyVerifiedScan: (scan: SampleReceiptScan) => void;
}

const TXT = {
  title: {
    uz: 'BozorKoʻz AI: Nakladnoy va Chek Skaneri',
    ru: 'BozorKoz AI: Сканер накладных и чеков',
    en: 'BozorKoz AI: Invoice & Receipt Scanner',
  },
  sub: {
    uz: "Qog'oz nakladnoy, Soliq QR-cheki yoki ovozli xabardan narxlarni 3 soniyada o'qib olish va soxta narxlarni filtrlash",
    ru: 'Распознавание цен с рукописных накладных, QR-чеков и голосовых заметок за 3 секунды с защитой от фейков',
    en: 'Extract prices from handwritten invoices, QR receipts, or voice notes in 3 seconds with anti-fraud filtering',
  },
  step1Label: {
    uz: '1. Namuna hujjatni tanlang yoki rasm yuklang',
    ru: '1. Выберите документ или загрузите фото',
    en: '1. Choose a Sample Document or Upload Photo',
  },
  uploadLabel: {
    uz: 'Nakladnoy / chek rasmini yuklash (.jpg, .png)',
    ru: 'Загрузить фото накладной или чека (.jpg, .png)',
    en: 'Upload invoice or receipt image (.jpg, .png)',
  },
  voiceLabel: {
    uz: '2. Ovozli / matnli xabardan narxni aniqlash',
    ru: '2. Распознавание цены из текста или голоса',
    en: '2. Voice / Text Price Extraction',
  },
  voiceHint: {
    uz: "Masalan, shakar narxini 440000 qilib yozib ko'ring — tizim soxta arzon narxni avtomatik bloklaydi.",
    ru: 'Попробуйте изменить цену сахара на 440000 — система автоматически заблокирует фейковую цену.',
    en: 'Try changing the sugar price to 440000 to see the anti-fraud filter block the bait price.',
  },
  analyzeBtn: {
    uz: 'AI orqali tahlil qilish',
    ru: 'Анализировать через AI',
    en: 'Analyze with AI',
  },
  resultHeader: {
    uz: 'Tahlil va Tekshiruv Natijasi',
    ru: 'Результат распознавания и проверки',
    en: 'Extraction & Verification Result',
  },
  rawTextTitle: {
    uz: 'Hujjatdan oʻqilgan matn:',
    ru: 'Распознанный текст документа:',
    en: 'Extracted Document Text:',
  },
  itemsTitle: {
    uz: 'Aniqlangan mahsulotlar va narx tekshiruvi:',
    ru: 'Найденные товары и проверка цен:',
    en: 'Detected Items & Price Verification:',
  },
  medianLbl: {
    uz: 'Bozor oʻrtacha narxi:',
    ru: 'Среднерыночная цена:',
    en: 'Market Median:',
  },
  diffLbl: { uz: 'Farq:', ru: 'Разница:', en: 'Diff:' },
  verifiedBadge: { uz: 'Tasdiqlandi', ru: 'Подтверждено', en: 'Verified' },
  blockedBadge: { uz: 'Soxta narx bloklandi', ru: 'Фейк заблокирован', en: 'Fake Blocked' },
  commitBtn: {
    uz: 'Tasdiqlangan narxlarni jadvalga qoʻshish',
    ru: 'Добавить подтвержденные цены в базу',
    en: 'Add Verified Prices to Market Board',
  },
  committedBtn: {
    uz: 'Narxlar jadvalga qoʻshildi (+Cashback)',
    ru: 'Цены добавлены в базу (+Кешбэк)',
    en: 'Prices Added to Board (+Cashback)',
  },
};

export const BozorKozAiSection: React.FC<BozorKozAiSectionProps> = ({
  lang,
  onApplyVerifiedScan,
}) => {
  const [selectedScan, setSelectedScan] = useState<SampleReceiptScan>(SAMPLE_RECEIPT_SCANS[0]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [customVoiceText, setCustomVoiceText] = useState<string>(
    "O'rikzor 4-qator 18-ombor: Shakar Xorazm 50kg 609000 so'm, Un Elita 50kg 315000 so'm"
  );
  const [appliedScanIds, setAppliedScanIds] = useState<string[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const handleSelectSample = (scan: SampleReceiptScan) => {
    setIsScanning(true);
    setSelectedScan(scan);
    setTimeout(() => {
      setIsScanning(false);
    }, 350);
  };

  const handleParseVoiceText = (e: React.FormEvent) => {
    e.preventDefault();
    setIsScanning(true);

    const numbers = customVoiceText.match(/\d{5,6}/g)?.map(Number) || [609000, 315000];
    const sugarPrice = numbers[0] || 609000;
    const flourPrice = numbers[1] || 315000;

    const sugarMedian = 612000;
    const sugarDev = Number((((sugarPrice - sugarMedian) / sugarMedian) * 100).toFixed(1));
    const sugarZ = Number(((sugarPrice - sugarMedian) / 34000).toFixed(2));
    const sugarBlocked = sugarDev < -12;

    const flourMedian = 318000;
    const flourDev = Number((((flourPrice - flourMedian) / flourMedian) * 100).toFixed(1));
    const flourZ = Number(((flourPrice - flourMedian) / 19000).toFixed(2));
    const flourBlocked = flourDev < -12;

    const customScan: SampleReceiptScan = {
      id: 'custom-voice-' + Date.now(),
      title: {
        uz: 'Ovozli / Matnli Xabar Tahlili',
        ru: 'Анализ голосового / текстового сообщения',
        en: 'Voice / Text Message Extraction',
      },
      sourceType: 'handwritten_nakladnoy',
      bazaarName: {
        uz: "O'rikzor Ulgurji Bozori",
        ru: 'Оптовый рынок Урикзар',
        en: 'Orikzor Wholesale Market',
      },
      sellerName: 'Foydalanuvchi xabari',
      rawTextPreview: customVoiceText,
      extractedItems: [
        {
          productId: 'sugar-50kg',
          productName: {
            uz: 'Shakar Xorazm Oliy nav (50 kg)',
            ru: 'Сахар Хорезм высший сорт (50 кг)',
            en: 'White Sugar Khorezm (50 kg)',
          },
          unit: { uz: '50 kg qop', ru: 'мешок 50 кг', en: '50 kg bag' },
          extractedPrice: sugarPrice,
          marketMedianPrice: sugarMedian,
          deviationPct: sugarDev,
          zScore: sugarZ,
          status: sugarBlocked ? 'blocked_fake' : 'verified',
          statusNote: {
            uz: sugarBlocked
              ? `Bloklandi: Bozor narxidan ${Math.abs(sugarDev)}% past shubhali narx`
              : 'Tasdiqlandi: Bozor diapazoniga mos',
            ru: sugarBlocked
              ? `Заблокировано: на ${Math.abs(sugarDev)}% ниже рыночной медианы`
              : 'Подтверждено: соответствует рынку',
            en: sugarBlocked
              ? `Blocked: ${Math.abs(sugarDev)}% below market median`
              : 'Verified: Within normal wholesale band',
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
          extractedPrice: flourPrice,
          marketMedianPrice: flourMedian,
          deviationPct: flourDev,
          zScore: flourZ,
          status: flourBlocked ? 'blocked_fake' : 'verified',
          statusNote: {
            uz: flourBlocked ? 'Bloklandi: Tannarxdan past narx' : 'Tasdiqlandi: Indeksga mos',
            ru: flourBlocked ? 'Заблокировано: ниже себестоимости' : 'Подтверждено: в норме',
            en: flourBlocked ? 'Blocked: Below mill cost' : 'Verified: Matches market band',
          },
        },
      ],
      cashbackRewardUzs: sugarBlocked && flourBlocked ? 0 : 4000,
    };

    setTimeout(() => {
      setSelectedScan(customScan);
      setIsScanning(false);
    }, 350);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    handleSelectSample(SAMPLE_RECEIPT_SCANS[0]);
  };

  const handleCommitToIndex = () => {
    if (appliedScanIds.includes(selectedScan.id)) return;
    setAppliedScanIds((prev) => [...prev, selectedScan.id]);
    onApplyVerifiedScan(selectedScan);
  };

  const hasVerifiedItems = selectedScan.extractedItems.some((i) => i.status === 'verified');
  const isAlreadyApplied = appliedScanIds.includes(selectedScan.id);

  return (
    <div className="space-y-6">
      {/* Clean Header */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">{TXT.title[lang]}</h2>
        <p className="text-xs text-slate-500 mt-1">{TXT.sub[lang]}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Samples + Voice Input */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-xs space-y-3">
            <div className="text-xs font-bold text-slate-700">{TXT.step1Label[lang]}</div>

            <div className="space-y-2">
              {SAMPLE_RECEIPT_SCANS.map((scan) => {
                const isActive = selectedScan.id === scan.id;
                const isFake = scan.sourceType === 'fake_bait_test';
                return (
                  <button
                    key={scan.id}
                    onClick={() => handleSelectSample(scan)}
                    className={`w-full text-left rounded-xl border p-3.5 transition cursor-pointer ${
                      isActive
                        ? isFake
                          ? 'border-rose-500 bg-rose-50/50'
                          : 'border-teal-600 bg-teal-50/50'
                        : 'border-slate-200/80 bg-slate-50/60 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {scan.title[lang]}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                          isFake
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {isFake ? 'Anti-Fraud' : `+${scan.cashbackRewardUzs.toLocaleString()} UZS`}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">{scan.bazaarName[lang]}</div>
                  </button>
                );
              })}
            </div>

            <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 hover:border-teal-600 bg-slate-50 p-3 text-xs font-semibold text-slate-600 hover:text-teal-700 cursor-pointer transition">
              <Upload className="w-4 h-4" />
              <span>{uploadedFileName ? uploadedFileName : TXT.uploadLabel[lang]}</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Voice / Text Box */}
          <form
            onSubmit={handleParseVoiceText}
            className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-xs space-y-3"
          >
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-teal-600" />
              <span>{TXT.voiceLabel[lang]}</span>
            </div>
            <p className="text-[11px] text-slate-500">{TXT.voiceHint[lang]}</p>
            <textarea
              rows={3}
              value={customVoiceText}
              onChange={(e) => setCustomVoiceText(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-800 font-mono focus:outline-none focus:border-teal-600"
            />
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-white transition cursor-pointer"
            >
              <Cpu className="w-4 h-4" />
              <span>{TXT.analyzeBtn[lang]}</span>
            </button>
          </form>
        </div>

        {/* Right 7 Cols: Verification Output */}
        <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="text-xs font-semibold text-teal-700">{TXT.resultHeader[lang]}</div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {selectedScan.title[lang]}
              </h3>
              <div className="text-xs text-slate-400">{selectedScan.bazaarName[lang]}</div>
            </div>
            {selectedScan.cashbackRewardUzs > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-800">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>+{selectedScan.cashbackRewardUzs.toLocaleString()} UZS</span>
              </div>
            )}
          </div>

          {/* Raw Text */}
          <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3.5 space-y-1">
            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              <span>{TXT.rawTextTitle[lang]}</span>
            </div>
            <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
              {selectedScan.rawTextPreview}
            </pre>
          </div>

          {/* Extracted Items */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-700">{TXT.itemsTitle[lang]}</div>

            {isScanning ? (
              <div className="py-10 text-center text-xs text-teal-700 font-semibold animate-pulse">
                AI...
              </div>
            ) : (
              selectedScan.extractedItems.map((item, idx) => {
                const isBlocked = item.status === 'blocked_fake';
                return (
                  <div
                    key={idx}
                    className={`rounded-xl border p-3.5 ${
                      isBlocked
                        ? 'border-rose-200 bg-rose-50/50'
                        : 'border-teal-200 bg-teal-50/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          {isBlocked ? (
                            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                          ) : (
                            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                          )}
                          <span>{item.productName[lang]}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {TXT.medianLbl[lang]}{' '}
                          <span className="font-mono font-semibold text-slate-700">
                            {item.marketMedianPrice.toLocaleString()} UZS
                          </span>{' '}
                          · {TXT.diffLbl[lang]}{' '}
                          {item.deviationPct > 0 ? `+${item.deviationPct}%` : `${item.deviationPct}%`}
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`font-mono text-base font-bold ${
                            isBlocked ? 'text-rose-600 line-through' : 'text-teal-700'
                          }`}
                        >
                          {item.extractedPrice.toLocaleString()} UZS
                        </div>
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            isBlocked
                              ? 'bg-rose-600 text-white'
                              : 'bg-teal-600 text-white'
                          }`}
                        >
                          {isBlocked ? TXT.blockedBadge[lang] : TXT.verifiedBadge[lang]}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`mt-2 text-xs font-medium ${
                        isBlocked ? 'text-rose-700' : 'text-teal-800'
                      }`}
                    >
                      {item.statusNote[lang]}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {hasVerifiedItems && (
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleCommitToIndex}
                disabled={isAlreadyApplied}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition cursor-pointer ${
                  isAlreadyApplied
                    ? 'bg-teal-50 border border-teal-200 text-teal-700'
                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isAlreadyApplied
                    ? `✓ ${TXT.committedBtn[lang]}`
                    : `${TXT.commitBtn[lang]} (+${selectedScan.cashbackRewardUzs.toLocaleString()} UZS)`}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
