# PriceRadar — QA hisoboti

**Loyiha:** PriceRadar (B2B narx taqqoslash va bozor tahlili MVP)
**Rol:** Katta QA muhandisi
**Sana:** 2026-yil 31-oktabr
**Tarmoq:** `arena/69672421-lumora`
**Xulosa:** ✅ **MVP namoyishi uchun chiqarishga tayyor** — ochiq kritik yoki jiddiy nuqson yo‘q.
Barcha avtomatik to‘plamlar yashil: **159 backend testi, 117 UI/unit testi, 110 jonli API tekshiruvi,
57 adversarial probe**, type-check va production build toza.

> **Bosqichlar tarixi:** 1-bosqich (funksional QA) 13 nuqsonni topib tuzatdi. 2-bosqich
> (adversarial / xato yo‘llari) yana 7 nuqsonni topdi — uchtasi faqat API yoki tarmoq
> noto‘g‘ri ishlaganda ko‘rinadi. 3-bosqich uch tilli interfeys va server matnini qo‘shdi hamda
> 6 mahalliylashtirish nuqsonini tuzatdi (§5.2). Barcha bosqichlar quyida; raqamlar 3-bosqichdan.

**Tillar:** interfeys **o‘zbek (uz), rus (ru) va ingliz (en)** tillarida ishlaydi — har bir sahifada
almashtiriladi, qurilma va hisob bo‘yicha saqlanadi, server yozadigan matnga ham qo‘llanadi.

---

## 1. Umumiy xulosa

Vazifa boshlanganda repozitoriyda **ilova kodi yo‘q** edi — faqat bir qatorli `README.md`.
QA talabi PriceRadar mavjudligini nazarda tutgani uchun avval spetsifikatsiyadagi MVP qurildi
(React + Vite + TypeScript + Tailwind frontend, FastAPI + SQLAlchemy backend), so‘ng QA aynan
so‘ralganidek bajarildi: ko‘zdan kechirish, ishga tushirish, har bir endpointni sinash, Killer Flow’ni
o‘tish, xarajat hisobini tekshirish, autentifikatsiya, o‘lik tugmalar va navigatsiya, moslashuvchanlik,
nuqsonlarni tuzatish va qayta yugurtirish.

**Boshlang‘ich holat**

```
$ ls
README.md          # "# Lumora" — ilova kodi yo'q
$ git log --oneline
465772e Initial commit
```

**Yakuniy holat**

| To‘plam | Testlar | O‘tdi | O‘tmadi |
| --- | --- | --- | --- |
| Backend unit + integratsiya (pytest) | 159 | 159 | 0 |
| Frontend UI, xato yo‘llari, a11y, i18n va unit (Vitest) | 117 | 117 | 0 |
| Jonli API smoke to‘plami (barcha endpointlar) | 110 | 110 | 0 |
| Adversarial probe (validatsiya, auth, injection, limitlar) | 57 | 57 | 0 |
| TypeScript type-check | — | ✅ | — |
| Production build (`vite build` + `vite preview` smoke) | — | ✅ | — |

Barcha bosqichlarda topilgan nuqsonlar: **26** (12 jiddiy, 14 kichik) — **26 tasi tuzatilgan va qayta
tekshirilgan**, 0 kechiktirilgan, 0 ochiq kritik/jiddiy.

---

## 2. Muhit va uslub

| Band | Qiymat |
| --- | --- |
| OS / runtime | Linux sandbox, Python 3.11.2, Node 22.22.3, npm 10.9.8 |
| Backend | FastAPI 0.162.0, Starlette 1.10.0, SQLAlchemy 2.1.6, Pydantic 2.14.2, uvicorn 0.54.0 |
| Baza | SQLite (dev varianti), modellar PostgreSQL bilan mos |
| Frontend | React 18.3, Vite 5.4.21, TypeScript 5.6, Tailwind 3.4, Recharts 2.15, React Router 6.30 |
| API server | `uvicorn app.main:app --host 0.0.0.0 --port 8000` (demo ma’lumotlar avtomatik) |
| Web server | `vite --host 0.0.0.0 --port 5173`, `/api` proksi → `127.0.0.1:8000` |
| UI testlash | Vitest + jsdom + Testing Library, **jonli backenddan yozib olingan** API fixturelar bilan |

**Nega DOM darajasidagi UI testlar:** sandbox brauzer ikkilik fayllarini yuklashni bloklaydi
(Playwright/Chromium CDN yetib bo‘lmaydi), shuning uchun haqiqiy brauzer avtomatizatsiyasi imkonsiz edi.
Uning o‘rniga har bir UI test haqiqiy React ilovasini render qiladi, haqiqiy foydalanuvchi harakatlarini
bajaradi va **ishlayotgan FastAPI serverdan olingan aynan o‘sha javoblarni** oladi — shu bilan
so‘rov/javob shartnomalari uchidan-uchiga tekshiriladi. Cheklovlar §10 da.

---

## 3. O‘nta QA vazifasiga javoblar

