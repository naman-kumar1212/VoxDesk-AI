"""
VoxDesk AI — Standalone Animated GIF Generator

Convenience wrapper that runs `scripts/generate_media.py`.
Generates:
  - docs/media/voxdesk-demo.gif
  - demo-assets/voxdesk-demo.gif

Usage:
  python scripts/generate_gif.py
"""

import sys
from pathlib import Path

def main():
    script_dir = Path(__file__).resolve().parent
    media_script = script_dir / "generate_media.py"
    if media_script.exists():
        # Execute generate_media
        import runpy
        runpy.run_path(str(media_script), run_name="__main__")
        return 0
    return 1

if __name__ == "__main__":
    sys.exit(main())
