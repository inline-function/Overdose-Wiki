#!/usr/bin/env python3
"""Transcode the licensed 乌鸦Producer WAVs into web MP3 cues.

The source pack stays outside the repo. Run from the game directory:
  python tools/audio/build-audio.py [--force] [--only slug]
"""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

GAME = Path(__file__).resolve().parents[2]
ROOT = GAME.parent
SOURCE = Path(os.environ.get("ODW_MUSIC_SOURCE", ROOT / "音乐"))
OUT = GAME / "public" / "audio" / "bgm"
MAP = Path(__file__).with_name("audio-map.json")
MAX_BYTES = 4_500_000


def ffmpeg_bin() -> str:
    explicit = os.environ.get("FFMPEG")
    if explicit:
        return explicit
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--only")
    args = parser.parse_args()

    tracks = json.loads(MAP.read_text(encoding="utf-8"))["tracks"]
    if args.only:
        tracks = [track for track in tracks if track["slug"] == args.only]
    if not tracks:
        sys.exit("no tracks selected")

    OUT.mkdir(parents=True, exist_ok=True)
    ffmpeg = ffmpeg_bin()
    total = 0

    for track in tracks:
        source = SOURCE / track["file"]
        target = OUT / f"{track['slug']}.mp3"
        if not source.exists():
            sys.exit(f"missing source: {source}")
        if target.exists() and not args.force and target.stat().st_mtime >= source.stat().st_mtime:
            print(f"skip {target.name} (up to date)")
        else:
            command = [
                ffmpeg,
                "-y",
                "-hide_banner",
                "-loglevel",
                "error",
                "-i",
                str(source),
                "-map_metadata",
                "-1",
                "-ac",
                "2",
                "-ar",
                "44100",
                "-c:a",
                "libmp3lame",
                "-b:a",
                "128k",
                "-af",
                "loudnorm=I=-16:TP=-1.5:LRA=11",
                str(target),
            ]
            subprocess.run(command, check=True)
            print(f"ok {target.name} {target.stat().st_size // 1024}KB")
        total += target.stat().st_size

    over = [track["slug"] for track in tracks if (OUT / f"{track['slug']}.mp3").stat().st_size > MAX_BYTES]
    print(f"{len(tracks)} cues · {total / 1024 / 1024:.1f}MB")
    if over:
        print("over 4.5MB:", ", ".join(over), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()