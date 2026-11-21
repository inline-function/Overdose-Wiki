#!/usr/bin/env python3
"""Downscale a generated illustration to game resolution and quantize to the 24-color palette."""

import argparse
from pathlib import Path

from PIL import Image, ImageFilter

PALETTE = [
    "#0b0a10", "#17151f", "#2b2735", "#e8e0cc", "#d6ccb4", "#f3ead8",
    "#5a5448", "#8c8270", "#a62b20", "#721a14", "#f2d9cf", "#2f4f8f",
    "#4a6fa5", "#3f6b3f", "#d9a441", "#f0c866", "#1b2a3a", "#27445a",
    "#8fa8b8", "#d8b89a", "#2a2a32", "#4a4a55", "#e8c87a", "#5b8fa8",
    "#d98f9b", "#9c4f5e", "#7f9a6b", "#4f6b4a",
]


def palette_image() -> Image.Image:
    flat = []
    for hex_color in PALETTE:
        flat.extend(int(hex_color[i:i + 2], 16) for i in (1, 3, 5))
    flat.extend([0, 0, 0] * (256 - len(PALETTE)))
    pal = Image.new("P", (1, 1))
    pal.putpalette(flat)
    return pal


def key_out(img: Image.Image, hex_color: str, tolerance: int) -> Image.Image:
    rgb = img.convert("RGB")
    key = tuple(int(hex_color[i:i + 2], 16) for i in (1, 3, 5))

    def distance(px):
        return abs(px[0] - key[0]) + abs(px[1] - key[1]) + abs(px[2] - key[2])

    alpha = Image.new("L", rgb.size, 255)
    alpha.putdata([0 if distance(px) <= tolerance else 255 for px in rgb.getdata()])
    alpha = alpha.filter(ImageFilter.MinFilter(5))
    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out


def key_magenta(img: Image.Image) -> Image.Image:
    """Key a noisy magenta backdrop: high red/blue, low green."""
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


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--in", dest="src", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--width", type=int, required=True)
    parser.add_argument("--height", type=int, required=True)
    parser.add_argument("--key", help="hex color to make transparent, e.g. #ff00ff")
    parser.add_argument("--magenta", action="store_true", help="key a noisy magenta backdrop")
    parser.add_argument("--tolerance", type=int, default=90)
    parser.add_argument("--crop", help="x,y,w,h in source pixels")
    parser.add_argument("--dither", action="store_true")
    parser.add_argument(
        "--gamma",
        type=float,
        default=1.0,
        help="gamma applied before quantizing; <1 lifts shadows (night scenes)",
    )
    parser.add_argument("--preview", help="optional 3x nearest-neighbor preview path")
    args = parser.parse_args()

    img = Image.open(args.src).convert("RGB")
    if args.crop:
        x, y, w, h = (int(value) for value in args.crop.split(","))
        img = img.crop((x, y, x + w, y + h))
    if args.magenta:
        img = key_magenta(img)
    elif args.key:
        img = key_out(img, args.key, args.tolerance)
    img = img.resize((args.width, args.height), Image.Resampling.LANCZOS)
    has_alpha = img.mode == "RGBA"
    if has_alpha:
        alpha = img.getchannel("A").point(lambda a: 255 if a >= 128 else 0)
    rgb = img.convert("RGB")
    if args.gamma != 1.0:
        table = [min(255, round(255 * ((value / 255) ** args.gamma))) for value in range(256)]
        rgb = rgb.point(table * 3)
    quant = rgb.quantize(
        palette=palette_image(),
        dither=Image.Dither.FLOYDSTEINBERG if args.dither else Image.Dither.NONE,
    ).convert("RGB")
    if has_alpha:
        out = quant.convert("RGBA")
        out.putalpha(alpha)
    else:
        out = quant
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    out.save(args.out, optimize=True)

    if args.preview:
        preview = out.resize((args.width * 3, args.height * 3), Image.Resampling.NEAREST)
        preview.save(args.preview)

    colors = {px for px in out.convert("RGB").getdata()}
    print(f"ok {args.out} {args.width}x{args.height} colors={len(colors)}")


if __name__ == "__main__":
    main()