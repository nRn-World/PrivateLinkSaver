# PrivateLinkSaver 🔐

A modern and professional Chrome extension to save and organize your links privately and securely with password protection.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Chrome](https://img.shields.io/badge/chrome-%E2%9C%93-brightgreen)

## 🌟 Features

### 🔒 Security
- **Password Protection**: Secure your bookmarks with SHA-256 hashing
- **Encryption**: AES-256-GCM encryption for sensitive data
- **Auto-lock**: Configurable timeout for increased security

### 📁 Organization
- **Folders**: Create unlimited folders with custom colors
- **Tags**: Tag your bookmarks for easy filtering
- **Favorites**: Mark important bookmarks
- **Search**: Powerful search function with fuzzy matching

### 🎨 Customization
- **Dark/Light Theme**: Switch between themes or follow system settings
- **5 Languages**: English, Swedish, Turkish, Spanish, French
- **Customizable UI**: Modern design with animations

### 📊 Statistics
- **Overview**: See total bookmarks, folders, and tags
- **Top Domains**: See which sites you save the most
- **Visit Counter**: Track how often you visit your bookmarks

### 💾 Data Management
- **Export/Import**: JSON, CSV, HTML formats
- **Automatic Backup**: Daily backups
- **Restore**: Restore from previous backups

### ⌨️ Productivity
- **Keyboard Shortcuts**: Quick access with shortcuts
- **Context Menu**: Right-click to save links
- **Omnibox**: Search bookmarks from the address bar (type "pls")

## 🚀 Installation

### From Chrome Web Store (Recommended)

1. Visit [Chrome Web Store](https://chrome.google.com/webstore) (Coming soon)
2. Search for "PrivateLinkSaver"
3. Click "Add to Chrome"

### From Source (Developer Mode)

1. Download the latest version as .zip
2. Extract the files
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode" in the top right corner
5. Click "Load unpacked"
6. Select the folder with extracted files
7. Done!

## 📖 Usage

### First Time

1. Click the extension icon in the toolbar
2. Create a secure password (at least 6 characters)
3. Login with your password
4. Start saving your favorite sites!

### Save Links

- **Via popup**: Click extension icon → "Save current page"
- **Context Menu**: Right-click a link → "Save link to PrivateLinkSaver"
- **Keyboard Shortcut**: Press `Ctrl+Shift+S` (Windows) or `Cmd+Shift+S` (Mac)

### Organize

- Create new folders with different colors
- Move bookmarks between folders
- Add tags for better filtering
- Search among your bookmarks

### Keyboard Shortcuts

| Shortcut | Function |
|--------|----------|
| `Ctrl+Shift+S` | Save current page |
| `Ctrl+Shift+B` | Open PrivateLinkSaver |
| `Ctrl+Shift+F` | Quick search |
| `Ctrl+K` | Focus search field |
| `Ctrl+N` | Create new folder |
| `Ctrl+D` | Save current page |
| `Escape` | Clear search |

## 🔒 Security

- **Password**: Hashed with SHA-256 and a unique 16-byte salt
- **Encryption**: AES-256-GCM for sensitive data
- **Local Storage**: All data is saved locally in your browser
- **No Servers**: No data is sent to external servers

## 📁 Project Structure

```
PrivateLinkSaver/
├── manifest.json          # Extension configuration
├── popup.html            # Popup UI
├── options.html          # Settings page
├── styles/
│   └── popup.css         # Styles
├── scripts/
│   ├── popup.js          # Popup logic
│   ├── background.js     # Service worker
│   ├── options.js        # Settings
│   ├── storage.js        # Storage functions
│   ├── crypto.js         # Encryption
│   └── translations.js   # Translations
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── _locales/             # Translations
│   ├── sv/
│   ├── en/
│   ├── tr/
│   ├── es/
│   └── fr/
├── README.md
├── PRIVACY.md
└── LICENSE
```

## 🛠️ Technologies

- **Manifest V3**: Latest Chrome Extension standard
- **Vanilla JavaScript**: No external dependencies
- **Web Crypto API**: Secure encryption
- **Chrome Storage API**: Local data storage
- **CSS Variables**: Dynamic themes
- **Font Awesome**: Icons
- **Google Fonts**: Inter font

## 📝 Changelog

### Version 2.0.0 (2026-01-30)

- ✨ **NEW**: Complete UI overhaul with modern design
- ✨ **NEW**: Tag system for better organization
- ✨ **NEW**: Statistics and insights
- ✨ **NEW**: Automatic backup
- ✨ **NEW**: Omnibox integration (search with "pls")
- ✨ **NEW**: Visit counter
- ✨ **NEW**: Top domains display
- ✨ **NEW**: Improved search with fuzzy matching
- ✨ **NEW**: Settings page (options.html)
- 🔒 **IMPROVED**: Stronger encryption (AES-256-GCM)
- 🔒 **IMPROVED**: Password strength indicator
- 🎨 **IMPROVED**: Dark/light theme
- 🌍 **IMPROVED**: Full i18n support
- ⚡ **IMPROVED**: Performance optimizations

### Version 1.0.0 (2026-01-15)

- 🎉 Initial release
- 🔒 Password protection with SHA-256
- 📁 Folder functionality
- 🌍 Multilingual support
- 🎨 Dark/light theme
- 📤 Export/Import

## 🤝 Contribute

Contributions are welcome! Follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## 👨‍💻 Author

**Robin Ayzit**

- Buy Me a Coffee: [buymeacoffee.com/robinayzit](https://buymeacoffee.com/robinayzit)

## 🙏 Support

If you like this project, consider to:

- ⭐ Star the project on GitHub
- ☕ [Buy me a coffee](https://buymeacoffee.com/robinayzit)
- 📢 Share with your friends
