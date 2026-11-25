#!/usr/bin/env python3
"""Process Harukaze expression variants into 128x192 prop busts + contact sheet."""
from pathlib import Path
from PIL import Image
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from pixelize import key_magenta, palette_image
ROOT = Path(__file__).resolve().parents[1]
W, H = 128, 192
moods = ["calm", "smile", "intense"]
sheet = Image.new("RGBA", (W * 3 * 2, H * 2), (20, 18, 28, 255))
for i, m in enumerate(moods):
    raw = Image.open(ROOT / f"art/expr_{m}_raw.png").convert("RGB")
    keyed = key_magenta(raw)
    crop = keyed.crop(keyed.getchannel("A").getbbox())
    scale = min((W - 4) / crop.width, (H - 4) / crop.height)
    tw, th = max(1, round(crop.width * scale)), max(1, round(crop.height * scale))
    small = crop.resize((tw, th), Image.Resampling.LANCZOS)
    alpha = small.getchannel("A").point(lambda a: 255 if a >= 128 else 0)
    rgb = small.convert("RGB").quantize(palette=palette_image(), dither=Image.Dither.NONE).convert("RGB")
    fine = rgb.convert("RGBA"); fine.putalpha(alpha)
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    canvas.paste(fine, ((W - tw) // 2, (H - th) // 2), fine)
    canvas.save(ROOT / f"public/assets/props/prop_harukaze_{m}.png")
    sheet.paste(canvas.resize((W * 2, H * 2), Image.Resampling.NEAREST), (i * W * 2, 0), canvas.resize((W * 2, H * 2), Image.Resampling.NEAREST))
sheet.save(ROOT / "art/expr_contact.png")
print("expr props written:", moods)