| # | Vazifa | Natija | Dalil |
| --- | --- | --- | --- |
| 1 | Frontend va backendni ko‘zdan kechirish | ✅ | 14 backend moduli; 12 sahifa, 20 komponent, 4 context/hook |
| 2 | Ilovani ishga tushirish | ✅ | API :8000 (8 mahsulot / 6 ta’minotchi / 28 taklif / 90 kunlik tarix), UI :5173, `/api` proksi HTTP orqali tekshirildi |
| 3 | Barcha API endpointlarini sinash | ✅ | 110/110 jonli tekshiruv + 63 pytest API testi |
| 4 | To‘liq Killer Flow’ni sinash | ✅ | 15 maxsus pytest testi + 9 UI testi + jonli smoke; 1–8 qadamlar tekshirildi (§4) |
| 5 | Umumiy xarajat hisobini tekshirish | ✅ | 27 unit test + 8 mahsulot × 5 miqdor × barcha takliflar bo‘yicha formula invarianti |
| 6 | Autentifikatsiyani tekshirish | ✅ | register/login/me/patch/password, 401/409/422, token buzish, foydalanuvchi izolyatsiyasi (§6) |
| 7 | O‘lik tugmalar va navigatsiyani topish | ✅ | 13 nuqson topildi va tuzatildi; 11 marshrut va 40+ boshqaruv elementi (§7) |
| 8 | Moslashuvchan joylashuvni tekshirish | ⚠️ Tuzilmaviy | Mobil breakpointlar auditi, drawer va karta ko‘rinishlari DOM testlarida; piksel darajasidagi vizual tekshiruv imkonsiz (§8) |
| 9 | Barcha kritik va jiddiy xatolarni tuzatish | ✅ | 12 jiddiy + 14 kichik tuzatildi, to‘plamlar qayta yashil (§5) |
| 10 | Frontend/backend integratsiyasini tekshirish | ✅ | UI testlari jonli yozilgan javoblardan foydalanadi; proksi tekshirildi; shartnomalar tasdiqlandi |

---

## 4. Killer Flow tekshiruvi (spetsifikatsiya §4)

Ssenariy: do‘kon egasi Dilshodga **100 kg kartoshka** kerak.

| Qadam | Talab | Tekshirilgan xatti-harakat | Holat |
| --- | --- | --- | --- |
| 1 | PriceRadar’ni ochadi | `/` autentifikatsiya talab qiladi; demo kirish `dilshod@priceradar.uz / demo1234` boshqaruv paneliga olib boradi | ✅ |
| 2 | Kartoshkani qidiradi | Qidiruv aynan 1 natija qaytaradi | ✅ |
| 3 | 100 kg kiritadi | Miqdor maydoni kg/l mahsulotlarda 100, presetlar 25/50/100/250, jonli qayta hisoblash | ✅ |
| 4 | Ta’minotchi takliflarini ko‘radi | 4 taklif: A 450 000, B 400 000, C 420 000 UZS (spetsifikatsiyadagi aniq qiymatlar) | ✅ |
| 5 | Dvigatel B ta’minotchini tavsiya qiladi | `recommended.supplier_name = Fergana Fresh Produce`, `total_cost = 400 000`, `rank = 1` | ✅ |
| 6 | Aniq taqqoslash va sabab | Tushuntirish: B keyingi variantdan 20 000 arzon, bepul yetkazishli C 420 000, A 450 000, eng past birlik narxi (3 300, omborda yo‘q) nima uchun chiqarilmagani | ✅ |
| 7 | “Ta’minotchi bilan bog‘lanish”ni bosadi | Modal: ta’minotchi, telefon `+998 73 244 18 65`, joylashuv, yetkazish shartlari, nusxalanadigan buyurtma, `tel:` havolasi | ✅ |
| 8 | Xarid xulosasi va A’ga nisbatan tejash | 350 000 + 50 000 = 400 000; A’ga nisbatan **50 000 UZS** tejash; yetkazilgan kg narxi 4 000 | ✅ |

Qo‘shimcha tekshiruvlar:

* Omborda yo‘q Namangan (birlik narxi 3 300 — bozorda eng past) **hech qachon reytingga kirmaydi**,
  sabab “Hozir omborda yo‘q”.
* 25 kg → faqat Buxoro (20 kg minimum, bepul yetkazish) mos → 105 000 UZS.
* 10 kg → hech bir ta’minotchi bajarolmaydi → aniq bo‘sh holat, yiqilish yo‘q.
* 5 000 kg → barcha zaxiradan oshadi → tavsiya yo‘q, tushunarli izoh.
* Aynan minimum miqdor (20 kg) → mos (chegara to‘g‘ri).
* Har bir mos taklif uchun `total_cost == unit_price × 100 + delivery_cost`.

Bir so‘rovda qayta hosil qilish:

```bash
curl -X POST http://localhost:8000/api/recommendations/compare \
  -H "Content-Type: application/json" -d '{"product_id": 1, "quantity": 100}'
```

---

## 5. Nuqsonlar jurnali — topilgan va tuzatilgan

