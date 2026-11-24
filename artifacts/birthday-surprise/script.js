const CONFIG = {
  // Change these personal details to make the surprise your own.
  name: "Priya",
  birthdayDate: "2026-12-15T00:00:00",
  introText: "Something special is waiting for Priya...",
  wishPrompt: "Make a wish, then tap the candle 🎂",
  // Replace the local photo files and captions here.
  photos: [
    { src: "images/photo1.jpg", caption: "Our first trip together 🌴" },
    { src: "images/photo2.jpg", caption: "That crazy night out 😂" },
    { src: "images/photo3.jpg", caption: "My favorite smile 😊" },
    { src: "images/photo4.jpg", caption: "Best day ever ❤️" },
    { src: "images/photo5.jpg", caption: "Forever friends 🤝" }
  ],
  // Replace this message with your own note; line breaks are preserved.
  message: "Dear Priya,\n\nToday is all about you. Thank you for being the kindest, funniest and most amazing person in my life. Every moment with you turns into a beautiful memory. I hope this year brings you endless smiles, big dreams coming true, and all the happiness you deserve.\n\nYou mean the world to me. ❤️",
  finalTitle: "Happy Birthday Priya! 🎉",
  finalWish: "May all your wishes come true. Keep shining, keep smiling, and never stop being you. Love you always! 💖",
  // Add or replace local audio files in public/audio and update these paths.
  sounds: {
    background: "audio/birthday.mp3",
    pop: "audio/pop.mp3",
    celebration: "audio/celebration.mp3"
  }
};

