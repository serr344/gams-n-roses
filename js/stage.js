// ═══════════════════════════════════════════════════════════════════
// GAMS N' ROSES — stage.js
// ═══════════════════════════════════════════════════════════════════

// ── ASSETS ─────────────────────────────────────────────────────────
const imgBuilding = new Image();
imgBuilding.src = 'img/building.png';

const imgBuildingViolated = new Image();
imgBuildingViolated.src = 'img/building_red.png';

// ── ITEMS ──────────────────────────────────────────────────────────
const ITEMS = [
  {
    id: 'line_array',
    name: 'Line Array',
    icon: '🔊',
    shortDesc: '+14 dB · Narrow Cone',
    desc: 'High-power directional speaker. Maximum sound pressure in a narrow cone.',
    color: '#ff6600',
    type: 'speaker',
    magnitude: 14,
    spread: 22,
    cost: 300
  },
  {
    id: 'fill_speaker',
    name: 'Fill Speaker',
    icon: '🔉',
    shortDesc: '+7 dB · Wide Area',
    desc: 'Wide-angle speaker for side and rear fill coverage.',
    color: '#ffaa00',
    type: 'speaker',
    magnitude: 7,
    spread: 55,
    cost: 150
  },
  {
    id: 'subwoofer',
    name: 'Subwoofer',
    icon: '〽️',
    shortDesc: '+5 dB · Omni Bass',
    desc: 'Equal bass frequency in all directions. Affects every point.',
    color: '#ff3300',
    type: 'speaker',
    magnitude: 5,
    spread: 180,
    cost: 200
  },
  {
    id: 'barrier',
    name: 'Sound Barrier',
    icon: '🧱',
    shortDesc: '−18 dB · Strong Block',
    desc: 'Greatly cuts sound going in that direction. Effective against nearby buildings.',
    color: '#0088ff',
    type: 'barrier',
    magnitude: -18,
    spread: 50,
    cost: 250
  },
  {
    id: 'absorber',
    name: 'Absorber Panel',
    icon: '🔇',
    shortDesc: '−10 dB · Precise Absorption',
    desc: 'Absorbs sound in a narrow direction. Used for fine-tuning.',
    color: '#00ccff',
    type: 'barrier',
    magnitude: -10,
    spread: 32,
    cost: 100
  },
  {
    id: 'reflector',
    name: 'Reflector',
    icon: '🪞',
    shortDesc: '−9 dB rear, +5 dB front',
    desc: 'Blocks sound in the slot direction and reflects it toward the audience.',
    color: '#aa44ff',
    type: 'hybrid',
    magnitude: -9,
    spread: 45,
    reflectMagnitude: 5,
    reflectSpread: 40,
    cost: 350
  }
];

// ── SLOT DEFINITIONS ───────────────────────────────────────────────
const SLOT_DEFS = {
  N:  { angle: 0,   label: 'N'  },
  NE: { angle: 45,  label: 'NE' },
  E:  { angle: 90,  label: 'E'  },
  SE: { angle: 135, label: 'SE' },
  S:  { angle: 180, label: 'S'  },
  SW: { angle: 225, label: 'SW' },
  W:  { angle: 270, label: 'W'  },
  NW: { angle: 315, label: 'NW' }
};

const SLOT_IDS = ['NW', 'N', 'NE', 'W', 'E', 'SW', 'S', 'SE'];

const BASE_DB   = 92;
const AUD_DIST  = 50;
const AUD_ANGLE = 180;

function getStageBaseDb() {
  if (stageData?.data?.maxDb != null) {
    return stageData.data.maxDb;
  }
  return BASE_DB;
}

// ── STATE ──────────────────────────────────────────────────────────
let stageData = null;
let selectedItem = null;
let activeSlot = null;
let currentCoins = 1200;

const placedItems = {};
SLOT_IDS.forEach(id => {
  placedItems[id] = null;
});

// ── INIT ───────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const raw = localStorage.getItem('stageOptimData');
  if (raw) {
    try {
      stageData = JSON.parse(raw);
    } catch (e) {
      stageData = null;
    }
  }

  buildPalette();
  buildSlots();
  updateAll();
  resizeCanvas();
  requestAnimationFrame(renderLoop);

  window.addEventListener('resize', () => {
    resizeCanvas();
    updateAll();
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#picker') && !e.target.closest('.slot')) {
      closePicker();
    }
  });
});