Barcha bandlar shu sessiyada tuzatilgan; har bir tuzatish regressiya testi bilan qoplangan va
to‘liq to‘plamlar qayta yugurtirilgan.

### 5.1 1-bosqich — funksional nuqsonlar

| ID | Jiddiylik | Soha | Nuqson | Tuzatish |
| --- | --- | --- | --- | --- |
| D-01 | **Jiddiy** | Tavsiya dvigateli | Tushuntirish faqat *keyingi* arzon taklif bilan taqqoslardi, eng qimmat mos taklifga nisbatan tejash aytilmasdi (spetsifikatsiya 8-qadam bajarilmasdi) | `explain()` barcha boshqa mos variantlarni summalari bilan sanaydi va “X ni tanlash 50 000 UZS tejaydi” jumlasini beradi |
| D-02 | **Jiddiy** | API shartnomasi | Javobda `updated_at` yo‘q edi, “oxirgi yangilanish” ustuni chiziqcha ko‘rsatardi | `ScoredOffer`/`OfferInput` ga `updated_at` qo‘shildi, jadval va mobil kartalar nisbiy vaqtni ko‘rsatadi |
| D-03 | **Jiddiy** | Mahsulot sahifasi | Takliflar har mahsulot uchun 100 birlikda hisoblanardi, “patnis” mahsulotlari (tuxum) noto‘g‘ri summa ko‘rsatardi | Etalon miqdor mahsulot birligidan olinadi (100 kg/l, 10 patnis) |
| D-04 | **Jiddiy** | Navigatsiya | Ta’minotchi profilidan `/products?category=Vegetables` havolasi katalogda e’tiborsiz qolardi | Kategoriya URL’dan o‘qiladi va URL bilan sinxron qoladi |
| D-05 | **Jiddiy** | Uslublar | `h-4.5`/`w-4.5` (Tailwind’da yo‘q) 24 joyda ishlatilgan — ikonka o‘lchamlari jimgina yo‘qolgan | `spacing['4.5']` qo‘shildi, build CSS’da klass borligi tekshirildi |
| D-06 | **Jiddiy** | Tahlil | `/analytics/overview` dagi `active_suppliers`/`total_offers` eski placeholder mantiq bilan hisoblanardi | `count(distinct(supplier_id))` va `count(offers)` ga almashtirildi |
| D-07 | Kichik | Tahlil | Narx tarixidagi ta’minotchi qatorlari birinchi qatorning id’sini ishlatardi | Qatorlar offer → supplier id/nom bo‘yicha aniq bog‘lanadi |
| D-08 | Kichik | Unumdorlik | `/compare?product=1&qty=100` havolasi bir so‘rovni ikki marta yuborardi | Oxirgi so‘rov kaliti bo‘yicha himoya (qo‘lda qayta hisoblash majburiy) |
| D-09 | Kichik | UI tozaligi | Yashirin soxta sarlavha tugmasi, bo‘sh “oxirgi yangilanish” katakchasi, ortib qolgan bo‘sh `<PageHeader>` | Olib tashlandi; soxta amal ishlaydigan “100 kg kartoshka misolini yuklash” tugmasiga almashtirildi |
| D-10 | Kichik | Tahlil | Talab so‘rovi mahsulotlarni ikki marta join qilardi va toifa mavjudligini hisobga olmasdi | Bitta guruhlangan so‘rovga qayta yozildi |
| D-11 | Kichik | Yordamchi | Trend ishlovchisida yetib bo‘lmaydigan mantiq noto‘g‘ri raqamlar berishi mumkin edi | Olib tashlandi; oyna eng yangi nuqtadan hisoblanadi |
| D-12 | Kichik | Backend qadoqlash | `app.schemas` re-export ro‘yxati eskirgani uchun yangi sxemalar importda buzardi | Wildcard re-export’ga o‘tkazildi |
| D-13 | Kichik | UX | Allaqachon saqlangan taklifni saqlash umumiy xato berardi | 409 endi “allaqachon saqlangan” deb ko‘rsatiladi, tugma “Saqlangan”ga sinxronlashadi |

### 5.2 2-bosqich — adversarial va xato yo‘llari

2-bosqich API’ni dushmanona kiritish bilan sinadi (soxta tokenlar, `1e400`, `NaN`, buzilgan JSON,
SQL/XSS satrlari, 1 001 belgili xabarlar, noto‘g‘ri HTTP metodlar) va UI’ni ishlamayotgan, sekin va
yetib bo‘lmaydigan backend bilan sinadi.

