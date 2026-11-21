#!/usr/bin/env python3
"""Regenerate the shipped pixel-font subsets from fonts-src.

Run after adding story text: python tools/subset-fonts.py
The full OFL fonts stay in fonts-src; only the subsets ship.
"""

from pathlib import Path
import subprocess
import sys

from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "fonts-src"
OUT = ROOT / "public" / "fonts"
CHARSET = SRC / "subset-chars.txt"

FONTS = [
    ("fusion-pixel-8px-proportional-sc.woff2", "fusion-pixel-8-subset.woff2"),
    ("fusion-pixel-10px-proportional-sc.woff2", "fusion-pixel-10-subset.woff2"),
    ("fusion-pixel-12px-proportional-sc.woff2", "fusion-pixel-12-subset.woff2"),
    ("cubic-11.woff2", "cubic-11-subset.woff2"),
]

def gb2312_chars() -> str:
    """Common simplified Chinese (GB2312 level 1+2), so new prose stays pixel-font."""
    chars = []
    for high in range(0xB0, 0xF8):
        for low in range(0xA1, 0xFF):
            try:
                chars.append(bytes((high, low)).decode("gb2312"))
            except UnicodeDecodeError:
                pass
    return "".join(chars)


EXTRA = (
    "".join(chr(code) for code in range(32, 127))
    + gb2312_chars()
    + "　、。，．・：；？！゛゜´｀¨＾￣＿ヽヾゝゞ〃仝々〆〇ー―‐／＼～∥｜…‥‘’“”"
    + "（）〔〕［］｛｝〈〉《》「」『』【】＋－±×÷＝≠＜＞≦≧∞∴♂♀°′″℃￥＄￠￡％＃＆＊＠"
    + "§☆★○●◎◇◆□■△▲▽▼※〒→←↑↓〓█▌▐░▒▓"
)


def collect_chars() -> str:
    chars = set(EXTRA)
    roots = [ROOT / "src", ROOT.parent / "重写文本"]
    suffixes = {".ts", ".tsx", ".json", ".css", ".html", ".md"}
    for root in roots:
        if not root.exists():
            continue
        for path in root.rglob("*"):
            if path.is_file() and path.suffix in suffixes:
                chars.update(path.read_text(encoding="utf-8"))
    chars.difference_update({"\r", "\n", "\t", "\u200b", "\ufeff"})
    return "".join(sorted(chars))


def cmap(path: Path) -> set[int]:
    font = TTFont(path)
    codes = set()
    for table in font["cmap"].tables:
        codes.update(table.cmap.keys())
    return codes


def main() -> int:
    text = collect_chars()
    CHARSET.write_text(text + "\n", encoding="utf-8")
    print(f"charset: {len(text)} characters -> {CHARSET.relative_to(ROOT)}")

    for source, target in FONTS:
        src = SRC / source
        dst = OUT / target
        subprocess.run(
            [
                sys.executable,
                "-m",
                "fontTools.subset",
                str(src),
                f"--text-file={CHARSET}",
                f"--output-file={dst}",
                "--flavor=woff2",
                "--layout-features=*",
            ],
            check=True,
        )
        missing = sorted(chr(code) for code in map(ord, text) if code not in cmap(dst))
        size = dst.stat().st_size
        print(f"{target}: {size / 1024:.1f} KiB, missing {len(missing)}")
        if missing:
            print("  " + "".join(missing[:80]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())