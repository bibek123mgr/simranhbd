const CONFIG = {
  // Personalize every line here; the site remains a self-contained static experience.
  name: "Simran",
  introText: "Something special is waiting for Simran...",
  introSubtitle: "The best day deserves a little bit of magic.",
  birthdayTodaySubtitle: "It's your birthday today. Your surprise is ready whenever you are.",
  wishPrompt: "Make a wish, then tap the candle.",
  candleRevealText: "One wish made. One wonderful year ahead.",
  photos: [
    { src: "images/photo6.jpg", caption: "My favorite eye" },
    { src: "images/photo2.jpg", caption: "My Favorite Smile With Rose" },
    { src: "images/photo3.jpg", caption: "v Favorite Smile" },
    { src: "images/photo4.jpg", caption: "Love trend" },
    { src: "images/photo5.jpg", caption: "Cheese" }
  ],
  message: "Dear Simran,\n\nToday is all about you. Thank you for being the kindest, funniest and most amazing person in my life. Every moment with you turns into a beautiful memory. I hope this year brings you endless smiles, big dreams coming true, and all the happiness you deserve.\n\nYou mean the world to me.",
  loveNotes: {
    eyebrow: "The little things",
    title: "Little things we love about you",
    subtitle: "A few reasons the world feels brighter with you in it.",
    items: [
      "The way you make everyone feel included.",
      "Your laugh, especially when you can't stop.",
      "How you show up, every single time.",
      "The tiny details you remember about people."
    ]
  },
  birthdayWishes: {
    eyebrow: "A whole year of possibility",
    title: "Birthday wishes",
    subtitle: "May this next chapter bring more of what makes you feel most like you.",
    wishes: [
      "Slow mornings and spontaneous adventures.",
      "Big dreams with room to grow.",
      "People who love you exactly as you are.",
      "A little magic in the ordinary days."
    ]
  },
  finalTitle: "Happy Birthday Simran!",
  finalWish: "May all your wishes come true. Keep shining, keep smiling, and never stop being you. Love you always!",
  sounds: {
    background: "",
    pop: "",
    celebration: ""
  }
};

// Countdown settings (month: 0 = Jan ... 10 = Nov, 11 = Dec)
const COUNTDOWN = {
  year: 2026,
  month: 10,
  day: 25,
  testMode: false // true = 15 sec countdown, then celebration, hidden after 1 min
};