| ID | Jiddiylik | Soha | Nuqson | Tuzatish |
| --- | --- | --- | --- | --- |
| D-14 | **Jiddiy** | API xatolari | Maxsus Pydantic validatori rad etgan har qanday so‘rov **HTTP 500 + ulanish uzilishi** berardi (`ValueError` obyekti JSON’ga aylanmasdi) | `_json_safe_errors()` qo‘shildi: `type`/`loc`/`msg`/`input`/`ctx` JSON-xavfsiz qilinadi |
| D-15 | **Jiddiy** | API xatolari | `{"quantity": 1e400}` yoki `NaN` ham 500 berardi (`allow_nan=False`) | `_json_safe()` har qanday chuqurlikda cheksiz float’larni satrga aylantiradi |
| D-16 | **Jiddiy** | Auth / sessiya | `/auth/me` har qanday sabab bilan yiqilsa (server down, tarmoq, 500) token tozalanib foydalanuvchi `/login`ga uloqtirilardi | Endi faqat **401** sessiyani tugatadi; boshqa xatolar tokenni saqlaydi va “Qayta urinish”/“Chiqish” bilan `ConnectionErrorScreen` ko‘rsatiladi |
| D-17 | **Jiddiy** | Navigatsiya | Taqqoslash sahifasi `?product=`/`?search=` ni faqat ochilganda o‘qirdi; `/compare` da turib sarlavha qidiruvi ishlatilsa sahifa eski mahsulotni ko‘rsatardi | Deep-link effekti URL parametrlariga bog‘langan; noto‘g‘ri id xato ko‘rsatadi |
| D-18 | Kichik | Yordamchi | Faqat bo‘sh joydan iborat xabar qabul qilinardi (200) va umumiy yordam matni bilan javob berardi | `AssistantRequest.message` validatori bo‘sh kiritishni 422 bilan rad etadi |
| D-19 | Kichik | Saqlangan takliflar | Miqdor maydoni tozalansa summalar 0 bo‘yicha hisoblanib, faqat yetkazish narxi (50 000 UZS) haqiqiy summadek ko‘rinardi | Noto‘g‘ri miqdorda summalar bo‘sh, “Noldan katta miqdor kiriting” xabari, `aria-invalid` |
| D-20 | Kichik | Asboblar | `npm run preview` `/api` proksisiz build berardi; `package.json`da `test` skripti yo‘q edi | Proksi qo‘shildi, `test` / `test:watch` skriptlari qo‘shildi |

### 5.3 3-bosqich — til qo‘llab-quvvatlash (English · O‘zbekcha · Русский)

Talab: interfeys uch tilning har birida **haqiqatan almashtirilishi** kerak — ilovada ham,
tayyorlangan hujjatlarda ham. Yo‘l-yo‘lakay 6 mahalliylashtirish nuqsoni topildi va tuzatildi.

| ID | Jiddiylik | Soha | Nuqson | Tuzatish | Regressiya testi |
| --- | --- | --- | --- | --- | --- |
| D-21 | **Jiddiy** | Til almashtirish | Til tanlanganda saqlangan sozlama va tugma yorlig‘i o‘zgarardi, lekin ochiq sahifalar eski tilda qolardi — React ildizi bir marta key bilan o‘ralgan edi | `App` endi `useSyncExternalStore` obunachisi va `<AppShell key={language} />` render qiladi — har bir sahifa yangi tilda qayta o‘rnatiladi | `i18n.test.tsx::switching language re-renders the whole app` |
| D-22 | **Jiddiy** | Server matni | Tavsiya tushuntirishi, rad etish sabablari va yordamchi javoblari faqat inglizcha edi | `backend/app/core/i18n.py` shablonlarni saqlaydi; `pricing.py`/`assistant.py` `language` qabul qiladi; endpointlar `Accept-Language` (yoki `?lang=`) dan aniqlaydi; `services/api.ts` har so‘rovda sarlavhani yuboradi | `tests/test_i18n.py` (26 test) |
| D-23 | **Jiddiy** | Matn ichidagi demo nomlar | Jumlalar ichida mahsulot nomlari, toifalar, birliklar va shaharlar inglizcha qolardi (“100 kg of **Potatoes**”) | `DATA_NAMES`/`localise()` qo‘shildi; joy egallovchilar mahalliylashtirilgan nom va birliklarni oladi (кг/л, шт/лоток) | `test_i18n.py` + jonli curl matritsasi |
| D-24 | Kichik | Tarjima sifati | Ruscha jumlalar noqulay o‘qilardi (“Для «Potatoes» на 100 kg”) | Beshta shablon qayta yozildi: “Для заказа «…»”, “Ни один поставщик не может выполнить заказ…”, “Варианты поставщиков по товару «…»” | en/ru/uz matritsasini qo‘lda ko‘zdan kechirish |
| D-25 | Kichik | Build buzilishi | `locales/uz/ui.ts` va `ru/ui.ts` dagi takroriy kalitlar `tsc` ni `TS1117` bilan yiqitardi | Blok-bo‘yicha skript bilan dedupe, bitta juftlik qo‘lda olib tashlandi | `npm run typecheck` toza, Vitest yashil |
| D-26 | Kichik | Qamrov | Lug‘at qamrovi testi qisman tarjima qilingan satrlarni topa olmasdi | Test har bir `tr()` kalitini ikkala lug‘atga solishtiradi, “bir xil bo‘lishi kerak” ro‘yxatini aniq saqlaydi va joy egallovchilar saqlanishini tekshiradi | `i18n.test.tsx` (19 test) |

