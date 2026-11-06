(() => {
  "use strict";

  /* ---------- Utilidades ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const vmin = () => Math.min(innerWidth, innerHeight) / 100;

  const GOAL = 7; // flores necesarias para el final secreto

  /* ---------- Personalización por enlace ----------
     ?para=Ana&de=Luis&msg=Tu mensaje aquí                       */
  const qs = new URLSearchParams(location.search);
  const para = (qs.get("para") || "").trim().slice(0, 40);
  const de = (qs.get("de") || "").trim().slice(0, 40);
  const msg = (qs.get("msg") || "").trim().slice(0, 220);

  $(".intro__title").textContent = para ? "Hola, " + para : "Hola";
  if (de) $(".intro__sub").textContent = de + " dejó algo para ti";

  /* ---------- Frases al tocar una flor ---------- */
  const compliments = [
    "Eres de esas personas que hacen florecer todo a su paso 🌷",
    "Esta flor se abrió solo para ti",
    "Alguien pensó en ti hoy",
    "Mereces cosas bonitas",
    "Tu sonrisa ilumina más que estas luciérnagas ✨",
    "Gracias por existir",
    "Hoy es un buen día para ti",
    "Eres más valiente de lo que crees",
    "Qué bueno que estés aquí 💛",
  ];
  let bag = [];
  const nextCompliment = () => {
    if (!bag.length) bag = compliments.slice().sort(() => Math.random() - 0.5);
    return bag.pop();
  };

  const wishes = [
    "Pide un deseo ✨",
    "Piénsalo bien… las estrellas escuchan",
    "Ese deseo ya va en camino 🌠",
    "Los deseos se cumplen más rápido en la noche",
  ];
  let wishIndex = 0;

  /* ---------- Estrellas, pasto y luciérnagas ---------- */
  const night = $(".night");
  for (let i = 0; i < 90; i++) {
    const s = document.createElement("i");
    s.className = "star";
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 70 + "%";
    s.style.setProperty("--t", 2 + Math.random() * 3 + "s");
    s.style.setProperty("--d", Math.random() * 3 + "s");
    night.appendChild(s);
  }

  const grass = $(".grass");
  for (let i = 0; i < 70; i++) {
    const g = document.createElement("span");
    g.style.setProperty("--gx", Math.random() * 100 + "%");
    g.style.setProperty("--gh", 4 + Math.random() * 8 + "vmin");
    g.style.setProperty("--gr", Math.random() * 30 - 15 + "deg");
    g.style.setProperty("--gd", Math.random() * 3 + "s");
    grass.appendChild(g);
  }

  function addLights(head, n = 10) {
    for (let i = 1; i <= n; i++) {
      const l = document.createElement("div");
      l.className = "flower__light flower__light--" + i;
      l.style.setProperty("--lx", Math.random() * 12 - 6 + "vmin");
      l.style.setProperty("--drift", Math.random() * 14 - 7 + "vmin");
      l.style.setProperty("--ld", 4 + Math.random() * 4 + "s");
      l.style.setProperty("--ldelay", 3 + Math.random() * 5 + "s");
      head.appendChild(l);
    }
  }
  document.querySelectorAll(".flower__leafs").forEach((h) => addLights(h));

  /* ---------- Sonido (generado, sin archivos) ---------- */
  const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99];
  let ctx = null;
  let master = null;
  let muted = false;

  function initAudio() {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
      if (ctx.state === "suspended") ctx.resume();
    } catch (e) {
      ctx = null;
    }
  }

  function note(freq, { vol = 0.18, dur = 2.4, type = "sine" } = {}) {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function chime(x) {
    const i = clamp(Math.floor((x / innerWidth) * scale.length), 0, scale.length - 1);
    note(scale[i], { vol: 0.2 });
    note(scale[i] * 2, { vol: 0.06, dur: 1.6 });
  }

  function ambient() {
    setInterval(() => {
      if (!ctx || muted || document.hidden) return;
      const f = scale[Math.floor(Math.random() * 5)] / 2;
      note(f, { vol: 0.07, dur: 4 });
    }, 2800);
  }

  const muteBtn = $(".btn-mute");
  muteBtn.addEventListener("click", () => {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : 0.55;
    muteBtn.textContent = muted ? "🔇" : "🔊";
    muteBtn.setAttribute("aria-label", muted ? "Activar sonido" : "Silenciar sonido");
  });

  /* ---------- Efectos visuales ---------- */
  function bubble(text, x, y) {
    const b = document.createElement("div");
    b.className = "bubble";
    b.textContent = text;
    b.style.left = clamp(x, 140, innerWidth - 140) + "px";
    b.style.top = clamp(y, 90, innerHeight) + "px";
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 4300);
  }

  function petals(x, y, n, pa, pb) {
    const floor = innerHeight - vmin() * 8;
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i");
      p.className = "petal";
      p.style.left = x + "px";
      p.style.top = y + "px";
      p.style.background = `linear-gradient(135deg, ${pa}, ${pb})`;
      document.body.appendChild(p);
      const dx = rand(-140, 140);
      const dy = Math.max(60, floor - y + rand(-10, 20));
      const a = p.animate(
        [
          { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
          { transform: `translate(${dx}px, ${dy}px) rotate(${rand(200, 720)}deg)`, opacity: 0 },
        ],
        { duration: rand(1800, 3400), easing: "cubic-bezier(.3,.1,.6,1)" }
      );
      a.onfinish = () => p.remove();
    }
  }

  function petalRain(n = 90, ms = 6000) {
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        const hue = rand(300, 360);
        petals(rand(0, innerWidth), -20, 1, `hsl(${hue} 95% 62%)`, `hsl(${hue + 20} 100% 82%)`);
      }, (i / n) * ms);
    }
  }

  function shoot() {
    if (reduce) return;
    const s = document.createElement("i");
    s.className = "shoot";
    s.style.left = rand(35, 100) + "vw";
    s.style.top = rand(2, 35) + "vh";
    document.body.appendChild(s);
    const d = rand(40, 70);
    const a = s.animate(
      [
        { transform: "translate(0,0) rotate(-35deg)", opacity: 1 },
        { transform: `translate(${-d}vmin, ${d * 0.7}vmin) rotate(-35deg)`, opacity: 0 },
      ],
      { duration: rand(900, 1400), easing: "ease-in" }
    );
    a.onfinish = () => s.remove();
  }

  async function shootingLoop() {
    while (true) {
      await sleep(rand(9000, 17000));
      if (!document.hidden) shoot();
    }
  }

  let lastSpark = 0;
  addEventListener("pointermove", (e) => {
    if (!started || reduce) return;
    const now = performance.now();
    if (now - lastSpark < 45) return;
    lastSpark = now;
    const s = document.createElement("i");
    s.className = "spark";
    s.style.left = e.clientX + "px";
    s.style.top = e.clientY + "px";
    document.body.appendChild(s);
    const a = s.animate(
      [
        { transform: "translate(-50%,-50%) scale(1)", opacity: 0.9 },
        { transform: `translate(calc(-50% + ${rand(-14, 14)}px), calc(-50% + ${rand(10, 30)}px)) scale(0)`, opacity: 0 },
      ],
      { duration: 800, easing: "ease-out" }
    );
    a.onfinish = () => s.remove();
  });

  /* ---------- Flores ---------- */
  const flowersBox = $(".flowers");
  const countEl = $("#count");
  const counterBox = $(".counter");
  let planted = 3;
  let finaleDone = false;

  function updateCounter() {
    countEl.textContent = Math.min(planted, GOAL);
    counterBox.classList.remove("bump");
    void counterBox.offsetWidth;
    counterBox.classList.add("bump");
  }

  function plant(clientX, clientY) {
    const u = vmin();
    const maxH = innerHeight / u - 8 - 20;
    const h = clamp((innerHeight - clientY) / u - 8, 16, Math.max(18, maxH));
    const hue = Math.floor(rand(0, 360));

    const f = document.createElement("div");
    f.className = "flower flower--new";
    f.style.setProperty("--x", (clientX / innerWidth) * 100 + "%");
    f.style.setProperty("--h", h + "vmin");
    f.style.setProperty("--s", rand(0.7, 1).toFixed(2));
    f.style.setProperty("--pa", `hsl(${hue} 95% 62%)`);
    f.style.setProperty("--pb", `hsl(${(hue + 40) % 360} 100% 82%)`);
    f.innerHTML = `
      <div class="flower__line"></div>
      <div class="flower__leafs">
        <div class="flower__leaf flower__leaf--1"></div>
        <div class="flower__leaf flower__leaf--2"></div>
        <div class="flower__leaf flower__leaf--3"></div>
        <div class="flower__leaf flower__leaf--4"></div>
        <div class="flower__white-circle"></div>
      </div>`;
    addLights($(".flower__leafs", f), 6);
    flowersBox.appendChild(f);

    // límite para que la página no se ponga pesada
    const extra = flowersBox.querySelectorAll(".flower--new");
    if (extra.length > 30) extra[0].remove();

    chime(clientX);
    planted++;
    updateCounter();
    if (planted === GOAL && !finaleDone) finale();
  }

  function touchFlower(f) {
    const head = $(".flower__leafs", f);
    head.classList.remove("wiggle");
    void head.offsetWidth;
    head.classList.add("wiggle");

    const r = $(".flower__white-circle", f).getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const cs = getComputedStyle(f);
    petals(cx, cy, 14, cs.getPropertyValue("--pa").trim() || "#ff4d8d", cs.getPropertyValue("--pb").trim() || "#ffb199");
    bubble(nextCompliment(), cx, cy - r.height);
    chime(cx);
  }

  /* ---------- Luna: pedir un deseo ---------- */
  const moon = $(".moon");
  moon.addEventListener("click", () => {
    if (!started) return;
    moon.classList.remove("is-wish");
    void moon.offsetWidth;
    moon.classList.add("is-wish");
    const r = moon.getBoundingClientRect();
    bubble(wishes[wishIndex++ % wishes.length], r.left + r.width / 2, r.bottom + 80);
    for (let i = 0; i < 6; i++) setTimeout(shoot, i * 280);
    [0, 2, 4, 6].forEach((n, i) => setTimeout(() => note(scale[n + 1], { vol: 0.14 }), i * 180));
  });

  /* ---------- Final secreto ---------- */
  const finaleEl = $(".finale");
  async function finale() {
    finaleDone = true;
    await sleep(1400);
    document.body.classList.add("magic");
    petalRain(reduce ? 20 : 110, 6500);
    [0, 2, 4, 5, 7, 8].forEach((n, i) => setTimeout(() => note(scale[n], { vol: 0.16, dur: 3 }), i * 260));
    await sleep(1800);
    $(".finale__text").textContent = msg || "Cada flor de este jardín nació porque tú quisiste. Eso dice mucho de ti.";
    $(".finale__from").textContent = de ? "— " + de : "";
    finaleEl.classList.add("is-on");
    finaleEl.setAttribute("aria-hidden", "false");
    $(".finale__close").focus();
  }
  $(".finale__close").addEventListener("click", () => {
    finaleEl.classList.remove("is-on");
    finaleEl.setAttribute("aria-hidden", "true");
  });

  /* ---------- Interacción general ---------- */
  document.addEventListener("click", (e) => {
    if (!started) return;
    if (e.target.closest(".ui, .moon, .finale, .intro")) return;
    const f = e.target.closest(".flower");
    if (f) touchFlower(f);
    else plant(e.clientX, e.clientY);
  });

  // Barra espaciadora: planta una flor al azar
  document.addEventListener("keydown", (e) => {
    if (!started || e.code !== "Space") return;
    if (e.target.closest("button, input, textarea")) return;
    e.preventDefault();
    plant(rand(0.08, 0.92) * innerWidth, rand(0.35, 0.7) * innerHeight);
  });

  /* ---------- Panel: crear mi propio regalo ---------- */
  const giftBtn = $(".btn-gift");
  const panel = $(".panel");
  const out = $(".panel__out");
  const status = $(".panel__status");

  giftBtn.addEventListener("click", () => {
    const open = panel.hidden;
    panel.hidden = !open;
    giftBtn.setAttribute("aria-expanded", String(open));
    if (open) {
      status.textContent = location.protocol === "file:"
        ? "Para que otra persona lo abra, sube esta carpeta a un hosting gratuito (por ejemplo Netlify Drop) y usa ese enlace."
        : "";
      $("#f-para").focus();
    }
  });

  $(".panel__go").addEventListener("click", async () => {
    const url = new URL(location.href.split("?")[0].split("#")[0]);
    const vals = { para: $("#f-para").value, de: $("#f-de").value, msg: $("#f-msg").value };
    Object.entries(vals).forEach(([k, v]) => {
      if (v.trim()) url.searchParams.set(k, v.trim());
    });
    out.hidden = false;
    out.value = url.toString();
    try {
      await navigator.clipboard.writeText(out.value);
      status.textContent = "Enlace copiado. Pégalo en un mensaje y envíalo.";
    } catch (err) {
      out.select();
      status.textContent = "Copia el enlace de arriba y envíalo.";
    }
  });

  /* ---------- Inicio ---------- */
  let started = false;

  async function say(lines) {
    const el = $(".message");
    for (const line of lines) {
      el.textContent = "";
      el.classList.add("is-on");
      for (const ch of line) {
        el.textContent += ch;
        await sleep(reduce ? 0 : 38);
      }
      await sleep(1500 + line.length * 22);
      el.classList.remove("is-on");
      await sleep(700);
    }
  }

  async function start() {
    if (started) return;
    started = true;
    initAudio();
    $(".intro").classList.add("is-gone");
    document.body.classList.remove("not-loaded");
    ambient();
    [0, 2, 4].forEach((n, i) => setTimeout(() => note(scale[n], { vol: 0.15, dur: 3 }), i * 220));

    await sleep(1100);
    await say([
      para ? `Hola, ${para}.` : "Hola.",
      "Mira lo que pasa cuando llegas…",
      msg || "Cada flor de aquí se abre cuando la tocas.",
      `Planta ${GOAL} y pasará algo mágico.`,
    ]);

    document.body.classList.add("is-ready");
    $(".hint").classList.add("is-on");
    shootingLoop();
  }

  $(".intro__btn").addEventListener("click", start);
})();