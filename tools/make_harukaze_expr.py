#!/usr/bin/env python3
"""Process all 8 Harukaze expression variants into prop busts.
Detects each star-head center (postures vary) and emits a TS meta module
for positioning the shared star FX. Builds a 4x2 contact sheet.
"""
from pathlib import Path
from PIL import Image
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from pixelize import key_magenta, palette_image
ROOT = Path(__file__).resolve().parents[1]
W, H = 128, 192
MOODS = ["calm", "smile", "intense", "tired", "sad", "restless", "blank", "hurt"]
meta = []
sheet = Image.new("RGBA", (W * 2 * 4, H * 2 * 2), (20, 18, 28, 255))
for i, m in enumerate(MOODS):
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
    ox, oy = (W - tw) // 2, (H - th) // 2
    canvas.paste(fine, (ox, oy), fine)
    canvas.save(ROOT / f"public/assets/props/prop_harukaze_{m}.png")
    # star-head center: centroid of opaque pixels in the top band
    px = canvas.load()
    xs, ys, n = 0, 0, 0
    for y in range(0, 60):
        for x in range(W):
            if px[x, y][3] > 0:
                xs += x; ys += y; n += 1
    cx, cy = (xs / n if n else W / 2), (ys / n if n else 24)
    meta.append((m, round(cx, 1), round(cy, 1)))
    big = canvas.resize((W * 2, H * 2), Image.Resampling.NEAREST)
    sheet.paste(big, ((i % 4) * W * 2, (i // 4) * H * 2), big)
sheet.save(ROOT / "art/expr_contact8.png")
lines = ["// 自动生成：春风8态差分星头中心（128x192 坐标），供共享 FX 定位。",
         "export const HARUKAZE_EXPR_HEAD: Record<string, { x: number; y: number }> = {"]
for m, cx, cy in meta:
    lines.append(f"  {m}: {{ x: {cx}, y: {cy} }},")
lines.append("};")
(ROOT / "src/dlc/harukazeExpr.ts").write_text("\n".join(lines) + "\n", encoding="utf-8")
print("8 expr props + meta written")
