# PriceRadar

**Bozorni biling. Aqlliroq xarid qiling. Ko‘proq tejang.**

**Tillar:** [English](./README.md) · **O‘zbekcha** · [Русский](./README.ru.md)

PriceRadar — O‘zbekistondagi oziq-ovqat do‘konlari, restoranlar, chakana savdo, ulgurji
sotuvchilar va kichik biznes uchun B2B bozor ma’lumotlari va narxlarni taqqoslash platformasi.

U shunchaki eng past birlik narxini ko‘rsatmaydi. Har bir buyurtma uchun u **umumiy xarid
xarajatini** hisoblaydi — birlik narxi × miqdor **va yetkazib berish** — va so‘ralgan miqdorni
bajara olmaydigan taklifni hech qachon tavsiya qilmaydi.

> **Bu loyihadagi barcha narxlar, ta’minotchilar, reytinglar va tendensiyalar uydirma demo
> ma’lumotlardir.** Interfeys, API javoblari va yordamchi buni har doim aniq ko‘rsatadi.
> Bu yerda hech narsa haqiqiy bozor tadqiqoti emas.

---

## 1. Nimalar qilingan

| Yo‘nalish | Yetkazilgan |
| --- | --- |
| Autentifikatsiya | Ro‘yxatdan o‘tish, kirish, JWT, profilni yangilash, parolni o‘zgartirish, demo hisob |
| Boshqaruv paneli | KPI’lar, 30 kunlik narx tendensiyasi, so‘nggi narx o‘zgarishlari, asosiy toifalar, so‘nggi takliflar, tezkor qidiruv |
| Narx taqqoslash | Mahsulot qidiruvi, miqdor kiritish, umumiy xarajat bo‘yicha reyting, moslik qoidalari, tejash, saralash (umumiy / sifat / yetkazib berish), ta’minotchi bilan bog‘lanish va xarid xulosasi |
| Mahsulotlar | Qidiruv, toifa filtri, mavjudlik filtri, saralash, sahifalash, mahsulot sahifasi, 30/90/180 kunlik narxlar tarixi grafigi, takliflar ro‘yxati |
| Ta’minotchilar | Ma’lumotnoma, joylashuv filtri, faqat tasdiqlanganlar, saralash, aloqa ma’lumotlari va takliflar bilan profil |
| Bozor tahlili | Trend grafigi, toifalar bo‘yicha o‘rtacha narxlar, taklif holati, talab ko‘rsatkichlari, mahsulot tarixi tanlagichi, 30/90/180 kunlik davrlar |
| AI yordamchi | Shaffof, qoidalar asosidagi dvigatel (tashqi model yo‘q): takliflarni taqqoslaydi, yutuvchini tushuntiradi, summalarni hisoblaydi, tendensiyalarni umumlashtiradi |
| Saqlangan takliflar | Saqlash / olib tashlash, narx va holat o‘zgarishini kuzatish, tanlangan takliflarni yonma-yon taqqoslash |
| Sozlamalar | Profil, biznes ma’lumotlari, interfeys tili, bildirishnoma sozlamalari, parolni o‘zgartirish |
| **Tillar** | **O‘zbek, rus va ingliz tillari** butun interfeysda, shu jumladan demo mahsulot nomlari va server yozadigan tushuntirishlarda |
| Backend | FastAPI + SQLAlchemy 2 + Pydantic v2, PostgreSQL’ga tayyor, SQLite dev varianti, demo ma’lumotlar, OpenAPI hujjati |
| Sifat | 159 backend testi, 117 frontend testi, 110 tekshiruvli jonli API smoke to‘plami + 57 adversarial probe, QA hisoboti |

Killer Flow (to‘liq ishlaydi): Dilshodga **100 kg kartoshka** kerak → qidiradi → 100 kg kiritadi →
A ta’minotchi 450 000, B 400 000, C 420 000 UZS ni ko‘radi → **umumiy** eng past xarajat
bo‘yicha B tavsiya etiladi → tushuntirish → ta’minotchi bilan bog‘lanish → A’ga nisbatan
50 000 UZS tejash ko‘rsatilgan xarid xulosasi.

---

## 2. Loyiha tuzilishi

