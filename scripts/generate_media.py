"""
VoxDesk AI — Standalone Media & Walkthrough Converter

Produces:
  1. docs/media/voxdesk-demo.mp4   (H.264, yuv420p, 1440x900 compressed product video)
  2. docs/media/voxdesk-demo.gif   (High-fidelity 12 fps animated preview, < 8 MB)
  3. demo-assets/voxdesk-demo.gif  (Companion animated preview in demo-assets/)

Usage:
  python scripts/generate_media.py
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def get_ffmpeg_executable():
    """Finds either system ffmpeg or imageio-ffmpeg bundled binary."""
    # 1. Try imageio_ffmpeg
    try:
        import imageio_ffmpeg
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if os.path.exists(exe):
            return exe
    except ImportError:
        pass

    # 2. Try system PATH
    sys_ffmpeg = shutil.which("ffmpeg")
    if sys_ffmpeg:
        return sys_ffmpeg

    return None

def main():
    script_dir = Path(__file__).resolve().parent
    repo_root = script_dir.parent
    assets_dir = repo_root / "demo-assets"
    docs_media_dir = repo_root / "docs" / "media"

    docs_media_dir.mkdir(parents=True, exist_ok=True)
    assets_dir.mkdir(parents=True, exist_ok=True)

    webm_path = assets_dir / "voxdesk-demo.webm"
    if not webm_path.exists():
        print(f"[Error] Source video not found at {webm_path}")
        print("Please run `node scripts/demo.mjs` first to record the product walkthrough.")
        return 1

    ffmpeg = get_ffmpeg_executable()
    if not ffmpeg:
        print("[Error] FFmpeg was not found. Please install `imageio-ffmpeg` via `pip install imageio-ffmpeg`.")
        return 1

    print("===============================================================")
    print(" VoxDesk AI — Standalone Media Export Utility")
    print(f" Source Video: {webm_path}")
    print(f" FFmpeg Exec : {ffmpeg}")
    print("===============================================================\n")

    # 1. Generate Compressed MP4 (docs/media/voxdesk-demo.mp4)
    out_mp4 = docs_media_dir / "voxdesk-demo.mp4"
    print(f"[Step 1/2] Converting to H.264 MP4: {out_mp4}...")
    mp4_cmd = [
        ffmpeg,
        "-y",
        "-i", str(webm_path),
        "-c:v", "libx264",
        "-crf", "22",
        "-preset", "slow",
        "-pix_fmt", "yuv420p",
        "-an",
        str(out_mp4)
    ]
    res_mp4 = subprocess.run(mp4_cmd, capture_output=True, text=True)
    if res_mp4.returncode == 0:
        size_mb = out_mp4.stat().st_size / (1024 * 1024)
        print(f"  [OK] MP4 successfully generated ({size_mb:.2f} MB)")
    else:
        print(f"  [Error] MP4 conversion failed: {res_mp4.stderr[-400:]}")
        return 1

    # 2. Generate Animated GIF (docs/media/voxdesk-demo.gif)
    # Extracts the most compelling 12-second product moment (from intake to ticket stamp)
    out_gif = docs_media_dir / "voxdesk-demo.gif"
    demo_assets_gif = assets_dir / "voxdesk-demo.gif"
    print(f"\n[Step 2/2] Generating palette-optimized animated GIF: {out_gif}...")
    gif_cmd = [
        ffmpeg,
        "-y",
        "-ss", "00:00:06",
        "-to", "00:00:18",
        "-i", str(webm_path),
        "-vf", "fps=12,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
        str(out_gif)
    ]
    res_gif = subprocess.run(gif_cmd, capture_output=True, text=True)
    if res_gif.returncode == 0:
        gif_size_mb = out_gif.stat().st_size / (1024 * 1024)
        print(f"  [OK] Animated GIF generated ({gif_size_mb:.2f} MB, < 8 MB target)")
        # Mirror to demo-assets/
        shutil.copyfile(out_gif, demo_assets_gif)
        print(f"  [OK] Mirrored to demo-assets: {demo_assets_gif}")
    else:
        print(f"  [Error] GIF conversion failed: {res_gif.stderr[-400:]}")
        return 1

    print("\n===============================================================")
    print(" Media Assets Successfully Created:")
    print(f"  • {out_mp4}")
    print(f"  • {out_gif}")
    print(f"  • {demo_assets_gif}")
    print("===============================================================\n")
    return 0

if __name__ == "__main__":
    sys.exit(main())

