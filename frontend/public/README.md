# VoxDesk AI brand assets

Transparent PNG logo assets and app/favicon icons derived from the approved VoxDesk AI branding reference.

## Files
- `voxdesk-logo.png`: full horizontal logo with tagline, transparent background.
- `voxdesk-logo-compact.png`: horizontal logo without tagline, for navigation/header use.
- `voxdesk-app-icon-512.png`: 512x512 app icon.
- `favicon.svg`: scalable vector favicon.
- `favicon.ico`: 16/32/48 pixel browser favicon.
- `favicon.png`: 64x64 PNG favicon.
- `apple-touch-icon.png`: 512x512 icon for touch shortcuts.

## Vite integration
Copy the contents of `public/` into the React/Vite project's `frontend/public/` directory.

In `frontend/index.html`, use:
```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="64x64" href="/favicon.png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

For the header:
```jsx
<img src="/voxdesk-logo-compact.png" alt="VoxDesk AI" />
```

Use `voxdesk-logo.png` on white or very light backgrounds. The dark navy wordmark is not intended for dark backgrounds.