```
priceradar/                       (repozitoriy ildizi)
├─ backend/
│  ├─ app/
│  │  ├─ api/                     routerlar: auth, products, suppliers, offers,
│  │  │                           analytics, saved_offers, recommendations, assistant
│  │  ├─ core/                    config, security (bcrypt + JWT), i18n (en/uz/ru)
│  │  ├─ database/                session, init_db, seed (demo ma’lumotlar)
│  │  ├─ models/                  User, Product, Supplier, Offer, PriceHistory, SavedOffer
│  │  ├─ schemas/                 Pydantic sxemalari
│  │  ├─ services/                pricing, catalog, analytics, assistant
│  │  └─ main.py                  FastAPI ilovasi, CORS, xato ishlovchilar
│  ├─ scripts/                    qa_smoke.py, qa_edge_probes.py, record_fixtures.py
│  ├─ tests/                      pricing, api, killer flow, robustness, i18n
│  └─ requirements.txt / requirements-dev.txt
├─ frontend/
│  ├─ src/
│  │  ├─ i18n/                    til do‘koni, lug‘atlar (en/uz/ru), keys.json
│  │  ├─ components/              UI primitivlari, grafiklar, LanguageSwitcher
│  │  ├─ context/                 AuthContext, ToastContext
│  │  ├─ layouts/                 AppLayout (yon menyu + yuqori panel + mobil drawer)
│  │  ├─ pages/                   12 sahifa
│  │  ├─ services/api.ts          tiplashtirilgan API klienti (Accept-Language yuboradi)
│  │  └─ test/                    117 test
│  └─ package.json
├─ README.md · README.uz.md · README.ru.md
└─ QA_REPORT.md · QA_REPORT.uz.md · QA_REPORT.ru.md
```

---

## 3. Ishga tushirish (Windows uchun aniq qadamlar)

### 3.1 Kerakli dasturlar

* Python **3.11+** — <https://www.python.org/downloads/> (o‘rnatishda *Add Python to PATH* ni belgilang)
* Node.js **20+** (LTS) — <https://nodejs.org/>
* Git — <https://git-scm.com/download/win>

PowerShell’da tekshiring:

```powershell
python --version
node --version
npm --version
```

### 3.2 Loyihani olish

```powershell
git clone https://github.com/Behruz0803/Lumora.git
cd Lumora
```

### 3.3 Backend (1-terminal)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
```

`Activate.ps1` PowerShell tomonidan bloklansa, bir marta quyidagini bajaring:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

cmd.exe ishlatsangiz faollashtirish `.\.venv\Scripts\activate.bat` bo‘ladi.

Tayyor bo‘lishi belgisi: `PriceRadar API ready (database: sqlite)`.
Swagger: <http://localhost:8000/docs>

### 3.4 Frontend (2-terminal)

```powershell
cd frontend
npm install
npm run dev
```

Brauzer: <http://localhost:5173>

### 3.5 Demo hisob

| Maydon | Qiymat |
| --- | --- |
| Email | `dilshod@priceradar.uz` |
| Parol | `demo1234` |

Kirish sahifasidagi **Use the demo account** tugmasi ham shu hisobga kiradi.

### 3.6 Tilni almashtirish

Yuqori paneldagi **EN / UZ / RU** tugmasi (yoki yon menyu, yoki kirish sahifasidagi
tanlagich) butun interfeysni darhol o‘zgartiradi. Tanlov `localStorage`da saqlanadi va
**Sozlamalar → Til va bildirishnomalar** bo‘limida profilga ham yoziladi.

### 3.7 macOS / Linux

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000

# boshqa terminalda
cd frontend
npm install && npm run dev
```

---

## 4. Muhit o‘zgaruvchilari

`backend/.env` (namuna: `backend/.env.example`):

| O‘zgaruvchi | Standart | Izoh |
| --- | --- | --- |
| `SECRET_KEY` | `change-me` | JWT imzosi. **Ishlab chiqarishda albatta o‘zgartiring** |
| `ALGORITHM` | `HS256` | JWT algoritmi |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` | Token muddati (7 kun) |
| `DATABASE_URL` | `sqlite:///./priceradar.db` | PostgreSQL: `postgresql+psycopg://user:pass@host/db` |
| `CORS_ORIGINS` | `http://localhost:5173` | Vergul bilan ajratilgan ro‘yxat |
| `CORS_ORIGIN_REGEX` | `https://[a-zA-Z0-9-]+\.e2b\.app` | Hosted preview domenlari |
| `SEED_DEMO_DATA` | `true` | Bo‘sh bazaga demo ma’lumotlarni yozadi |

`frontend/.env` (ixtiyoriy): `VITE_API_URL` — API boshqa domenda bo‘lsa.

---

## 5. Umumiy xarajat va tavsiya dvigateli

**Formula:** `Umumiy xarajat = (birlik narxi × miqdor) + yetkazib berish`

Misol — kartoshka, 100 kg:

