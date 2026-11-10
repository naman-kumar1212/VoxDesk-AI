"""
VoxDesk AI — Standalone Animated GIF Generator

Reads captured screenshot frames from demo-assets/ and generates a lightweight,
high-framerate animated preview GIF.
Saves directly to: demo-assets/voxdesk-demo.gif (and mirrors to docs/voxdesk-demo.gif).

Usage:
    python scripts/generate_gif.py
"""

import os
import sys
import shutil
from pathlib import Path
from PIL import Image

# Ensure UTF-8 output on Windows consoles
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def main():
    script_dir = Path(__file__).resolve().parent
    repo_root = script_dir.parent
    assets_dir = repo_root / "demo-assets"
    docs_dir = repo_root / "docs"

    assets_dir.mkdir(parents=True, exist_ok=True)
    docs_dir.mkdir(parents=True, exist_ok=True)

    frames = [
        assets_dir / "hero.png",
        assets_dir / "active-workflow.png",
        assets_dir / "result-state.png",
        assets_dir / "dashboard.png",
    ]

    images = []
    for f in frames:
        if f.exists():
            img = Image.open(f).convert("RGB")
            # Resize to 960x600 for sharp Retina rendering and lightweight size (< 250 KB)
            img = img.resize((960, 600), Image.Resampling.LANCZOS)
            images.append(img)
        else:
            print(f"[Warning] Frame not found at {f}")

    if not images:
        print("[Error] No frames found in demo-assets/ to generate GIF.")
        return 1

    primary_gif = assets_dir / "voxdesk-demo.gif"
    docs_gif = docs_dir / "voxdesk-demo.gif"

    # Save animated GIF directly in demo-assets/
    images[0].save(
        primary_gif,
        save_all=True,
        append_images=images[1:],
        duration=[2000, 2200, 2200, 2500],
        loop=0,
        optimize=True,
    )
    size_kb = primary_gif.stat().st_size / 1024
    print(f"[Done] Saved demo GIF: {primary_gif} ({size_kb:.1f} KB)")

    # Mirror to docs/ for documentation embedding compatibility
    shutil.copyfile(primary_gif, docs_gif)
    print(f"[Done] Mirrored to docs: {docs_gif}")

    return 0

if __name__ == "__main__":
    exit(main())