function resizeCanvas() {
  const wrap = document.getElementById('stageWrap');
  const canvas = document.getElementById('stageCanvas');
  canvas.width = wrap.clientWidth;
  canvas.height = wrap.clientHeight;
  positionSlots();
}

// ── PALETTE ────────────────────────────────────────────────────────
function buildPalette() {
  const list = document.getElementById('itemsList');
  list.innerHTML = '';

  ITEMS.forEach(item => {
    const div = document.createElement('div');
    div.className = 'item-card';
    div.style.setProperty('--c', item.color);
    div.id = 'ic-' + item.id;
    div.innerHTML = `
      <div class="ic-top">
        <span class="ic-icon">${item.icon}</span>
        <span class="ic-name">${item.name}</span>
        <span class="ic-stat">${item.shortDesc}</span>
      </div>
      <div class="ic-desc">${item.desc}</div>
      <div style="margin-top:8px; font-family:'Share Tech Mono'; font-size:11px; color:var(--gold); font-weight:bold;">
        💰 ${item.cost} 🪙
      </div>
    `;
    div.onclick = () => selectItem(item);
    list.appendChild(div);
  });
}

function selectItem(item) {
  selectedItem = selectedItem?.id === item.id ? null : item;

  document.querySelectorAll('.item-card').forEach(card => {
    card.classList.remove('selected');
  });

  const hint = document.getElementById('selHint');

  if (selectedItem) {
    document.getElementById('ic-' + selectedItem.id)?.classList.add('selected');
    hint.classList.add('active');
    hint.innerHTML = `<b>${selectedItem.icon} ${selectedItem.name}</b> selected.<br>Cost: ${selectedItem.cost} 🪙<br>Click a slot to place it.`;
  } else {
    hint.classList.remove('active');
    hint.innerHTML = 'Select equipment, then click a <b>slot around the stage</b>.';
  }

  closePicker();
}

// ── SLOTS & PICKER ─────────────────────────────────────────────────
function buildSlots() {
  const wrap = document.getElementById('stageWrap');

  SLOT_IDS.forEach(id => {
    const div = document.createElement('div');
    div.className = 'slot';
    div.id = 'slot-' + id;
    div.dataset.slot = id;
    div.innerHTML = `<span class="slot-icon">＋</span><span class="slot-lbl">${SLOT_DEFS[id].label}</span>`;
    div.onclick = e => {
      e.stopPropagation();
      onSlotClick(id, e);
    };
    wrap.appendChild(div);
  });
}

function stagePx(canvas) {
  const sw = Math.min(canvas.width * 0.28, 240);
  const sh = sw * 0.55;
  return { w: sw, h: sh };
}

function positionSlots() {
  const canvas = document.getElementById('stageCanvas');
  const { w, h } = stagePx(canvas);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const gap = 38;
  const hw = w / 2 + gap;
  const hh = h / 2 + gap;

  const positions = {
    N:  { x: cx,      y: cy - hh },
    NE: { x: cx + hw, y: cy - hh },
    E:  { x: cx + hw, y: cy      },
    SE: { x: cx + hw, y: cy + hh },
    S:  { x: cx,      y: cy + hh },
    SW: { x: cx - hw, y: cy + hh },
    W:  { x: cx - hw, y: cy      },
    NW: { x: cx - hw, y: cy - hh }
  };

  SLOT_IDS.forEach(id => {
    const el = document.getElementById('slot-' + id);
    const pos = positions[id];
    el.style.left = (pos.x - 25) + 'px';
    el.style.top = (pos.y - 25) + 'px';
  });
}

function onSlotClick(slotId, e) {
  if (selectedItem) {
    attemptPlaceItem(slotId, selectedItem);
    selectItem(null);
    return;
  }
  openPicker(slotId, e);
}

