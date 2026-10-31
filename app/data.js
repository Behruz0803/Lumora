/* MarketPulse B2B — demo ma'lumotlari (deterministik, offline) */

const SUPPLIERS = [
  { id: "s1",  name: "SementGroup",    region: "Toshkent",  rating: 4.8, delivery: 1, verified: true,  deals: 412 },
  { id: "s2",  name: "BuildMax",       region: "Toshkent",  rating: 4.5, delivery: 2, verified: true,  deals: 388 },
  { id: "s3",  name: "QuruqQurilish",  region: "Chirchiq",  rating: 4.2, delivery: 3, verified: false, deals: 190 },
  { id: "s4",  name: "AgroTrade",      region: "Samarqand", rating: 4.6, delivery: 2, verified: true,  deals: 305 },
  { id: "s5",  name: "FoodLine",       region: "Toshkent",  rating: 4.4, delivery: 1, verified: true,  deals: 522 },
  { id: "s6",  name: "PackMaster",     region: "Toshkent",  rating: 4.7, delivery: 2, verified: true,  deals: 277 },
  { id: "s7",  name: "EcoPack",        region: "Buxoro",    rating: 4.0, delivery: 4, verified: false, deals: 96  },
  { id: "s8",  name: "OfficePro",      region: "Toshkent",  rating: 4.5, delivery: 2, verified: true,  deals: 231 },
  { id: "s9",  name: "ITSupply",       region: "Toshkent",  rating: 4.3, delivery: 3, verified: true,  deals: 168 },
  { id: "s10", name: "TransLogistik",  region: "Toshkent",  rating: 4.1, delivery: 1, verified: false, deals: 142 },
  { id: "s11", name: "MetallServis",   region: "Bekobod",   rating: 4.4, delivery: 3, verified: true,  deals: 205 },
  { id: "s12", name: "UniversalTrade", region: "Farg'ona",  rating: 3.9, delivery: 5, verified: false, deals: 74  }
];

const CATEGORIES = [
  "Qurilish materiallari",
  "Oziq-ovqat",
  "Qadoqlash",
  "Ofis jihozlari",
  "IT texnika",
  "Logistika"
];

