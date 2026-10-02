"""Optimize existing game artwork and honest, HUD-hidden gameplay captures for the site."""
import argparse
import json
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument("game_root", type=Path)
args = parser.parse_args()
output = Path(__file__).resolve().parents[1] / "website/images/current"
output.mkdir(parents=True, exist_ok=True)
sources = {
    "hero-valley": ("assets/art/ui/loading-valley-v2.png", 1672, "Title-screen artwork"),
    "wordmark": ("assets/art/ui/bramblevein-wordmark-v2.png", 1600, "Game wordmark"),
    "scene-coast": ("assets/art/ui/loading-sunroot-coast-v1.png", 960, "Loading-screen artwork"),
    "scene-rime": ("assets/art/ui/loading-rimewatch-v1.png", 960, "Loading-screen artwork"),
    "scene-deep": ("assets/art/ui/loading-emberdeep-v1.png", 960, "Loading-screen artwork"),
    "gameplay-home": ("tests/artifacts/website-overhaul/home.png", 1280, "In-game capture, HUD hidden"),
    "gameplay-village": ("tests/artifacts/website-overhaul/village.png", 1280, "In-game capture, HUD hidden"),
    "gameplay-cave": ("tests/artifacts/website-overhaul/cave.png", 1280, "In-game capture, HUD hidden"),
}
manifest = []
for name, (relative, width, kind) in sources.items():
    with Image.open(args.game_root / relative) as source:
        picture = source.convert("RGBA" if name == "wordmark" else "RGB")
        if name == "wordmark":
            picture = picture.crop(picture.getchannel("A").getbbox())
        picture.thumbnail((width, 2000), Image.Resampling.LANCZOS)
        target = output / f"{name}.webp"
        picture.save(target, "WEBP", quality=88, method=6)
        manifest.append({"file": target.name, "source": relative, "kind": kind, "width": picture.width, "height": picture.height})
        print(f"{target.name}: {picture.width}x{picture.height}, {target.stat().st_size:,} bytes")
with Image.open(args.game_root / "assets/branding/bramblevein-overhaul.png") as source:
    source.convert("RGBA").resize((64, 64), Image.Resampling.LANCZOS).save(output / "favicon.png")
(output / "manifest.json").write_text(json.dumps({"game_commit": "82b78941e8c70ffed51a6eb95370a0a26c105aaf", "assets": manifest}, indent=2) + "\n", encoding="utf-8")