function attemptPlaceItem(slotId, item) {
  const oldItem = placedItems[slotId];
  let requiredCoins = item.cost;

  if (oldItem) {
    requiredCoins -= oldItem.cost;
  }

  if (currentCoins >= requiredCoins) {
    currentCoins -= requiredCoins;
    placedItems[slotId] = item;

    const el = document.getElementById('slot-' + slotId);
    el.className = 'slot filled';
    el.style.setProperty('--sc', item.color);
    el.innerHTML = `<span class="slot-icon">${item.icon}</span><span class="slot-lbl">${item.name.split(' ')[0]}</span>`;

    updateAll();
  } else {
    const coinUI = document.getElementById('hCoins');
    coinUI.style.color = 'var(--red)';
    coinUI.style.transform = 'scale(1.2)';
    setTimeout(() => {
      coinUI.style.color = 'var(--gold)';
      coinUI.style.transform = 'scale(1)';
    }, 300);
  }
}

function openPicker(slotId, e) {
  activeSlot = slotId;

  const picker = document.getElementById('picker');
  const title = document.getElementById('pickerTitle');
  const items = document.getElementById('pickerItems');
  const remove = document.getElementById('pickerRemove');

  title.textContent = `SLOT: ${SLOT_DEFS[slotId].label} (${slotId})`;
  items.innerHTML = '';

  ITEMS.forEach(item => {
    const div = document.createElement('div');
    const oldItem = placedItems[slotId];
    const netCost = item.cost - (oldItem ? oldItem.cost : 0);
    const canAfford = currentCoins >= netCost;

    div.className = 'pi';
    div.style.opacity = canAfford ? '1' : '0.4';
    div.innerHTML = `
      <span class="pi-icon">${item.icon}</span>
      <div style="flex:1;">
        <div class="pi-name">${item.name}</div>
        <div class="pi-stat">${item.shortDesc}</div>
      </div>
      <div style="font-size:10px; color:var(--gold); font-family:'Share Tech Mono';">💰${item.cost}</div>
    `;

    div.onclick = ev => {
      ev.stopPropagation();
      attemptPlaceItem(slotId, item);
      closePicker();
    };

    items.appendChild(div);
  });

  if (placedItems[slotId]) {
    remove.className = 'p-remove';
    remove.innerHTML = `✕ &nbsp; Remove (+${placedItems[slotId].cost} 🪙)`;
  } else {
    remove.className = 'p-remove hidden';
  }

  const rect = e.target.closest('.slot').getBoundingClientRect();
  picker.style.left = Math.min(rect.right + 8, window.innerWidth - 245) + 'px';
  picker.style.top = Math.max(Math.min(rect.top, window.innerHeight - 380), 8) + 'px';
  picker.classList.remove('hidden');
}

function closePicker() {
  document.getElementById('picker').classList.add('hidden');
  activeSlot = null;
}

window.removeItem = function () {
  if (!activeSlot) return;

  const oldItem = placedItems[activeSlot];
  if (!oldItem) return;

  currentCoins += oldItem.cost;
  placedItems[activeSlot] = null;

  const el = document.getElementById('slot-' + activeSlot);
  el.className = 'slot';
  el.style.removeProperty('--sc');
  el.innerHTML = `<span class="slot-icon">＋</span><span class="slot-lbl">${SLOT_DEFS[activeSlot].label}</span>`;

  closePicker();
  updateAll();
};

// ── OPTIMIZATION MATH ──────────────────────────────────────────────
function angularDiff(a, b) {
  return Math.abs(((a - b) + 180) % 360 - 180);
}

function itemContribution(item, slotAngle, targetAngle) {
  const diff = angularDiff(targetAngle, slotAngle);
  const sigma = item.spread;
  let effect = item.magnitude * Math.exp(-(diff * diff) / (2 * sigma * sigma));

  if (item.type === 'hybrid' && item.reflectMagnitude) {
    const reflDiff = angularDiff(targetAngle, AUD_ANGLE);
    effect += item.reflectMagnitude * Math.exp(
      -(reflDiff * reflDiff) / (2 * item.reflectSpread * item.reflectSpread)
    );
  }

  return effect;
}