| Ta’minotchi | Birlik narxi | Mahsulot narxi | Yetkazib berish | **Umumiy** | Holat |
| --- | --- | --- | --- | --- | --- |
| Fergana Fresh Produce (B) | 3 500 | 350 000 | 50 000 | **400 000** | ✅ tavsiya |
| Bukhara Farm Direct (C) | 4 200 | 420 000 | 0 | 420 000 | mos |
| Tashkent Agro Trade (A) | 4 000 | 400 000 | 50 000 | 450 000 | mos |
| Namangan Food Supply | 3 300 | 330 000 | 30 000 | 360 000 | ❌ omborda yo‘q — reytingga kirmaydi |

Qoidalar:

1. Hisob-kitob butun UZS’da, `Decimal` yarim yuqoriga yaxlitlash bilan.
2. Ombor tugagan (`out_of_stock`), zaxira yetmagan yoki minimal buyurtmadan kam takliflar **hech qachon** tavsiya etilmaydi.
3. Reyting umumiy xarajat bo‘yicha; teng bo‘lsa — reyting, keyin id bo‘yicha barqaror.
4. “Umuman eng yaxshi” — sifat/tezkorlik ballini ham hisobga oladi va farqni ochiq ko‘rsatadi.
5. Har javob `data_source: "demo"` va uydirma ma’lumot haqidagi ogohlantirishni o‘z ichiga oladi.

---

## 6. API ma’lumotnomasi

Barcha endpointlar `/api` prefiksi bilan. 🔒 — JWT talab qiladi.

| Metod | Yo‘l | Auth | Izoh |
| --- | --- | --- | --- |
| GET | `/health` | — | Holat tekshiruvi |
| POST | `/auth/register` | — | 201 + token |
| POST | `/auth/login` | — | 200 + token |
| GET | `/auth/me` | 🔒 | Joriy foydalanuvchi |
| PATCH | `/auth/me` | 🔒 | Profil, biznes, til, bildirishnomalar |
| POST | `/auth/me/password` | 🔒 | Parolni o‘zgartirish |
| GET | `/products` | — | Qidiruv, filtrlash, saralash, sahifalash |
| GET | `/products/{id}` | — | Mahsulot tafsilotlari |
| GET | `/products/{id}/offers` | — | Miqdor bo‘yicha takliflar |
| GET | `/products/{id}/price-history` | — | `days` = 7..365 |
| GET | `/products/categories` | — | Toifalar |
| GET | `/suppliers` | — | Ma’lumotnoma |
| GET | `/suppliers/{id}` | — | Profil |
| GET | `/suppliers/{id}/offers` | — | Ta’minotchi takliflari |
| GET | `/offers` | — | Takliflar ro‘yxati |
| POST | `/offers` | 🔒 | Yangi taklif yaratish |
| GET | `/analytics/overview` | — | KPI’lar |
| GET | `/analytics/market` | — | Taklif holati, talab ko‘rsatkichlari |
| GET | `/analytics/categories` | — | Toifalar bo‘yicha |
| GET | `/analytics/price-history/{id}` | — | Mahsulot tarixi |
| GET | `/saved-offers` | 🔒 | Saqlangan takliflar |
| POST | `/saved-offers` | 🔒 | Saqlash (dublikat — 409) |
| DELETE | `/saved-offers/{id}` | 🔒 | O‘chirish |
| POST | `/recommendations/compare` | — | **Asosiy dvigatel** |
| POST | `/assistant/chat` | — | Qoidalar asosidagi yordamchi |

**Til:** barcha endpointlar `Accept-Language: en|uz|ru` sarlavhasini qabul qiladi;
`?lang=uz` kabi parametr ham ishlaydi. Tushuntirishlar, rad etish sabablari va yordamchi
javoblari shu tilda qaytadi (standart — ingliz tili).

Misol:

```bash
curl -X POST http://localhost:8000/api/recommendations/compare \
  -H "Content-Type: application/json" -H "Accept-Language: uz" \
  -d '{"product_id": 1, "quantity": 100}'
```

---

## 7. Ma’lumotlar bazasi

* Baza jadvallari ishga tushishda `create_all` bilan yaratiladi (idempotent).
* Demo ma’lumotlar: 8 mahsulot, 6 ta’minotchi, 28 taklif, 90 kunlik narxlar tarixi,
  demo foydalanuvchi `dilshod@priceradar.uz`. Deterministik (qat’iy seedlar).
* Har bir demo yozuvda `is_demo = true`.
* Bazani noldan boshlash: `backend/priceradar.db` faylini o‘chirib, API’ni qayta ishga tushiring.

---

## 8. Tillar (English · O‘zbekcha · Русский)

* **Almashtirish joylari:** yuqori paneldagi `EN/UZ/RU`, yon menyudagi tanlagich, kirish sahifasi.
* **Nimalar tarjima qilingan:** navigatsiya, panellar, jadvallar, grafiklar, formalar,
  validatsiya xabarlari, toastlar, bo‘sh/xato holatlari, yordamchi sahifasi, nusxalanadigan
  xarid buyurtmasi va demo ma’lumot yorliqlari (mahsulot nomlari, toifalar, birliklar, shaharlar).
