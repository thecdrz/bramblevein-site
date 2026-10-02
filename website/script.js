"use strict";
// Register light to the valley artwork; never move the landscape or the copy.
const hero = document.querySelector(".hero");
const canvas = document.querySelector(".hero-ambience");
const motionButton = document.querySelector(".motion-toggle");
const context = canvas?.getContext("2d");
if (hero && context && motionButton) {
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  let paused = false,
    visible = false,
    frame = 0,
    last = 0,
    elapsed = 0;
  function glow(x, y, radius, alpha) {
    const fill = context.createRadialGradient(x, y, 0, x, y, radius);
    fill.addColorStop(0, `rgba(255,190,93,${alpha})`);
    fill.addColorStop(1, "rgba(255,170,65,0)");
    context.fillStyle = fill;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  function draw(now) {
    frame = requestAnimationFrame(draw);
    if (now - last < 50) return;
    elapsed += Math.min((now - last) / 1000, 0.1);
    last = now;
    const width = hero.clientWidth,
      height = hero.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    context.clearRect(0, 0, width, height);
    const scale = Math.max(width / 1672, height / 941);
    // Match the image's cover positioning at each responsive breakpoint.
    const ox = (width - 1672 * scale) * (width <= 700 ? 0.59 : 0.5);
    const oy = (height - 941 * scale) * (width <= 700 ? 0.5 : 0.45);
    context.save();
    context.translate(ox, oy);
    context.scale(scale, scale);
    [
      [649, 695],
      [927, 695],
      [1183, 644],
      [1347, 647],
      [1516, 597],
      [1560, 340],
    ].forEach(([x, y], i) => {
      glow(x, y, 46, 0.16 + Math.sin(elapsed * 2.3 + i) * 0.055);
    });
    for (let i = 0; i < 10; i++) {
      const x = 800 + i * 32 + Math.sin(elapsed * 0.12 + i * 1.7) * 12;
      const y = 479 + Math.sin(i * 2.3) * 18 + Math.sin(elapsed * 0.25 + i) * 3;
      const alpha =
        Math.pow(Math.max(0, Math.sin(elapsed * 0.9 + i * 2.1)), 3) * 0.55;
      glow(x, y, 7, alpha * 0.4);
      context.fillStyle = `rgba(240,223,146,${alpha})`;
      context.fillRect(x, y, 2, 1.4);
    }
    // A soft chimney plume, registered to the painted cottage roof.
    for (let i = 0; i < 7; i++) {
      const age = (elapsed * 0.16 + i / 7) % 1;
      const x = 1572 + age * 36 + Math.sin(age * 7 + elapsed * 0.3) * age * 12;
      const y = 164 - age * 125;
      const r = 9 + age * 22;
      const mist = context.createRadialGradient(x, y, 0, x, y, r);
      mist.addColorStop(
        0,
        `rgba(219,215,204,${Math.sin(age * Math.PI) * 0.14})`,
      );
      mist.addColorStop(1, "rgba(219,215,204,0)");
      context.fillStyle = mist;
      context.fillRect(x - r, y - r, r * 2, r * 2);
    }
    context.restore();
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    motionButton.hidden = preference.matches;
    if (preference.matches)
      context.clearRect(0, 0, canvas.width, canvas.height);
    if (!paused && !preference.matches && visible && !document.hidden) {
      last = performance.now();
      frame = requestAnimationFrame(draw);
    }
    hero.dataset.ambience = frame ? "playing" : "paused";
  }
  motionButton.addEventListener("click", () => {
    paused = !paused;
    motionButton.textContent = paused ? "Resume ambience" : "Pause ambience";
    motionButton.setAttribute("aria-pressed", String(paused));
    sync();
  });
  preference.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }).observe(hero);
}
const lightbox = document.querySelector(".lightbox");
if (lightbox && typeof lightbox.showModal === "function") {
  const image = lightbox.querySelector("img");
  const caption = lightbox.querySelector(".lightbox-caption");
  let opener;
  document.querySelectorAll(".gallery-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
        return;
      event.preventDefault();
      opener = link;
      image.src = link.href;
      image.alt = link.querySelector("img").alt;
      caption.textContent = link.dataset.caption;
      lightbox.showModal();
    });
  });
  lightbox
    .querySelector("button")
    .addEventListener("click", () => lightbox.close());
  lightbox.addEventListener("click", (event) => {
    const bounds = lightbox.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      lightbox.close();
  });
  lightbox.addEventListener("close", () =>
    opener?.focus({ preventScroll: true }),
  );
}
