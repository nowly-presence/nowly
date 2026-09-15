#!/usr/bin/env python3
"""Build installer.ico from a square PNG so the Setup .exe uses the brand mark."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--png", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()

    if not args.png.is_file():
        raise SystemExit(f"png not found: {args.png}")

    try:
        from PIL import Image
    except ImportError:
        raise SystemExit("Pillow is required: pip install pillow")

    source = Image.open(args.png).convert("RGBA")
    sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    canvas = source.resize((256, 256), Image.Resampling.LANCZOS)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(args.out, format="ICO", sizes=sizes)
    print(f"wrote {args.out} ({args.out.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
