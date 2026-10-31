/* MarketPulse B2B — demo logikasi */

const fmt = n => new Intl.NumberFormat('ru-RU').format(Math.round(n)).replace(/\u00A0/g, ' ');
const uzs = n => fmt(n) + " UZS";
const shortNum = n => {
  if (n >= 1e9) return (n / 1e9).toFixed(n >= 1e10 ? 0 : 1).replace('.', ',') + " mlrd";
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace('.', ',') + " mln";
  if (n >= 1e3) return fmt(n / 1e3) + " ming";
  return fmt(n);
};
const VAT = 0.12;
let vatOn = false;

const state = {
  view: "dashboard",
  productId: "p01",
  category: ""
};

/* ---------- navigatsiya ---------- */
function setView(name) {
  state.view = name;
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === name));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + name));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (name === 'dashboard') drawChart();
}
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => setView(btn.dataset.view));
});

/* ---------- yordamchilar ---------- */
const productById = id => PRODUCTS.find(p => p.id === id);

function offersFor(pid) {
  return [...OFFERS[pid]].sort((a, b) => a.price - b.price);
}
function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function statsFor(pid) {
  const o = offersFor(pid);
  const prices = o.map(x => x.price);
  const med = median(prices);
  const min = Math.min(...prices), max = Math.max(...prices);
  return { offers: o, med, min, max, spread: ((max - min) / min) * 100 };
}
function priceDisplay(p) { return vatOn ? p * (1 + VAT) : p; }

/* ---------- DASHBOARD ---------- */
function renderDashboard() {
  const last = INDEX[INDEX.length - 1].value;
  const monthAgo = INDEX[INDEX.length - 31].value;
  const delta = ((last - monthAgo) / monthAgo) * 100;

  document.getElementById('kpiIndex').textContent = last.toFixed(1);
  const dEl = document.getElementById('kpiIndexDelta');
  dEl.textContent = `${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta).toFixed(1)}% (30 kun)`;
  dEl.className = 'kpi-delta ' + (delta >= 0 ? 'up' : 'down');

  let totalSaving = 0, spreadSum = 0;
  PRODUCTS.forEach(p => {
    const s = statsFor(p.id);
    totalSaving += s.max - s.min;
    spreadSum += s.spread;
  });
  document.getElementById('kpiSave').textContent = shortNum(totalSaving / PRODUCTS.length);
  document.getElementById('kpiSpread').textContent = (spreadSum / PRODUCTS.length).toFixed(1) + "%";

  // kategoriyalar
  const catBox = document.getElementById('catList');
  catBox.innerHTML = CATEGORIES.map((c, ci) => {
    const prods = PRODUCTS.filter(p => p.cat === c);
    const avg = prods.reduce((a, p) => a + statsFor(p.id).spread, 0) / prods.length;
    const pct = (hashStr(c) * 6 - 2.4);
    return `<div class="cat-row">
      <span>${c} <span class="muted small">· ${prods.length} SKU</span></span>
      <span class="cat-pct ${pct >= 0 ? 'up' : 'down'}">${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%</span>
      <div class="cat-bar"><i style="width:${Math.min(100, avg * 2.4)}%"></i></div>
    </div>`;
  }).join('');

  // spread jadvali
  const rows = PRODUCTS.map(p => ({ p, s: statsFor(p.id) }))
    .sort((a, b) => b.s.spread - a.s.spread).slice(0, 6);
  document.querySelector('#spreadTable tbody').innerHTML = rows.map(({ p, s }) => `
    <tr>
      <td>${p.name}</td>
      <td><span class="tag">${p.cat}</span></td>
      <td class="num">${fmt(priceDisplay(s.min))}</td>
      <td class="num">${fmt(priceDisplay(s.med))}</td>
      <td class="num">${fmt(priceDisplay(s.max))}</td>
      <td class="num"><span class="tag warn">${s.spread.toFixed(1)}%</span></td>
      <td class="num"><button class="btn sm" data-open="${p.id}">Tahlil →</button></td>
    </tr>`).join('');
  document.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => {
    state.productId = b.dataset.open;
    document.getElementById('productSelect').value = state.productId;
    renderCompare();
    setView('compare');
  }));
}

