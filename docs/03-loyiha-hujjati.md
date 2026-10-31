# 3-Loyiha hujjati — MarketPulse B2B

**Lumora IT Case Competition · Case D: Smart Market Prices · 31-oktabr 2026, Toshkent**
**AICA × AI Alliance · 100 ballik rubrika bo'yicha to'liq yechim**

> Ushbu hujjat [`02-master-prompt.md`](02-master-prompt.md) dagi master prompt bajarilishi natijasi.
> Prototip: [`../app/index.html`](../app/index.html) — barcha 12 bo'limdagi raqamlar va modullar demo ilovada ko'rsatilgan.

## Rubrika bo'yicha xarita

| # | Bo'lim | Ball | Hujjatdagi joy |
|---|---|---|---|
| A1 | Mission, Vision & Value Proposition | 10 | [1](#1-missiya-vizyon-va-qiymat-taklifi-10-ball) |
| A2 | Market Analysis (TAM/SAM/SOM) | 10 | [2](#2-bozor-tahlili-va-raqobat-muhiti-10-ball) |
| A3 | Target Users & Adoption | 5 | [3](#3-maqsadli-foydalanuvchilar-va-qamrab-olish-strategiyasi-5-ball) |
| A4 | Product Roadmap | 10 | [4](#4-mahsulot-roadmapi-10-ball) |
| A5 | Monetization | 10 | [5](#5-monetizatsiya-strategiyasi-10-ball) |
| A6 | Go-To-Market | 5 | [6](#6-go-to-market-va-o'sish-kanallari-5-ball) |
| B7 | 3-Year Financials & KPIs | 10 | [7](#7-3-yillik-moliyaviy-prognoz-va-kpi-10-ball) |
| B8 | Risks & Mitigation | 5 | [8](#8-xatarlar-va-ularni-yumshatish-5-ball) |
| B9 | Prototype Architecture | 10 | [9](#9-prototip-va-demo-arxitekturasi-10-ball) |
| B10 | UI Wireframes | 5 | [10](#10-namunaviy-ekranlar-va-ui-wireframe-5-ball) |
| B11 | Killer Flow | 15 | [11](#11-killer-flow-15-ball) |
| B12 | New Feature | 5 | [12](#12-yangi-ai-funksiya-5-ball) |

---

# PART A: STRATEGY & BUSINESS (50 ball)

## 1. Missiya, vizyon va qiymat taklifi (10 ball)

**Platforma nomi:** MarketPulse B2B (loyiha kodi: *Smart Market Prices*).

### 1.1. Missiya
O'zbekistondagi har bir tadbirkorga real vaqt rejimida shaffof, xolis va tahlil qilingan bozor narxlari hamda talab-taklif ko'rsatkichlarini taqdim etish orqali xaridor va yetkazib beruvchi o'rtasidagi **tranzaksion xarajatlarni 30% ga kamaytirish** va xaridlardagi narx farqini (15–40%) **5% ichida** ushlab turish.

### 1.2. Vizyon (5 yil)
Markaziy Osiyodagi eng yirik AI-boshqariladigan B2B narx analitikasi va avtomatlashtirilgan xaridlar ekotizimi: 2031-yilga qadar 4 davlat, 50 000 korporativ xaridor, 120 000 dan ortiq indekslangan SKU va yillik 400 mlrd UZS hajmli xarid aylanmasini tahlil qilish.

### 1.3. Value Proposition Canvas

| Bo'lim | Xaridor (KOB ta'sischi, xaridlar menejeri) | Yetkazib beruvchi (ulgurji sotuvchi) |
|---|---|---|
| **Jobs** | Kerakli tovarni eng maqbul narxda, tez va ishonchli topish; byudjetni himoya qilish; hisobot uchun asos | Yangi B2B mijozlar topish; raqobatchi narxini bilish; ortiqcha zaxirani sotish |
| **Pains** | Narxlar tarqoq, 3–5 kunga cho'zilgan qo'lda solishtirish, "yashirin" narxlar, QQS noaniqligi, ishonchsiz ta'minotchi | Talab prognozi yo'q, narxni asossiz tushirish bosimi, mijozlar faqat shaxsiy aloqalar orqali |
| **Gains** | Yagona dashboardda 100 000+ SKU bo'yicha real narx, QQS bilan/QQSsiz ajratilgan ko'rinish, ta'minotchi reytingi, avtomatik muzokara skripti | Bozor talabining real hajmi, dynamic pricing tavsiyasi, malakali xaridorlar oqimi, verified badge |
| **Products & Services** | Narx indeksi, taqqoslash moduli, analitik hisobot, AI negotiator, shartnoma shabloni | Listing, talab prognozi, narx benchmark, lead-generatsiya |
| **Pain relievers** | 3 kundan 15 daqiqaga qisqargan xarid sikli; o'rtacha 11–18% tejamkorlik | Narx xatosini 40% ga kamaytiradigan benchmark; bo'sh turgan zaxirani sotish |
| **Gain creators** | Xarid bo'yicha avtomatik audit-trail va tejamkorlik hisoboti (bosh buxgalter uchun) | Daromadning 20–25% o'sishi (yangi kanal hisobiga) |

**Bir jumlalik qiymat taklifi:** *"MarketPulse B2B — bir xil tovar uchun bozordagi 15–40% narx farqini 15 daqiqada ko'rinadigan qiladi va AI yordamida eng maqbul shartnomani tuzishga olib boradi."*

### 1.4. Nima uchun aynan hozir (Why now)
- EHF/Didox raqamlashtirilishi narx ma'lumotlarining **qonuniy va verifikatsiya qilinadigan** manbasini yaratdi.
- 2026-yilda startap ekotizimi $4.3 mlrd, 950+ startap, 22 venchur fond — B2B SaaS uchun kapital mavjud.
- PQ-59 (11.02.2026) davlat xaridlari va raqamli iqtisodni rag'batlantirmoqda.
- LLM narxlarining 18 oyda ~10 barobar arzonlashishi (inference cost) B2B analitikani iqtisodiy foydali qildi.

---

## 2. Bozor tahlili va raqobat muhiti (10 ball)

### 2.1. TAM / SAM / SOM (UZS)

| Daraja | Ta'rif | Hisoblash | Hajm (yillik) |
|---|---|---|---|
| **TAM** | O'zbekistondagi 500 000+ faol biznes subyektining B2B xaridlari va ularga xizmat ko'rsatuvchi analitik dasturiy ta'minot bozori | 500 000 × o'rtacha 2.4 mln UZS/yil raqamli xarid xarajati | **1.2 trln UZS** |
| **SAM** | Raqamlashtirilgan, EHF/bank billingdan faol foydalanuvchi KOB va yirik korxonalar segmenti | 145 000 korxona × 2.4 mln UZS | **350 mlrd UZS** |
| **SOM** | 3 yilda egallanadigan B2B SaaS + analitik xizmatlar ulushi (SAMning ~12%) | 3 400 obunachi × 1.03 mln UZS × 12 | **42 mlrd UZS** (2029) |

Qo'shimcha hajm manbalari: xarid hajmi bo'yicha tranzaksion komissiya (0.15%), sponsor listing, ma'lumot API'lari.

### 2.2. Raqobat xaritasi

| O'yinchi | Model | Kuchli tomon | Zaif tomon | MarketPulse ustunligi |
|---|---|---|---|---|
| **B2BMAP** | B2B e'lonlar katalogi | Katta katalog, brend tanilganligi | Narx real vaqtda yangilanmaydi, analitika yo'q | AI narx indeksi + entity matching |
| **Bigmart** | Korporativ xarid / marketplace ($200k investitsiya) | Logistika va to'lov infratuzilmasi | Narx benchmark yo'q, faqat o'z sotuvchilari | Bozorning butun kesimi (neytrallik) |
| **An'anaviy vositachilar** | Qo'lda sotib olish, Telegram guruhlari | Moslashuvchanlik, shaxsiy aloqa | 15–40% narx farqi, shaffoflik yo'q | 15 daqiqada avtomatik taqqoslash |
| **1C / ERP modullari** | Ichki xarid boshqaruvi | Kuchli ichki jarayon | Tashqi bozor narxini bilmaydi | Tashqi benchmark integratsiyasi (API) |
| **Xalqaro (Zoho, Coupa)** | Enterprise procurement | Funksionallik chuqur | UZS/EHF/QQS moslashuvi yo'q, narxi yuqori | Mahalliy soliq/valyuta mosligi |

**Pozitsiyalash:** *"Narx ma'lumotlarining neytral operatori"* — biz sotuvchi emasmiz, shuning uchun benchmark ishonchli.

### 2.3. Raqobatbardosh ustunliklar (moat)
1. **Ma'lumot tarmog'i effekti** — har bir yangi yetkazib beruvchi indeks aniqligini oshiradi.
2. **Tarixiy narx ma'lumotlari** — 18 oydan keyin prognoz modeli faqat bizda.
3. **EHF/Didox integratsiyasi** — verifikatsiya qilingan, qalbaki bo'lmagan narxlar.
4. **Mahalliy moslashuv** — UZS, 12% QQS, o'zbek/rus tillari, mahalliy to'lov tizimlari.
5. **AI negotiator** — faqat ma'lumot emas, natija (tejangan so'm) sotamiz.

---

## 3. Maqsadli foydalanuvchilar va qamrab olish strategiyasi (5 ball)

### 3.1. Persona 1 — KOB ta'sischisi ("Akmal", 34 yosh, mebel ishlab chiqarish)
- **Maqsad:** xomashyo xarajatini 10% kamaytirish, ta'minotchi narxni oshirib yubormaganini bilish.
- **Xatti-harakat:** Telegram, mobil; kuniga 20 daqiqa.
- **Pain:** 3 ta ta'minotchidan narx so'rash uchun 2 kun ketadi.
- **Yechim:** mobil indeks + "Narx ogohlantirish" (alert) + 1 klikda taqqoslash. **Free → Business** konversiya.

### 3.2. Persona 2 — Xaridlar menejeri ("Nigora", 28 yosh, oziq-ovqat distribyutori)
- **Maqsad:** 40+ ta'minotchi o'rniga yagona dashboard, haftalik 30 dan ortiq xarid.
- **KPI:** xarid sikli vaqti, tejamkorlik %.
- **Yechim:** Pro Analytics + RFQ avtomatizatsiyasi + AI negotiator. **Asosiy ARPU manbasi.**

### 3.3. Persona 3 — Bosh buxgalter / moliya direktori ("Dilnoza", 41 yosh)
- **Maqsad:** QQS bilan/QQSsiz to'g'ri hisob, audit uchun asos, xarid byudjeti nazorati.
- **Yechim:** QQS ajratilgan narx ko'rinishi, Excel/1C eksport, tejamkorlik bo'yicha avtomatik hisobot, rol-asosli ruxsat.

### 3.4. Persona 4 — Yetkazib beruvchi ("Rustam", 38 yosh, ulgurji qurilish materiallari)
- **Maqsad:** yangi B2B mijozlar, raqobatchi narxini bilish.
- **Yechim:** Verified supplier profil, narx benchmark, lead oqimi, birinchi 3 oy bepul.

### 3.5. Adoption strategy (AARRR)

| Bosqich | Taktika | Ko'rsatkich |
|---|---|---|
| **Acquisition** | IT Park rezidentlari, Savdo-sanoat palatasi, biznes assotsiatsiyalar, Telegram B2B guruhlari, SEO ("narx qancha turadi" so'rovlari) | CAC 1.6–2.4 mln UZS |
| **Activation** | 1-kirishda "birinchi taqqoslash" — 3 klikda natija; demo ma'lumot bilan onboarding | 7 kunlik aktivatsiya 55% |
| **Retention** | Narx alert, haftalik "Bozor dampingi" hisoboti, ERP/1C integratsiya | M3 retention 62% |
| **Revenue** | Free → Business (14 kun trial), yillik to'lovda 2 oy bepul | Trial→paid 28% |
| **Referral** | Har bir taklif qilingan korxona uchun 1 oy bepul; hamkor-konsultantlarga 20% komissiya | NPS ≥ 45 |

**Ishontirish (trust) strategiyasi:** narx manbasi shaffof ko'rsatiladi (EHF / ommaviy прайс / portal), *"manba"* belgisi har bir narx yonida; metodologiya ochiq hujjatlashtiriladi; "neytral operator" pozitsiyasi.

---

## 4. Mahsulot roadmapi (10 ball)

| Bosqich | Davr | Asosiy imkoniyatlar | Texnik ish | Muvaffaqiyat mezoni |
|---|---|---|---|---|
| **P0 — MVP: Price Index** | 2027 Q1–Q2 | 5 000 SKU indeksi, taqqoslash jadvali, QQS almashtirgichi, 200 verified ta'minotchi, Telegram bot | Scraper (Playwright), parsing pipeline, PostgreSQL + pgvector, Next.js | 150 obunachi, indeks aniqligi ≥ 92% |
| **P1 — Dynamic Analytics** | 2027 Q3–2028 Q2 | Narx tarixi va trend, alert, RFQ moduli, supplier reytingi, Excel/1C eksport, Pro API | TimescaleDB, indeks hisoblash dvigateli, notification servisi, RBAC | 800 obunachi, NRR 105% |
| **P2 — AI Predictive Procurement** | 2028 Q3–2029 Q2 | 90 kunlik talab prognozi, dynamic pricing tavsiyasi, AI negotiator, avtomatik shartnoma loyihasi | Forecasting (Prophet/LightGBM + LLM), negotiation agent, e-imzo integratsiyasi | 2 200 obunachi, AI modulidan foydalanish 45% |
| **P3 — Ecosystem & Regional** | 2029 Q3–2030 | EHF bilan ikki tomonlama integratsiya, marketplace, kredit-skoring, Qozog'iston/Qirg'iziston | Multi-tenant, i18n, lokalizatsiya, ochiq API | 3 400 obunachi, 2 ta yangi bozor |

Har bir bosqich oxirida **GO/NO-GO** darvozasi: aktivatsiya ≥ 50%, churn ≤ 6%/oy, indeks aniqligi ≥ 92%.

---

## 5. Monetizatsiya strategiyasi (10 ball)

### 5.1. Daromad manbalari

| # | Manba | Tavsif | Daromaddagi ulush (2029) |
|---|---|---|---|
| 1 | **SaaS obuna** | Business / Pro / Enterprise tariflar | 62% |
| 2 | **Pro Analytics API** | Narx indeksi, tarix va prognoz API'si (per-call + oylik limit) | 18% |
| 3 | **Sponsorlik / B2B Listing** | Kategoriya sahifasida ustuvor joylashuv, "Top supplier" bloklari | 11% |
| 4 | **Verification Badge** | Yuridik tekshiruv + EHF tarixi asosida "Verified" belgisi | 5% |
| 5 | **Xizmatlar** | Xarid auditi, konsalting, custom integratsiya | 4% |

### 5.2. Tariflar jadvali (UZS, oyiga, QQSdan tashqari; QQS 12% ustiga qo'shiladi)

| Tarif | Narx (oy/QQSsiz) | QQSilgan yakuniy | Foydalanuvchi | Limitlar | Kim uchun |
|---|---|---|---|---|---|
| **Basic Index** | 0 | 0 | 1 | 50 ko'rish/oy, tarix 30 kun | Sinov, mikro biznes |
| **Business** | 499 000 | 558 880 | 3 | Cheksiz ko'rish, alert 20 ta, Excel eksport | KOB ta'sischisi |
| **Pro Analytics** | 1 490 000 | 1 668 800 | 10 | API 10 000 call/oy, RFQ, prognoz, negosiator | Xaridlar bo'limi |
| **Enterprise** | 4 900 000 dan | 5 488 000 dan | Cheksiz | SLA 99.9%, SSO, on-premise/private cloud, 1C/SAP | Yirik korporatsiya |

- Yillik to'lov: **2 oy bepul** (16.7% chegirma).
- Supplier tarifi: 299 000 UZS/oy (birinchi 3 oy bepul).
- API overdraft: 100 000 UZS / 1 000 call.
- Enterprise onboarding: 12 000 000 UZS bir martalik (integratsiya).

**Narx mantiqi:** Business tarifi bitta xarid jarayonida tejalgan o'rtacha 1.9 mln UZS evaziga o'zini 4 barobar qoplaydi (*value-based pricing*).

### 5.3. Unit economics

| Ko'rsatkich | 2027 | 2028 | 2029 |
|---|---|---|---|
| ARPU (oy/QQSsiz) | 920 000 | 980 000 | 1 030 000 |
| Gross margin | 88% | 88% | 88% |
| Oylik churn | 6.5% | 5.5% | 4.5% |
| LTV = ARPU×GM/churn | 12.45 mln | 15.68 mln | 20.14 mln |
| CAC | 2.40 mln | 2.00 mln | 1.60 mln |
| **LTV/CAC** | **5.2×** | **7.8×** | **12.6×** |
| CAC payback | 11 oy | 8 oy | 6 oy |

---

## 6. Go-To-Market va o'sish kanallari (5 ball)

### 6.1. Kanallar

| Kanal | Harakat | 12 oylik maqsad (2027) | CAC hissasi |
|---|---|---|---|
| **IT Park ekotizimi** | Rezidentlik, demo-days, startap akseleratorlari bilan hamkorlik | 90 mijoz | 22% |
| **Savdo-sanoat palatasi / assotsiatsiyalar** | A'zolarga 3 oy chegirma, vebinar seriyasi | 70 mijoz | 18% |
| **EHF/Didox hamkorligi** | Integratsiya → "narxni solishtirish" tugmasi operatorlar kabinetida | 60 mijoz | 14% |
| **Telegram B2B hamjamiyatlari** | Bot + haftalik bozor dampengi, foydali kontent | 40 mijoz | 10% |
| **SEO / kontent** | "X narxi qancha?", "qurilish materiallari narxlari" kalkulyatorlari | 35 mijoz | 12% |
| **Direct sales (Enterprise)** | 5 kishilik sotuv jamoasi, yirik korporatsiyalar | 8 shartnoma | 18% |
| **Hamkor-konsultantlar** | Buxgalter va konsalting firmalariga 20% komissiya | 25 mijoz | 6% |

### 6.2. GTM ketma-ketligi
1. **Toshkent piloti** (2027 Q1): qurilish materiallari, oziq-ovqat, qadoqlash — 3 kategoriya, 500 ta'minotchi.
2. **Vertikal kengaytirish** (2027 Q3): logistika, ofis jihozlari, IT-hardware.
3. **Regional** (2028 Q2): Samarqand, Buxoro, Farg'ona — hamkor-franchayzi modeli.
4. **Eksport** (2029 Q3): Qozog'iston (UZS → KZT lokalizatsiya).

**Funnel ko'rsatkichlari:** MQL → SQL 35%, SQL → trial 60%, trial → paid 28%.

---

# PART B: PRODUCT & INNOVATION (50 ball)

## 7. 3-yillik moliyaviy prognoz va KPI (10 ball)

### 7.1. P&L prognozi (mlrd UZS; 1 AQSh dollari = 12 700 UZS, 2026 kursi)

| Ko'rsatkich | 2027 | 2028 | 2029 |
|---|---|---|---|
| To'lovchi obunachilar (yil oxiri) | 290 | 1 150 | 3 400 |
| **Daromad (Revenue)** | **3.20** | **13.50** | **42.00** |
| COGS (data, scraping, cloud, API 12%) | 0.38 | 1.62 | 5.04 |
| **Gross profit** | **2.82** | **11.88** | **36.96** |
| OPEX — jamoa (18 → 34 → 78 kishi) | 3.00 | 6.10 | 14.50 |
| OPEX — marketing va sotuv | 1.20 | 2.80 | 7.00 |
| OPEX — infratuzilma va data | 0.60 | 1.20 | 3.00 |
| OPEX — ofis, yuridik, boshqa | 0.80 | 0.90 | 2.00 |
| **Jami OPEX** | **5.60** | **11.00** | **26.50** |
| **EBITDA** | **(2.78)** | **0.88** | **10.46** |
| Amortizatsiya | 0.45 | 0.86 | 2.50 |
| **EBIT** | **(3.23)** | **0.02** | **7.96** |
| Foyda solig'i (15%) | 0 | 0 | 1.19 |
| **Sof foyda (Net profit)** | **(3.23)** | **0.02** | **6.77** |
| CAPEX (server, litsenziya, ofis) | 1.40 | 2.10 | 4.00 |
| **Erkin pul oqimi (FCF)** | **(4.63)** | **(2.08)** | **2.77** |

**Moliyalashtirish ehtiyoji:** Seed $600 000 (~7.6 mlrd UZS) — 2027 yilgi operatsion zarar va CAPEXni qoplaydi; 2028 Q4da EBITDA musbat, 2029 Q2da FCF musbat.

### 7.2. KPI paneli

| KPI | 2027 | 2028 | 2029 | Benchmark |
|---|---|---|---|---|
| MRR o'sishi (oylik) | 12% | 9% | 7% | B2B SaaS 6–10% |
| ARPU (oy) | 920k | 980k | 1 030k | — |
| Gross margin | 88% | 88% | 88% | 75–85% |
| CAC | 2.40 mln | 2.00 mln | 1.60 mln | — |
| LTV/CAC | 5.2× | 7.8× | 12.6× | ≥ 3× |
| Oylik churn | 6.5% | 5.5% | 4.5% | ≤ 5% |
| NRR | 95% | 108% | 118% | ≥ 100% |
| Indekslangan SKU | 5 000 | 42 000 | 120 000 | — |
| Verified ta'minotchi | 200 | 1 800 | 6 500 | — |
| Platforma orqali tejalgan summa (mijozlar bo'yicha jami) | 1.1 mlrd | 8.4 mlrd | 29.0 mlrd | — |
| NPS | 38 | 45 | 52 | ≥ 40 |

### 7.3. Moliyaviy model formulalari
```
MRR        = Σ (obunachilar_tarif × tarif_narxi)
ARR        = MRR × 12
CAC        = (sotuv + marketing xarajati) / yangi mijozlar
LTV        = ARPU × gross_margin / oylik_churn
Payback    = CAC / (ARPU × gross_margin)
FCF        = EBITDA − CAPEX − soliq
QQS_summa  = narx_net × 0.12
```

---

## 8. Xatarlar va ularni yumshatish (5 ball)

| # | Xatar | Ehtimol | Ta'sir | Yumshatish chorasi | Egasi |
|---|---|---|---|---|---|
| 1 | **Ma'lumot sifati / scraping bloklanishi** | Yuqori | Yuqori | 3 kanalli arxitektura (ommaviy прайс, hamkor API, EHF), proxy pool, huquqiy shartnomalar, foydalanuvchi kontributsiyasi + moderatsiya | CTO |
| 2 | **Yetkazib beruvchilar narxni yashirishi** | Yuqori | O'rta | Anonim benchmark, "narx bermagan" ta'minotchi reytingi pasayadi, gamifikatsiya, verified badge imtiyozi | CPO |
| 3 | **Huquqiy: ma'lumotlardan foydalanish / raqobat qonuni** | O'rta | Yuqori | Faqat ommaviy va shartnomaviy ma'lumotlar; agregatsiya (individual shartnoma shartlari oshkor qilinmaydi); yuridik audit; "Maxfiylik siyosati" va foydalanish shartlari | Legal |
| 4 | **Valyuta/soliq qoidasi o'zgarishi (LRU-573, QQS)** | Past | O'rta | Soliq qoidalari modul sifatida (konfiguratsiya), 12% QQS parametrlashtirilgan, monitoring | CFO |
| 5 | **Raqobatchi (Bigmart/B2BMAP) narx urushi** | O'rta | O'rta | Neytral operator pozitsiyasi, ma'lumot chuqurligi, API ekotizimi, hamkorlik taklifi | CEO |
| 6 | **AI xatosi (noto'g'ri entity matching)** | O'rta | Yuqori | Inson tasdiqlash (human-in-the-loop), ishonch chegarasi < 0.85 → moderatsiya, benchmark to'plami, oylik anomaliya auditi | Head of AI |
| 7 | **Kadrlar (AI/ML mutaxassislari tanqisligi)** | Yuqori | O'rta | IT Park grantlari, universitet hamkorligi, masofaviy jamoalar, ESOP | HR |
| 8 | **Kiberxavfsizlik / ma'lumot sizib chiqishi** | Past | Juda yuqori | SOC2-roadmap, shifrlash (at-rest/in-transit), RBAC, pentest, audit-log, zaxira (RPO 1 soat) | CISO |
| 9 | **DB texnik qarzi (monolit)** | O'rta | O'rta | Modulli monolit → servislarga bosqichma-bosqich ajratish, DDD chegaralari | CTO |

**Risk matritsasi (qisqa):**
```
Ta'sir
 Yuqori |  #1        #3
 O'rta  |  #2 #7     #5 #6
 Past   |  #4        #8
        +----------------------
          Past  O'rta  Yuqori  → Ehtimol
```

---

## 9. Prototip va demo arxitekturasi (10 ball)

### 9.1. Yuqori darajali arxitektura

```
┌──────────────────────────────────────────────────────────────────────┐
│  MIJOZ QATLAMI                                                      │
│  Next.js 14 (web) · React Native (mobil) · Telegram bot · Public API │
└─────────────────────────────┬────────────────────────────────────────┘
                              │ HTTPS / REST / WebSocket
┌─────────────────────────────▼────────────────────────────────────────┐
│  API GATEWAY (Kong / Nginx) — auth, rate limit, audit log            │
└───────┬───────────────┬────────────────┬───────────────┬─────────────┘
        │               │                │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌───────▼──────┐ ┌──────▼──────────┐
│ narx servisi │ │ RFQ/Shart-  │ │ analitika/   │ │ billing &       │
│ (FastAPI)    │ │ noma servisi│ │ prognoz      │ │ obuna (Payme,   │
│              │ │             │ │ servisi      │ │ Click, Uzum)    │
└───────┬──────┘ └──────┬──────┘ └───────┬──────┘ └──────┬──────────┘
        │               │                │               │
┌───────▼───────────────▼────────────────▼───────────────▼──────────┐
│  DATA & AI QATLAMI                                                │
│  • Ingestion: Playwright/Scrapy, EHF(Didox) API, supplier portal  │
│  • AI Parsing: GPT-4o-mini (struktura), embeddings + pgvector     │
│  • Entity Matching: fuzzy + vektor + LLM verifikator              │
│  • Indeks dvigateli: median, MAD, MPI (kunlik batch)              │
│  • Prognoz: Prophet / LightGBM + LLM izohi                        │
│  • Negotiator agent: LLM + narx konteksti + qoidalar (guardrail)  │
└───────┬──────────────────────────────────────────────────────────┘
        │
┌───────▼──────────────────────────────────────────────────────────┐
│  SAQLASH: PostgreSQL 16 (+pgvector) · TimescaleDB (narx tarixi)    │
│  Redis (cache/queue) · S3/MinIO (fayllar) · ClickHouse (analitika)│
└──────────────────────────────────────────────────────────────────┘
Infra: Docker + K8s, GitHub Actions CI/CD, Prometheus/Grafana, Sentry
```

### 9.2. Ma'lumot yig'ish (Data Collection)

| Manba | Usul | Chastota | Ishonch darajasi |
|---|---|---|---|
| Hamkor ta'minotchilar portali | REST API / CSV yuklash | Real vaqt | 0.95 |
| Ommaviy прайс-listlar | Scrapy + Playwright, o'zgarish diff | 6 soatda | 0.70 |
| EHF / Didox (kelishilgan doirada) | Operator API, agregatsiya | Kuniga | 0.98 |
| Foydalanuvchi kvitansiyalari | OCR + moderatsiya | Real vaqt | 0.85 |
| Davlat xaridlari portali | Ochiq ma'lumotlar | Kuniga | 0.90 |

**Etika va huquq:** robots.txt hurmati, faqat ommaviy narxlar, shaxsiy ma'lumotlar yig'ilmaydi, manba har doim ko'rsatiladi.

### 9.3. Entity Matching Engine (eng kritik komponent)
1. **Normallashtirish** — birlik (kg/l/dona), brend, model, o'lcham ajratish; o'zbek/rus sinonimlar lug'ati.
2. **Kandidat qidirish** — `pgvector` bo'yicha top-20 (embedding: `text-embedding-3-small`).
3. **Skorlash** — fuzzy (token-set ratio) 40% + vektor 40% + atribut mosligi 20%.
4. **LLM verifikator** — chegara holatlar (0.70–0.90) uchun "bir xil tovarmi?" savoli.
5. **Human-in-the-loop** — < 0.70 → moderatsiya navbati.

```python
score = 0.4 * fuzzy_ratio(a, b) + 0.4 * cosine(emb_a, emb_b) + 0.2 * attr_match(a, b)
# score >= 0.90 → avtomatik birlashtirish
# 0.70 <= score < 0.90 → LLM verifikator
# score < 0.70 → yangi SKU / moderatsiya
```

### 9.4. Narx indeksi hisoblash
```
MPI_t = 100 × Σ_c [ w_c × ( median(P_c,t) / median(P_c,0) ) ]
w_c   = kategoriya xarid hajmi ulushi
Fair band: [median − 1.5×MAD ; median + 1.5×MAD]
Spread% = (P_max − P_min) / P_min × 100
P_net   = P_gross / 1.12
```

### 9.5. Texnologik stack
| Qatlam | Tanlov | Sabab |
|---|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind, Recharts | SSR/SEO, tez MVP |
| Backend | Python FastAPI, Pydantic, SQLAlchemy | AI ekosistemiga yaqinlik |
| AI | GPT-4o-mini (parsing/negotiator), text-embedding-3-small | Narx/sifat balansi; lokal fallback: Qwen2.5-7B |
| DB | PostgreSQL 16 + pgvector, TimescaleDB, ClickHouse | Tranzaksion + vaqt seriyasi + analitika |
| Infra | Docker, Kubernetes (Yandex Cloud / AWS), GitHub Actions | Skalabillik, lokal hosting imkoniyati |
| Monitoring | Prometheus, Grafana, Sentry, Loki | SLA 99.9% |

### 9.6. Demo (ushbu repo)
`app/` papkasidagi statik prototip: 60 SKU, 12 ta'minotchi, real vaqtga o'xshash narx oqimi, QQS almashtirgichi, 8 bosqichli Killer Flow va AI Negotiator. Hech qanday backend talab qilmaydi (offline demo uchun ideal).

---

## 10. Namunaviy ekranlar va UI wireframe (5 ball)

### 10.1. Ekran 1 — Dashboard
```
┌───────────────────────────────────────────────────────────────┐
│ MarketPulse B2B      [Qidiruv: mahsulot, brend, SKU...]  👤   │
├───────────────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│ │ MPI indeks│ │ Tejamkorlik│ │ Faol      │ │ Narx farqi│       │
│ │ 104.7 ▲2.1│ │ 1.9 mln   │ │ ta'minotchi│ │ 27.4%    │       │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘       │
│ ┌─────────────────────────────┐ ┌───────────────────────────┐ │
│ │ Narx indeksi (90 kun)       │ │ Top kategoriyalar         │ │
│ │  ╱╲    ╱╲                   │ │ Qurilish   +4.2%          │ │
│ │ ╱  ╲__╱  ╲__▲               │ │ Oziq-ovqat −1.1%          │ │
│ └─────────────────────────────┘ └───────────────────────────┘ │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ Narx o'zgarishlari (live): sement +2 000, ...             │ │
│ └───────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

### 10.2. Ekran 2 — Narxlarni taqqoslash moduli
```
┌───────────────────────────────────────────────────────────────┐
│ ◀ Orqaga · Qurilish materiallari · Sement M400 (50 kg)        │
│ [✓] QQS bilan ko'rsatish        Hudud: [Toshkent ▾]           │
├───────────────────────────────────────────────────────────────┤
│ Ta'minotchi      Narx (net)  QQS   Yakuniy   Reyting  Muddat  │
│ ───────────────────────────────────────────────────────────── │
│ ★ SementGroup     62 000   7 440   69 440   4.8/5   1 kun   │  ← ENG ARZON
│   BuildMax        68 500   8 220   76 720   4.5/5   2 kun   │
│   QuruqQurilish   71 000   8 520   79 520   4.2/5   3 kun   │
├───────────────────────────────────────────────────────────────┤
│ Median 68 500 · Spread 14.5% · Fair band 60 500 – 76 000     │
│ [AI Negotiator bilan muzokara]   [Excel'ga eksport]           │
│ Tejamkorlik: eng qimmatdan 10 080 UZS (12.7%)                 │
└───────────────────────────────────────────────────────────────┘
```

### 10.3. Ekran 3 — Analitik hisobot
```
┌───────────────────────────────────────────────────────────────┐
│ Haftalik xarid hisoboti (09.10–16.10.2026)                     │
├───────────────────────────────────────────────────────────────┤
│ Xaridlar: 34 ta · Summa: 412.6 mln UZS · Tejamkorlik: 48.2 mln│
│ ┌────────────────────────┐ ┌────────────────────────────────┐ │
│ │ Kategoriya bo'yicha    │ │ Narx trendi (sement)           │ │
│ │ [stacked bar chart]    │ │ [line chart with threshold]    │ │
│ └────────────────────────┘ └────────────────────────────────┘ │
│ Ogohlantirishlar: 3 ta narx oshdi (>5%) · 1 ta'minotchi kechikdi│
│ [PDF yuklab olish] [1C'ga yuborish]                            │
└───────────────────────────────────────────────────────────────┘
```

**UX qoidalari:** bir ekranda bitta asosiy qaror; har bir narx yonida manba ikonkasi; QQS holati doim ko'rinadi; mobil-birinchi; o'zbek va rus tillari.

---

## 11. Killer Flow (15 ball)

> Maqsad: xaridor 15 daqiqada eng maqbul shartnomaga keladi. Har bir qadamda tizim harakati, chiqish artefakti va o'lchanadigan natija ko'rsatilgan.

| # | Qadam | Foydalanuvchi harakati | Tizim harakati | Natija / artefakt | SLA | KPI |
|---|---|---|---|---|---|---|
| **1** | **Muammoni aniqlash** | Tovar nomini kiritadi: "Sement M400 50 kg, 2 000 qop, Toshkent, 2 hafta" | NLP orqali SKU, hajm, hudud, muddatni ajratadi; entity matching | Tasdiqlangan so'rov kartasi (RFQ draft) | < 5 s | So'rovni aniqlash aniqligi ≥ 95% |
| **2** | **Bozor skaneri** | "Bozorni skanerlash" | 12 ta'minotchidan real vaqt narxlarini yig'adi; QQSni ajratadi; eskirgan narxlarni belgilaydi | 3–12 ta taklif, verifikatsiya holati bilan | < 15 s | Qamrov ≥ 3 taklif |
| **3** | **Narx tahlili** | Taqqoslash jadvalini ko'radi | Median, spread, fair-price band, tarixiy trend, anomaliya aniqlash | Narx landshafti + "bu narx qimmatmi?" bahosi | < 3 s | Anomaliya topish ≥ 90% |
| **4** | **Ta'minotchi saralash** | Reyting, yetkazish muddati, to'lov sharti filtrlari | Reyting = sifat 40% + muddat 30% + narx 20% + tarix 10%; risk bayroqlari | Saralangan shortlist (top-3) | < 2 s | Shortlist aniqligi ≥ 90% |
| **5** | **AI muzokara** | "AI Negotiatorni ishga tushirish" | Maqsadli narxni hisoblaydi (median − leverage), muzokara skripti, savdo tili, alternativa (BATNA) | Muzokara rejasi + xat matni (o'zbek/rus) | < 20 s | O'rtacha 5–11% qo'shimcha chegirma |
| **6** | **Shartnoma loyihasi** | Taklifni tanlaydi, shartlarni tasdiqlaydi | Shartnoma shabloni (yetkazish, jarima, to'lov grafigi, QQS 12%), e-imzo uchun tayyorlaydi | Shartnoma drafti (PDF/DOCX) + solishtirma akt | < 30 s | Yuridik xatolar ≤ 2% |
| **7** | **Buyurtma va kuzatish** | Buyurtmani tasdiqlaydi | Zakaz EHF/1C bilan bog'lanadi, yetkazish kuzatuvi, ogohlantirishlar | Buyurtma raqami, trek, kutilayotgan sana | < 1 daq | Yetkazish SLA 92% |
| **8** | **Natijani o'lchash** | Hisobotni ko'radi | Tejamkorlikni hisoblaydi (boshlang'ich median vs yakuniy narx), audit-trail saqlaydi, benchmarkini yangilaydi | Tejamkorlik akti, dashboardga yozuv, NPS so'rovi | < 5 s | Tejamkorlik 11–18% |

**End-to-end natija:** 3–5 kunlik qo'lda xarid → **15 daqiqa**; o'rtacha tejamkorlik **1.9 mln UZS / bitta xarid**; 100% audit-trail.

**Fallback ssenariylari:**
- Taklif 3 tadan kam → "Chegara" rejimi: tarixiy median + bozor dampengi asosida baholash.
- Ta'minotchi javob bermasa → avtomatik eslatma (24 soat), keyin keyingi shortlist.
- Narx anomaliyasi → human moderatsiya navbati + foydalanuvchiga "tekshirilmoqda" belgisi.

---

## 12. Yangi AI funksiya (5 ball)

### AI Smart Procurement Negotiator (ASPN)

**Muammo:** Narxni bilish yetarli emas — xaridor muzokara olib borishga vaqt va ko'nikma topa olmaydi; o'rtacha 8–14% chegirma "stolda qoladi".

**Yechim:** Agent xarid kontekstini (hajm, muddat, alternativalar, ta'minotchining yuklamasi, tarixiy kelishuvlar) tahlil qilib, **real maqsadli narxni** va **shaxsiylashtirilgan muzokara strategiyasini** ishlab chiqadi, xat va dialog skriptlarini yozadi, natijani qayd etadi va o'rganadi.

**Texnik tavsif:**
1. **Kontekst to'plash** — RFQ, narx tarixi, ta'minotchi profili, o'xshash bitimlar (embedding bo'yicha top-5 analog).
2. **Maqsadli narx modeli:**
   ```
   target = median_qualified × (1 − leverage)
   leverage = 0.40×hajm_bonusi + 0.25×raqobat_bosimi
            + 0.20×muddat_egiluvchanligi + 0.15×to'lov_sharti
   floor    = min(qualified) × 0.97   # yo'qotishdan himoya
   ```
3. **LLM agent (ReAct)** — 4 bosqich: `diagnose` (ta'minotchi pozitsiyasi) → `strategy` (BATNA, anchor, concession plan) → `draft` (xat/skript) → `verify` (guardrail: raqamlar modeldan, halol bo'lmagan da'volar taqiqlanadi).
4. **Guardrail** — barcha raqamlar hisoblash dvigatelidan olinadi; LLM faqat matn yozadi; "yolg'on raqobatchi taklifi" kabi noetik usullar bloklangan.
5. **O'z-o'zini o'rganish** — har bir yakunlangan bitim `(kontekst → strategiya → natija)` sifatida log qilinadi; kvartalda model qayta kalibrlanadi.
6. **Integratsiya** — Telegram/email orqali yuborish, CRM'ga yozish, e-imzo bilan shartnomaga o'tish.

**Kutilayotgan natija:** qo'shimcha **5–11%** chegirma, xarid siklining **40%** ga qisqarishi, xaridlar bo'limi vaqtining **60%** i strategik ishlarga bo'shashi.

**Nima uchun "tub burilish":** bozorda hozircha faqat *narx ko'rsatuvchi* platformalar bor; ASPN esa **narxni o'zgartiradi** — ya'ni ma'lumotdan pul tejashga o'tish nuqtasi.

---

## Xulosa va amalga oshirish bo'yicha tavsiyalar

1. **Master promptni qo'llash** — [`02-master-prompt.md`](02-master-prompt.md) orqali ushbu hujjat generatsiya qilindi; jamoa ichida har bir yangilanish uchun qayta ishlatiladi.
2. **Qonunchilikka qat'iy rioya** — barcha hisob-kitoblar UZSda, 12% QQS, LRU-573 9-modda; EHF integratsiyasi ustuvor.
3. **Pitch tayyorlash** — 15 ballik Killer Flow va AI Negotiatorni live demo sifatida ko'rsatish (3 daqiqalik skript: [`04-pitch-deck.md`](04-pitch-deck.md)).
4. **Keyingi 30 kun** — 3 kategoriya, 200 ta'minotchi, 50 pilot mijoz; indeks aniqligi ≥ 92%.
5. **O'lchov** — har hafta: tejalgan UZS, xarid sikli vaqti, NPS; har oy: LTV/CAC, churn, indeks aniqligi.

**Manbalar:** Lumora IT Case Tashkent Event Deck; markdev.uz (B2B marketing in Uzbekistan); mansurovteam.com; dora.uz (B2B pricing); invest.gov.uz (startups); b2bmap.com; spot.uz (2026 startaplar); ADB (Uzbekistan tech startup ecosystem); inconsult.uz (public procurement).
