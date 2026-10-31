# 5-Bo'lim. Pitch: 5 slayd va 3 daqiqalik nutq

**Format:** 3 daqiqa · 5 slayd · hakamlar paneli: Dilmurod (IT-ekonomika/investitsiya), Abdumalik Abdukhalimov (FoundersHub — problem-fit va ijro tezligi), Elzodxon Sharofaddinov (Aisha AI & VoiceLab — texnik arxitektura), Umid Azamkulov (Scholify — moliyaviy barqarorlik va jamoa).

## Slaydlar va vaqt taqsimoti

| Vaqt | Slayd | Mazmun | Hakamlar e'tibori |
|---|---|---|---|
| 00:00–00:30 | **1. Muammo** | B2B xaridlarda axborot tarqoqligi; bir xil tovar 15–40% farq; xarid sikli 3–5 kun | UZSdagi yo'qotish bilan raqamlash |
| 00:30–01:00 | **2. Yechim** | MarketPulse B2B: real vaqt narx indeksi, AI parsing, neytral operator | Texnik ishonchlilik |
| 01:00–01:45 | **3. Prototip + Killer Flow** | Live demo: 15 daqiqada shartnoma (8 qadam) | Demo ishlashi, UX |
| 01:45–02:20 | **4. Biznes model va moliya** | Tariflar (499k/1.49m/4.9m UZS), 2029: 42 mlrd UZS, LTV/CAC 12.6× | Moliyaviy realistiklik |
| 02:20–03:00 | **5. GTM, raqobat, jamoa** | IT Park, EHF/Didox, Bigmart/B2BMAP'dan farq, jamoa va so'rov | Ijro tezligi |

---

## Nutq matni (so'zma-so'z, ~420 so'z ≈ 3 daqiqa)

**[0:00 — Slayd 1]**
"Assalomu alaykum. O'zbekistonda 500 mingdan ortiq biznes bir xil tovarni **15 dan 40 foizgacha** farq bilan sotib oladi. Sabab bitta: narxlar tarqoq. Bitta xarid o'rtacha 3–5 kun va 20 dan ortiq qo'ng'iroqni talab qiladi. Ya'ni har bir KOB har yili o'z xarajatining sezilarli qismini **shunchaki bilmaslik uchun** to'laydi."

**[0:30 — Slayd 2]**
"MarketPulse B2B — bu B2B narxlarning neytral operatori. Biz uch manbadan ma'lumot yig'amiz: hamkor ta'minotchi API'lari, ommaviy прайс-listlar va EHF/Didox. AI parsing va entity matching har xil nomdagi bir xil tovarni bitta SKUga birlashtiradi, so'ng median narx, adolatli narx diapazoni va bozor indeksini hisoblaymiz. Muhimi — biz sotuvchi emasmiz, shuning uchun benchmark ishonchli."

**[1:00 — Slayd 3]**
"Endi 15 daqiqada bajariladigan Killer Flowni ko'rsataman: so'rovni kiritamiz — tizim 12 ta'minotchidan narxlarni skanerlaydi, QQSni ajratadi, eng arzon va ishonchli uchtasini saralaydi. AI Negotiator maqsadli narxni hisoblab, muzokara skriptini yozadi. Shartnoma shabloni bir klikda tayyorlanadi. Natija: 3–5 kun emas, 15 daqiqa; o'rtacha **1.9 million so'm tejamkorlik** bitta xaridda."

**[1:45 — Slayd 4]**
"Biznes model — SaaS. Business tarifi 499 ming, Pro Analytics 1 million 490 ming, Enterprise 4 million 900 ming so'mdan; qo'shimcha API, listing va verified badge. 2027-yilda 3.2 milliard, 2029-yilda **42 milliard so'm** daromad. Unit economics: LTV/CAC 2029-da 12.6, CAC payback 6 oy, gross margin 88%. Seed so'rovi — 600 ming dollar: bu 2027 yilgi zarar va CAPEXni qoplaydi, EBITDA 2028-yilda musbat bo'ladi."

**[2:20 — Slayd 5]**
"GTM: IT Park, Savdo-sanoat palatasi va EHF operatorlari orqali — ya'ni mijozlar allaqachon to'plangan joyga kiramiz. Raqobatchilar B2BMAP va Bigmart katalog va xarid vositasi; ular narxni **o'zgartirmaydi**. Biz ma'lumotni pul tejashga aylantiramiz. Jamoa: AI, fintech va B2B savdoda tajribali. Bugun pilot uchun 3 kategoriya va 200 ta'minotchi tayyor. Rahmat — savollar bo'lsa, demo stolida davom etamiz."

---

## Hakamlar uchun 6 ta tayyor javob

1. **"Ma'lumotni qonuniy qanday olasiz?"** — Ommaviy прайс (robots.txt hurmat), hamkor API shartnomalari va EHF agregatsiyasi; shaxsiy bitim shartlari oshkor qilinmaydi.
2. **"Ta'minotchi narxini yashirsa?"** — Benchmark anonim; narx bermagan ta'minotchi reytingi pasayadi; verified badge rag'bati.
3. **"Nega Bigmart buni qilmaydi?"** — Ular sotuvchi, ya'ni neytral benchmark bera olmaydi; bizning model ma'lumot tarmog'i effektiga tayanadi.
4. **"AI xato qilsa?"** — 0.70–0.90 oralig'ida LLM verifikator, undan pastda human-in-the-loop; oylik anomaliya auditi.
5. **"42 mlrd UZS realmi?"** — 3 400 obunachi × 1.03 mln ARPU × 12 = 42 mlrd; SAMning 12%, 145 000 korxona ichida 2.3% penetratsiya.
6. **"Nima uchun hozir?"** — EHF raqamlashtirish, LLM arzonlashuvi, PQ-59 siyosati va $4.3 mlrd ekotizim.

## Demo tayyorlash ro'yxati
- [ ] `app/` prototip brauzerda ochilgan (offline ishlaydi)
- [ ] Zaxira skrinshotlar va 60 sekundlik video
- [ ] 3 ta real kategoriya bo'yicha oldindan tayyorlangan so'rov
- [ ] Zaxira internet: lokal hotspot