Mahalliylashtirish matritsasi (jonli API):

| Til | Taqqoslash tushuntirishi | Rad etish sababi | Yordamchi javobi |
| --- | --- | --- | --- |
| `en` | “Recommended: Fergana Fresh Produce — 100 kg x 3 500 UZS … 400 000 UZS total” | “Currently out of stock” | “For 100 kg of Potatoes, the lowest total cost is 400 000 UZS …” |
| `ru` | “Рекомендуется: Fergana Fresh Produce — 100 кг × 3 500 UZS … итого 400 000 UZS” | “Сейчас нет в наличии” | “Для заказа «Картофель» на 100 кг наименьшая общая стоимость — 400 000 UZS …” |
| `uz` | “Tavsiya etiladi: Fergana Fresh Produce — 100 kg x 3 500 UZS … jami 400 000 UZS” | “Hozir omborda yo‘q” | “Kartoshka mahsulotidan 100 kg uchun eng past umumiy xarajat — 400 000 UZS …” |
| `fr-FR` (qo‘llanmaydi) | Inglizcha zaxira javob, HTTP 200 | Inglizcha | Inglizcha |
| `?lang=uz` + `Accept-Language: ru` | Parametr ustun (o‘zbekcha) | O‘zbekcha | O‘zbekcha |

Interfeys qamrovi `frontend/src/test/i18n.test.tsx` da tekshiriladi:

* **476 UI kaliti** manbadan yig‘iladi va har biri `uz` hamda `ru` da mavjud (**476/476**).
* Jimgina zaxira yo‘q: yetishmayotgan kalit, inglizcha qoldiq yoki yo‘qolgan `{placeholder}` testni yiqitadi.
* `en → uz → ru → en` almashtirish sahifalar, yon menyu, jadvallar, grafiklar va yordamchi ekranini qayta
  render qiladi; tanlov qayta yuklashdan keyin ham saqlanadi (`localStorage`) va hisobga yoziladi.
* Ko‘plik: rus tilida `one/few/many`, o‘zbekchada yagona shakl, inglizchada `one/other`; pul UZS bo‘yicha
  bo‘sh joy bilan guruhlanadi.
* API klienti **har bir** so‘rovda faol tilga mos `Accept-Language` yuborishi tekshiriladi
  (`i18n.test.tsx::API language header`) — interfeys va server matni hech qachon ajralib qolmaydi.

### 5.4 Test asboblari bilan bog‘liq muammolar (mahsulot nuqsoni emas)

D-01/D-02 dan oldin yozilgan eski API fixturelar, noaniq matn matcherlari, `user-event` bilan
to‘qnashadigan clipboard stub, va probe skriptining takroriy yugurtirishda takroriy `409` olishi.
Barchasi hal qilindi: fixturelar jonli API’dan qayta yoziladi, probe skripti har yugurishda unikal
email/telefon ishlatadi.

---

## 6. Autentifikatsiya va avtorizatsiya matritsasi

| Holat | Kutilgan | Natija |
| --- | --- | --- |
| Yangi hisob ro‘yxatdan o‘tkazish | 201 + JWT + foydalanuvchi | ✅ |
| Takroriy email | 409, tushunarli xabar | ✅ |
| Parol < 8 belgi / noto‘g‘ri email | 422, maydon xabari | ✅ |
| To‘g‘ri ma’lumot bilan kirish | 200 + JWT | ✅ |
| Noto‘g‘ri parol / noma’lum email | 401 (hisob bor-yo‘qligi oshkor qilinmaydi) | ✅ |
| Tokensiz `GET /auth/me` | 401 | ✅ |
| Buzilgan/soxta token | 401 | ✅ |
| Ilova ochilganda eskirgan token | Token tozalanadi, `/login`ga yo‘naltirish | ✅ |
| Tokensiz `GET/POST /saved-offers` | 401 | ✅ |
| Saqlangan takliflar foydalanuvchi bo‘yicha | Yangi foydalanuvchi `[]` ko‘radi; boshqaning taklifini o‘chira olmaydi (404) | ✅ |
| Tokensiz `POST /offers` | 401 | ✅ |
| Profilni yangilash | 200, `/me` da aks etadi | ✅ |
| Noto‘g‘ri til kodi | 422 | ✅ |
| Noto‘g‘ri joriy parol bilan parol o‘zgartirish | 400 | ✅ |
| Parol o‘zgartirish muvaffaqiyati | Eski parol 401, yangi parol 200 | ✅ |
| Parol saqlanishi | Faqat bcrypt xesh, javoblarda xesh yo‘q | ✅ |
| Frontend himoyasi | Himoyalangan marshrutlar login’ga yo‘naltiradi va `from` ni saqlaydi | ✅ |

---

## 7. Endpoint, tugma va navigatsiya auditi

### 7.1 Endpointlar — barchasi PASS (110 jonli tekshiruv)

