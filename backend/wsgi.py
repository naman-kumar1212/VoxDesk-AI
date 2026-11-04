"""
WSGI entrypoint for VoxDesk AI backend.
Compatible with Vercel Python runtime and local Flask dev server.
"""
import os
import sys
import tempfile

# Force Matplotlib and cache directories to writable /tmp on serverless (Vercel/Lambda)
os.environ.setdefault("MPLCONFIGDIR", os.path.join(tempfile.gettempdir(), "matplotlib"))

# Ensure current directory is on python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app

app = create_app()

# Vercel serverless function entrypoint compatibility
handler = app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
