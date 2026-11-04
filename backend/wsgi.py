"""
WSGI entrypoint for VoxDesk AI backend.
Compatible with Vercel Python runtime and local Flask dev server.
"""
from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

