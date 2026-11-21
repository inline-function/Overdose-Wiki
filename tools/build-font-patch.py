#!/usr/bin/env python3
"""Build tiny fallback fonts for glyphs the shipped fonts don't cover.

Fusion Pixel 8/10/12 use the same 100-unit pixel grid but ship different
character sets (e.g. 10px lacks 晖/谵). Cubic 11 is Traditional-Chinese
oriented and lacks some simplified-only glyphs. For those gaps we
rasterize the nearest available pixel glyph into a matching-grid patch
font, so the browser never falls back to a system font.

Run after tools/subset-fonts.py: python tools/build-font-patch.py
"""

from pathlib import Path
import sys

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "fonts-src"
OUT = ROOT / "public" / "fonts"

SOURCES = {
    8: "fusion-pixel-8px-proportional-sc.woff2",
    10: "fusion-pixel-10px-proportional-sc.woff2",
    12: "fusion-pixel-12px-proportional-sc.woff2",
}

FUSION = {
    8: {"upem": 800, "ascent": 900, "descent": -300, "grid": 7, "x": 0, "y": -100, "advance": 800},
    10: {"upem": 1000, "ascent": 1200, "descent": -400, "grid": 9, "x": 0, "y": -100, "advance": 1000},
    12: {"upem": 1200, "ascent": 1400, "descent": -400, "grid": 11, "x": 0, "y": -100, "advance": 1200},
}

TARGETS = {
    "fusion-8": {**FUSION[8], "subset": "fusion-pixel-8-subset.woff2", "source": 8},
    "fusion-10": {**FUSION[10], "subset": "fusion-pixel-10-subset.woff2", "source": 8},
    "fusion-12": {**FUSION[12], "subset": "fusion-pixel-12-subset.woff2", "source": 12},
    "cubic-11": {
        "upem": 1200,
        "ascent": 1000,
        "descent": -400,
        "grid": 11,
        "x": 100,
        "y": -200,
        "advance": 1300,
        "subset": "cubic-11-subset.woff2",
        "source": 12,
    },
}


def runtime_chars() -> set[str]:
    chars = set()
    for path in (ROOT / "src").rglob("*"):
        if path.is_file() and path.suffix in {".ts", ".tsx", ".json", ".css"}:
            chars.update(path.read_text(encoding="utf-8"))
    allowed = set()
    for ch in chars:
        code = ord(ch)
        if ch.isspace():
            continue
        # emoji / symbols have no pixel outline to borrow; leave them to the OS.
        if code >= 0x1F000 or 0x2600 <= code <= 0x27BF or code == 0x274C:
            continue
        allowed.add(ch)
    return allowed


def expansion_chars() -> set[str]:
    charset = ROOT / "fonts-src" / "subset-chars.txt"
    if not charset.exists():
        return set()
    return {ch for ch in charset.read_text(encoding="utf-8") if not ch.isspace()}


_FONT_CACHE: dict[Path, tuple[TTFont, object, dict[int, str]]] = {}


def _font(path: Path):
    cached = _FONT_CACHE.get(path)
    if cached is None:
        font = TTFont(path)
        cached = (font, font.getGlyphSet(), font.getBestCmap() or {})
        _FONT_CACHE[path] = cached
    return cached


def cmap(path: Path) -> dict[int, str]:
    return _font(path)[2]


def contours(font_path: Path, char: str):
    font, glyph_set, cmap_table = _font(font_path)
    name = cmap_table[ord(char)]
    pen = RecordingPen()
    glyph_set[name].draw(pen)
    paths = []
    current = []
    for op, args in pen.value:
        if op == "moveTo":
            current = [args[0]]
        elif op == "lineTo":
            current.append(args[0])
        elif op == "closePath" and current:
            paths.append(current)
            current = []
        elif op == "qCurveTo":
            raise SystemExit(f"{char}: unexpected curve in pixel font")
    return paths


def rasterize(font_path: Path, char: str, grid: int, y_offset: int) -> list[list[bool]]:
    paths = contours(font_path, char)
    pixels = [[False] * grid for _ in range(grid)]
    for row in range(grid):
        cy = y_offset + row * 100 + 50
        for col in range(grid):
            cx = col * 100 + 50
            inside = False
            for path in paths:
                count = len(path)
                for index in range(count):
                    x1, y1 = path[index]
                    x2, y2 = path[(index + 1) % count]
                    if (y1 > cy) != (y2 > cy):
                        cross = (x2 - x1) * (cy - y1) / (y2 - y1) + x1
                        if cx < cross:
                            inside = not inside
            pixels[row][col] = inside
    return pixels


