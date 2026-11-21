#!/usr/bin/env python3
"""Text-to-image via Qwen-Image on the token-plan gateway.

The gateway exposes images through DashScope's native multimodal route
(/api/v1/services/aigc/multimodal-generation/generation), not /images/generations.

Reads QWEN_BASE_URL / QWEN_API_KEY from ../../.env.local (or environment).
Usage:
  python tools/qwen_image.py --prompt-file tools/prompts/river.txt --size 1664*928 --out art/river.png
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[2]


def load_env() -> tuple[str, str]:
    env_file = ROOT / ".env.local"
    values: dict[str, str] = {}
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                key, _, value = line.partition("=")
                values[key.strip()] = value.strip()
    base = os.environ.get("QWEN_BASE_URL") or values.get("QWEN_BASE_URL", "")
    key = os.environ.get("QWEN_API_KEY") or values.get("QWEN_API_KEY", "")
    if not base or not key:
        sys.exit("missing QWEN_BASE_URL / QWEN_API_KEY")
    return base.rstrip("/"), key


def generate(base: str, key: str, model: str, prompt: str, size: str, seed: int | None, negative: str) -> bytes:
    host = "https://" + urlparse(base).netloc
    url = host + "/api/v1/services/aigc/multimodal-generation/generation"
    parameters: dict[str, object] = {
        "size": size,
        "n": 1,
        "prompt_extend": False,
        "watermark": False,
    }
    if seed is not None:
        parameters["seed"] = seed
    if negative:
        parameters["negative_prompt"] = negative
    payload = {
        "model": model,
        "input": {"messages": [{"role": "user", "content": [{"text": prompt}]}]},
        "parameters": parameters,
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=300) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    try:
        content = data["output"]["choices"][0]["message"]["content"]
        image_url = next(item["image"] for item in content if item.get("type") == "image")
    except (KeyError, IndexError, StopIteration, TypeError):
        sys.exit(f"no image in response: {json.dumps(data)[:600]}")
    with urllib.request.urlopen(image_url, timeout=180) as resp:
        return resp.read()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--prompt")
    parser.add_argument("--prompt-file")
    parser.add_argument("--size", default="1664*928")
    parser.add_argument("--model", default="qwen-image-3.0-pro")
    parser.add_argument("--negative", default="text, watermark, logo, signature, blurry, photorealistic")
    parser.add_argument("--seed", type=int)
    parser.add_argument("--out", required=True)
    parser.add_argument("--retries", type=int, default=3)
    args = parser.parse_args()

    prompt = args.prompt
    if args.prompt_file:
        prompt = Path(args.prompt_file).read_text(encoding="utf-8").strip()
    if not prompt:
        sys.exit("missing --prompt or --prompt-file")

    base, key = load_env()
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)

    last_error = ""
    for attempt in range(1, args.retries + 1):
        started = time.time()
        try:
            blob = generate(base, key, args.model, prompt, args.size, args.seed, args.negative)
            out.write_bytes(blob)
            print(f"ok {out} {len(blob)} bytes {time.time() - started:.1f}s")
            return
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")[:600]
            last_error = f"HTTP {exc.code}: {detail}"
        except Exception as exc:
            last_error = f"{type(exc).__name__}: {exc}"
        print(f"attempt {attempt} failed: {last_error}", file=sys.stderr)
        if attempt < args.retries:
            time.sleep(min(20, 4 * attempt))
    sys.exit(f"generation failed: {last_error}")


if __name__ == "__main__":
    main()