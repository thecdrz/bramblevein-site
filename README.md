# Bramblevein showcase

The static showcase deployed to <https://thecdrz.github.io/bramblevein-site/>.
The source of the live site is this repository's `website/` directory. Pushes
to `main` affecting that directory trigger the existing GitHub Pages workflow.

## Preview

Serve `website/` with any static server, for example:

```sh
python -m http.server 8765 --directory website
```

## Assets

The site uses the current game wordmark, title/loading artwork, and actual
development-build screenshots. Artwork is labelled separately from gameplay.
Gameplay captures hide only the HUD; they are not AI-generated or retouched.
`website/images/current/manifest.json` records source assets and the game commit.
Optimized WebP assets are committed so deployment needs no build step.

To regenerate with Pillow installed and the game checkout/captures available:

```sh
python tools/prepare_assets.py ../Bramblevein
```

## Browser checks

With Playwright installed and the preview server running:

```sh
node tools/check_site.cjs http://127.0.0.1:8765/
```

Optional `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` environment variables select
an existing Playwright installation/browser. Tests cover desktop, mobile,
narrow phone, tablet, and wide desktop layouts; loaded images; overflow;
keyboard lightbox/focus restoration; navigation; FAQ; and no-JavaScript fallback.
Screenshots are written to the ignored `.preview/` directory.

Copy intentionally describes an in-development Windows playtest, not a final
release. Development screenshots may differ from the public itch.io build.
