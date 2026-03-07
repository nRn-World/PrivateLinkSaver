# PrivateLinkSaver

A clean, privacy-first Chrome extension for saving and organizing links locally.

![Version](https://img.shields.io/badge/version-2.0.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Manifest](https://img.shields.io/badge/manifest-v3-brightgreen)

## Why PrivateLinkSaver?

PrivateLinkSaver is built for people who want a fast bookmark workflow without cloud lock-in.
Your data stays in the browser, protected by password-based access and local storage.

## Core Features

### Security & Privacy
- Password protection with **PBKDF2-SHA256** hashing (legacy SHA-256 hashes still supported)
- Local-first architecture using `chrome.storage.local`
- No tracking/analytics SDKs
- Optional AES-GCM crypto utilities for sensitive workflows

### Smart Bookmarking
- One-click save from popup, context menu, and keyboard shortcut
- Smart URL cleanup (removes common tracking parameters)
- Duplicate protection using canonical URL matching
- Automatic tag suggestions from domain/title

### Organization & Search
- Folder-based organization with custom colors
- Tag filtering and quick folder switching
- Search with relevance scoring (title/url/tags/folder)
- Sort by date, name, and visit count

### Productivity
- **Command Palette** (`Ctrl+Shift+P`) for fast actions
- Omnibox support (`pls` keyword)
- Backup and restore tools
- Import/export in JSON format

### UI / UX
- Modern, lightweight popup UI
- Light and dark theme support
- Multi-language support: English, Swedish, Turkish, Spanish, French

## Installation

### Option A: Load Unpacked (development)
1. Clone/download this repository
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the project folder (the folder containing `manifest.json`)

### Option B: Chrome Web Store package
1. Create a zip where `manifest.json` is in the root of the zip
2. Upload that zip in Chrome Web Store Developer Dashboard

## Usage

1. Open the extension from the toolbar
2. Register a password (first run)
3. Save your current page with one click
4. Organize with folders/tags and find links quickly with search

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+S` | Save current page |
| `Ctrl+Shift+B` | Open PrivateLinkSaver |
| `Ctrl+Shift+F` | Quick search |
| `Ctrl+Shift+P` | Command palette |
| `Ctrl+K` | Focus search |
| `Ctrl+N` | New folder |
| `Ctrl+D` | Save current page |
| `Esc` | Clear search / close modal |

## Project Structure

```text
PrivateLinkSave/
|- manifest.json
|- popup.html
|- options.html
|- scripts/
|  |- background.js
|  |- popup.js
|  |- options.js
|  |- storage.js
|  |- crypto.js
|  `- translations.js
|- styles/
|  `- popup.css
|- icons/
|- _locales/
|- PRIVACY.md
|- LICENSE
`- README.md
```

## Security Notes

- Password hashes are stored locally (never sent to your server)
- Bookmark favicon previews can use Google's favicon endpoint for display
- The extension does not run external analytics trackers

## Development

Tech stack:
- Manifest V3
- Vanilla JavaScript
- Web Crypto API
- Chrome Storage API

Recommended local flow:
1. Edit files
2. Reload extension in `chrome://extensions`
3. Test popup/actions
4. Commit and push

## Contributing

Pull requests are welcome.

1. Fork the repository
2. Create a branch: `git checkout -b feature/my-improvement`
3. Commit changes
4. Push branch
5. Open pull request

## License

MIT License. See `LICENSE` for details.

## Author

Created by Robin Ayzit / nRn World

- Buy Me a Coffee: https://buymeacoffee.com/nrnworld
- Email: bynrnworld@gmail.com
