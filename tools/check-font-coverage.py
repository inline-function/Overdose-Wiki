#!/usr/bin/env python3
"""Report characters used by the game that no pixel font/patch covers."""
from pathlib import Path
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
FACES = {
    "fusion-8": ["fusion-pixel-8-subset.woff2", "fusion-8-patch.woff2"],
    "fusion-10": ["fusion-pixel-10-subset.woff2", "fusion-10-patch.woff2"],
    "fusion-12": ["fusion-pixel-12-subset.woff2", "fusion-12-patch.woff2"],
    "cubic-11": ["cubic-11-subset.woff2", "cubic-11-patch.woff2"],
}

def used_chars() -> set[str]:
    chars = set()
    for root in (ROOT / "src", ROOT.parent / "重写文本"):
        if not root.exists():
            continue
        for path in root.rglob("*"):
            if path.is_file() and path.suffix in {".ts", ".tsx", ".json", ".css", ".html", ".md"}:
                chars.update(path.read_text(encoding="utf-8"))
    return {
        ch
        for ch in chars
        if not ch.isspace()
        and ord(ch) < 0x1F000
        and not (0x2600 <= ord(ch) <= 0x27BF)
    }

def cmap(path: Path) -> set[int]:
    return set((TTFont(path).getBestCmap() or {}).keys())

def main() -> int:
    chars = used_chars()
    failed = False
    for name, files in FACES.items():
        covered = set()
        for file in files:
            path = ROOT / "public" / "fonts" / file
            if path.exists():
                covered |= cmap(path)
        missing = sorted(ch for ch in chars if ord(ch) not in covered)
        print(f"{name}: {len(missing)} missing")
        if missing:
            failed = True
            print("  " + "".join(missing[:160]))
    return 1 if failed else 0

if __name__ == "__main__":
    raise SystemExit(main())
