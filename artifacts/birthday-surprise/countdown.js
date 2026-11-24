// const CONFIG = {
//   year: 2026,
//   month: 10,       // 10 = November
//   day: 25,
//   testMode: false  // true = 15 sec countdown, then celebration, hidden after 1 min
// };

// // Countdown ends at 25 Nov 00:00
// const startTime = CONFIG.testMode
//   ? new Date(Date.now() + 15000)
//   : new Date(CONFIG.year, CONFIG.month, CONFIG.day, 0, 0, 0);

// // Everything disappears at 26 Nov 00:00
// const endTime = CONFIG.testMode
//   ? new Date(Date.now() + 60000)
//   : new Date(CONFIG.year, CONFIG.month, CONFIG.day + 1, 0, 0, 0);

// // ---------- CSS ----------
// const style = document.createElement("style");
// style.textContent = `
//   body.state-countdown #countdown { display: flex !important; }
//   body.state-countdown #start-button { display: none !important; }

//   body.state-start #countdown { display: none !important; }
//   body.state-start #start-button { display: inline-block !important; }

//   body.state-over .app-shell,
//   body.state-over .sky,
//   body.state-over .lightbox { display: none !important; }

//   #party-canvas {
//     position: fixed; inset: 0; width: 100%; height: 100%;
//     pointer-events: none; z-index: 99999;
//   }
// `;
// document.head.appendChild(style);

// // ---------- Celebration (confetti + hearts) ----------
// let celebrating = false;

// function celebrate() {
//   if (celebrating) return;
//   if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
//   celebrating = true;

//   const canvas = document.createElement("canvas");
//   canvas.id = "party-canvas";
//   document.body.appendChild(canvas);
//   const ctx = canvas.getContext("2d");

//   const resize = () => {
//     canvas.width = window.innerWidth;
//     canvas.height = window.innerHeight;
//   };
//   resize();
//   window.addEventListener("resize", resize);

//   const colors = ["#f58db7", "#ffd166", "#8ecae6", "#b8f2e6", "#ff6b9d", "#c9a7ff"];
//   const pieces = [];

//   function burst(x, y, count) {
//     for (let i = 0; i < count; i++) {
//       const angle = Math.random() * Math.PI * 2;
//       const speed = 4 + Math.random() * 9;
//       pieces.push({
//         x, y,
//         vx: Math.cos(angle) * speed,
//         vy: Math.sin(angle) * speed - 5,
//         size: 6 + Math.random() * 8,
//         color: colors[Math.floor(Math.random() * colors.length)],
//         rot: Math.random() * Math.PI,
//         vr: (Math.random() - 0.5) * 0.3,
//         heart: Math.random() < 0.25,
//         life: 0
//       });
//     }
//   }

//   function drawHeart(size) {
//     const s = size / 2;
//     ctx.beginPath();
//     ctx.moveTo(0, s * 0.6);
//     ctx.bezierCurveTo(-s * 1.4, -s * 0.4, -s * 0.5, -s * 1.3, 0, -s * 0.4);
//     ctx.bezierCurveTo(s * 0.5, -s * 1.3, s * 1.4, -s * 0.4, 0, s * 0.6);
//     ctx.fill();
//   }

//   // Several bursts over ~4 seconds
//   const w = canvas.width, h = canvas.height;
//   burst(w * 0.5, h * 0.4, 120);
//   setTimeout(() => burst(w * 0.2, h * 0.5, 80), 500);
//   setTimeout(() => burst(w * 0.8, h * 0.5, 80), 900);
//   setTimeout(() => burst(w * 0.5, h * 0.3, 100), 1600);
//   setTimeout(() => burst(w * 0.3, h * 0.4, 70), 2400);
//   setTimeout(() => burst(w * 0.7, h * 0.4, 70), 3000);

//   const startedAt = performance.now();

//   function frame(now) {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     for (let i = pieces.length - 1; i >= 0; i--) {
//       const p = pieces[i];
//       p.vy += 0.18;      // gravity
//       p.vx *= 0.99;      // air drag
//       p.x += p.vx;
//       p.y += p.vy;
//       p.rot += p.vr;
//       p.life++;

//       if (p.y > canvas.height + 30) {
//         pieces.splice(i, 1);
//         continue;
//       }

//       ctx.save();
//       ctx.translate(p.x, p.y);
//       ctx.rotate(p.rot);
//       ctx.fillStyle = p.color;
//       if (p.heart) {
//         drawHeart(p.size * 1.6);
//       } else {
//         ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
//       }
//       ctx.restore();
//     }

//     const elapsed = now - startedAt;
//     if (elapsed < 4500 || pieces.length > 0) {
//       requestAnimationFrame(frame);
//     } else {
//       window.removeEventListener("resize", resize);
//       canvas.remove();
//       celebrating = false;
//     }
//   }
//   requestAnimationFrame(frame);
// }

// // ---------- Timer ----------
// const pad = (n) => String(n).padStart(2, "0");
// let currentState = null;

// function setState(name) {
//   if (name === currentState) return;
//   const previous = currentState;
//   currentState = name;

//   document.body.classList.remove("state-countdown", "state-start", "state-over");
//   document.body.classList.add(name);

//   // Celebrate when the time is complete:
//   // - user was already on the page and the timer reached zero (previous = countdown)
//   // - user opened the site after the time was complete (previous = null)
//   if (name === "state-start") celebrate();
// }

// function startCountdown() {
//   const d = document.getElementById("count-days");
//   const h = document.getElementById("count-hours");
//   const m = document.getElementById("count-minutes");
//   const s = document.getElementById("count-seconds");

//   function tick() {
//     const now = new Date();

//     if (now >= endTime) {
//       setState("state-over");
//       return;
//     }

//     if (now >= startTime) {
//       setState("state-start");
//       return;
//     }

//     setState("state-countdown");
//     const total = Math.floor((startTime - now) / 1000);
//     d.textContent = pad(Math.floor(total / 86400));
//     h.textContent = pad(Math.floor((total % 86400) / 3600));
//     m.textContent = pad(Math.floor((total % 3600) / 60));
//     s.textContent = pad(total % 60);
//   }

//   tick();
//   setInterval(tick, 1000);
// }

// if (document.readyState === "loading") {
//   document.addEventListener("DOMContentLoaded", startCountdown);
// } else {
//   startCountdown();
// }