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


class VercelWSGIWrapper:
    """
    WSGI wrapper ensuring clean PATH_INFO resolution behind Vercel edge proxy.
    """
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        path = environ.get("PATH_INFO", "")
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
                environ["PATH_INFO"] = "/"

        return self.wsgi_app(environ, start_response)


app.wsgi_app = VercelWSGIWrapper(app.wsgi_app)
handler = app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
