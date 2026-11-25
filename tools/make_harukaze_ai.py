#!/usr/bin/env python3
"""Process the AI-generated youthful Harukaze into fine 128x192 pixel layers.
Keys magenta, fits aspect into 128x192, quantizes to the game palette,
splits head/body at the neck (overlap to hide the seam) for layered animation.
"""
from pathlib import Path
from PIL import Image
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from pixelize import key_magenta, palette_image

ROOT = Path(__file__).resolve().parents[1]
raw = Image.open(ROOT / "art/harukaze_ai_raw.png").convert("RGB")
keyed = key_magenta(raw)
bbox = keyed.getchannel("A").getbbox()
crop = keyed.crop(bbox)
W, H = 128, 192
scale = min((W - 4) / crop.width, (H - 4) / crop.height)
tw, th = max(1, round(crop.width * scale)), max(1, round(crop.height * scale))
small = crop.resize((tw, th), Image.Resampling.LANCZOS)
alpha = small.getchannel("A").point(lambda a: 255 if a >= 128 else 0)
rgb = small.convert("RGB").quantize(palette=palette_image(), dither=Image.Dither.NONE).convert("RGB")
fine = rgb.convert("RGBA"); fine.putalpha(alpha)
canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
canvas.paste(fine, ((W - tw) // 2, (H - th) // 2), fine)

OUT = ROOT / "public/assets-private/dlc"
canvas.save(OUT / "harukaze_student.png")
# head / body split (overlap at neck)
head_cut, body_start = 48, 42
head = Image.new("RGBA", (W, H), (0, 0, 0, 0)); head.paste(canvas.crop((0, 0, W, head_cut)), (0, 0))
body = Image.new("RGBA", (W, H), (0, 0, 0, 0)); body.paste(canvas.crop((0, body_start, W, H)), (0, body_start))
head.save(OUT / "harukaze_head.png")
body.save(OUT / "harukaze_body.png")
canvas.resize((256, 384), Image.Resampling.NEAREST).save(ROOT / "art/harukaze_fine_preview.png")
print("fine layers written; char size", tw, th)