(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const steps = [...document.querySelectorAll(".step")];
  const totalSteps = steps.length;
  const introTitle = $("#intro-title");
  const wishPrompt = $("#wish-prompt");
  const finalTitle = $("#final-title");
  const finalWish = $("#final-wish");
  const startButton = $("#start-button");
  const cakeStage = $("#cake-stage");
  const candleButton = $("#candle-button");
  const cake = $("#cake");
  const cakeNext = $("#cake-next");
  const cakeHint = $("#cake-hint");
  const rail = $("#memory-rail");
  const galleryNext = $("#gallery-next");
  const messageOutput = $("#typed-message");
  const messageNext = $("#message-next");
  const replayButton = $("#replay-button");
  const muteToggle = $("#mute-toggle");
  const lightbox = $("#lightbox");
  const lightboxImage = $("#lightbox-image");
  const lightboxVideo = $("#lightbox-video");
  const lightboxFrame = $("#lightbox-frame");
  const lightboxCaption = $("#lightbox-caption");
  const lightboxClose = $("#lightbox-close");
  const canvas = $("#celebration-canvas");
  const context = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const placeholderColors = [
    "linear-gradient(145deg, #ffd9e6, #f6a5c7)",
    "linear-gradient(145deg, #ffe6a9, #f2a9bb)",
    "linear-gradient(145deg, #ffd0e3, #dca2c8)",
    "linear-gradient(145deg, #f6c5d4, #f39c9d)",
    "linear-gradient(145deg, #f5d8a7, #ec9ebc)"
  ];

  let currentStep = 1;
  let countdownInterval;
  let typewriterInterval;
  let isMuted = false;
  let flameIsOut = false;
  let lightboxReturnFocus = null;
  let canvasFrame = null;
  let lastFireworkAt = 0;
  let lastConfettiAt = 0;
  let particles = [];
  let fireworks = [];
  let uploadedMedia = [];
  let audioContext = null;
  let melodyTimer = null;
  let melodyStarted = false;
  let melodyIndex = 0;
  let nextNoteAt = 0;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const melody = [
    [392, .27], [392, .27], [440, .54], [392, .54], [523.25, .54], [493.88, 1.05],
    [392, .27], [392, .27], [440, .54], [392, .54], [587.33, .54], [523.25, 1.05],
    [392, .27], [392, .27], [783.99, .54], [659.25, .54], [523.25, .54], [493.88, .54], [440, 1.05],
    [698.46, .27], [698.46, .27], [659.25, .54], [523.25, .54], [587.33, .54], [523.25, 1.1]
  ];

  const audioTracks = {};
  Object.entries(CONFIG.sounds || {}).forEach(([key, source]) => {
    if (!source) return;
    const track = new Audio();
    track.preload = "none";
    track.loop = key === "background";
    track.volume = key === "background" ? .2 : .45;
    track.addEventListener("error", () => { track.dataset.unavailable = "true"; });
    track.src = source;
    audioTracks[key] = track;
  });

  function attemptPlay(track) {
    if (!track || isMuted || track.dataset.unavailable === "true") return false;
    try {
      const result = track.play();
      if (result && result.catch) result.catch(() => {});
      return true;
    } catch { return false; }
  }
  function pauseTrack(track) {
    if (!track) return;
    track.pause();
    try { track.currentTime = 0; } catch { /* Optional local sound may not be ready. */ }
  }
  function playNote(frequency, duration, startAt) {
    if (!audioContext || isMuted) return;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startAt);
    gain.gain.setValueAtTime(.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(.12, startAt + .025);
    gain.gain.exponentialRampToValueAtTime(.0001, startAt + duration * .88);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration);
  }
  function scheduleMelody() {
    if (!audioContext || isMuted || !melodyStarted) return;
    while (nextNoteAt < audioContext.currentTime + .45) {
      const [frequency, duration] = melody[melodyIndex];
      playNote(frequency, duration * .76, nextNoteAt);
      nextNoteAt += duration;
      melodyIndex = (melodyIndex + 1) % melody.length;
    }
  }
  function startMusicFromGesture() {
    if (isMuted) return;
    const backgroundTrack = audioTracks.background;
    if (backgroundTrack && backgroundTrack.dataset.unavailable !== "true") {
      backgroundTrack.volume = 0.2;
      try {
        const playback = backgroundTrack.play();
        if (playback && playback.catch) playback.catch(startSynthesizedMelody);
        return;
      } catch {
        startSynthesizedMelody();
        return;
      }
    }
    startSynthesizedMelody();
  }
  function startSynthesizedMelody() {
    if (isMuted) return;
    if (audioContext && audioContext.state === "suspended") audioContext.resume().catch(() => {});
    if (AudioContextClass) {
      try {
        if (!audioContext) audioContext = new AudioContextClass();
        if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
        if (!melodyStarted) {
          melodyStarted = true;
          melodyIndex = 0;
          nextNoteAt = audioContext.currentTime + .05;
          melodyTimer = window.setInterval(scheduleMelody, 180);
        }
      } catch { /* Browsers without Web Audio can still enjoy the full surprise. */ }
    }
  }
  function stopMusic() {
    window.clearInterval(melodyTimer);
    melodyTimer = null;
    melodyStarted = false;
    pauseTrack(audioTracks.background);
  }

  // ================= COUNTDOWN (merged from countdown.js) =================

  // Countdown ends at 25 Nov 00:00
  const startTime = COUNTDOWN.testMode
    ? new Date(Date.now() + 15000)
    : new Date(COUNTDOWN.year, COUNTDOWN.month, COUNTDOWN.day, 0, 0, 0);

  // Everything disappears at 26 Nov 00:00
  const endTime = COUNTDOWN.testMode
    ? new Date(Date.now() + 60000)
    : new Date(COUNTDOWN.year, COUNTDOWN.month, COUNTDOWN.day + 1, 0, 0, 0);

  // CSS rules that decide what shows in each state
  const countdownStyle = document.createElement("style");
  countdownStyle.textContent = `
    body.state-countdown #countdown { display: flex !important; }
    body.state-countdown #start-button { display: none !important; }

    body.state-start #countdown { display: none !important; }
    body.state-start #start-button { display: inline-block !important; }

    body.state-over .app-shell,
    body.state-over .sky,
    body.state-over .lightbox { display: none !important; }

    #party-canvas {
      position: fixed; inset: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 99999;
    }
  `;
  document.head.appendChild(countdownStyle);

  // Celebration (confetti + hearts) when the time is complete
  let celebrating = false;

  function celebrate() {
    if (celebrating) return;
    if (reducedMotion.matches) return;
    celebrating = true;

    const partyCanvas = document.createElement("canvas");
    partyCanvas.id = "party-canvas";
    document.body.appendChild(partyCanvas);
    const ctx = partyCanvas.getContext("2d");

    const resize = () => {
      partyCanvas.width = window.innerWidth;
      partyCanvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const colors = ["#f58db7", "#ffd166", "#8ecae6", "#b8f2e6", "#ff6b9d", "#c9a7ff"];
    const pieces = [];

    function burst(x, y, count) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 9;
        pieces.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 5,
          size: 6 + Math.random() * 8,
          color: colors[Math.floor(Math.random() * colors.length)],
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
          heart: Math.random() < 0.25
        });
      }
    }

    function drawHeart(size) {
      const s = size / 2;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.6);
      ctx.bezierCurveTo(-s * 1.4, -s * 0.4, -s * 0.5, -s * 1.3, 0, -s * 0.4);
      ctx.bezierCurveTo(s * 0.5, -s * 1.3, s * 1.4, -s * 0.4, 0, s * 0.6);
      ctx.fill();
    }

    const w = partyCanvas.width, h = partyCanvas.height;
    burst(w * 0.5, h * 0.4, 120);
    setTimeout(() => burst(w * 0.2, h * 0.5, 80), 500);
    setTimeout(() => burst(w * 0.8, h * 0.5, 80), 900);
    setTimeout(() => burst(w * 0.5, h * 0.3, 100), 1600);
    setTimeout(() => burst(w * 0.3, h * 0.4, 70), 2400);
    setTimeout(() => burst(w * 0.7, h * 0.4, 70), 3000);

    const startedAt = performance.now();

    function frame(now) {
      ctx.clearRect(0, 0, partyCanvas.width, partyCanvas.height);

      for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i];
        p.vy += 0.18;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;

        if (p.y > partyCanvas.height + 30) {
          pieces.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.heart) drawHeart(p.size * 1.6);
        else ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }

      if (now - startedAt < 4500 || pieces.length > 0) {
        requestAnimationFrame(frame);
      } else {
        window.removeEventListener("resize", resize);
        partyCanvas.remove();
        celebrating = false;
      }
    }
    requestAnimationFrame(frame);
  }

  const pad = (n) => String(n).padStart(2, "0");
  let currentState = null;

  function setState(name) {
    if (name === currentState) return;
    currentState = name;

    document.body.classList.remove("state-countdown", "state-start", "state-over");
    document.body.classList.add(name);

    const subtitle = $("#intro-subtitle");
    if (name === "state-start") {
      if (subtitle) subtitle.textContent = CONFIG.birthdayTodaySubtitle;
      celebrate();
    } else if (name === "state-countdown") {
      if (subtitle) subtitle.textContent = CONFIG.introSubtitle;
    }
  }

  function renderCountdown() {
    const now = new Date();

    if (now >= endTime) {
      setState("state-over");
      return;
    }

    if (now >= startTime) {
      setState("state-start");
      return;
    }

    setState("state-countdown");
    const total = Math.floor((startTime - now) / 1000);
    const values = {
      days: Math.floor(total / 86400),
      hours: Math.floor((total % 86400) / 3600),
      minutes: Math.floor((total % 3600) / 60),
      seconds: total % 60
    };
    Object.entries(values).forEach(([key, value]) => {
      const output = $(`#count-${key}`);
      if (output) output.textContent = pad(value);
    });
  }

  // ================= END COUNTDOWN =================

  function showStep(number) {
    if (number < 1 || number > totalSteps) return;
    currentStep = number;
    steps.forEach((step, index) => {
      const active = index === number - 1;
      step.classList.toggle("is-active", active);
      step.setAttribute("aria-hidden", String(!active));
      step.inert = !active;
      const counter = step.querySelector(".step-counter");
      if (counter) counter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(totalSteps).padStart(2, "0")}`;
    });
    const heading = steps[number - 1].querySelector("h1, h2");
    if (heading) requestAnimationFrame(() => heading.focus({ preventScroll: true }));
    if (number === 3) animateMemories();
    if (number === 4) startTypewriter();
    if (number === totalSteps) beginCelebration();
    else stopCelebration();
  }

  function startFromBeginning() {
    startMusicFromGesture();
    if (currentStep === 1) showStep(2);
  }

  function mediaItems() {
    return [...CONFIG.photos.map((item) => ({ ...item, kind: "image", temporary: false })), ...uploadedMedia];
  }

  function renderMemories() {
    rail.replaceChildren();
    const items = mediaItems();
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "gallery-empty";
      empty.textContent = "Your favorite memories will live here.";
      rail.append(empty);
      return;
    }
    items.forEach((item, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "polaroid";
      card.style.setProperty("--rotation", `${[-3, 2, -1.6, 2.7, -2.2][index % 5]}deg`);
      card.setAttribute("aria-label", `Open ${item.kind === "video" ? "video" : "photo"}: ${item.caption || "Memory"}`);
      const frame = document.createElement("span");
      frame.className = "polaroid-photo";
      frame.style.setProperty("--placeholder", placeholderColors[index % placeholderColors.length]);
      if (item.kind === "video") {
        const video = document.createElement("video");
        video.src = item.src;
        video.muted = true;
        video.playsInline = true;
        video.preload = "metadata";
        video.setAttribute("aria-hidden", "true");
        frame.append(video);
        const badge = document.createElement("span");
        badge.className = "video-badge";
        badge.textContent = "PLAY";
        badge.setAttribute("aria-hidden", "true");
        frame.append(badge);
      } else {
        const image = document.createElement("img");
        image.src = item.src;
        image.alt = "";
        image.loading = "lazy";
        image.addEventListener("error", () => {
          image.remove();
          frame.classList.add("is-placeholder");
        }, { once: true });
        image.addEventListener("load", () => frame.classList.remove("is-placeholder"), { once: true });
        frame.classList.add("is-placeholder");
        frame.append(image);
      }
      const tape = document.createElement("span");
      tape.className = "tape";
      tape.setAttribute("aria-hidden", "true");
      const caption = document.createElement("span");
      caption.className = "memory-caption";
      caption.textContent = item.caption || (item.kind === "video" ? "A little movie" : "A favorite moment");
      card.append(tape, frame, caption);
      card.addEventListener("click", () => openLightbox(index, card));
      rail.append(card);
    });
  }

  function animateMemories() {
    [...rail.querySelectorAll(".polaroid")].forEach((card, index) => {
      window.setTimeout(() => card.classList.add("is-arrived"), reducedMotion.matches ? 0 : index * 90);
    });
  }

  function openLightbox(index, sourceCard) {
    const item = mediaItems()[index];
    if (!item) return;
    lightboxReturnFocus = sourceCard;
    lightboxImage.removeAttribute("src");
    lightboxVideo.pause();
    lightboxVideo.removeAttribute("src");
    lightboxVideo.load();
    lightboxImage.hidden = item.kind === "video";
    lightboxVideo.hidden = item.kind !== "video";
    lightboxCaption.textContent = item.caption || (item.kind === "video" ? "A little movie" : "A favorite moment");
    lightboxFrame.style.setProperty("--placeholder", placeholderColors[index % placeholderColors.length]);
    lightboxFrame.classList.toggle("is-placeholder", item.kind === "image");
    if (item.kind === "video") {
      lightboxVideo.src = item.src;
      lightboxVideo.load();
    } else {
      lightboxImage.alt = item.caption || "Birthday memory";
      lightboxImage.onload = () => lightboxFrame.classList.remove("is-placeholder");
      lightboxImage.onerror = () => lightboxFrame.classList.add("is-placeholder");
      lightboxImage.src = item.src;
    }
    lightbox.hidden = false;
    requestAnimationFrame(() => lightbox.classList.add("is-open"));
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    lightboxClose.focus();
  }

  function closeLightbox() {
    if (lightbox.hidden) return;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lightboxVideo.pause();
    window.setTimeout(() => {
      lightbox.hidden = true;
      lightboxImage.removeAttribute("src");
      lightboxVideo.removeAttribute("src");
      lightboxVideo.load();
      if (lightboxReturnFocus && document.contains(lightboxReturnFocus)) lightboxReturnFocus.focus();
    }, reducedMotion.matches ? 0 : 260);
  }

  function acceptUploads(files) {
    uploadedMedia.forEach((item) => URL.revokeObjectURL(item.src));
    uploadedMedia = [...files].filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"))
      .map((file) => ({
        src: URL.createObjectURL(file),
        kind: file.type.startsWith("video/") ? "video" : "image",
        caption: file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "),
        temporary: true
      }));
    renderMemories();
    animateMemories();
  }

  function startTypewriter() {
    window.clearInterval(typewriterInterval);
    messageOutput.replaceChildren();
    messageNext.hidden = true;
    const textNode = document.createTextNode("");
    const cursor = document.createElement("span");
    cursor.className = "cursor";
    cursor.setAttribute("aria-hidden", "true");
    messageOutput.append(textNode, cursor);
    let position = 0;
    const typeNext = () => {
      if (currentStep !== 4) { window.clearInterval(typewriterInterval); return; }
      if (position < CONFIG.message.length) {
        textNode.appendData(CONFIG.message.charAt(position++));
      } else {
        window.clearInterval(typewriterInterval);
        messageNext.hidden = false;
      }
    };
    if (reducedMotion.matches) {
      textNode.textContent = CONFIG.message;
      cursor.remove();
      messageNext.hidden = false;
    } else {
      typeNext();
      typewriterInterval = window.setInterval(typeNext, 24);
    }
  }

  function extinguishCandle() {
    if (flameIsOut) return;
    flameIsOut = true;
    cakeStage.classList.add("is-out");
    cake.classList.remove("is-bouncing");
    void cake.offsetWidth;
    cake.classList.add("is-bouncing");
    cakeNext.hidden = false;
    $("#cake-reveal").hidden = false;
    $("#cake-reveal").textContent = CONFIG.candleRevealText;
    cakeHint.textContent = "Wish made. Keep it close.";
    playSound("pop");
    burstConfetti(window.innerWidth / 2, window.innerHeight * .42, 62);
  }

  function playSound(name) {
    const track = audioTracks[name];
    if (!track || isMuted || track.dataset.unavailable === "true") return;
    if (name !== "background") {
      try { track.currentTime = 0; } catch { /* Optional sound is not ready. */ }
    }
    attemptPlay(track);
  }

  function resizeCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function burstConfetti(x, y, amount = 55) {
    const colors = ["#ffbed8", "#f6c6d6", "#ffe4a9", "#ed8bb5", "#fff1e7"];
    for (let i = 0; i < amount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      particles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 2,
        gravity: .045 + Math.random() * .06, size: 3 + Math.random() * 5,
        rotation: Math.random() * Math.PI, spin: (Math.random() - .5) * .18, life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() > .62 ? "circle" : "rect"
      });
    }
    requestCanvasFrame();
  }

  function addFirework() {
    const x = window.innerWidth * (.14 + Math.random() * .72);
    const y = window.innerHeight * (.12 + Math.random() * .46);
    const hue = [338, 354, 42, 18][Math.floor(Math.random() * 4)];
    const burst = [];
    const count = reducedMotion.matches ? 10 : 34;
    for (let i = 0; i < count; i += 1) {
      const angle = Math.PI * 2 * i / count;
      const speed = 1.1 + Math.random() * 2.5;
      burst.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, hue, size: 1.5 + Math.random() * 2 });
    }
    fireworks.push(burst);
  }

  function drawEffects(time) {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (currentStep === totalSteps && !reducedMotion.matches) {
      if (time - lastConfettiAt > 110) {
        lastConfettiAt = time;
        particles.push({
          x: Math.random() * window.innerWidth, y: -10, vx: (Math.random() - .5) * .8,
          vy: 1.1 + Math.random() * 1.7, gravity: .018, size: 3 + Math.random() * 4,
          rotation: Math.random() * Math.PI, spin: (Math.random() - .5) * .08, life: 1,
          color: ["#ffbed8", "#f6c6d6", "#ffe4a9", "#fff1e7"][Math.floor(Math.random() * 4)], shape: "rect"
        });
      }
      if (time - lastFireworkAt > 1800) { lastFireworkAt = time; addFirework(); }
    }
    particles = particles.filter((p) => p.life > .04 && p.y < window.innerHeight + 25);
    particles.forEach((p) => {
      p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.rotation += p.spin;
      p.life -= p.vy < 0 ? .009 : .012;
      context.save(); context.globalAlpha = Math.max(0, p.life); context.fillStyle = p.color;
      context.translate(p.x, p.y); context.rotate(p.rotation);
      if (p.shape === "circle") { context.beginPath(); context.arc(0, 0, p.size / 2, 0, Math.PI * 2); context.fill(); }
      else context.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
      context.restore();
    });
    fireworks = fireworks.map((burst) => burst.filter((spark) => spark.life > .02)).filter((burst) => burst.length);
    fireworks.forEach((burst) => burst.forEach((spark) => {
      spark.x += spark.vx; spark.y += spark.vy; spark.vx *= .985; spark.vy *= .985; spark.life -= .014;
      context.beginPath(); context.globalAlpha = Math.max(0, spark.life);
      context.fillStyle = `hsl(${spark.hue} 82% 67%)`; context.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2); context.fill();
    }));
    context.globalAlpha = 1;
  }

  function requestCanvasFrame() {
    if (!canvasFrame) canvasFrame = requestAnimationFrame(animateCanvas);
  }

  function animateCanvas(time) {
    canvasFrame = null;
    drawEffects(time);
    if (currentStep === totalSteps || particles.length || fireworks.length) canvasFrame = requestAnimationFrame(animateCanvas);
  }

  function beginCelebration() {
    lastFireworkAt = 0;
    lastConfettiAt = 0;
    if (audioTracks.background) audioTracks.background.volume = .24;
    playSound("celebration");
    burstConfetti(window.innerWidth / 2, window.innerHeight * .38, 48);
    if (!reducedMotion.matches) { addFirework(); requestCanvasFrame(); }
  }

  function stopCelebration() {
    if (audioTracks.background) audioTracks.background.volume = .2;
    if (canvasFrame && currentStep !== totalSteps && !particles.length && !fireworks.length) {
      cancelAnimationFrame(canvasFrame);
      canvasFrame = null;
    }
  }

  function replay() {
    window.clearInterval(typewriterInterval);
    pauseTrack(audioTracks.celebration);
    pauseTrack(audioTracks.pop);
    particles = [];
    fireworks = [];
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    flameIsOut = false;
    cakeStage.classList.remove("is-out");
    cake.classList.remove("is-bouncing");
    cakeNext.hidden = true;
    $("#cake-reveal").hidden = true;
    cakeHint.textContent = "Tap the candle to make your wish.";
    rail.querySelectorAll(".polaroid").forEach((card) => card.classList.remove("is-arrived"));
    messageNext.hidden = true;
    messageOutput.replaceChildren();
    showStep(1);
    startMusicFromGesture();
  }

  function renderAddedSteps() {
    const notes = CONFIG.loveNotes;
    $("#love-eyebrow").textContent = notes.eyebrow;
    $("#love-title").textContent = notes.title;
    $("#love-subtitle").textContent = notes.subtitle;
    const loveList = $("#love-list");
    notes.items.forEach((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      loveList.append(item);
    });
    const wishes = CONFIG.birthdayWishes;
    $("#wishes-eyebrow").textContent = wishes.eyebrow;
    $("#wishes-title").textContent = wishes.title;
    $("#wishes-subtitle").textContent = wishes.subtitle;
    const wishList = $("#wishes-list");
    wishes.wishes.forEach((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      wishList.append(item);
    });
  }

  introTitle.textContent = CONFIG.introText;
  $("#intro-subtitle").textContent = CONFIG.introSubtitle;
  wishPrompt.textContent = CONFIG.wishPrompt;
  finalTitle.textContent = CONFIG.finalTitle;
  finalWish.textContent = CONFIG.finalWish;
  renderAddedSteps();
  renderMemories();
  renderCountdown();
  resizeCanvas();
  countdownInterval = window.setInterval(renderCountdown, 1000);

  startButton.addEventListener("click", startFromBeginning);
  candleButton.addEventListener("click", extinguishCandle);
  cakeNext.addEventListener("click", () => showStep(3));
  galleryNext.addEventListener("click", () => showStep(4));
  messageNext.addEventListener("click", () => showStep(5));
  $("#love-next").addEventListener("click", () => showStep(6));
  $("#wishes-next").addEventListener("click", () => showStep(7));
  replayButton.addEventListener("click", replay);
  $("#gallery-back").addEventListener("click", () => rail.scrollBy({ left: -240, behavior: reducedMotion.matches ? "auto" : "smooth" }));
  $("#gallery-forward").addEventListener("click", () => rail.scrollBy({ left: 240, behavior: reducedMotion.matches ? "auto" : "smooth" }));
  $("#memory-upload").addEventListener("change", (event) => acceptUploads(event.currentTarget.files));
  muteToggle.addEventListener("click", () => {
    isMuted = !isMuted;
    muteToggle.setAttribute("aria-pressed", String(isMuted));
    muteToggle.setAttribute("aria-label", isMuted ? "Unmute sound" : "Mute sound");
    Object.values(audioTracks).forEach((track) => { track.muted = isMuted; if (isMuted) track.pause(); });
    if (isMuted) stopMusic();
    else startMusicFromGesture();
    if (!isMuted && currentStep === totalSteps) playSound("celebration");
  });
  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !lightbox.hidden) closeLightbox();
    if (!lightbox.hidden && event.key === "Tab") { event.preventDefault(); lightboxClose.focus(); }
  });
  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("pagehide", () => {
    uploadedMedia.forEach((item) => URL.revokeObjectURL(item.src));
    stopMusic();
    if (audioContext) audioContext.close().catch(() => {});
  });
})();