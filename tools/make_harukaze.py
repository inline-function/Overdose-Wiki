#!/usr/bin/env python3
"""Hand-drawn layered pixel sprite of Harukaze: 16yo genius pharmacist.
Betelgeuse star head (faceless) + school uniform + short open lab coat + 74 badge + vial.
Layers: legs / body / coat / arm / head -> 128x192 transparent PNGs (64x96 grid x2).
"""
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parents[1] / "public/assets-private/dlc"
W, H = 64, 96
C = {
    "ink": "#17151f", "ink2": "#2b2735", "void": "#0b0a10",
    "paper3": "#f3ead8", "paper": "#e8e0cc", "paper2": "#d6ccb4",
    "muted": "#5a5448", "line": "#8c8270",
    "red": "#a62b20", "reddeep": "#721a14",
    "night": "#1b2a3a", "night2": "#27445a",
    "skin": "#d8b89a", "hair": "#2a2a32",
    "yellow": "#d9a441", "yellow2": "#f0c866", "sun": "#e8c87a",
    "river": "#5b8fa8", "sky": "#8fa8b8",
}
def rgb(h): return tuple(int(h[i:i+2], 16) for i in (1, 3, 5)) + (255,)

def new(): return Image.new("RGBA", (W, H), (0, 0, 0, 0))
def rect(img, x0, y0, x1, y1, col):
    for y in range(y0, y1):
        for x in range(x0, x1):
            if 0 <= x < W and 0 <= y < H: img.putpixel((x, y), rgb(col))
def px(img, x, y, col):
    if 0 <= x < W and 0 <= y < H: img.putpixel((x, y), rgb(col))
def disc(img, cx, cy, r, col):
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r * r: px(img, x, y, col)

# ---- HEAD: Betelgeuse star ball + corona spikes ----
head = new()
disc(head, 32, 16, 11, C["red"])
disc(head, 32, 16, 11, C["red"])  # base
# edge shade
for y in range(5, 28):
    for x in range(21, 44):
        d = (x - 32) ** 2 + (y - 16) ** 2
        if 90 < d <= 121: px(head, x, y, C["reddeep"])
# hot core highlight
disc(head, 29, 13, 4, C["sun"])
disc(head, 28, 12, 2, C["yellow2"])
# corona spikes
for (x, y) in [(32, 3), (32, 4), (20, 8), (19, 9), (44, 8), (45, 9), (24, 26), (40, 26), (32, 28), (18, 16), (46, 16)]:
    px(head, x, y, C["yellow2"])
for (x, y) in [(32, 2), (17, 16), (47, 16), (22, 5), (42, 5)]:
    px(head, x, y, C["sun"])

# ---- LEGS: slim teen trousers + shoes ----
legs = new()
rect(legs, 26, 64, 31, 88, C["hair"])
rect(legs, 33, 64, 38, 88, C["hair"])
rect(legs, 27, 64, 28, 88, C["ink2"])  # shade
rect(legs, 34, 64, 35, 88, C["ink2"])
rect(legs, 24, 88, 31, 92, C["ink"])
rect(legs, 33, 88, 40, 92, C["ink"])
rect(legs, 24, 90, 31, 92, C["void"])
rect(legs, 33, 90, 40, 92, C["void"])

# ---- BODY: uniform torso + open coat upper + left arm + badge ----
body = new()
rect(body, 18, 31, 46, 34, C["paper3"])          # shoulders
rect(body, 24, 31, 40, 60, C["night"])           # gakuran torso
rect(body, 24, 31, 26, 60, C["night2"])          # torso shade
rect(body, 30, 31, 34, 35, C["paper3"])          # collar
rect(body, 31, 35, 33, 52, C["red"])             # tie
px(body, 31, 52, C["reddeep"]); px(body, 32, 53, C["reddeep"])
for yy in (40, 46, 52): px(body, 34, yy, C["yellow2"])  # buttons
# coat upper panels (open, over uniform sides)
rect(body, 18, 31, 24, 60, C["paper3"])
rect(body, 40, 31, 46, 60, C["paper3"])
rect(body, 23, 31, 24, 60, C["paper2"])
rect(body, 40, 31, 41, 60, C["paper2"])
# left arm (viewer left) at side
rect(body, 15, 34, 19, 56, C["paper3"])
rect(body, 15, 34, 16, 56, C["paper2"])
rect(body, 15, 56, 19, 60, C["skin"])
# 74 badge on left coat panel
rect(body, 19, 40, 23, 45, C["yellow2"])
rect(body, 19, 40, 23, 41, C["yellow"])
px(body, 20, 42, C["ink"]); px(body, 21, 43, C["ink"]); px(body, 22, 42, C["ink"])
# neck
rect(body, 30, 27, 34, 31, C["ink2"])

# ---- COAT: lower hem flaps (sway layer) ----
coat = new()
rect(coat, 18, 58, 24, 68, C["paper3"])
rect(coat, 40, 58, 46, 68, C["paper3"])
rect(coat, 23, 58, 24, 68, C["paper2"])
rect(coat, 40, 58, 41, 68, C["paper2"])
rect(coat, 17, 66, 24, 68, C["paper3"])  # flare
rect(coat, 40, 66, 47, 68, C["paper3"])
rect(coat, 18, 67, 24, 68, C["paper2"])
rect(coat, 40, 67, 46, 68, C["paper2"])

# ---- ARM: right arm raised holding vial ----
arm = new()
rect(arm, 44, 34, 48, 46, C["paper3"])   # upper sleeve
rect(arm, 46, 40, 50, 46, C["paper3"])   # forearm raised
rect(arm, 44, 34, 45, 46, C["paper2"])
rect(arm, 48, 37, 52, 41, C["skin"])     # hand
rect(arm, 50, 31, 53, 38, C["river"])    # vial
rect(arm, 50, 31, 53, 32, C["paper3"])   # cap
rect(arm, 51, 33, 52, 37, C["sky"])      # liquid shine

layers = {"legs": legs, "body": body, "coat": coat, "arm": arm, "head": head}
OUT.mkdir(parents=True, exist_ok=True)
for name, img in layers.items():
    big = img.resize((128, 192), Image.NEAREST)
    big.save(OUT / f"harukaze_{name}.png")
# composed preview
comp = new()
for name in ["legs", "body", "coat", "arm", "head"]:
    comp = Image.alpha_composite(comp, layers[name])
comp.resize((256, 384), Image.NEAREST).save(Path(__file__).resolve().parents[1] / "art/harukaze_new_preview.png")
comp.resize((128, 192), Image.NEAREST).save(OUT / "harukaze_student.png")
print("layers written:", ", ".join(layers), "+ student")
