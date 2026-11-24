const CONFIG = {
  // Personalize every line here; the site remains a self-contained static experience.
  name: "Priya",
  birthdayDate: "2026-10-25T00:00:00",
  introText: "Something special is waiting for Priya...",
  introSubtitle: "The best day deserves a little bit of magic.",
  birthdayTodaySubtitle: "It's your birthday today. Your surprise is ready whenever you are.",
  birthdayPassedSubtitle: "The date has passed, but your birthday surprise is still here.",
  birthdayPuzzle: {
    scrambledWord: "YADHTRIB",
    answer: "BIRTHDAY",
    retryMessage: "Not quite. Try rearranging the letters.",
    successMessage: "You solved it. Your surprise is ready!",
    unlockButton: "Open your surprise"
  },
  wishPrompt: "Make a wish, then tap the candle.",
  candleRevealText: "One wish made. One wonderful year ahead.",
  photos: [
    { src: "images/photo1.jpg", caption: "Our first trip together" },
    { src: "images/photo2.jpg", caption: "That crazy night out" },
    { src: "images/photo3.jpg", caption: "My favorite smile" },
    { src: "images/photo4.jpg", caption: "Best day ever" },
    { src: "images/photo5.jpg", caption: "Forever friends" }
  ],
  message: "Dear Priya,\n\nToday is all about you. Thank you for being the kindest, funniest and most amazing person in my life. Every moment with you turns into a beautiful memory. I hope this year brings you endless smiles, big dreams coming true, and all the happiness you deserve.\n\nYou mean the world to me.",
  // Content for the two added pages is editable here.
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
  finalTitle: "Happy Birthday Priya!",
  finalWish: "May all your wishes come true. Keep shining, keep smiling, and never stop being you. Love you always!",
  // Leave background empty to use the built-in Happy Birthday melody.
  // Add an audio file path here only if you want to replace that melody.
  sounds: {
    background: "",
    pop: "",
    celebration: ""
  }
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
  const birthdayPuzzle = $("#birthday-puzzle");
  const puzzleAnswer = $("#puzzle-answer");
  const puzzleSubmit = $("#puzzle-submit");
  const puzzleFeedback = $("#puzzle-feedback");
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
  let puzzleSolved = false;
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

  function renderCountdown() {
    const targetDate = new Date(CONFIG.birthdayDate);
    const now = new Date();
    const countdown = $("#countdown");
    const introSubtitle = $("#intro-subtitle");
    const birthdayDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    if (today === birthdayDay) {
      countdown.hidden = true;
      birthdayPuzzle.hidden = true;
      startButton.hidden = false;
      startButton.textContent = "Tap to Start";
      introSubtitle.textContent = CONFIG.birthdayTodaySubtitle;
      return;
    }

    if (today > birthdayDay) {
      countdown.hidden = true;
      birthdayPuzzle.hidden = false;
      startButton.hidden = !puzzleSolved;
      startButton.textContent = CONFIG.birthdayPuzzle.unlockButton;
      introSubtitle.textContent = CONFIG.birthdayPassedSubtitle;
      return;
    }

    countdown.hidden = false;
    birthdayPuzzle.hidden = true;
    startButton.hidden = false;
    startButton.textContent = "Tap to Start";
    introSubtitle.textContent = CONFIG.introSubtitle;
    const remaining = Math.max(0, targetDate.getTime() - now.getTime());
    const seconds = Math.floor(remaining / 1000);
    const values = {
      days: Math.floor(seconds / 86400),
      hours: Math.floor((seconds % 86400) / 3600),
      minutes: Math.floor((seconds % 3600) / 60),
      seconds: seconds % 60
    };
    Object.entries(values).forEach(([key, value]) => {
      const output = $(`#count-${key}`);
      if (output) output.textContent = String(value).padStart(2, "0");
    });
  }
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
    if (isBirthdayPast() && !puzzleSolved) return;
    startMusicFromGesture();
    if (currentStep === 1) showStep(2);
  }
  function isBirthdayPast() {
    const targetDate = new Date(CONFIG.birthdayDate);
    const now = new Date();
    const birthdayDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return today > birthdayDay;
  }
  function solveBirthdayPuzzle(event) {
    event.preventDefault();
    const answer = puzzleAnswer.value.trim().replace(/\s+/g, "").toLocaleUpperCase();
    if (answer !== CONFIG.birthdayPuzzle.answer.replace(/\s+/g, "").toLocaleUpperCase()) {
      puzzleFeedback.textContent = CONFIG.birthdayPuzzle.retryMessage;
      puzzleAnswer.setAttribute("aria-invalid", "true");
      puzzleAnswer.select();
      return;
    }
    puzzleSolved = true;
    puzzleAnswer.removeAttribute("aria-invalid");
    puzzleAnswer.disabled = true;
    puzzleSubmit.disabled = true;
    puzzleFeedback.textContent = CONFIG.birthdayPuzzle.successMessage;
    startButton.hidden = false;
    startButton.textContent = CONFIG.birthdayPuzzle.unlockButton;
    startMusicFromGesture();
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
  $("#scrambled-word").textContent = CONFIG.birthdayPuzzle.scrambledWord;
  wishPrompt.textContent = CONFIG.wishPrompt;
  finalTitle.textContent = CONFIG.finalTitle;
  finalWish.textContent = CONFIG.finalWish;
  renderAddedSteps();
  renderMemories();
  renderCountdown();
  resizeCanvas();
  countdownInterval = window.setInterval(renderCountdown, 1000);

  startButton.addEventListener("click", startFromBeginning);
  birthdayPuzzle.addEventListener("submit", solveBirthdayPuzzle);
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