const PRODUCTS = [
  // Qurilish materiallari
  { id: "p01", name: "Sement M400 (50 kg)", cat: "Qurilish materiallari", unit: "qop", base: 62500, pool: ["s1","s2","s3","s11"] },
  { id: "p02", name: "Sement M500 (50 kg)", cat: "Qurilish materiallari", unit: "qop", base: 71000, pool: ["s1","s2","s3","s11"] },
  { id: "p03", name: "Armatura A500 Ø12 mm (1 t)", cat: "Qurilish materiallari", unit: "tonna", base: 8450000, pool: ["s2","s3","s11"] },
  { id: "p04", name: "Gips karton 12.5 mm (1.2×2.5 m)", cat: "Qurilish materiallari", unit: "dona", base: 48000, pool: ["s1","s2","s3"] },
  { id: "p05", name: "Qizil g'isht M125", cat: "Qurilish materiallari", unit: "dona", base: 1250, pool: ["s3","s11","s12"] },
  { id: "p06", name: "Qum (1 m³, yetkazib berish bilan)", cat: "Qurilish materiallari", unit: "m³", base: 185000, pool: ["s3","s11","s12"] },
  { id: "p07", name: "Shifer 8 to'lqinli", cat: "Qurilish materiallari", unit: "dona", base: 78000, pool: ["s2","s3","s12"] },
  { id: "p08", name: "Mineral paxta 100 mm (1 m³)", cat: "Qurilish materiallari", unit: "m³", base: 320000, pool: ["s1","s3","s11"] },
  { id: "p09", name: "Keramogranit 60×60 (1 m²)", cat: "Qurilish materiallari", unit: "m²", base: 145000, pool: ["s2","s3","s12"] },
  { id: "p10", name: "Profnastil C8 (1 m²)", cat: "Qurilish materiallari", unit: "m²", base: 96000, pool: ["s2","s11","s12"] },

  // Oziq-ovqat
  { id: "p11", name: "Bug'doy uni 1-nav (50 kg)", cat: "Oziq-ovqat", unit: "qop", base: 265000, pool: ["s4","s5","s12"] },
  { id: "p12", name: "O'simlik yog'i (5 l)", cat: "Oziq-ovqat", unit: "dona", base: 92000, pool: ["s4","s5"] },
  { id: "p13", name: "Shakar (50 kg)", cat: "Oziq-ovqat", unit: "qop", base: 615000, pool: ["s4","s5","s12"] },
  { id: "p14", name: "Guruch Lazer (25 kg)", cat: "Oziq-ovqat", unit: "qop", base: 385000, pool: ["s4","s5"] },
  { id: "p15", name: "Tovuq filesi (10 kg)", cat: "Oziq-ovqat", unit: "blok", base: 620000, pool: ["s4","s5"] },
  { id: "p16", name: "Kartoshka (1 tonna)", cat: "Oziq-ovqat", unit: "tonna", base: 4200000, pool: ["s4","s12"] },
  { id: "p17", name: "Makaron mahsuloti (10 kg)", cat: "Oziq-ovqat", unit: "quti", base: 110000, pool: ["s5","s4"] },
  { id: "p18", name: "Choy (25 kg)", cat: "Oziq-ovqat", unit: "qop", base: 2450000, pool: ["s4","s5"] },
  { id: "p19", name: "Konserva g'o'sht (500 dona)", cat: "Oziq-ovqat", unit: "blok", base: 9800000, pool: ["s4","s5","s12"] },
  { id: "p20", name: "Tuz (25 kg)", cat: "Oziq-ovqat", unit: "qop", base: 78000, pool: ["s4","s5"] },

  // Qadoqlash
  { id: "p21", name: "GoFrokarton 3 qatlam (1000 dona)", cat: "Qadoqlash", unit: "paket", base: 2450000, pool: ["s6","s7"] },
  { id: "p22", name: "Stretch plyonka 500 mm", cat: "Qadoqlash", unit: "rulon", base: 118000, pool: ["s6","s7","s12"] },
  { id: "p23", name: "Polypropilen qop 50 kg (500 dona)", cat: "Qadoqlash", unit: "paket", base: 1850000, pool: ["s6","s7"] },
  { id: "p24", name: "PET butilka 1 l (1000 dona)", cat: "Qadoqlash", unit: "paket", base: 1250000, pool: ["s6","s7"] },
  { id: "p25", name: "Karton quti 40×30×30 (500 dona)", cat: "Qadoqlash", unit: "paket", base: 1650000, pool: ["s6","s7"] },
  { id: "p26", name: "Skotch lenta 48 mm", cat: "Qadoqlash", unit: "dona", base: 18500, pool: ["s6","s7","s12"] },
  { id: "p27", name: "Vakuum paket (1000 dona)", cat: "Qadoqlash", unit: "paket", base: 890000, pool: ["s6","s7"] },
  { id: "p28", name: "Kraft paket (1000 dona)", cat: "Qadoqlash", unit: "paket", base: 720000, pool: ["s6","s7"] },

  // Ofis jihozlari
  { id: "p29", name: "Ofis stoli 140×70", cat: "Ofis jihozlari", unit: "dona", base: 1450000, pool: ["s8","s12"] },
  { id: "p30", name: "Ergonomik ofis kursisi", cat: "Ofis jihozlari", unit: "dona", base: 1250000, pool: ["s8","s12"] },
  { id: "p31", name: "A4 qog'oz 80 g (5 paket)", cat: "Ofis jihozlari", unit: "quti", base: 210000, pool: ["s8","s9"] },
  { id: "p32", name: "Arxiv shkafi (metall)", cat: "Ofis jihozlari", unit: "dona", base: 2150000, pool: ["s8"] },
  { id: "p33", name: "Markerlar to'plami (20 dona)", cat: "Ofis jihozlari", unit: "to'plam", base: 78000, pool: ["s8","s9"] },
  { id: "p34", name: "Konditsioner 18 000 BTU", cat: "Ofis jihozlari", unit: "dona", base: 7800000, pool: ["s8","s12"] },

  // IT texnika
  { id: "p35", name: "Noutbuk 14\" i5/16GB/512SSD", cat: "IT texnika", unit: "dona", base: 11800000, pool: ["s9","s12"] },
  { id: "p36", name: "Monitor 24\" FHD", cat: "IT texnika", unit: "dona", base: 1850000, pool: ["s9","s8"] },
  { id: "p37", name: "Lazer printer A4", cat: "IT texnika", unit: "dona", base: 3450000, pool: ["s9","s8"] },
  { id: "p38", name: "Wi-Fi router (biznes)", cat: "IT texnika", unit: "dona", base: 1450000, pool: ["s9"] },
  { id: "p39", name: "Server 2U Xeon", cat: "IT texnika", unit: "dona", base: 42000000, pool: ["s9","s12"] },
  { id: "p40", name: "UPS 3000 VA", cat: "IT texnika", unit: "dona", base: 4200000, pool: ["s9","s8"] },
  { id: "p41", name: "Tarmoq kabeli Cat6 (305 m)", cat: "IT texnika", unit: "rulon", base: 1950000, pool: ["s9","s11"] },

  // Logistika
  { id: "p42", name: "Toshkent–Samarqand yuk tashish (20 t)", cat: "Logistika", unit: "reys", base: 4800000, pool: ["s10","s12"] },
  { id: "p43", name: "Toshkent–Farg'ona yuk tashish (10 t)", cat: "Logistika", unit: "reys", base: 3600000, pool: ["s10","s12"] },
  { id: "p44", name: "Ombor saqlash (1 pallet/oy)", cat: "Logistika", unit: "oy", base: 320000, pool: ["s10"] },
  { id: "p45", name: "Yuk ortish-bo'shatish (1 soat)", cat: "Logistika", unit: "soat", base: 145000, pool: ["s10","s12"] }
];