* **Server matni ham:** tavsiya tushuntirishi, rad etish sabablari va yordamchi javoblari
  faol tilda qaytadi (`Accept-Language` yoki `?lang=`).
* **Profil sozlamasi:** **Sozlamalar → Til va bildirishnomalar**da tanlangan til
  `PATCH /api/auth/me` orqali hisobga yoziladi.
* **Sonlar, sanalar va ko‘plik:** rus tilida one/few/many shakllari, o‘zbek tilida yagona
  shakl, pul birligi — UZS.

Yangi til qo‘shish: `frontend/src/i18n/locales/uz/ui.ts` ni nusxalab tarjima qiling,
`i18n/core.ts` dagi `LANGUAGES` va `backend/app/core/i18n.py` dagi
`SUPPORTED_LANGUAGES` ga qo‘shing. `npm run i18n:keys` kalitlarni yangilaydi;
`src/test/i18n.test.tsx` yetishmayotgan tarjimani darhol topadi.

---

## 9. Testlar

```bash
# backend (159 test)
cd backend
pip install -r requirements-dev.txt
python -m pytest tests -q

# jonli API to‘plamlari (110 smoke + 57 probe) — alohida bazada ishlating
#   rm -f qa_smoke.db && DATABASE_URL=sqlite:///./qa_smoke.db uvicorn app.main:app --port 8001
python scripts/qa_smoke.py http://127.0.0.1:8001
python scripts/qa_edge_probes.py http://127.0.0.1:8001

# frontend (117 test)
cd frontend
npm run typecheck
npm test
npm run build
npm run preview        # :4173 da build + /api proxy
```

Joriy natijalar: **159/159** backend, **117/117** frontend, **110/110** jonli smoke,
**57/57** probe; type-check va production build toza.
Batafsil: [`QA_REPORT.uz.md`](./QA_REPORT.uz.md).

---

## 10. Docker (ixtiyoriy)

```bash
cp .env.example .env        # SECRET_KEY ni belgilang
docker compose up --build
```

* Frontend: <http://localhost:8080> (nginx build’ni beradi va `/api` ni proksi qiladi)
* API: <http://localhost:8000/docs>
* PostgreSQL 16 + nomlangan volume; demo ma’lumotlar birinchi ishga tushishda yoziladi.

> Docker fayllari berilgan, lekin QA sandboxida **ishga tushirilmagan** (Docker daemon yo‘q).

---

## 11. Ma’lum cheklovlar

* **Barcha ma’lumot uydirma.** Ta’minotchi oqimi, skraping yoki jonli bozor integratsiyasi yo‘q.
* “AI” yordamchi — deterministik qoidalar dvigateli. Til modeli ulanmagan va u buni har javobda aytadi.
  Savollarni ingliz, o‘zbek va rus tillarida tushunadi (kalit so‘zlar bo‘yicha).
* Bildirishnoma sozlamalari saqlanadi, lekin email/push yuborilmaydi.
* “Ta’minotchi bilan bog‘lanish” — namoyish oqimi: telefon, `tel:` havolasi va nusxalanadigan buyurtma.
  Xabar yubormaydi va buyurtma bermaydi.
* Takliflarni tahrirlash/o‘chirish endpointlari, admin roli, fayl yuklash, refresh-token va
  rate limiting MVP doirasidan tashqarida.
* Sxema `create_all` bilan yaratiladi (Alembic emas).
* Haqiqiy brauzerda vizual regressiya va qurilmalar bo‘yicha testlar QA sandboxida imkonsiz edi;
  xatti-harakat DOM testlari bilan, moslashuvchanlik statik audit bilan tekshirildi.
* Docker compose ishga tushirilmagan (yuqoriga qarang).

---

## 12. Xavfsizlik

* Parollar **bcrypt** (cost 12) bilan, oldindan SHA-256 xeshlash orqali — 72 baytdan uzun
  parollar hech qachon jimgina kesilmaydi.
* JWT `SECRET_KEY` bilan imzolanadi, amal qilish muddati bor (standart 7 kun).
* Himoyalangan endpointlar (`/auth/me`, `/saved-offers`, `POST /offers`) token talab qiladi;
  saqlangan takliflar foydalanuvchi bo‘yicha ajratilgan.
* CORS faqat sozlangan manbalar (va ixtiyoriy preview domeni) uchun ochiq.
* Sirlar `.env` da; `.env.example` namuna sifatida berilgan, `.env` git’ga qo‘shilmaydi.
* Xato javoblari hech qachon parol yoki token qiymatini qaytarmaydi.