function totalModifierAt(angle) {
  let mod = 0;

  SLOT_IDS.forEach(id => {
    const item = placedItems[id];
    if (!item) return;
    mod += itemContribution(item, SLOT_DEFS[id].angle, angle);
  });

  return mod;
}

function dbReceivedAt(building) {
  if (!stageData) return 0;

  const dx = building.centerX - stageData.pos.x;
  const dy = building.centerY - stageData.pos.y;
  const dist = Math.hypot(dx, dy);

  if (dist < 1) return 999;

  const compassDeg = ((Math.atan2(dx, -dy) * 180 / Math.PI) + 360) % 360;
  return getStageBaseDb() + totalModifierAt(compassDeg) - 20 * Math.log10(dist);
}

function audienceDB() {
  return getStageBaseDb() + totalModifierAt(AUD_ANGLE) - 20 * Math.log10(AUD_DIST);
}

function countViolations() {
  if (!stageData?.data?.nearby) return 0;

  return stageData.data.nearby.filter(b => dbReceivedAt(b) > b.dbLimit).length;
}

function calculateCrowd() {
  const adb = audienceDB();
  const violations = countViolations();
  const baseCrowd = Math.max(0, Math.floor((adb - 50) * 450));
  const penalty = violations * 2500;
  return Math.max(0, baseCrowd - penalty);
}

// ── UI UPDATE ──────────────────────────────────────────────────────
function updateAll() {
  updateScorePanel();
  updateBuildingList();
  updateHeader();
}

function updateHeader() {
  const adb = audienceDB();
  const violations = countViolations();
  const finalCrowd = calculateCrowd();

  const audEl = document.getElementById('hAud');
  const violEl = document.getElementById('hViol');
  const crowdEl = document.getElementById('hCrowd');
  const coinsEl = document.getElementById('hCoins');

  if (audEl) audEl.textContent = adb.toFixed(1);
  if (violEl) violEl.textContent = violations;
  if (crowdEl) crowdEl.textContent = finalCrowd.toLocaleString('en-US') + ' 👥';
  if (coinsEl) coinsEl.textContent = currentCoins + ' 🪙';

  if (audEl) audEl.style.color = dbColor(adb);
  if (violEl) violEl.style.color = violations === 0 ? 'var(--green)' : 'var(--red)';
  if (crowdEl) crowdEl.style.color = violations > 0 ? 'var(--red)' : 'var(--cyan)';
}

function dbColor(db) {
  if (db <= 70) return 'var(--green)';
  if (db <= 85) return 'var(--gold)';
  return 'var(--red)';
}

function updateScorePanel() {
  const adb = audienceDB();
  const el = document.getElementById('audBig');
  const sub = document.getElementById('audSub');
  const bar = document.getElementById('audBar');

  if (el) {
    el.textContent = adb.toFixed(1);
    el.style.color = dbColor(adb);
  }

  const itemCount = SLOT_IDS.filter(id => placedItems[id]).length;
  const finalCrowd = calculateCrowd();

  if (sub) {
    sub.textContent = itemCount === 0
      ? 'place an item to start calculating'
      : `${itemCount} item(s) · Total Audience: ${finalCrowd.toLocaleString('en-US')} 👥`;
  }

  if (bar) {
    const pct = Math.min(100, Math.max(0, (adb - 50) / 50 * 100));
    bar.style.width = pct + '%';
    bar.style.background =
      dbColor(adb).replace('var(--', '').replace(')', '') === 'green'
        ? '#39ff14'
        : adb <= 85
          ? '#ffc300'
          : '#ff1744';
  }
}



