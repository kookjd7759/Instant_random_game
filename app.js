const $ = (id) => document.getElementById(id);

const canvas = $("wheel");
const ctx = canvas.getContext("2d");

const TA = $("items");
const resultText = $("resultText");

let items = ["아메리카노", "라떼", "초코", "벌칙: 팔굽혀펴기 10개"];
let angle = 0;         // 현재 회전 각도(rad)
let spinning = false;

function parseItems() {
  const lines = TA.value
    .split("\n")
    .map(s => s.trim())
    .filter(Boolean);
  items = lines.length ? lines : ["(항목이 비어있음)"];
}

function saveItems() {
  parseItems();
  localStorage.setItem("roulette_items", JSON.stringify(items));
  draw();
}

function loadItems() {
  const raw = localStorage.getItem("roulette_items");
  if (!raw) return;
  items = JSON.parse(raw);
  TA.value = items.join("\n");
  draw();
}

function shuffleItems() {
  parseItems();
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  TA.value = items.join("\n");
  draw();
}

function draw() {
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2;
  const r = Math.min(w, h) / 2 - 6;

  ctx.clearRect(0, 0, w, h);

  // 배경 원
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  const n = items.length;
  const slice = (Math.PI * 2) / n;

  for (let i = 0; i < n; i++) {
    // 색: HSL로 자동 분배
    const hue = (i * 360) / n;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, i * slice, (i + 1) * slice);
    ctx.closePath();
    ctx.fillStyle = `hsl(${hue} 70% 45%)`;
    ctx.fill();

    // 구분선
    ctx.strokeStyle = "rgba(255,255,255,.22)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 텍스트
    ctx.save();
    ctx.rotate(i * slice + slice / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,.95)";
    ctx.font = "bold 16px system-ui";
    const label = items[i].length > 14 ? items[i].slice(0, 14) + "…" : items[i];
    ctx.fillText(label, r - 14, 6);
    ctx.restore();
  }

  // 바깥 테두리
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,.28)";
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.restore();
}

function pickWinner(finalAngle) {
  // 포인터는 "위쪽" (각도 -90도 방향). 캔버스에서 0rad는 x축(오른쪽)이라 보정.
  const n = items.length;
  const slice = (Math.PI * 2) / n;

  // 포인터가 가리키는 각도(룰렛 기준) = -90도 - finalAngle
  let a = (-Math.PI / 2 - finalAngle) % (Math.PI * 2);
  if (a < 0) a += Math.PI * 2;

  const idx = Math.floor(a / slice);
  return items[idx] ?? items[0];
}

function spin() {
  if (spinning) return;
  parseItems();
  if (!items.length) return;

  spinning = true;
  resultText.textContent = "-";

  const start = performance.now();
  const duration = 4200 + Math.random() * 1200; // 4.2~5.4s
  const startAngle = angle;

  // 목표 회전(랜덤): 8~12바퀴 + 랜덤 오프셋
  const target = (Math.PI * 2) * (8 + Math.random() * 4) + Math.random() * Math.PI * 2;

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function frame(now) {
    const t = (now - start) / duration;
    const p = Math.min(1, t);
    angle = startAngle + target * easeOutCubic(p);
    draw();

    if (p < 1) {
      requestAnimationFrame(frame);
    } else {
      // 각도 정규화
      angle = angle % (Math.PI * 2);
      const winner = pickWinner(angle);
      resultText.textContent = winner;
      spinning = false;
    }
  }

  requestAnimationFrame(frame);
}

$("save").addEventListener("click", saveItems);
$("load").addEventListener("click", loadItems);
$("shuffle").addEventListener("click", shuffleItems);
$("spin").addEventListener("click", spin);

TA.value = items.join("\n");
draw();