// Animates a delivery through the two diagrams on the landing page.
//
// Each .canvas[data-demo] holds a wide and a narrow SVG of the same diagram.
// A token travels along the diagram's edges (path.e, in document order),
// cards light up as it reaches them, and the .ticker line under the canvas
// narrates what the orchestrator records. The scenes below are the only
// content; the engine just moves the token and swaps text.
//
// Nothing runs when the visitor prefers reduced motion, when the canvas is
// off screen, or when the tab is hidden.

(() => {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;

  const SCENES = {
    relay: [
      [
        { say: "<b>NL_betaling_0412.csv</b> · the source agent encrypts it for the destination agent." },
        { lit: 0 }, { show: 0 }, { wait: 500 },
        { edge: 0, dur: 1400 },
        { lit: 1 }, { say: "The relay forwards <b>1.4 MB</b> of ciphertext. It holds no key and stores nothing." }, { wait: 1100 },
        { edge: 1, reverse: true, dur: 1400 },
        { lit: 2 }, { say: "The destination agent decrypts and checks the checksum. <span class=\"ok\">Delivered.</span>" },
        { wait: 2600 }, { hide: true }, { clear: true }, { wait: 800 },
      ],
      [
        { say: "<b>salaris_2026-11.xml</b> · encrypted at the source. The orchestrator sees the name, size and checksum." },
        { lit: 0 }, { show: 0 }, { wait: 500 },
        { edge: 0, dur: 1400 },
        { lit: 1 }, { say: "The relay forwards <b>212 KB</b> it cannot read, then forgets it." }, { wait: 1100 },
        { edge: 1, reverse: true, dur: 1400 },
        { lit: 2 }, { say: "Checksum matches. <span class=\"ok\">Delivered</span>, and recorded as such." },
        { wait: 2600 }, { hide: true }, { clear: true }, { wait: 800 },
      ],
    ],
    flow: [
      [
        { say: "<b>NL_betaling_0412.csv</b> arrives from vm-finance-01." },
        { lit: 0 }, { show: 0 }, { wait: 500 },
        { edge: 0, dur: 900 },
        { lit: 1 }, { say: "Name starts with NL_? <b>Yes.</b>" }, { wait: 800 },
        { edge: 1, dur: 1200 },
        { lit: 2 }, { say: "<b>NL_betaling_0412.csv</b> · 1.4 MB · <span class=\"ok\">delivered to Partner SFTP</span>" },
        { wait: 2600 }, { hide: true }, { clear: true }, { wait: 800 },
      ],
      [
        { say: "<b>kwartaalrapport_Q3.pdf</b> arrives from vm-finance-01." },
        { lit: 0 }, { show: 0 }, { wait: 500 },
        { edge: 0, dur: 900 },
        { lit: 1 }, { say: "Name starts with NL_? <b>No.</b>" }, { wait: 800 },
        { edge: 2, dur: 1200 },
        { lit: 3 }, { say: "<b>kwartaalrapport_Q3.pdf</b> · 6.8 MB · <span class=\"ok\">archived on vm-archive-01</span>" },
        { wait: 2600 }, { hide: true }, { clear: true }, { wait: 800 },
      ],
      [
        { say: "<b>NL_factuur_2291.csv</b> arrives from vm-finance-01." },
        { lit: 0 }, { show: 0 }, { wait: 500 },
        { edge: 0, dur: 900 },
        { lit: 1 }, { say: "Name starts with NL_? <b>Yes.</b>" }, { wait: 800 },
        { edge: 1, dur: 1200 },
        { lit: 2 }, { say: "Partner SFTP refuses the connection. The source file stays where it is." }, { fail: true }, { wait: 1300 },
        { edge: 3, dur: 700 },
        { lit: 4 }, { say: "<b>NL_factuur_2291.csv</b> · <b>failed</b> · team notified, retry scheduled" },
        { wait: 2600 }, { hide: true }, { clear: true }, { wait: 800 },
      ],
    ],
  };

  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  class Demo {
    constructor(el) {
      this.el = el;
      this.scenes = SCENES[el.dataset.demo] || [];
      this.ticker = el.parentElement.querySelector(".ticker");
      this.idle = this.ticker ? this.ticker.innerHTML : "";
      this.svgs = Array.from(el.querySelectorAll("svg"));
      this.next = 0;
      this.run = null;
    }

    visible() {
      return this.svgs.find((s) => s.getClientRects().length > 0);
    }

    place(edgeIndex, t, reverse) {
      const svg = this.visible();
      if (!svg) return;
      const path = svg.querySelectorAll("path.e")[edgeIndex];
      const token = svg.querySelector(".token");
      if (!path || !token) return;
      const len = path.getTotalLength();
      const p = path.getPointAtLength((reverse ? 1 - t : t) * len);
      token.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
    }

    each(selector, fn) {
      this.svgs.forEach((svg) => svg.querySelectorAll(selector).forEach(fn));
    }

    say(html) {
      if (this.ticker) this.ticker.innerHTML = html;
    }

    wait(ms, run) {
      return new Promise((resolve) => {
        const id = setTimeout(resolve, ms);
        run.timers.push(id);
      });
    }

    move(edgeIndex, reverse, dur, run) {
      return new Promise((resolve) => {
        const start = performance.now();
        const step = (now) => {
          if (run.stopped) return resolve();
          const t = Math.min(1, (now - start) / dur);
          this.place(edgeIndex, ease(t), reverse);
          if (t < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      });
    }

    async play(scene, run) {
      for (const op of scene) {
        if (run.stopped) return;
        if ("say" in op) this.say(op.say);
        if ("lit" in op) this.each("rect.card", (c, i) => { if (i === op.lit) c.classList.add("lit"); });
        if ("show" in op) { this.place(op.show, 0, false); this.each(".token", (t) => t.classList.add("on")); }
        if ("fail" in op) this.each(".token", (t) => t.classList.add("f"));
        if ("hide" in op) this.each(".token", (t) => t.classList.remove("on", "f"));
        if ("clear" in op) this.each("rect.card.lit", (c) => c.classList.remove("lit"));
        if ("edge" in op) await this.move(op.edge, Boolean(op.reverse), op.dur, run);
        if ("wait" in op) await this.wait(op.wait, run);
      }
    }

    start() {
      if (this.run || !this.scenes.length) return;
      const run = { stopped: false, timers: [] };
      this.run = run;
      (async () => {
        while (!run.stopped) {
          await this.play(this.scenes[this.next % this.scenes.length], run);
          this.next += 1;
        }
      })();
    }

    stop() {
      const run = this.run;
      if (!run) return;
      run.stopped = true;
      run.timers.forEach(clearTimeout);
      this.run = null;
      this.each(".token", (t) => t.classList.remove("on", "f"));
      this.each("rect.card.lit", (c) => c.classList.remove("lit"));
      this.say(this.idle);
    }
  }

  const demos = Array.from(document.querySelectorAll(".canvas[data-demo]")).map((el) => new Demo(el));
  const onScreen = new Set();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const demo = demos.find((d) => d.el === entry.target);
      if (!demo) return;
      if (entry.isIntersecting) { onScreen.add(demo); if (!document.hidden) demo.start(); }
      else { onScreen.delete(demo); demo.stop(); }
    });
  }, { threshold: 0.35 });

  demos.forEach((d) => observer.observe(d.el));

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) demos.forEach((d) => d.stop());
    else onScreen.forEach((d) => d.start());
  });
})();