function updateBuildingList() {
  const list = document.getElementById('buildingList');
  if (!list) return;

  if (!stageData?.data?.nearby || stageData.data.nearby.length === 0) {
    list.innerHTML = `
      <div style="padding:20px 14px;text-align:center;font-size:12px;color:var(--dim)">
        No buildings in range
      </div>`;
    return;
  }

  const sorted = [...stageData.data.nearby].sort((a, b) => {
    const ra = dbReceivedAt(a);
    const rb = dbReceivedAt(b);
    const va = ra > a.dbLimit;
    const vb = rb > b.dbLimit;

    if (va && !vb) return -1;
    if (!va && vb) return 1;

    return (rb - b.dbLimit) - (ra - a.dbLimit);
  });

  list.innerHTML = '';

  sorted.forEach(b => {
    const received = dbReceivedAt(b);
    const violated = received > b.dbLimit;
    const diff = received - b.dbLimit;
    const absDiff = Math.abs(diff).toFixed(1);

    let color = 'var(--green)';
    if (violated) color = 'var(--red)';
    else if (received > b.dbLimit - 5) color = 'var(--gold)';

    const name = b.type.length > 22 ? b.type.slice(0, 22) + '…' : b.type;

    const row = document.createElement('div');
    row.className = 'bld-row' + (violated ? ' violated' : '');

    row.innerHTML = `
      <div>
        <div class="bld-name">${name}</div>
        <div class="bld-dist">${Math.round(b.dist)}m · limit ${b.dbLimit} dB</div>
      </div>
      <div style="text-align:right;">
        <div class="bld-recv" style="color:${color}">
          ${received.toFixed(1)} / ${b.dbLimit}
        </div>
        <div class="bld-limit" style="color:${color}">
          ${violated ? `OVER by ${absDiff} dB` : `SAFE by ${absDiff} dB`}
        </div>
      </div>
    `;

    list.appendChild(row);
  });
}

// ── CANVAS RENDER ──────────────────────────────────────────────────
function renderLoop() {
  requestAnimationFrame(renderLoop);
  draw();
}

