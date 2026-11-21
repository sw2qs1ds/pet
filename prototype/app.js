/**
 * pet · 阶段一原型：能看见、会动、点得动。
 * 纯 Canvas 手绘占位形象（真素材下一阶段替换），无任何依赖。
 */
(() => {
  "use strict";

  const canvas = document.getElementById("stage");
  const ctx = canvas.getContext("2d");
  const bubble = document.getElementById("bubble");
  const hint = document.getElementById("hint");

  const LINES = [
    "你终于来啦。",
    "在呢在呢。",
    "这个页面还挺空的。",
    "别戳我，痒。",
    "今天想聊点什么？",
    "我先在这儿待着。",
  ];

  const W = () => canvas.clientWidth;
  const H = () => canvas.clientHeight;

  const pet = {
    x: 0,
    y: 0,          // 脚底位置的 y
    baseY: 0,
    vx: 0,
    vy: 0,
    targetX: 0,
    scale: 1,
    flip: 1,
    bob: 0,        // 呼吸相位
    squash: 1,     // 点击挤压
    blinkAt: 0,
    dragging: false,
    nextDecision: 0,
    mode: "idle",  // idle | walk | drag
    pop: 0,        // 点击弹跳
  };

  // 逻辑尺寸：以 160 为宠物高度基准
  const PET_H = 150;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(W() * dpr);
    canvas.height = Math.floor(H() * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pet.baseY = H() * 0.74;
    if (!pet.x) {
      pet.x = W() * 0.5;
      pet.targetX = pet.x;
    }
    pet.y = pet.baseY;
  }
  window.addEventListener("resize", resize);

  // ---------- 绘制 ----------
  function drawBody(t) {
    const bob = Math.sin(pet.bob) * 3;
    const shear = Math.sin(pet.bob * 0.7) * 0.03;
    const s = pet.scale * pet.squash * (1 + pet.pop * 0.18);

    ctx.save();
    ctx.translate(pet.x, pet.y + bob - pet.pop * 10);
    ctx.scale(pet.flip * s, s);
    ctx.rotate(shear);

    // 影子
    ctx.save();
    ctx.scale(1 / (pet.flip * s), 1 / s);
    ctx.globalAlpha = 0.28 * (1 - pet.pop * 0.4);
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(0, -pet.pop * 4, 64 * s, 12 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const bodyH = PET_H * 0.52;
    const bodyW = PET_H * 0.62;

    // 尾巴
    const tail = Math.sin(pet.bob * 1.6) * 0.22;
    ctx.save();
    ctx.translate(-bodyW * 0.86, -bodyH * 0.52);
    ctx.rotate(tail);
    ctx.fillStyle = "#2f56d1";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-34, -26, -46, -2);
    ctx.quadraticCurveTo(-34, 2, -32, 12);
    ctx.quadraticCurveTo(-30, 22, -46, 24);
    ctx.quadraticCurveTo(-22, 30, 0, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 身体
    const g = ctx.createLinearGradient(0, -bodyH, 0, 0);
    g.addColorStop(0, "#5b7cff");
    g.addColorStop(1, "#3455d4");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, -bodyH * 0.52, bodyW * 0.52, bodyH * 0.58, 0, 0, Math.PI * 2);
    ctx.fill();

    // 肚皮
    ctx.fillStyle = "rgba(255,255,255,.9)";
    ctx.beginPath();
    ctx.ellipse(bodyW * 0.02, -bodyH * 0.36, bodyW * 0.32, bodyH * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();

    // 背鳍
    ctx.fillStyle = "#2a4ac0";
    ctx.beginPath();
    ctx.moveTo(-6, -bodyH * 1.02);
    ctx.quadraticCurveTo(10, -bodyH * 1.24, 26, -bodyH * 1.0);
    ctx.closePath();
    ctx.fill();

    // 眼睛
    const blink = (t % 4200) < 130 ? 0.12 : 1;
    const eyeY = -bodyH * 0.66;
    const eyeX = bodyW * 0.18;
    ctx.fillStyle = "#10131a";
    for (const dx of [-eyeX * 0.72, eyeX * 0.72]) {
      ctx.save();
      ctx.translate(dx, eyeY);
      ctx.scale(1, blink);
      ctx.beginPath();
      ctx.arc(0, 0, 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // 高光
    if (blink > 0.5) {
      ctx.fillStyle = "rgba(255,255,255,.85)";
      for (const dx of [-eyeX * 0.72, eyeX * 0.72]) {
        ctx.beginPath();
        ctx.arc(dx + 1.6, eyeY - 1.8, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 嘴
    ctx.strokeStyle = "#10131a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, eyeY + 14, 6, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    // 腮红
    ctx.fillStyle = "rgba(255,138,160,.35)";
    for (const dx of [-eyeX * 1.5, eyeX * 1.5]) {
      ctx.beginPath();
      ctx.ellipse(dx, eyeY + 12, 7, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // ---------- 行为 ----------
  function decide(now) {
    pet.nextDecision = now + 3200 + Math.random() * 5200;
    const r = Math.random();
    if (r < 0.62) {
      pet.mode = "walk";
      const margin = 90;
      pet.targetX = margin + Math.random() * Math.max(40, W() - margin * 2);
    } else if (r < 0.8) {
      pet.mode = "idle";
      pet.pop = 0.5; // 小跳一下
    } else {
      pet.mode = "idle";
    }
  }

  function showBubble(text) {
    bubble.textContent = text;
    bubble.classList.add("show");
    clearTimeout(showBubble.t);
    showBubble.t = setTimeout(() => bubble.classList.remove("show"), 2600);
    hint.classList.add("hide");
  }

  function positionBubble() {
    bubble.style.left = pet.x + "px";
    bubble.style.top = pet.y - PET_H * pet.scale - 26 + "px";
  }

  function tick(now) {
    const dt = Math.min(32, now - (tick.last || now));
    tick.last = now;
    pet.bob += dt * 0.0026;

    if (!pet.dragging) {
      if (pet.mode === "walk") {
        const dx = pet.targetX - pet.x;
        const speed = 0.09 * dt;
        if (Math.abs(dx) > 2) {
          pet.x += Math.sign(dx) * Math.min(Math.abs(dx), speed);
          pet.flip = dx > 0 ? 1 : -1;
        } else {
          pet.mode = "idle";
        }
      } else if (now > pet.nextDecision) {
        decide(now);
      }
      // 拖拽松手后回落到地面
      if (pet.y < pet.baseY) {
        pet.vy += 0.0018 * dt * 60;
        pet.y = Math.min(pet.baseY, pet.y + pet.vy);
        if (pet.y >= pet.baseY) { pet.vy = 0; pet.y = pet.baseY; }
      }
    }

    pet.pop = Math.max(0, pet.pop - dt * 0.004);
    pet.squash += ((pet.dragging ? 0.94 : 1) - pet.squash) * 0.18;

    // 边界
    pet.x = Math.max(60, Math.min(W() - 60, pet.x));

    ctx.clearRect(0, 0, W(), H());
    drawBody(now);
    positionBubble();
    requestAnimationFrame(tick);
  }

  // ---------- 输入 ----------
  let down = null;

  canvas.addEventListener("pointerdown", (e) => {
    down = { x: e.clientX, y: e.clientY, t: performance.now(), move: 0 };
    const d = Math.hypot(e.clientX - pet.x, e.clientY - (pet.y - PET_H * 0.5));
    if (d < PET_H * 0.75) {
      pet.dragging = true;
      pet.mode = "drag";
      canvas.setPointerCapture(e.pointerId);
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!pet.dragging || !down) return;
    down.move += Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0);
    pet.x = e.clientX;
    pet.y = Math.min(pet.baseY, Math.max(80, e.clientY));
  });

  canvas.addEventListener("pointerup", (e) => {
    if (!down) return;
    const quick = performance.now() - down.t < 380 && down.move < 12;
    const wasDragging = pet.dragging;
    pet.dragging = false;
    if (wasDragging) {
      pet.mode = "idle";
      pet.vy = 1.2;
      if (quick) {
        pet.pop = 1;
        showBubble(LINES[Math.floor(Math.random() * LINES.length)]);
      }
    }
    down = null;
    pet.nextDecision = performance.now() + 2500;
  });

  canvas.addEventListener("pointercancel", () => {
    pet.dragging = false;
    pet.mode = "idle";
    down = null;
  });

  // ---------- 对话 ----------
  const say = document.getElementById("say");
  const sendBtn = document.getElementById("send");

  async function submit() {
    const text = (say.value || "").trim();
    if (!text || sendBtn.disabled) return;
    say.value = "";
    sendBtn.disabled = true;
    showBubble("……");
    try {
      const reply = await window.PetBrain.current.ask(text);
      showBubble(String(reply));
      pet.pop = 1;
      pet.mode = "idle";
    } catch (err) {
      showBubble("我这边出了点问题：" + (err && err.message ? err.message : err));
    } finally {
      sendBtn.disabled = false;
    }
  }

  if (sendBtn) sendBtn.addEventListener("click", submit);
  if (say) {
    say.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    });
  }

  resize();
  requestAnimationFrame(tick);
})();