(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const steps = [...document.querySelectorAll(".step")];
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
  const micButton = $("#mic-button");
  const micLabel = $("#mic-label");
  const rail = $("#memory-rail");
  const galleryNext = $("#gallery-next");
  const messageOutput = $("#typed-message");
  const messageNext = $("#message-next");
  const replayButton = $("#replay-button");
  const muteToggle = $("#mute-toggle");
  const lightbox = $("#lightbox");
  const lightboxImage = $("#lightbox-image");
  const lightboxFrame = $("#lightbox-frame");
  const lightboxCaption = $("#lightbox-caption");
  const lightboxClose = $("#lightbox-close");
  const canvas = $("#celebration-canvas");
  const context = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const placeholderColors = [
    "linear-gradient(145deg, #efb7c8, #bd7fa5)",
    "linear-gradient(145deg, #f1d29d, #dc9c92)",
    "linear-gradient(145deg, #b8c4e5, #8a80b7)",
    "linear-gradient(145deg, #e5c4b0, #d58996)",
    "linear-gradient(145deg, #c1d7c5, #84a99e)"
  ];

  let currentStep = 1;
  let countdownInterval = null;
  let typewriterInterval = null;
  let isMuted = false;
  let flameIsOut = false;
  let activeStream = null;
  let micContext = null;
  let micFrame = null;
  let lightboxReturnFocus = null;
  let canvasFrame = null;
  let lastFireworkAt = 0;
  let lastConfettiAt = 0;
  let particles = [];
  let fireworks = [];

  const audioTracks = {};
  Object.entries(CONFIG.sounds).forEach(([key, source]) => {
    const track = new Audio();
    track.preload = "auto";
    track.loop = key === "background";
    track.volume = key === "background" ? 0.25 : 0.8;
    track.addEventListener("error", () => {
      // Missing optional local audio is intentionally silent.
      track.dataset.unavailable = "true";
    });
    track.src = source;
    track.load();
    audioTracks[key] = track;
  });

  function attemptPlay(track) {
    if (!track || isMuted || track.dataset.unavailable === "true") return;
    try {
      const playback = track.play();
      if (playback && typeof playback.catch === "function") playback.catch(() => {});
    } catch {
      // Browsers may reject playback until a gesture; no audio is required.
    }
  }

  function pauseAndReset(track) {
    if (!track) return;
    try {
      track.pause();
      track.currentTime = 0;
    } catch {
      // An unavailable audio file has nothing to reset.
    }
  }

  function unlockAudio() {
    const background = audioTracks.background;
    if (background) {
      background.volume = 0.25;
      attemptPlay(background);
    }
  }

  function preloadPhotos() {
    CONFIG.photos.forEach((photo) => {
      const image = new Image();
      image.src = photo.src;
    });
  }

  function renderCountdown() {
    const target = new Date(CONFIG.birthdayDate).getTime();
    const now = Date.now();
    const remaining = Math.max(0, target - now);
    const totalSeconds = Math.floor(remaining / 1000);
    const values = {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60
    };
    $("#count-days").textContent = String(values.days).padStart(2, "0");
    $("#count-hours").textContent = String(values.hours).padStart(2, "0");
    $("#count-minutes").textContent = String(values.minutes).padStart(2, "0");
    $("#count-seconds").textContent = String(values.seconds).padStart(2, "0");

    if (remaining === 0 && currentStep === 1) {
      window.clearInterval(countdownInterval);
      window.setTimeout(() => {
        if (currentStep === 1) showStep(2);
      }, 900);
    }
  }

  function showStep(number) {
    if (number < 1 || number > steps.length) return;
    currentStep = number;
    steps.forEach((step, index) => {
      const active = index === number - 1;
      step.classList.toggle("is-active", active);
      step.setAttribute("aria-hidden", String(!active));
      step.inert = !active;
    });
    const heading = steps[number - 1].querySelector("h1, h2");
    if (heading) requestAnimationFrame(() => heading.focus({ preventScroll: true }));

    if (number === 3) animateMemories();
    if (number === 4) startTypewriter();
    if (number === 5) beginCelebration();
    else stopCelebration();
  }

  function startFromBeginning() {
    unlockAudio();
    if (currentStep !== 1) return;
    showStep(2);
  }

  function renderMemories() {
    rail.replaceChildren();
    CONFIG.photos.forEach((photo, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "polaroid";
      card.style.setProperty("--rotation", `${[-3, 2, -1.6, 2.7, -2.2][index % 5]}deg`);
      card.setAttribute("aria-label", `Open photo: ${photo.caption}`);
      card.dataset.index = String(index);

      const imageFrame = document.createElement("span");
      imageFrame.className = "polaroid-photo";
      imageFrame.style.setProperty("--placeholder", placeholderColors[index % placeholderColors.length]);
      const image = document.createElement("img");
      image.src = photo.src;
      image.alt = "";
      image.loading = "eager";
      image.addEventListener("error", () => {
        image.remove();
        imageFrame.classList.add("is-placeholder");
      }, { once: true });
      image.addEventListener("load", () => imageFrame.classList.remove("is-placeholder"), { once: true });
      imageFrame.append(image);

      const tape = document.createElement("span");
      tape.className = "tape";
      tape.setAttribute("aria-hidden", "true");
      const caption = document.createElement("span");
      caption.className = "memory-caption";
      caption.textContent = photo.caption;
      card.append(tape, imageFrame, caption);
      card.addEventListener("click", () => openLightbox(index, card));
      rail.append(card);
    });
  }

  function animateMemories() {
    const cards = [...rail.querySelectorAll(".polaroid")];
    cards.forEach((card, index) => {
      window.setTimeout(() => card.classList.add("is-arrived"), reducedMotion.matches ? 0 : index * 120);
    });
  }

  function openLightbox(index, sourceCard) {
    const photo = CONFIG.photos[index];
    if (!photo) return;
    lightboxReturnFocus = sourceCard;
    lightboxImage.removeAttribute("src");
    lightboxImage.alt = photo.caption;
    lightboxCaption.textContent = photo.caption;
    lightboxFrame.style.setProperty("--placeholder", placeholderColors[index % placeholderColors.length]);
    lightboxFrame.classList.add("is-placeholder");
    lightboxImage.onload = () => lightboxFrame.classList.remove("is-placeholder");
    lightboxImage.onerror = () => {
      lightboxImage.removeAttribute("src");
      lightboxFrame.classList.add("is-placeholder");
    };
    lightboxImage.src = photo.src;
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
    window.setTimeout(() => {
      lightbox.hidden = true;
      lightboxImage.removeAttribute("src");
      if (lightboxReturnFocus && document.contains(lightboxReturnFocus)) lightboxReturnFocus.focus();
    }, reducedMotion.matches ? 0 : 260);
  }

  function startTypewriter() {
    window.clearInterval(typewriterInterval);
    messageOutput.replaceChildren();
    messageNext.hidden = true;
    const content = document.createTextNode("");
    const cursor = document.createElement("span");
    cursor.className = "cursor";
    cursor.setAttribute("aria-hidden", "true");
    messageOutput.append(content, cursor);
    let position = 0;
    const cadence = reducedMotion.matches ? 0 : 24;

    const typeNext = () => {
      if (currentStep !== 4) {
        window.clearInterval(typewriterInterval);
        return;
      }
      if (position < CONFIG.message.length) {
        content.appendData(CONFIG.message.charAt(position));
        position += 1;
        return;
      }
      window.clearInterval(typewriterInterval);
      messageNext.hidden = false;
    };
    typeNext();
    if (cadence > 0) typewriterInterval = window.setInterval(typeNext, cadence);
    else {
      content.appendData(CONFIG.message.slice(1));
      messageNext.hidden = false;
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
    cakeHint.textContent = "Wish made. Keep it close.";
    stopMicrophone();
    playSound("pop");
    burstConfetti(window.innerWidth / 2, window.innerHeight * 0.42, 62);
  }

  function playSound(name) {
    const track = audioTracks[name];
    if (!track || isMuted || track.dataset.unavailable === "true") return;
    if (name !== "background") {
      try {
        track.currentTime = 0;
      } catch {
        // Continue gracefully when a local sound is unavailable.
      }
    }
    attemptPlay(track);
  }

  async function startMicrophone() {
    if (flameIsOut || activeStream) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      cakeHint.textContent = "Microphone unavailable here. Tap the candle instead.";
      return;
    }
    try {
      activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error("Audio input is not supported.");
      micContext = new AudioContextClass();
      const source = micContext.createMediaStreamSource(activeStream);
      const analyser = micContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      micButton.setAttribute("aria-pressed", "true");
      micLabel.textContent = "Listening…";
      cakeHint.textContent = "Give the candle a gentle blow.";

      const listen = () => {
        if (!activeStream || flameIsOut) return;
        analyser.getByteTimeDomainData(samples);
        let power = 0;
        for (let index = 0; index < samples.length; index += 1) {
          const delta = (samples[index] - 128) / 128;
          power += delta * delta;
        }
        const rms = Math.sqrt(power / samples.length);
        if (rms > 0.19) {
          extinguishCandle();
          return;
        }
        micFrame = requestAnimationFrame(listen);
      };
      micFrame = requestAnimationFrame(listen);
    } catch {
      stopMicrophone();
      cakeHint.textContent = "Microphone permission was not available. Tap the candle instead.";
    }
  }

  function stopMicrophone() {
    if (micFrame) cancelAnimationFrame(micFrame);
    micFrame = null;
    if (activeStream) activeStream.getTracks().forEach((track) => track.stop());
    activeStream = null;
    if (micContext) {
      micContext.close().catch(() => {});
      micContext = null;
    }
    micButton.setAttribute("aria-pressed", "false");
    micLabel.textContent = "Use microphone";
  }

  function resizeCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function burstConfetti(x, y, amount = 55) {
    const colors = ["#f6d38e", "#f49abf", "#d8c8ff", "#fff0c8", "#db8caa"];
    for (let index = 0; index < amount; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        gravity: 0.045 + Math.random() * 0.06,
        size: 3 + Math.random() * 5,
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.18,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() > 0.62 ? "circle" : "rect"
      });
    }
    requestCanvasFrame();
  }

  function addFirework() {
    const x = window.innerWidth * (.14 + Math.random() * .72);
    const y = window.innerHeight * (.12 + Math.random() * .46);
    const hue = [37, 334, 270, 15][Math.floor(Math.random() * 4)];
    const burst = [];
    const count = reducedMotion.matches ? 10 : 34;
    for (let index = 0; index < count; index += 1) {
      const angle = Math.PI * 2 * index / count;
      const speed = 1.1 + Math.random() * 2.5;
      burst.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        hue,
        size: 1.5 + Math.random() * 2
      });
    }
    fireworks.push(burst);
  }

  function drawEffects(time) {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (currentStep === 5 && !reducedMotion.matches) {
      if (time - lastConfettiAt > 90) {
        lastConfettiAt = time;
        particles.push({
          x: Math.random() * window.innerWidth,
          y: -10,
          vx: (Math.random() - .5) * .8,
          vy: 1.1 + Math.random() * 1.7,
          gravity: .018,
          size: 3 + Math.random() * 4,
          rotation: Math.random() * Math.PI,
          spin: (Math.random() - .5) * .08,
          life: 1,
          color: ["#f6d38e", "#f49abf", "#d8c8ff", "#fff0c8"][Math.floor(Math.random() * 4)],
          shape: "rect"
        });
      }
      if (time - lastFireworkAt > 1700) {
        lastFireworkAt = time;
        addFirework();
      }
    }

    particles = particles.filter((particle) => particle.life > .04 && particle.y < window.innerHeight + 25);
    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += particle.gravity;
      particle.rotation += particle.spin;
      particle.life -= particle.vy < 0 ? .009 : .012;
      context.save();
      context.globalAlpha = Math.max(0, particle.life);
      context.fillStyle = particle.color;
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      if (particle.shape === "circle") {
        context.beginPath();
        context.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
        context.fill();
      } else {
        context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 1.5);
      }
      context.restore();
    });

    fireworks = fireworks.map((burst) => burst.filter((spark) => spark.life > .02)).filter((burst) => burst.length);
    fireworks.forEach((burst) => burst.forEach((spark) => {
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.vx *= .985;
      spark.vy *= .985;
      spark.life -= .014;
      context.beginPath();
      context.globalAlpha = Math.max(0, spark.life);
      context.fillStyle = `hsl(${spark.hue} 82% 75%)`;
      context.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
      context.fill();
    }));
    context.globalAlpha = 1;
  }

  function requestCanvasFrame() {
    if (canvasFrame) return;
    canvasFrame = requestAnimationFrame(animateCanvas);
  }

  function animateCanvas(time) {
    canvasFrame = null;
    drawEffects(time);
    if (currentStep === 5 || particles.length || fireworks.length) {
      canvasFrame = requestAnimationFrame(animateCanvas);
    }
  }

  function beginCelebration() {
    lastFireworkAt = 0;
    lastConfettiAt = 0;
    const background = audioTracks.background;
    if (background) background.volume = 0.58;
    playSound("celebration");
    if (reducedMotion.matches) {
      burstConfetti(window.innerWidth / 2, window.innerHeight * .38, 48);
      return;
    }
    addFirework();
    requestCanvasFrame();
  }

  function stopCelebration() {
    const background = audioTracks.background;
    if (background && currentStep !== 5) background.volume = 0.25;
    if (canvasFrame && currentStep !== 5 && particles.length === 0 && fireworks.length === 0) {
      cancelAnimationFrame(canvasFrame);
      canvasFrame = null;
    }
  }

  function replay() {
    window.clearInterval(typewriterInterval);
    stopMicrophone();
    pauseAndReset(audioTracks.celebration);
    pauseAndReset(audioTracks.pop);
    if (audioTracks.background) audioTracks.background.volume = 0.25;
    particles = [];
    fireworks = [];
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    flameIsOut = false;
    cakeStage.classList.remove("is-out");
    cake.classList.remove("is-bouncing");
    cakeNext.hidden = true;
    cakeHint.textContent = "Tap the candle or blow gently into your microphone.";
    rail.querySelectorAll(".polaroid").forEach((card) => card.classList.remove("is-arrived"));
    messageNext.hidden = true;
    messageOutput.replaceChildren();
    showStep(1);
    unlockAudio();
  }

  introTitle.textContent = CONFIG.introText;
  wishPrompt.textContent = CONFIG.wishPrompt;
  finalTitle.textContent = CONFIG.finalTitle;
  finalWish.textContent = CONFIG.finalWish;
  renderMemories();
  preloadPhotos();
  renderCountdown();
  countdownInterval = window.setInterval(renderCountdown, 1000);
  resizeCanvas();

  startButton.addEventListener("click", startFromBeginning);
  candleButton.addEventListener("click", extinguishCandle);
  cakeNext.addEventListener("click", () => showStep(3));
  galleryNext.addEventListener("click", () => showStep(4));
  messageNext.addEventListener("click", () => showStep(5));
  replayButton.addEventListener("click", replay);
  micButton.addEventListener("click", () => {
    if (activeStream) stopMicrophone();
    else startMicrophone();
  });
  muteToggle.addEventListener("click", () => {
    isMuted = !isMuted;
    muteToggle.setAttribute("aria-pressed", String(isMuted));
    muteToggle.setAttribute("aria-label", isMuted ? "Unmute sound" : "Mute sound");
    Object.values(audioTracks).forEach((track) => {
      track.muted = isMuted;
      if (isMuted) track.pause();
      else if (track.loop && currentStep > 1) attemptPlay(track);
    });
    if (!isMuted && currentStep === 5) playSound("celebration");
  });
  $("#gallery-back").addEventListener("click", () => rail.scrollBy({ left: -240, behavior: reducedMotion.matches ? "auto" : "smooth" }));
  $("#gallery-forward").addEventListener("click", () => rail.scrollBy({ left: 240, behavior: reducedMotion.matches ? "auto" : "smooth" }));
  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !lightbox.hidden) closeLightbox();
    if (!lightbox.hidden && event.key === "Tab") {
      event.preventDefault();
      lightboxClose.focus();
    }
  });
  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("pagehide", stopMicrophone);
})();