/* Deterministik pseudo-random (seed matn bo'yicha) */
function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/* Ta'minotchi takliflari: har bir tovar uchun 3–4 taklif */
function buildOffers() {
  const offers = {};
  PRODUCTS.forEach(p => {
    offers[p.id] = p.pool.map((sid, i) => {
      const s = SUPPLIERS.find(x => x.id === sid);
      const r = hashStr(p.id + sid);
      const spread = 0.86 + r * 0.34;          // 86%–120% baza narxidan
      const price = Math.round((p.base * spread) / 500) * 500;
      const updated = Math.round(2 + hashStr(sid + p.id) * 46); // daqiqa oldin
      return {
        supplierId: sid,
        supplier: s.name,
        region: s.region,
        price,
        rating: s.rating,
        delivery: s.delivery,
        verified: s.verified,
        updatedMin: updated,
        confidence: s.verified ? 0.95 : 0.72,
        stock: Math.round(20 + hashStr("stock" + sid + p.id) * 480)
      };
    });
  });
  return offers;
}

const OFFERS = buildOffers();

/* MPI indeksi — 90 kunlik seriya */
function buildIndex() {
  const out = [];
  let v = 100;
  const start = new Date();
  start.setDate(start.getDate() - 89);
  for (let i = 0; i < 90; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const drift = (hashStr("idx" + i) - 0.48) * 0.9;
    v = Math.max(92, Math.min(118, v + drift));
    out.push({ date: d, value: +v.toFixed(2) });
  }
  return out;
}
const INDEX = buildIndex();
