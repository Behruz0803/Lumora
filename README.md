# Lumora — Case D: Smart Market Prices

**MarketPulse B2B** — O'zbekiston B2B bozori uchun AI-asosidagi narx analitikasi va avtomatlashtirilgan xarid platformasi.
Lumora IT Case Competition (31-oktabr 2026, Toshkent) · AICA × AI Alliance · 100 ballik rubrika.

Ushbu repozitoriya Google Drive'dagi **"AI Agent Prompt Design"** hujjatidagi barcha topshiriqlarning bajarilgan ko'rinishi: tahlil, master prompt, 12 bo'limli loyiha hujjati, pitch va ishlaydigan prototip.

## Tarkib

| Fayl | Nima bor |
|---|---|
| [`docs/01-bozor-tahlili.md`](docs/01-bozor-tahlili.md) | Bozor muammosi, normativ-soliq talablari (LRU-573, 12% QQS), ekotizim metrikasi, prompt metodologiyasi |
| [`docs/02-master-prompt.md`](docs/02-master-prompt.md) | Tayyor master prompt (nusxalab LLM'ga berish uchun) |
| [`docs/03-loyiha-hujjati.md`](docs/03-loyiha-hujjati.md) | **Asosiy yechim**: 12/12 topshiriq — missiya, TAM/SAM/SOM, personas, roadmap, monetizatsiya, 3-yillik P&L, risklar, arxitektura, wireframe, Killer Flow, AI Negotiator |
| [`docs/04-pitch-deck.md`](docs/04-pitch-deck.md) | 5 slayd, 3 daqiqalik nutq matni, hakamlar uchun javoblar |
| [`app/`](app/index.html) | Ishlaydigan prototip: dashboard, narx taqqoslash, ta'minotchilar, Killer Flow, AI Negotiator |

## Prototipni ishga tushirish

Backend talab qilinmaydi (statik, offline ishlaydi):

```bash
python3 -m http.server 8080 --directory app
# yoki: npx serve app
```

Brauzerda: `http://localhost:8080`

### Demo imkoniyatlari
- **Dashboard** — MPI narx indeksi (90 kun), kategoriya dinamikasi, eng katta narx farqi jadvali.
- **Narxlar taqqoslash** — 45 SKU, 12 ta'minotchi; QQS 12% almashtirgichi, median/fair-band, tejamkorlik hisobi.
- **Ta'minotchilar** — reyting (sifat 40% + muddat 30% + narx 20% + tarix 10%), verified belgilari.
- **Killer Flow** — 8 bosqichning interaktiv ijrosi (15 daqiqada shartnoma).
- **AI Negotiator** — leverage modeli, maqsadli narx, BATNA, o'zbek tilida muzokara xati.

> Barcha narxlar UZSda, QQS 12% (LRU-573, 9-modda). Demo ma'lumotlar sintetik.

## Asosiy raqamlar

| Ko'rsatkich | Qiymat |
|---|---|
| TAM / SAM / SOM | 1.2 trln / 350 mlrd / 42 mlrd UZS |
| Daromad 2027 → 2029 | 3.2 → 42.0 mlrd UZS |
| ARPU / gross margin | 1.03 mln UZS · 88% |
| LTV/CAC (2029) | 12.6× |
| Killer Flow natijasi | 3–5 kun → 15 daqiqa; ~1.9 mln UZS tejamkorlik/xarid |

## Hujjatlarni qayta generatsiya qilish

1. [`docs/02-master-prompt.md`](docs/02-master-prompt.md) dagi blokni nusxalang.
2. LLM'ga yuboring (GPT-4o / Claude / DeepSeek) — 12 bo'limli hujjat chiqadi.
3. Yangi ma'lumotlarni `docs/03-loyiha-hujjati.md` ga ko'chiring va `app/data.js` dagi demo qiymatlarni yangilang.
