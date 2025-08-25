# 📱 Markdown Lite PWA

A lightweight Markdown editor with live preview - Progressive Web App version for iOS, Android, and Web platforms.

## 🚀 Features

- **📱 Cross-Platform**: Works on iPhone, iPad, Android, and desktop
- **📂 File System Integration**: Direct access to Google Drive through iOS/Android file systems
- **⚡ Offline Support**: Edit files without internet connection
- **🔄 Real-time Preview**: Live Markdown rendering
- **💾 Auto-save**: Automatic saving every 5 seconds
- **📲 PWA Installation**: Add to home screen for native app experience
- **⌨️ Keyboard Shortcuts**: Familiar editing shortcuts

## 🎯 Quick Start

### For Desktop/Laptop:
1. Open this app in Chrome, Edge, or Safari
2. Click "フォルダを開く" to select a folder with Markdown files
3. Start editing!

### For iOS/iPad:
1. Open Safari and navigate to this PWA
2. Tap the Share button → "Add to Home Screen"
3. Launch from your home screen
4. Use "フォルダを開く" to access Google Drive folders through the Files app

### For Android:
1. Open Chrome and navigate to this PWA
2. Tap the menu → "Add to Home screen"
3. Launch from your home screen
4. Access your Google Drive files through the file picker

## 📋 Requirements

- **Chrome 86+** or **Edge 86+** for full File System Access API support
- **Safari 15.2+** (limited file system support on iOS)
- For best experience: Chrome or Edge on desktop, Safari on iOS

## 🔧 Technical Details

### PWA Features
- Service Worker for offline caching
- Web App Manifest for installation
- File System Access API for native file operations
- Background sync capability

### Browser Support
| Browser | Desktop | Mobile | File System API |
|---------|---------|---------|----------------|
| Chrome | ✅ | ✅ | ✅ |
| Edge | ✅ | ✅ | ✅ |
| Safari | ⚠️ | ⚠️ | ⚠️ |
| Firefox | ✅ | ✅ | ❌ |

> Note: Safari has limited File System Access API support. File operations work through standard file pickers.

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + S` | Save file |
| `Cmd/Ctrl + N` | New file |
| `Cmd/Ctrl + O` | Open file |
| `Cmd/Ctrl + E` | Switch to edit mode |
| `Cmd/Ctrl + P` | Switch to preview mode |

## 🎨 Markdown Support

- Headers (`# ## ###`)
- **Bold** and *italic* text
- `Inline code` and code blocks
- Links and images
- Lists (bulleted and numbered)
- Tables
- Blockquotes
- Task lists (`- [x] completed`)

## 🔄 How It Works with Google Drive

### iOS/iPadOS:
1. Install Google Drive app on your device
2. Open PWA and tap "フォルダを開く"
3. iOS Files app will show Google Drive as a location
4. Select your desired folder
5. Files are accessed directly from Google Drive

### Android:
1. Install Google Drive app
2. Open PWA and tap "フォルダを開く"  
3. Android file picker shows Google Drive
4. Select folder and start editing

## 🛠 Development

This is a static PWA - no build process required!

```bash
# Clone the repository
git clone https://github.com/TMrev-z/markdown-lite-pwa.git

# Navigate to directory
cd markdown-lite-pwa

# Serve locally (Python 3)
python3 -m http.server 8080

# Or use any static file server
npx serve .
```

Open `http://localhost:8080` in your browser.

## 📦 Deployment

Deploy to any static hosting service:
- **Vercel**: `vercel --prod`
- **Netlify**: Drag and drop the folder
- **GitHub Pages**: Enable Pages in repository settings
- **Firebase Hosting**: `firebase deploy`

## 🔧 Advanced Configuration

### Service Worker Caching
Edit `sw.js` to customize caching strategies:
- App shell resources are cached first
- Dynamic content uses network-first strategy
- Offline fallbacks available

### Manifest Settings
Modify `manifest.json` to customize:
- App name and description
- Theme colors
- Display mode
- File associations

## 🆚 Differences from Electron Version

| Feature | Electron | PWA |
|---------|----------|-----|
| Platform | macOS only | Cross-platform |
| Installation | App Store/DMG | Add to home screen |
| File access | Full system access | Sandboxed API |
| Offline mode | Built-in | Service Worker |
| Updates | Manual/Auto-updater | Automatic |
| Size | ~100MB | ~500KB |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Based on the original [Markdown Lite](https://github.com/TMrev-z/markdown-lite) Electron app
- Uses [Marked.js](https://marked.js.org/) for Markdown parsing
- Built with modern Web APIs for native-like experience

---

**Made with ❤️ by Cocoroai Inc.**