function draw() {
  const canvas = document.getElementById('stageCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;

  ctx.clearRect(0, 0, W, H);

  drawGrid(ctx, W, H);
  drawSoundField(ctx, cx, cy);

  const { w: sw, h: sh } = stagePx(canvas);
  drawStage(ctx, cx, cy, sw, sh);
  drawBuildingDots(ctx, cx, cy);
  drawItemArrows(ctx, cx, cy, sw, sh);
  drawCompass(ctx, W, H);
}

function drawGrid(ctx, W, H) {
  const step = 50;
  ctx.strokeStyle = 'rgba(28,37,53,0.5)';
  ctx.lineWidth = 1;

  for (let x = 0; x < W; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  for (let y = 0; y < H; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

function drawSoundField(ctx, cx, cy) {
  const SECTORS = 72;
  const R_MAX = Math.min(cx, cy) * 0.82;
  const R_REF = AUD_DIST;

  for (let i = 0; i < SECTORS; i++) {
    const sectorAngle = (i / SECTORS) * 360;
    const startCanvas = (sectorAngle - 90 - 360 / SECTORS / 2) * Math.PI / 180;
    const endCanvas = (sectorAngle - 90 + 360 / SECTORS / 2) * Math.PI / 180;

    const dbAtRef = getStageBaseDb() + totalModifierAt(sectorAngle) - 20 * Math.log10(R_REF);
    const t = Math.max(0, Math.min(1, (dbAtRef - 55) / 40));

    const r = Math.round(255 * t);
    const g = Math.round(200 * (1 - t));
    const alpha = 0.12 + t * 0.15;

    ctx.fillStyle = `rgba(${r},${g},20,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R_MAX, startCanvas, endCanvas);
    ctx.closePath();
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(255,195,0,0.25)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  ctx.arc(cx, cy, R_MAX, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  [0.33, 0.66].forEach(f => {
    ctx.strokeStyle = 'rgba(255,195,0,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, R_MAX * f, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawStage(ctx, cx, cy, sw, sh) {
  const grad = ctx.createLinearGradient(cx, cy - sh / 2, cx, cy + sh / 2);
  grad.addColorStop(0, '#1e1200');
  grad.addColorStop(0.5, '#2d1d00');
  grad.addColorStop(1, '#1a1000');

  ctx.fillStyle = grad;
  ctx.fillRect(cx - sw / 2, cy - sh / 2, sw, sh);

  ctx.strokeStyle = '#ffc300';
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - sw / 2, cy - sh / 2, sw, sh);

  ctx.strokeStyle = '#ff3c00';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - sw / 2, cy + sh / 2);
  ctx.lineTo(cx + sw / 2, cy + sh / 2);
  ctx.stroke();

  const spkW = 14;
  const spkH = 22;

  [-sw / 2 + spkW, sw / 2 - spkW].forEach(ox => {
    ctx.fillStyle = '#111';
    ctx.strokeStyle = '#ffc300';
    ctx.lineWidth = 1;
    ctx.fillRect(cx + ox - spkW / 2, cy - spkH / 2, spkW, spkH);
    ctx.strokeRect(cx + ox - spkW / 2, cy - spkH / 2, spkW, spkH);
    ctx.strokeStyle = '#ff6600';
    ctx.beginPath();
    ctx.arc(cx + ox, cy, spkW * 0.3, 0, Math.PI * 2);
    ctx.stroke();
  });

  ctx.fillStyle = '#ffc300';
  ctx.beginPath();
  ctx.arc(cx, cy - sh * 0.25, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = 'bold 11px "Bebas Neue"';
  ctx.fillStyle = 'rgba(255,195,0,0.6)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('STAGE', cx, cy + 2);

  const arrowY = cy + sh / 2 + 18;
  ctx.fillStyle = 'rgba(255,60,0,0.5)';
  ctx.font = '10px "Share Tech Mono"';
  ctx.fillText('▼ AUDIENCE', cx, arrowY);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawBuildingDots(ctx, cx, cy) {
  if (!stageData?.data?.nearby || stageData.data.nearby.length === 0) return;

  const R_MAX = Math.min(cx, cy) * 0.82;
  const sectors = {};

  stageData.data.nearby.forEach(b => {
    const dx = b.centerX - stageData.pos.x;
    const dy = b.centerY - stageData.pos.y;

    if (Math.hypot(dx, dy) < 1) return;

    const compassDeg = Math.round(((Math.atan2(dx, -dy) * 180 / Math.PI) + 360) % 360);
    const received = dbReceivedAt(b);
    const margin = received - b.dbLimit;
    const sectorIndex = Math.round(compassDeg / 45) % 8;

    if (!sectors[sectorIndex] || margin > sectors[sectorIndex].margin) {
      sectors[sectorIndex] = { building: b, compassDeg, received, margin };
    }
  });

  Object.values(sectors).forEach(data => {
    const { building: b, compassDeg, received } = data;
    const violated = received > b.dbLimit;
    const canvasAngle = (compassDeg - 90) * Math.PI / 180;

    const px = cx + R_MAX * Math.cos(canvasAngle);
    const py = cy + R_MAX * Math.sin(canvasAngle);

    ctx.strokeStyle = violated ? 'rgba(255, 23, 68, 0.4)' : 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = violated ? 1.5 : 1;

    if (violated) ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, py);
    ctx.stroke();
    ctx.setLineDash([]);

    const imgSize = 32;
    const currentImg = violated ? imgBuildingViolated : imgBuilding;

    if (currentImg.complete && currentImg.naturalWidth !== 0) {
      ctx.drawImage(currentImg, px - imgSize / 2, py - imgSize / 2, imgSize, imgSize);
    } else {
      ctx.fillStyle = violated ? '#ff1744' : '#39ff14';
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = violated ? '#ff8a80' : 'rgba(200,208,224,0.9)';
    ctx.font = '10px "Share Tech Mono"';
    ctx.textAlign = 'center';
    ctx.fillText(`${compassDeg}º • ${received.toFixed(0)}/${b.dbLimit}dB`, px, py - (imgSize / 2 + 6));
    ctx.textAlign = 'left';
  });
}

function drawItemArrows(ctx, cx, cy, sw, sh) {
  SLOT_IDS.forEach(id => {
    const item = placedItems[id];
    if (!item) return;

    const canvasAngle = (SLOT_DEFS[id].angle - 90) * Math.PI / 180;
    const gap = 38 + (
      id.length === 2
        ? Math.max(sw, sh) / 2 + 10
        : (id === 'N' || id === 'S' ? sh / 2 + 10 : sw / 2 + 10)
    );

    const sx = cx + Math.cos(canvasAngle) * gap;
    const sy = cy + Math.sin(canvasAngle) * gap;
    const ex = cx + Math.cos(canvasAngle) * (gap + 55);
    const ey = cy + Math.sin(canvasAngle) * (gap + 55);

    const isBarrier = item.type === 'barrier';
    ctx.strokeStyle = item.color;
    ctx.lineWidth = isBarrier ? 2.5 : 2;
    ctx.globalAlpha = 0.7;

    if (isBarrier) {
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = item.color;
      ctx.fillText('🚫', ex, ey);
    } else {
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      const headLen = 8;
      const headAngle = canvasAngle + Math.PI;

      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(
        ex + headLen * Math.cos(headAngle + 0.4),
        ey + headLen * Math.sin(headAngle + 0.4)
      );
      ctx.moveTo(ex, ey);
      ctx.lineTo(
        ex + headLen * Math.cos(headAngle - 0.4),
        ey + headLen * Math.sin(headAngle - 0.4)
      );
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  });
}

function drawCompass(ctx, W, H) {
  const px = W - 40;
  const py = 38;
  const r = 20;

  ctx.strokeStyle = 'rgba(28,37,53,0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.stroke();

  const dirs = [
    { label: 'N', angle: -Math.PI / 2 },
    { label: 'S', angle:  Math.PI / 2 },
    { label: 'E', angle:  0 },
    { label: 'W', angle:  Math.PI }
  ];

  ctx.font = '9px "Share Tech Mono"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  dirs.forEach(d => {
    ctx.fillStyle = d.label === 'S' ? '#ff3c00' : 'rgba(80,90,112,0.9)';
    ctx.fillText(d.label, px + Math.cos(d.angle) * (r - 6), py + Math.sin(d.angle) * (r - 6));
  });

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// ── RESULTS SCREEN NAVIGATION ───────────────────────────────────────
window.showResults = async function () {
  const itemCount = SLOT_IDS.filter(id => placedItems[id]).length;
  if (!itemCount) {
    alert("Place at least one item before comparing.");
    return;
  }

  const violations = countViolations();
  if (violations > 0) {
    alert(`Resolve all ${violations} violation(s) before viewing results.`);
    return;
  }

  const stageDataRaw = localStorage.getItem('stageOptimData');
  if (!stageDataRaw) {
    alert("Stage data not found. Please go back and select a map location first.");
    return;
  }

  const parsedStageData = JSON.parse(stageDataRaw);
  const userCrowd = calculateCrowd();
  const userDb = audienceDB();

  localStorage.setItem('gams_userCrowd', String(userCrowd));
  localStorage.setItem('gams_userDb', String(userDb.toFixed(2)));

  const resultBtn = Array.from(document.querySelectorAll('button'))
    .find(btn => btn.textContent.includes('View Results'));

  const oldText = resultBtn ? resultBtn.textContent : null;

  if (resultBtn) {
    resultBtn.disabled = true;
    resultBtn.textContent = 'Calculating GAMSPy...';
    resultBtn.style.opacity = '0.7';
    resultBtn.style.cursor = 'wait';
  }

  try {
    const response = await fetch('http://127.0.0.1:5000/api/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsedStageData)
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Optimization request failed.');
    }

    const optimal = data.result;

    localStorage.setItem('gams_optimalData', JSON.stringify({
      maxSeyirci: optimal.maxSeyirci ?? optimal.estimated_crowd ?? 0,
      x: optimal.x ?? optimal.stage_pos?.x ?? 0,
      y: optimal.y ?? optimal.stage_pos?.y ?? 0,
      maxDb: optimal.maxDb ?? optimal.audience_db ?? 0,
      placement: optimal.placement ?? {},
      violations: optimal.violations ?? 0,
      spent: optimal.spent ?? 0,
      method: optimal.method ?? 'GAMSPy'
    }));

    window.location.href = 'result.html';
  } catch (err) {
    console.error(err);
    alert(
      'GAMSPy optimization could not be completed automatically.\n\n' +
      'Make sure api_server.py is running.\n\n' +
      'Error: ' + err.message
    );
  } finally {
    if (resultBtn) {
      resultBtn.disabled = false;
      resultBtn.textContent = oldText;
      resultBtn.style.opacity = '1';
      resultBtn.style.cursor = 'pointer';
    }
  }
};