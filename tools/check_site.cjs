const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.argv[2] || "http://127.0.0.1:8765/";
const output = path.resolve(__dirname, "../.preview");
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
  });
  try {
    for (const [name, width, height] of [
      ["desktop", 1440, 1000],
      ["mobile", 390, 844],
      ["narrow", 320, 740],
      ["tablet", 768, 1024],
      ["wide", 1920, 1080],
    ]) {
      const page = await browser.newPage({
        viewport: { width, height },
        reducedMotion: "reduce",
      });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("response", (response) => {
        if (response.status() >= 400)
          errors.push(`${response.status()} ${response.url()}`);
      });
      await page.goto(base, { waitUntil: "networkidle" });
      for (const img of await page.locator('img[loading="lazy"]').all()) {
        await img.scrollIntoViewIfNeeded();
      }
      await page.waitForFunction(() =>
        [...document.querySelectorAll("img[src]")].every(
          (img) => img.complete && img.naturalWidth > 0,
        ),
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        `${name}: horizontal overflow`,
      );
      await page.screenshot({
        path: path.join(output, `${name}-full.png`),
        fullPage: true,
      });
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: path.join(output, `${name}-hero.png`) });
      const opener = page.locator(".gallery-link").first();
      await opener.click();
      await page.waitForFunction(() => document.querySelector("dialog").open);
      assert.match(
        await page.locator(".lightbox-caption").innerText(),
        /HUD hidden/,
      );
      assert.ok(await page.locator(".lightbox img").getAttribute("alt"));
      await page.keyboard.press("Escape");
      assert.equal(
        await page.locator("dialog").evaluate((dialog) => dialog.open),
        false,
      );
      assert.equal(
        await opener.evaluate((element) => document.activeElement === element),
        true,
      );
      await opener.press("Enter");
      await page.getByRole("button", { name: "Close screenshot" }).click();
      assert.equal(
        await page.locator(".world-section,.faq-section").count(),
        0,
      );
      assert.equal(
        await page.locator(".feature-grid .gallery-link").count(),
        6,
      );
      assert.equal(await page.locator(".motion-toggle").isVisible(), false);
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForFunction(
        () => document.querySelector(".hero").dataset.ambience === "playing",
      );
      if (name === "desktop") {
        const before = await page.locator(".hero").screenshot();
        await page.waitForTimeout(350);
        const after = await page.locator(".hero").screenshot();
        assert.equal(
          before.equals(after),
          false,
          "Hero animation must change visible rendered pixels",
        );
      }
      await page.getByRole("button", { name: "Pause ambience" }).click();
      assert.equal(
        await page.locator(".hero").getAttribute("data-ambience"),
        "paused",
      );
      const pausedCanvas = await page
        .locator("canvas")
        .evaluate((canvas) => canvas.toDataURL());
      await page.waitForTimeout(120);
      assert.equal(
        await page.locator("canvas").evaluate((canvas) => canvas.toDataURL()),
        pausedCanvas,
        "Paused ambience must freeze",
      );
      await page.getByRole("button", { name: "Resume ambience" }).click();
      assert.equal(
        await page.locator(".hero").getAttribute("data-ambience"),
        "playing",
      );
      await page.locator("#gallery").scrollIntoViewIfNeeded();
      await page.waitForFunction(
        () => document.querySelector(".hero").dataset.ambience === "paused",
      );
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForFunction(
        () => document.querySelector(".hero").dataset.ambience === "playing",
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.waitForFunction(
        () => document.querySelector(".hero").dataset.ambience === "paused",
      );
      await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      await page.locator('.actions a[href="#gallery"]').click();
      assert.equal(new URL(page.url()).hash, "#gallery");
      assert.equal(await page.locator("h1").count(), 1);
      assert.equal(await page.locator("img:not([alt])").count(), 0);
      assert.deepEqual(errors, [], `${name}: browser or network errors`);
      console.log(
        `PASS ${name} ${width}x${height}: images, overflow, navigation, keyboard lightbox, ambience/reduced motion`,
      );
      await page.close();
    }
    const fallback = await browser.newPage({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
    });
    await fallback.goto(base);
    // Windows Python may serve WebP as an attachment; Pages serves image/webp.
    // Both are a usable non-JS fallback to the original full-size asset.
    const destination = Promise.any([
      fallback.waitForEvent("download").then((download) => download.url()),
      fallback
        .waitForURL("**/world-home-night.webp")
        .then(() => fallback.url()),
    ]);
    await fallback.locator(".gallery-link").first().click();
    assert.match(await destination, /world-home-night.webp$/);
    await fallback.close();
    console.log("PASS no-JavaScript gallery fallback");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
