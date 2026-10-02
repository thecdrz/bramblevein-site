"use strict";
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
