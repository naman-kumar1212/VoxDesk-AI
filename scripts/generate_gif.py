import os
from PIL import Image

assets_dir = r"D:/Projects/VoxDesk AI/demo-assets"
docs_dir = r"D:/Projects/VoxDesk AI/docs"

frames = [
    os.path.join(assets_dir, "hero.png"),
    os.path.join(assets_dir, "active-workflow.png"),
    os.path.join(assets_dir, "result-state.png"),
    os.path.join(assets_dir, "dashboard.png"),
]

images = []
for f in frames:
    if os.path.exists(f):
        img = Image.open(f).convert("RGB")
        # Resize to 960x600 for crisp, lightweight embedding in README
        img = img.resize((960, 600), Image.Resampling.LANCZOS)
        images.append(img)

if images:
    out_gif = os.path.join(docs_dir, "voxdesk-demo.gif")
    images[0].save(
        out_gif,
        save_all=True,
        append_images=images[1:],
        duration=[2000, 2200, 2200, 2500],
        loop=0,
        optimize=True
    )
    print(f"Generated animated GIF: {out_gif} ({os.path.getsize(out_gif)/1024:.1f} KB)")

