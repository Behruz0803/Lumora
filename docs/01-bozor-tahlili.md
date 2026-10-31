# 1-Bo'lim. O'zbekistonda B2B xaridlar va narx shaffofligi bo'yicha analitik umumlashtirish

> Manba: Google Drive'dagi **"AI Agent Prompt Design"** hujjati, 1–2-bo'limlar.
> Hujjat Lumora IT Case Competition (31-oktabr 2026, Toshkent) doirasidagi AICA va AI Alliance hamkorligidagi **Case D — "Smart Market Prices"** topshirig'iga bag'ishlangan.

## 1.1. Muammoning qo'yilishi

O'zbekiston B2B (business-to-business) savdo va korporativ xaridlar ekotizimida **axborot asimmetriyasi** hamda narx shakllanishining tarqoqligi tadbirkorlik subyektlari operatsion samaradorligiga salbiy ta'sir ko'rsatuvchi asosiy omillardan biridir.

Kichik va o'rta biznes (KOB) vakillari xomashyo, asbob-uskuna, qadoqlash vositalari va tijorat mahsulotlarini xarid qilishda resurslarining sezilarli qismini quyidagilarga sarflaydi:

- yetkazib beruvchilarni izlash;
- tijorat takliflarini qo'lda solishtirish;
- uzoq davom etadigan muzokaralar.

Yagona shaffof narxlar reyestri yoki analitik indeksatsiya mavjud emasligi sababli **bir xil texnik spesifikatsiyaga ega tovarlar va xizmatlar 15–40% gacha farqlanuvchi narxlarda** sotilmoqda.

## 1.2. Normativ-huquqiy va soliq cheklovlari

| Talab | Manba | Platforma uchun amaliy ahamiyati |
|---|---|---|
| Narxlar faqat milliy valyutada — so'mda (UZS) belgilanadi; xorijiy valyuta yoki shartli birliklarga bog'lash taqiqlanadi | O'zR "Valyutani tartibga solish to'g'risida"gi Qonuni (LRU-573), 9-modda | Barcha narxlar, indekslar va moliyaviy modellar UZSda yuritilishi shart |
| Standart QQS stavkasi 12% | Soliq kodeksi | Narxlarni QQS bilan / QQSsiz ajratib taqqoslash majburiyati |
| Elektron hisob-faktura (EHF) ekotizimi: Didox va boshqa operatorlar | Soliq kodeksi + EHF operatorlari | Narx ma'lumotlarini EHF bilan mantiqiy bog'lash (verifikatsiya manbasi) |
| Korporativ qarorlar ko'p bo'g'inli: ta'sischi, moliya direktori / bosh buxgalter, texnik mutaxassis, yuridik bo'lim | Amaliy B2B tadqiqotlar | Bir platformada bir nechta rol va turli kesimdagi (texnik, moliyaviy, huquqiy) ko'rinishlar zarur |

## 1.3. Bozor konteksti (2026)

| Ko'rsatkich | Qiymat va manba | Ahamiyati |
|---|---|---|
| Startap ekotizimining umumiy qiymati | $4.3 mlrd (2026) | Institutsional va venchur sarmoyalar mavjud |
| Faol startaplar / venchur fondlar | 950 ta / 22 ta | B2B SaaS va AI startaplari uchun moliyalashtirish manbalari keng |
| Davlat siyosati | PQ-59 (11.02.2026): 2030-yilga qadar 5 000 startap, $2 mlrd venchur investitsiya | Bozor o'sishi uchun tizimli qo'llab-quvvatlash |
| Mavjud o'yinchilar | Bigmart ($200k investitsiya), B2BMAP | Katalog / xarid boshqaruvi bor, **real vaqt narx agregatsiyasi va AI prognoz yo'q** |
| Bo'shliq | Narx indeksatsiyasi, dynamic pricing, AI predictive procurement | Aynan shu bo'shliq Case D yechimining yadrosi |

## 1.4. Prompt injiniring metodologiyasi (2-bo'lim)

12 topshiriqni 100 ballik rubrikaga qat'iy mos holda bitta ijro seansida chiqarish uchun prompt quyidagi 5 tamoyilga tayanadi:

1. **Tizimli persona va meta-kontekst inyeksiyasi** — agent "Enterprise AI Systems Architect + Venture Strategist + B2B Startup Mentor" rolida ishlaydi.
2. **Dekompozitsiya va ballarga asoslangan chuqurlik** — har bir bo'limga balliga mutanosib detallash (15 ballik Killer Flow va 10 ballik moliyaviy prognoz eng chuqur).
3. **Anti-truncation protokoli** — qisqartirish, "va hokazo", umumiy gaplar taqiqlanadi; har bir bo'lim yakunlangan formatda.
4. **Milliy huquqiy-soliq moslashuvi** — faqat UZS, 12% QQS, LRU-573.
5. **Ko'p qatlamli formatlash** — Markdown jadvallar, formulalar, qadamli ssenariylar.

Master promptning to'liq matni: [`02-master-prompt.md`](02-master-prompt.md).
