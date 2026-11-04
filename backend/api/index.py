"""
Vercel Serverless Function entrypoint for VoxDesk AI backend.
Routes all API requests directly to Flask application instance.
Includes WSGI PATH_INFO resolution wrapper for edge reverse-proxies.
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


class VercelWSGIWrapper:
    """
    WSGI wrapper ensuring clean PATH_INFO resolution behind Vercel edge proxy.
    If the proxy passes the physical entrypoint identifier (/api/index or /index),
    it recovers the legitimate client-requested path from request headers.
    """
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        path = environ.get("PATH_INFO", "")
        # If edge proxy passed physical entrypoint, recover the real requested URI
        if path in ("/api/index", "/index", "/api/index.py", "/index.py"):
            orig_uri = (
                environ.get("HTTP_X_FORWARDED_URI")
                or environ.get("HTTP_X_REAL_PATH")
                or environ.get("HTTP_X_MATCHED_PATH")
                or environ.get("HTTP_X_ORIGINAL_URL")
                or ""
            )
            clean_orig = orig_uri.split("?")[0] if orig_uri else ""
            if clean_orig and clean_orig not in ("/api/index", "/index", "/api/index.py", "/index.py"):
                environ["PATH_INFO"] = clean_orig
            else:
                # Default to root endpoint
                environ["PATH_INFO"] = "/"

        return self.wsgi_app(environ, start_response)


# Apply WSGI wrapper
app.wsgi_app = VercelWSGIWrapper(app.wsgi_app)

# Vercel serverless function entrypoint compatibility
handler = app