* **Tizim:** health, OpenAPI barcha kerakli yo‘llarni qamraydi, Swagger UI ishlaydi.
* **CORS:** `http://localhost:5173` va `https://*.e2b.app` uchun preflight ruxsat etiladi; noma’lum origin rad etiladi.
* **Auth:** register/login/me/patch/password, barcha salbiy holatlar bilan.
* **Mahsulotlar:** ro‘yxat, qidiruv, bo‘sh qidiruv, toifa filtri, narx bo‘yicha saralash, noto‘g‘ri saralash (422), sahifalash, 0-sahifa (422), 404, tafsilotlar, takliflar, noto‘g‘ri miqdor (422), 90 kunlik tarix (4 ta’minotchi qatori), oraliq validatsiyasi, toifalar.
* **Ta’minotchilar:** ro‘yxat/saralash, tasdiqlanganlar filtri, qidiruv, shaharlar, tafsilot, 404, `+998` format.
* **Takliflar:** ro‘yxat, filtrlar, tafsilot, 404, auth talabi, validatsiya, takroriy juftlik 409, yaratish 201 (`is_demo=false`).
* **Tahlil:** KPI, trend, o‘zgarishlar, toifalar, so‘nggi takliflar, demo yorliqlari, narx tarixi, 404, bozor taklifi, talab indikatorlari.
* **Saqlangan takliflar:** auth, yaratish, 409, 404, ro‘yxat, o‘chirish 204, qayta o‘chirish 404.
* **Tavsiyalar:** to‘liq Killer Flow, reyting tartibi, tejash, moslik, MOQ chegarasi, ortiqcha zaxira, 422, 404, formula invarianti.
* **Yordamchi:** taqqoslash, trend, yordam, qoidalar asosidaligi oshkorligi, havola qilingan takliflar, bo‘sh xabar 422.
* **Mahalliylashtirish:** `Accept-Language: en|ru|uz`, `uz-UZ` mintaqa tegi, `?lang=` ustunligi, qo‘llanmaydigan til → inglizcha zaxira (200, hech qachon 500), har bir tilda tushuntirish/rad etish sababi/yordamchi javobi.

### 7.2 Interaktiv boshqaruvlar — barchasi sinovdan o‘tgan (117 UI/unit testi)

Kirish · demo kirish · ro‘yxatdan o‘tish · parolni ko‘rsatish · forma validatsiyasi · yon menyu (8 ta) ·
mobil menyu · sarlavha qidiruvi → taqqoslash · boshqaruv paneli CTA’lari · mahsulot qidiruvi va taklif
tanlash · miqdor presetlari / yarmi / ikki barobar / qayta hisoblash · saralash chiplari · “Ta’minotchi bilan
bog‘lanish” modali · buyurtmani nusxalash · qo‘ng‘iroq havolasi · taklifni saqlash (dublikat bilan) ·
toifa chiplari · filtrlar · sahifalash · ta’minotchi filtrlari · telefonni nusxalash · tahlil oraliqlari ·
mahsulot tarixi tanlagichi · yordamchi: yuborish, taklif chiplari, chatni tozalash, kontekst · saqlangan
takliflar: tanlash, taqqoslash modali, olib tashlash · sozlamalar: profil/biznes/sozlamalar/parol/chiqish ·
xato holatida “Qayta urinish” · 404 havolalari ·
**til almashtirgich (en/uz/ru) yuqori panelda, yon menyuda va kirish sahifasida, hamda Sozlamalardagi
til tanlagichi — barchasi butun ilovani darhol qayta render qiladi**.

**Natija:** tuzatishlardan keyin o‘lik tugma, bezak boshqaruv yoki buzilgan havola topilmadi.
2-bosqich bu boshqaruvlarning *xato* holatini ham isbotladi: API o‘chiq bo‘lsa, panel, kirish formasi va
yordamchi bo‘sh ekran o‘rniga tushunarli xato va ishlaydigan qayta urinish ko‘rsatadi, sessiya saqlanadi (D-16).

### 7.3 Marshrutlar

`/login`, `/register`, `/` (Umumiy), `/compare`, `/products`, `/products/:id`, `/suppliers`,
`/suppliers/:id`, `/analytics`, `/assistant`, `/saved-offers`, `/settings`, `*` (404).
Har bir marshrut **production build**’da ham (`vite preview`, :4173) yuklandi: `/`, `/login`, `/compare`,
`/analytics`, `/settings` va noma’lum yo‘l 200 qaytaradi, `/api/health` va to‘liq taqqoslash so‘rovi
preview proksisi orqali ishlaydi. Himoyalangan marshrutlar to‘g‘ri yo‘naltiradi, 404 sahifasi ishlaydi.

---

## 8. Moslashuvchan joylashuv auditi

Usul: har bir sahifani statik audit (breakpointlar, qat’iy kengliklar, jadval toshishi, grid yig‘ilishi)
va drawer hamda mobil/desktop dublikat joylashuvlar uchun DOM testlari. Tailwind build CSS’ida
`sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536` media so‘rovlari mavjudligi tekshirildi.