function drawChart() {
  const canvas = document.getElementById('indexChart');
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 600, h = 230;
  canvas.width = w * dpr; canvas.height = h * dpr;
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const pad = { l: 36, r: 10, t: 14, b: 24 };
  const vals = INDEX.map(d => d.value);
  const min = Math.min(...vals) - 1.5, max = Math.max(...vals) + 1.5;
  const x = i => pad.l + (i / (INDEX.length - 1)) * (w - pad.l - pad.r);
  const y = v => pad.t + (1 - (v - min) / (max - min)) * (h - pad.t - pad.b);

  // grid
  ctx.strokeStyle = 'rgba(34,48,90,.7)';
  ctx.fillStyle = '#8ea0c4';
  ctx.font = '10px Inter, sans-serif';
  ctx.lineWidth = 1;
  for (let g = 0; g <= 4; g++) {
    const val = min + (g / 4) * (max - min);
    const yy = y(val);
    ctx.beginPath(); ctx.moveTo(pad.l, yy); ctx.lineTo(w - pad.r, yy); ctx.stroke();
    ctx.fillText(val.toFixed(0), 6, yy + 3);
  }

  // area
  const grad = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
  grad.addColorStop(0, 'rgba(61,220,151,.28)');
  grad.addColorStop(1, 'rgba(61,220,151,0)');
  ctx.beginPath();
  INDEX.forEach((d, i) => i ? ctx.lineTo(x(i), y(d.value)) : ctx.moveTo(x(i), y(d.value)));
  ctx.lineTo(x(INDEX.length - 1), h - pad.b);
  ctx.lineTo(x(0), h - pad.b);
  ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  // line
  ctx.beginPath();
  INDEX.forEach((d, i) => i ? ctx.lineTo(x(i), y(d.value)) : ctx.moveTo(x(i), y(d.value)));
  ctx.strokeStyle = '#3ddc97'; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();

  // last point
  const li = INDEX.length - 1;
  ctx.beginPath(); ctx.arc(x(li), y(INDEX[li].value), 4, 0, Math.PI * 2);
  ctx.fillStyle = '#3ddc97'; ctx.fill();
  ctx.beginPath(); ctx.arc(x(li), y(INDEX[li].value), 8, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(61,220,151,.35)'; ctx.stroke();

  // x labels
  ctx.fillStyle = '#8ea0c4';
  [0, 30, 60, 89].forEach(i => {
    const d = INDEX[i].date;
    const label = d.getDate().toString().padStart(2, '0') + '.' + (d.getMonth() + 1).toString().padStart(2, '0');
    ctx.fillText(label, Math.min(x(i) - 10, w - 34), h - 6);
  });
}

window.addEventListener('resize', () => { if (state.view === 'dashboard') drawChart(); });

/* ---------- COMPARE ---------- */
function populateSelects() {
  const cat = document.getElementById('categoryFilter');
  CATEGORIES.forEach(c => {
    const o = document.createElement('option');
    o.value = c; o.textContent = c; cat.appendChild(o);
  });
  cat.addEventListener('change', () => {
    state.category = cat.value;
    const list = PRODUCTS.filter(p => !state.category || p.cat === state.category);
    fillProductSelect(list);
    if (list.length) { state.productId = list[0].id; renderCompare(); }
  });

  fillProductSelect(PRODUCTS);

  const negSel = document.getElementById('negProduct');
  PRODUCTS.forEach(p => {
    const o = document.createElement('option');
    o.value = p.id; o.textContent = `${p.name} · ${p.cat}`;
    negSel.appendChild(o);
  });
  negSel.value = 'p01';
}

function fillProductSelect(list) {
  const sel = document.getElementById('productSelect');
  sel.innerHTML = list.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  sel.value = state.productId;
  sel.onchange = () => { state.productId = sel.value; renderCompare(); };
}

function renderCompare() {
  const p = productById(state.productId);
  if (!p) return;
  document.getElementById('productTitle').textContent = p.name;
  document.getElementById('compareSub').textContent = `${p.cat} · o'lchov birligi: ${p.unit} · narxlar ${vatOn ? 'QQS bilan' : 'QQSsiz'}`;

  const s = statsFor(p.id);
  const rows = s.offers;
  const minP = s.min, maxP = s.max;

  document.querySelector('#offerTable tbody').innerHTML = rows.map((o, i) => {
    const vat = o.price * VAT;
    const final = o.price + vat;
    const cls = o.price === minP ? 'best' : (o.price === maxP ? 'worst' : '');
    return `<tr class="${cls}">
      <td><b>${o.supplier}</b> ${o.verified ? '<span class="tag ok">✓ verified</span>' : ''}</td>
      <td class="muted">${o.region}</td>
      <td class="num">${fmt(o.price)}</td>
      <td class="num muted">${fmt(vat)}</td>
      <td class="num"><b>${fmt(final)}</b></td>
      <td class="num"><span class="rating"><b>★ ${o.rating.toFixed(1)}</b></span></td>
      <td class="num">${o.delivery} kun</td>
      <td><span class="tag ${o.verified ? 'ok' : 'warn'}">${o.verified ? 'EHF' : 'прайс'} · ${o.updatedMin} daq</span></td>
      <td class="num">${i === 0 ? '<span class="tag ok">tanlangan</span>' : `<button class="btn sm" data-neg="${p.id}">Muzokara</button>`}</td>
    </tr>`;
  }).join('');

  document.querySelectorAll('[data-neg]').forEach(b => b.addEventListener('click', () => {
    document.getElementById('negProduct').value = b.dataset.neg;
    setView('negotiator');
  }));

  const best = rows[0], worst = rows[rows.length - 1];
  document.getElementById('compareStats').innerHTML = `
    <span>Median: <b>${uzs(priceDisplay(s.med))}</b></span>
    <span>Fair band: <b>${fmt(priceDisplay(s.med * 0.92))} – ${fmt(priceDisplay(s.med * 1.08))}</b></span>
    <span>Narx farqi: <b>${s.spread.toFixed(1)}%</b></span>
    <span>Tejamkorlik: <b style="color:var(--accent)">${uzs(worst.price - best.price)}</b> / ${p.unit}</span>
    <span>So'nggi yangilanish: <b>${Math.min(...rows.map(r => r.updatedMin))} daqiqa oldin</b></span>`;
}

/* ---------- SUPPLIERS ---------- */
function renderSuppliers() {
  const box = document.getElementById('supplierGrid');
  box.innerHTML = SUPPLIERS.map(s => {
    const score = (s.rating / 5) * 100;
    return `<div class="supplier">
      <div class="supplier-head">
        <div>
          <div class="supplier-name">${s.name}</div>
          <div class="supplier-meta"><span>${s.region}</span><span>${s.delivery} kun yetkazish</span></div>
        </div>
        ${s.verified ? '<span class="tag ok">✓ verified</span>' : '<span class="tag warn">tekshirilmagan</span>'}
      </div>
      <div class="meter"><i style="width:${score}%"></i></div>
      <div class="supplier-stats">
        <span>Reyting <b>★ ${s.rating.toFixed(1)}</b></span>
        <span>Bitimlar <b>${fmt(s.deals)}</b></span>
        <span>Indeks <b>${Math.round(score)}</b></span>
      </div>
    </div>`;
  }).join('');
}

/* ---------- KILLER FLOW ---------- */
const FLOW = [
  { t: "Muammoni aniqlash", d: "Tovar, hajm, hudud va muddat NLP orqali ajratiladi; entity matching SKU tasdiqlaydi.", a: "RFQ draft", sl: "5 s" },
  { t: "Bozor skaneri", d: "12 ta'minotchidan real vaqt narxlari yig'iladi, QQS ajratiladi, eskirgan narxlar belgilanadi.", a: "3–12 taklif", sl: "15 s" },
  { t: "Narx tahlili", d: "Median, spread, fair-price band, 90 kunlik trend va anomaliyalar hisoblanadi.", a: "Narx landshafti", sl: "3 s" },
  { t: "Ta'minotchi saralash", d: "Reyting = sifat 40% + muddat 30% + narx 20% + tarix 10%; risk bayroqlari.", a: "Top-3 shortlist", sl: "2 s" },
  { t: "AI muzokara", d: "Maqsadli narx, BATNA va muzokara skripti tayyorlanadi (o'zbek/rus).", a: "Muzokara rejasi", sl: "20 s" },
  { t: "Shartnoma loyihasi", d: "Shartnoma shabloni: yetkazish, jarima, to'lov grafigi, QQS 12%; e-imzoga tayyor.", a: "PDF / DOCX", sl: "30 s" },
  { t: "Buyurtma va kuzatish", d: "Buyurtma EHF/1C bilan bog'lanadi, yetkazish trekи va ogohlantirishlar yoqiladi.", a: "Trek + sana", sl: "1 daq" },
  { t: "Natijani o'lchash", d: "Tejamkorlik akti, audit-trail; indeks benchmarki yangilanadi.", a: "Tejamkorlik akti", sl: "5 s" }
];

function renderFlow() {
  document.getElementById('flowSteps').innerHTML = FLOW.map((f, i) => `
    <div class="step" id="step-${i}">
      <div class="step-num">${i + 1}</div>
      <div>
        <div class="step-title">${f.t}</div>
        <div class="step-desc">${f.d}</div>
      </div>
      <div class="step-meta">${f.sl}<b>${f.a}</b></div>
    </div>`).join('');
}

function runFlow() {
  const btn = document.getElementById('runFlow');
  const result = document.getElementById('flowResult');
  result.hidden = true;
  btn.disabled = true;
  btn.textContent = "Jarayon ketmoqda…";
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active', 'done'));

  let i = 0;
  const tick = () => {
    if (i > 0) document.getElementById('step-' + (i - 1)).classList.replace('active', 'done');
    if (i >= FLOW.length) {
      btn.disabled = false;
      btn.textContent = "▶ Jarayonni qayta ishga tushirish";
      showFlowResult();
      return;
    }
    document.getElementById('step-' + i).classList.add('active');
    i++;
    setTimeout(tick, 780);
  };
  tick();
}

function showFlowResult() {
  const p = productById(state.productId);
  const s = statsFor(p.id);
  const best = s.offers[0];
  const saving = s.med - best.price;
  const r = document.getElementById('flowResult');
  r.hidden = false;
  r.innerHTML = `
    <h3>✅ Bajarildi — shartnoma tayyor (${p.name})</h3>
    <div class="result-grid">
      <div class="result-item"><span>Tanlangan ta'minotchi</span><b>${best.supplier}</b></div>
      <div class="result-item"><span>Yakuniy narx (QQS bilan)</span><b>${fmt(best.price * 1.12)}</b></div>
      <div class="result-item"><span>Mediandan tejamkorlik</span><b style="color:var(--accent)">${fmt(saving)}</b></div>
      <div class="result-item"><span>Jarayon vaqti</span><b>14 daq 52 s</b></div>
    </div>
    <p class="muted small" style="margin:12px 0 0">Audit-trail yozildi · Benchmark yangilandi · Yetkazish sanasi: 2 kun</p>`;
  r.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
document.getElementById('runFlow').addEventListener('click', runFlow);

/* ---------- AI NEGOTIATOR ---------- */
function runNegotiator() {
  const pid = document.getElementById('negProduct').value;
  const p = productById(pid);
  const qty = Math.max(1, +document.getElementById('negQty').value || 1);
  const days = Math.max(1, +document.getElementById('negDays').value || 1);
  const payScore = parseFloat(document.getElementById('negPay').value) + 0.86; // 0.86–1.0
  const payLabel = document.getElementById('negPay').selectedOptions[0].textContent;

  const s = statsFor(pid);
  const n = s.offers.length;
  const volScore = Math.min(1, qty / 2000);
  const compScore = Math.min(1, (n - 1) / 3);
  const timeScore = Math.min(1, Math.max(0, (days - 7) / 23));
  const payN = Math.min(1, payScore);

  const leverage = Math.min(0.18,
    0.40 * volScore + 0.25 * compScore + 0.20 * timeScore + 0.15 * payN);
  const target = Math.round((s.med * (1 - leverage)) / 500) * 500;
  const floor = Math.round((s.min * 0.97) / 500) * 500;
  const anchor = Math.round((s.min * 0.98) / 500) * 500;
  const saving = (s.med - target) * qty;

  document.getElementById('negResult').className = '';
  document.getElementById('negResult').innerHTML = `
    <div class="neg-top">
      <div class="neg-pill"><span>Median narx</span><b>${fmt(s.med)}</b></div>
      <div class="neg-pill"><span>Maqsadli narx</span><b style="color:var(--accent)">${fmt(target)}</b></div>
      <div class="neg-pill"><span>Leverage</span><b>${(leverage * 100).toFixed(1)}%</b></div>
      <div class="neg-pill"><span>Tejamkorlik</span><b style="color:var(--accent)">${shortNum(saving)}</b></div>
    </div>
    <div class="neg-letter">${letter(p, qty, days, s, target, anchor, floor, payLabel, leverage)}</div>
    <p class="neg-note">Guardrail: barcha raqamlar indeks dvigatelidan; LLM faqat matn generatsiyasi. Yuborishdan oldin ta'minotchi va miqdorni tekshiring.</p>`;
}

function letter(p, qty, days, s, target, anchor, floor, payLabel, lev) {
  const best = s.offers[0];
  return `Assalomu alaykum, ${best.supplier} jamoasi!

"${p.name}" bo'yicha ${fmt(qty)} ${p.unit} hajmida xarid rejalashtirmoqdamiz (yetkazish muddati: ${days} kun, to'lov: ${payLabel.toLowerCase()}).

Bozor tahlilimiz (${new Date().toLocaleDateString('uz-UZ')}, ${s.offers.length} ta'minotchi asosida):
• median narx — ${fmt(s.med)} UZS/${p.unit};
• eng past taklif — ${fmt(s.min)} UZS/${p.unit};
• joriy narx farqi — ${s.spread.toFixed(1)}%.

Hajm va to'lov shartlarini hisobga olib, ${fmt(target)} UZS/${p.unit} darajasida kelishuvni taklif qilamiz
(boshlang'ich taklif: ${fmt(anchor)}, maqbul pastki chegara: ${fmt(floor)}). Umumiy summa: ${fmt(target * qty)} UZS (QQSdan tashqari, QQS 12% ustiga).

Qo'shimcha ravishda 30 kunlik kredit liniyasi va keyingi 6 oy uchun barqaror hajmni kafolatlay olamiz.

Iltimos, taklifingizni 24 soat ichida tasdiqlang. Aks holda shortlistdagi navbatdagi ta'minotchiga o'tamiz.

Hurmat bilan,
Behruz M. — Xaridlar bo'limi, MarketPulse B2B
(leverage ${(lev * 100).toFixed(1)}% · BATNA: ${fmt(s.min)} UZS/${p.unit})`;
}
document.getElementById('runNeg').addEventListener('click', runNegotiator);

/* ---------- QQS toggle ---------- */
document.getElementById('vatToggle').addEventListener('change', e => {
  vatOn = e.target.checked;
  renderDashboard();
  renderCompare();
});

/* ---------- global qidiruv ---------- */
const searchInput = document.getElementById('globalSearch');
let searchBox = null;
searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  if (searchBox) { searchBox.remove(); searchBox = null; }
  if (q.length < 2) return;
  const matches = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q)).slice(0, 7);
  if (!matches.length) return;

  searchBox = document.createElement('div');
  searchBox.className = 'card';
  searchBox.style.cssText = 'position:absolute;top:52px;left:0;right:0;z-index:50;padding:8px;margin:0;box-shadow:0 18px 40px rgba(0,0,0,.5)';
  searchBox.innerHTML = matches.map(p => `
    <button class="btn" style="display:block;width:100%;text-align:left;margin:2px 0;background:transparent;border:0"
      data-p="${p.id}">${p.name} <span class="muted small">· ${p.cat}</span></button>`).join('');
  document.querySelector('.search-wrap').appendChild(searchBox);
  searchBox.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => {
    state.productId = b.dataset.p;
    document.getElementById('productSelect').value = state.productId;
    renderCompare();
    setView('compare');
    searchInput.value = '';
    searchBox.remove(); searchBox = null;
  }));
});
document.addEventListener('keydown', e => {
  if (e.key === '/' && document.activeElement !== searchInput) { e.preventDefault(); searchInput.focus(); }
  if (e.key === 'Escape' && searchBox) { searchBox.remove(); searchBox = null; }
});

/* ---------- init ---------- */
populateSelects();
renderDashboard();
renderCompare();
renderSuppliers();
renderFlow();
drawChart();
runNegotiator();
