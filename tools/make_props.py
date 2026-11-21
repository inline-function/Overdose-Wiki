#!/usr/bin/env python3
"""Turn generated prop art into 64x64 transparent pixel sprites."""

from pathlib import Path

from PIL import Image, ImageFilter

PALETTE = [
    "#0b0a10", "#17151f", "#2b2735", "#e8e0cc", "#d6ccb4", "#f3ead8",
    "#5a5448", "#8c8270", "#a62b20", "#721a14", "#f2d9cf", "#2f4f8f",
    "#4a6fa5", "#3f6b3f", "#d9a441", "#f0c866", "#1b2a3a", "#27445a",
    "#8fa8b8", "#d8b89a", "#2a2a32", "#4a4a55", "#e8c87a", "#5b8fa8",
    "#d98f9b", "#9c4f5e", "#7f9a6b", "#4f6b4a",
    "#f4a3b6", "#e0708a", "#c2506b", "#8c3a4e",
]


def palette_image() -> Image.Image:
    flat = []
    for hex_color in PALETTE:
        flat.extend(int(hex_color[i:i + 2], 16) for i in (1, 3, 5))
    flat.extend([0, 0, 0] * (256 - len(PALETTE)))
    pal = Image.new("P", (1, 1))
    pal.putpalette(flat)
    return pal


def key_magenta(img: Image.Image) -> Image.Image:
    rgb = img.convert("RGB")

    def is_magenta(px):
        r, g, b = px
        return g < 135 and r > 150 and b > 120 and (r - g) > 75 and (b - g) > 60

    alpha = Image.new("L", rgb.size, 255)
    alpha.putdata([0 if is_magenta(px) else 255 for px in rgb.getdata()])
    alpha = alpha.filter(ImageFilter.MinFilter(5))
    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out


def sprite(img: Image.Image, size: int = 64, margin: int = 2) -> Image.Image:
    keyed = key_magenta(img)
    bbox = keyed.getchannel("A").getbbox()
    if bbox:
        keyed = keyed.crop(bbox)
    inner = size - margin * 2
    scale = min(inner / keyed.width, inner / keyed.height)
    target = (max(1, round(keyed.width * scale)), max(1, round(keyed.height * scale)))
    keyed = keyed.resize(target, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(keyed, ((size - target[0]) // 2, (size - target[1]) // 2), keyed)

    rgb = canvas.convert("RGB")
    quant = rgb.quantize(palette=palette_image(), dither=Image.Dither.NONE).convert("RGBA")
    quant.putalpha(canvas.getchannel("A").point(lambda a: 255 if a >= 128 else 0))
    return quant


def main() -> None:
    out_dir = Path("public/assets/props")
    out_dir.mkdir(parents=True, exist_ok=True)

    for name in ("goto", "higan", "harukaze"):
        img = Image.open(f"art/qwen/prop_{name}_raw.png").convert("RGB")
        sprite(img).save(out_dir / f"prop_{name}.png", optimize=True)
        print("ok", f"prop_{name}.png")

    cat = Image.open("art/qwen/prop_caijia_raw.png").convert("RGB")
    w, h = cat.size
    cells = {
        "smile": (0, 0, w // 2, h // 2),
        "sleepy": (w // 2, 0, w, h // 2),
        "hype": (0, h // 2, w // 2, h),
        "blank": (w // 2, h // 2, w, h),
    }
    for state, box in cells.items():
        sprite(cat.crop(box)).save(out_dir / f"prop_caijia_{state}.png", optimize=True)
        print("ok", f"prop_caijia_{state}.png")


if __name__ == "__main__":
    main()