def resample(pixels: list[list[bool]], target_grid: int) -> list[list[bool]]:
    source_grid = len(pixels)
    if source_grid == target_grid:
        return pixels
    out = [[False] * target_grid for _ in range(target_grid)]
    for row in range(target_grid):
        source_row = int(row * (source_grid - 1) / (target_grid - 1) + 0.5)
        for col in range(target_grid):
            source_col = int(col * (source_grid - 1) / (target_grid - 1) + 0.5)
            out[row][col] = pixels[source_row][source_col]
    return out


def build_patch(key: str, config: dict, chars: set[str]) -> Path | None:
    if not chars:
        return None
    upem = config["upem"]
    grid = config["grid"]
    glyphs = {}
    metrics = {}
    cmap_map = {}

    notdef = TTGlyphPen(None)
    notdef.moveTo((0, 0))
    notdef.lineTo((0, config["ascent"]))
    notdef.lineTo((upem, config["ascent"]))
    notdef.lineTo((upem, 0))
    notdef.closePath()
    glyphs[".notdef"] = notdef.glyph()
    metrics[".notdef"] = (config["advance"], 0)

    made = 0
    for char in sorted(chars):
        code = ord(char)
        source = None
        for candidate in (config["source"], 12, 10, 8):
            font_path = SRC / SOURCES[candidate]
            if code in cmap(font_path):
                source = font_path
                break
        if source is None:
            continue
        source_grid = candidate - 1
        pixels = resample(
            rasterize(source, char, source_grid, -100),
            grid,
        )
        pen = TTGlyphPen(None)
        for row, line in enumerate(pixels):
            col = 0
            while col < len(line):
                if not line[col]:
                    col += 1
                    continue
                end = col
                while end < len(line) and line[end]:
                    end += 1
                x0 = config["x"] + col * 100
                x1 = config["x"] + end * 100
                y0 = config["y"] + row * 100
                y1 = y0 + 100
                pen.moveTo((x0, y0))
                pen.lineTo((x1, y0))
                pen.lineTo((x1, y1))
                pen.lineTo((x0, y1))
                pen.closePath()
                col = end
        name = f"u{code:04X}"
        glyphs[name] = pen.glyph()
        metrics[name] = (config["advance"], 0)
        cmap_map[code] = name
        made += 1

    if not made:
        return None

    fb = FontBuilder(upem, isTTF=True)
    fb.setupGlyphOrder([".notdef", *sorted(set(cmap_map.values()))])
    fb.setupCharacterMap(cmap_map)
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=config["ascent"], descent=config["descent"])
    family = key.replace("fusion-", "Fusion Pixel ").replace("cubic-", "Cubic ") + " Patch"
    fb.setupNameTable(
        {
            "familyName": family,
            "styleName": "Regular",
            "uniqueFontIdentifier": family.replace(" ", "") + "-Regular",
            "fullName": family,
            "psName": family.replace(" ", "") + "-Regular",
            "version": "Version 1.0",
        }
    )
    fb.setupOS2(
        sTypoAscender=config["ascent"],
        sTypoDescender=config["descent"],
        sTypoLineGap=0,
        usWinAscent=config["ascent"],
        usWinDescent=-config["descent"],
    )
    fb.setupPost()
    target = OUT / f"{key}-patch.woff2"
    fb.font.flavor = "woff2"
    fb.save(target)
    print(f"{target.name}: {made} glyphs, {target.stat().st_size / 1024:.1f} KiB")
    return target


def main() -> int:
    chars = runtime_chars()
    expansion = expansion_chars()
    unresolved = False
    for key, config in TARGETS.items():
        subset = OUT / config["subset"]
        have = set(cmap(subset))
        pool = chars | expansion
        missing = {ch for ch in pool if ord(ch) not in have}
        patch = build_patch(key, config, missing)
        if patch is None:
            if missing:
                print(f"{key}: no patch ({len(missing)} unresolved)")
                unresolved = True
            else:
                stale = OUT / f"{key}-patch.woff2"
                if stale.exists():
                    stale.unlink()
                print(f"{key}: complete")
        else:
            print(f"{key}: {len(missing)} missing -> {patch.name}")
    return 1 if unresolved else 0


if __name__ == "__main__":
    sys.exit(main())