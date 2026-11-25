#!/usr/bin/env python3
"""Downscale the AI hallucination-cloud art to the 256x256 enemy portrait slot.
Keeps the rich multicolor palette (no quantize) for the psychedelic look.
"""
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
raw = Image.open(ROOT / "art/enemy08_raw.png").convert("RGB")
out = raw.resize((256, 256), Image.Resampling.NEAREST)
out.save(ROOT / "public/assets-private/dlc/enemy-08.png")
out.resize((512, 512), Image.Resampling.NEAREST).save(ROOT / "art/enemy08_preview.png")
print("enemy-08 replaced with hallucination cloud")
