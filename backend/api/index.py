"""
Vercel Serverless Function entrypoint for VoxDesk AI backend.
Routes all API requests directly to Flask application instance.
"""
import os
import sys
import tempfile

# Force Matplotlib and font cache to writable /tmp on serverless (Vercel/Lambda)
os.environ.setdefault("MPLCONFIGDIR", os.path.join(tempfile.gettempdir(), "matplotlib"))

# Ensure backend root directory is on python path so "from app import create_app" works
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app

app = create_app()

# Vercel serverless function entrypoint compatibility
handler = app
