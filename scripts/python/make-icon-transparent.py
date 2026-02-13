#!/usr/bin/env python3
"""
Make image background transparent (for use as an icon).

Uses rembg (ML-based) to detect foreground and remove the background.
Output is PNG with alpha channel.

Setup (from repo root; use a venv for project-local deps):
  python -m venv scripts/python/.venv
  scripts/python/.venv/Scripts/activate   # Windows
  # source scripts/python/.venv/bin/activate   # macOS/Linux
  pip install -r scripts/python/requirements.txt

Usage:
  python scripts/python/make-icon-transparent.py input.png
  python scripts/python/make-icon-transparent.py input.jpg -o icon.png
  python scripts/python/make-icon-transparent.py input.png --size 128
"""

import argparse
import io
import sys
from pathlib import Path

try:
    from rembg import remove as rembg_remove
    from PIL import Image
except ImportError:
    print("Missing dependencies. Install with:", file=sys.stderr)
    print("  pip install -r scripts/python/requirements.txt  (or: pip install \"rembg[cpu]\" pillow)", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Remove image background and save as transparent PNG (for icons)."
    )
    parser.add_argument(
        "input",
        type=Path,
        help="Input image path (e.g. photo.png, icon.jpg)",
    )
    parser.add_argument(
        "-o", "--output",
        type=Path,
        default=None,
        help="Output PNG path (default: <input>_transparent.png)",
    )
    parser.add_argument(
        "--size",
        type=int,
        default=None,
        metavar="N",
        help="Resize longest side to N pixels (keeps aspect ratio)",
    )
    parser.add_argument(
        "--padding",
        type=int,
        default=0,
        metavar="N",
        help="Add N pixels transparent padding around the result",
    )
    args = parser.parse_args()

    inp = args.input.resolve()
    if not inp.is_file():
        print(f"Error: input file not found: {inp}", file=sys.stderr)
        sys.exit(1)

    out = args.output
    if out is None:
        out = inp.parent / f"{inp.stem}_transparent.png"
    else:
        out = out.resolve()
    out.parent.mkdir(parents=True, exist_ok=True)

    print(f"Reading {inp} ...")
    with open(inp, "rb") as f:
        input_data = f.read()

    print("Removing background ...")
    output_data = rembg_remove(input_data)

    img = Image.open(io.BytesIO(output_data)).convert("RGBA")

    if args.padding and args.padding > 0:
        w, h = img.size
        new = Image.new("RGBA", (w + 2 * args.padding, h + 2 * args.padding), (0, 0, 0, 0))
        new.paste(img, (args.padding, args.padding))
        img = new

    if args.size is not None and args.size > 0:
        w, h = img.size
        if w >= h:
            new_w, new_h = args.size, max(1, int(h * args.size / w))
        else:
            new_w, new_h = max(1, int(w * args.size / h)), args.size
        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    img.save(out, "PNG")
    print(f"Saved: {out}")


if __name__ == "__main__":
    main()