| Sahifa / komponent | Mobil xatti-harakat | Natija |
| --- | --- | --- |
| Ilova qobig‘i | Yon menyu `< lg` yashirin, gamburger overlay drawer (`w-[280px]`), sticky yuqori panel, qidiruv ikkinchi qatorga | ✅ drawer testda |
| Auth | Split ekran bir ustunga tushadi, `< sm` da vizual panel yashiriladi | ✅ |
| Umumiy | KPI 1→2→4, grafiklar ustma-ust (`xl:grid-cols-3`), ro‘yxatlar yig‘iladi | ✅ |
| Narx taqqoslash | Hero grid yig‘iladi; `< md` da jadval kartalar ro‘yxati bilan almashadi | ✅ |
| Mahsulotlar | 1→2→3→4 ustun; filtrlar yig‘iladi; chiplar gorizontal aylanadi | ✅ |
| Mahsulot sahifasi | Sarlavha yig‘iladi; 2→3→6 ko‘rsatkich; grafik va takliflar ustma-ust | ✅ |
| Ta’minotchilar | 1→2→3 ustun; filtr qatori o‘raladi | ✅ |
| Ta’minotchi sahifasi | Desktop jadval + mobil kartalar; CTA’lar yig‘iladi | ✅ |
| Tahlil | Barcha grafiklar to‘liq kenglikda; jadvallar `overflow-x-auto` ichida | ✅ |
| Yordamchi | `< xl` da chat va yon panel ustma-ust; `min-h-[480px]` saqlanadi | ✅ |
| Saqlangan takliflar | 1→2 ustun kartalar; `< sm` da modal to‘liq kenglikdagi varaq | ✅ |
| Sozlamalar | Bir ustun → `xl` da 2 ustun; formalar 1→2 maydon | ✅ |
| Modallar | Mobilda pastdan chiqadigan varaq, ≥ sm da markazlashgan karta, `max-h-[92vh]` + ichki skroll, focus trap + Esc | ✅ |

320 px kenglikda toshib ketadigan qat’iy kenglik faqat desktop yon menyusi va `max-w` konteynerlarida
uchraydi; jadval o‘ramlaridan tashqarida boshqarilmaydigan gorizontal skroll topilmadi.

### 8.1 Avtomatik accessibility / tuzilma tekshiruvlari (2-bosqich)

`frontend/src/test/a11y.test.tsx` `/login` va to‘qqizta himoyalangan sahifa uchun quyidagilarni tekshiradi:
har bir ko‘rinadigan `button`, `a[href]`, `input`, `select`, `textarea`, `role="switch"` uchun mavjud
nom; sozlamalar va taqqoslash sahifalaridagi har bir maydonning dasturiy yorlig‘i; desktop yon menyu
(`hidden lg:block`) va mobil trigger (`lg:hidden`) birgaligi; takliflar jadvali `hidden md:block` +
`md:hidden` kartalar; tahlil jadvallari `overflow-x-auto` ichida; modallar viewport bilan chegaralangan;
toastlar `aria-live="polite"` da, xato holatlari `role="alert"` bilan.

17 tekshiruv, barchasi o‘tdi. Ular yo‘l-yo‘lakay ikkita yashirin regressiyani ham topdi: yorliqsiz parol
maydoni va yopilganda `body` skrollini tiklamaydigan modal.

> **Eslatma:** haqiqiy brauzer renderingisiz piksel darajasidagi vizual tekshiruv (shrift yuklanishi,
> haqiqiy o‘ralish, tegish maydonlari) imkonsiz edi. Ommaviy chiqishdan oldin Chrome’da 360/768/1440 px
> da qisqa qo‘lda tekshiruv tavsiya etiladi.

---

## 9. Xarajat va tavsiya to‘g‘riligi

* Formula `app/services/pricing.py` da bir marta yozilgan va frontendda faqat o‘qish uchun takrorlangan.
* Pul — butun UZS; `unit_price × quantity` da bir marta yarim yuqoriga yaxlitlash.
* Kiritish validatsiyasi: birlik narxi > 0, miqdor > 0, yetkazish ≥ 0 → `PricingError`, HTTP 422.
* Invariantlar 8 mahsulot × miqdorlar (1, 7,5, 25, 100, 250) bo‘yicha isbotlangan:
  `total_cost == round(unit_price × qty) + delivery_cost`, mos bo‘lmagan/omborda yo‘q taklif reytingga kirmaydi.
* Reyting umumiy xarajat bo‘yicha, barqaror tie-break (reyting, keyin id) — takroriy so‘rovlarda tekshirildi.
* “Umuman eng yaxshi” sifat/yetkazish bali tufayli “eng arzon”dan farq qilishi mumkin; farqda UI uni
  aniq alternativa va ustama sifatida ko‘rsatadi.
* Miqdorga bog‘liq reyting tekshirildi: 50 kg da qimmat/bepul yetkazishli ta’minotchi, 1 000 kg da
  arzon/qimmat yetkazishli ta’minotchi yutadi.
* Tuzoqdan himoya: 100 kg da 4 200 bepul yetkazish 4 000 + 50 000 yetkazishdan afzal.

---

## 10. Qamrab olinmagan / cheklovlar

1. **Haqiqiy brauzer avtomatizatsiyasi yo‘q** (Chromium yuklash bloklangan): skrinshotlar, brauzerlararo
   (Firefox/Safari/WebKit) tekshiruv, Lighthouse/performance ko‘rsatkichlari va haqiqiy viewport renderingi yo‘q.
2. **Docker compose ishga tushirilmagan** — sandboxda Docker daemon yo‘q. Fayllar izchil, lekin Docker bor
   mashinada bir marta smoke-test qilish kerak.
3. **PostgreSQL rejimi ishga tushirilmagan** — faqat SQLite. Modellar PG bilan mos, lekin prod oldidan
   bitta integratsion yugurish kerak.
4. **Penetratsion test yo‘q** — JWT/bcrypt/CORS/validatsiya ko‘zdan kechirilgan va salbiy testlar bilan
   tekshirilgan, ammo fuzzing, rate-limit va CVE skani bajarilmagan.
5. **Yuklama/unumdorlik testi yo‘q.**
6. Dizayn bo‘yicha demo sohalar: bildirishnomalar saqlanadi, lekin yuborilmaydi; ta’minotchi *kompaniya
   nomlari* uch tilda ham berilganidek qoladi; yordamchi — tashqi modelsiz qoidalar dvigateli.
   Yordamchi o‘zbek/rus savollarni kalit so‘zlar bilan tushunadi, lekin kalit so‘zlar ingliz manbasiga
   asoslangan, shuning uchun sof o‘zbekcha jumla intent sifatida emas, tanlangan tildagi yordam matni
   bilan javoblanadi.
7. **Tarjima sifati**: en/uz/ru matritsasi va 476 UI kaliti bo‘yicha ona tilida o‘qish darajasidagi ko‘zdan
   kechirish bajarilgan, ammo professional lingvistik imzo yo‘q.

---

## 11. Barchasini qayta yugurtirish

```bash
# 1. Backend unit + integratsiya testlari
cd backend && python -m pytest tests -q                     # 159 passed (26 mahalliylashtirish testi)

# 2. Jonli to'plamlar uchun bir martalik API (demo bazani toza saqlaydi)
cd backend && rm -f qa_smoke.db && \
  DATABASE_URL=sqlite:///./qa_smoke.db uvicorn app.main:app --port 8001

# 3. Jonli API smoke to'plami
python scripts/qa_smoke.py http://127.0.0.1:8001             # 110/110 passed

# 4. Adversarial probe
python scripts/qa_edge_probes.py http://127.0.0.1:8001       # 57/57 passed

# 5. Frontend
cd frontend
npm run typecheck                                           # clean
npm test                                                    # 117 passed (19 i18n)
npm run build                                               # success
npm run preview                                             # :4173 + /api proxy

# 6. Til matritsasi (ishlayotgan API'da)
for L in en ru uz; do
  curl -s -X POST http://127.0.0.1:8000/api/recommendations/compare \
    -H "Content-Type: application/json" -H "Accept-Language: $L" \
    -d '{"product_id": 1, "quantity": 100}' | head -c 200; echo
done
```

Ikkala QA skripti demo foydalanuvchi va taklif yaratadi, shuning uchun ularni har doim bir martalik
bazaga (`qa_smoke.db` / `qa_probe.db`) qaratib, keyin faylni o‘chiring — namoyish bazasi toza qolishi kerak.

---

## 12. Yakuniy imzo

| Mezon | Holat |
| --- | --- |
| Ilova uchidan-uchiga ishlaydi (frontend + backend + baza) | ✅ |
| Har bir hujjatlashtirilgan API endpoint to‘g‘ri kod va xatolar bilan ishlaydi | ✅ |
| Killer Flow to‘liq interaktiv, spetsifikatsiyadagi aniq summalar | ✅ |
| Umumiy xarajat hisobi to‘g‘ri, moslik qoidalari bajariladi | ✅ |
| Autentifikatsiya va foydalanuvchi ma’lumotlari izolyatsiyasi to‘g‘ri | ✅ |
| O‘lik tugmalar yoki buzilgan navigatsiya yo‘q | ✅ |
| Uch tilli interfeys (en/uz/ru) haqiqatan almashtiriladi, server matni bilan birga | ✅ |
| Moslashuvchan joylashuvlar va mobil fallbacklar mavjud | ✅ (tuzilmaviy; vizual tekshiruv tavsiya etiladi) |
| Kritik/jiddiy nuqsonlar | **0 ochiq** (uch bosqichda 12 tuzatildi) |
| Kichik nuqsonlar | **0 ochiq** (uch bosqichda 14 tuzatildi) |
| Avtomatik regressiya qamrovi | 159 backend + 117 UI/unit + 110 jonli API + 57 probe |

**Tavsiya:** MVP namoyishi uchun tasdiqlangan. Ommaviy/production chiqish oldidan §10 dagi muhit
bo‘shliqlarini yoping (haqiqiy brauzer yugurishi, Docker + PostgreSQL integratsiyasi, xavfsizlik skani).
