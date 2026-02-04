# 🎧 EchoListen - AI-Powered Audio Learning Companion

<div align="center">

![React](https://img.shields.io/badge/React-19-black?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite)
![PWA](https://img.shields.io/badge/PWA-Supported-5A0FCB?logo=pwa)
![Deepgram](https://img.shields.io/badge/Deepgram-Integrated-0033AD)

**Transform audio into interactive learning experiences with AI-powered transcription and speaker identification**

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [PWA](#-pwa-support) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

EchoListen is a Progressive Web App (PWA) designed for language learners and audio content consumers. It leverages advanced speech recognition technology to automatically transcribe audio files, identify different speakers, and synchronize transcripts with audio playback.

### 🎯 Key Capabilities

- **🗣️ Multi-Speaker Recognition**: Automatically identifies and distinguishes between different speakers
- **📝 Real-time Transcription**: Converts audio to text using Deepgram's Nova-3 model
- **🎯 Word-Level Timestamps**: Precise alignment between audio and text
- **📚 Vocabulary Management**: Save and review unfamiliar words
- **📱 Cross-Platform**: Works on desktop, mobile (Android & iOS), and tablet devices
- **🔄 Offline Support**: Partial offline functionality after first load

---

## ✨ Features

### Core Functionality

| Feature | Description |
|---------|-------------|
| **Audio Upload** | Support for MP3, WAV, and other audio formats (up to 5 minutes) |
| **AI Transcription** | Powered by Deepgram Nova-3 model with smart formatting |
| **Speaker Diarization** | Automatic identification of different speakers |
| **Interactive Player** | Synchronized audio playback with transcript highlighting |
| **Word Selection** | Click on any word to save to vocabulary list |
| **Spaced Repetition** | Review vocabulary with spaced repetition algorithm |
| **Multiple AI Providers** | Switch between Deepgram and Google Gemini |

### User Experience

- 🎨 **Modern UI**: Clean, intuitive interface built with Tailwind CSS 4
- ⚡ **Fast Performance**: Built on Vite 6 for optimal loading speed
- 🌙 **Dark Mode**: Eye-friendly dark theme by default
- 📱 **PWA Native**: Install on any device for app-like experience
- 🔐 **Privacy First**: All data stored locally in your browser

---

## 🛠️ Technology Stack

### Frontend
- **React 19** - Latest React with concurrent features
- **TypeScript 5.8** - Type-safe development
- **Vite 6** - Lightning-fast build tool
- **Tailwind CSS 4** - Utility-first CSS framework
- **React Router 7** - Client-side routing

### AI/ML
- **Deepgram SDK** - Industry-leading speech recognition
- **Google GenAI** - Alternative AI provider option

### Development Tools
- **PostCSS** - CSS processing
- **TypeScript Compiler** - Type checking
- **ESBuild** - Fast bundling via Vite

---

## 📦 Installation

### Prerequisites

- **Node.js** 18.17 or higher
- **npm** or **yarn** package manager

### Clone and Install

```bash
# Clone the repository
git clone https://github.com/madmonkey007/-EchoListenultra.git
cd -EchoListenultra

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

---

## 🚀 Usage

### Quick Start

1. **Launch the App**
   ```bash
   npm run dev
   # or use production preview
   npm run build && npm run preview
   ```

2. **Configure API Key**
   - Open the app in your browser
   - Navigate to **Settings**
   - Select **Custom ASR** (Deepgram)
   - Enter your [Deepgram API Key](https://console.deepgram.com)

3. **Upload Audio**
   - Click **Add Session** or **+** button
   - Select an audio file (MP3/WAV recommended)
   - Wait for transcription to complete

4. **Start Learning**
   - Play the audio with synchronized transcript
   - Click on unfamiliar words to save them
   - Review your vocabulary list

### PWA Installation

#### Desktop (Chrome/Edge)

1. Open the app in Chrome or Edge
2. Click the install icon in the address bar 📲
3. Click "Install" or "Add to desktop"

#### Mobile (Android/iOS)

1. Open the app in Chrome (Android) or Safari (iOS)
2. Chrome: Tap menu → "Add to Home Screen"
3. Safari: Tap Share → "Add to Home Screen"

---

## 📱 PWA Support

EchoListen is a full-featured Progressive Web App:

### ✅ Supported Features
- Install on any device (desktop, mobile, tablet)
- Offline-capable (partial functionality)
- App-like experience (fullscreen, standalone)
- Add to home screen/dock
- Push notifications ready

### 📋 Installation Guides

- **Desktop**: [PWA Installation Guide](./PWA_INSTALLATION_GUIDE.md)
- **Mobile**: See your desktop guide `EchoListen-手机使用指南.md`
- **Chrome Extension**: [Extension Guide](./CHROME_EXTENSION_README.md)

---

## 🎓 How It Works

### Transcription Pipeline

```
Audio Upload → Deepgram API → Process Response
                              ↓
                         Identify Speakers
                              ↓
                         Generate Segments
                              ↓
                         Sync with Audio
```

### Data Flow

1. **Upload**: Audio file is sent to Deepgram API
2. **Process**: Deepgram transcribes and identifies speakers
3. **Store**: Segments stored in browser localStorage
4. **Display**: Transcript synced with audio player

---

## 📂 Project Structure

```
echolisten/
├── src/
│   ├── views/           # Page components
│   │   ├── HomeView.tsx
│   │   ├── PlayerView.tsx
│   │   ├── AddSessionView.tsx
│   │   ├── VocabularyView.tsx
│   │   └── SettingsView.tsx
│   ├── components/      # Reusable components
│   │   └── BottomNav.tsx
│   ├── App.tsx          # Root component
│   ├── index.tsx        # Entry point
│   └── types.ts         # TypeScript definitions
├── public/
│   ├── manifest.json    # PWA manifest
│   ├── sw.js           # Service Worker
│   └── icons/          # App icons
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_DEEPGRAM_API_KEY=your_deepgram_api_key_here
```

### API Keys

Get your API key from [Deepgram Console](https://console.deepgram.com):
1. Sign up for a free account
2. Navigate to API Keys
3. Create a new API key
4. Copy and paste into Settings or `.env` file

---

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Generate PWA icons
npm run generate-icons
```

### Build PWA for Production

```bash
# Build with PWA assets
npm run build:pwa
```

This creates:
- Optimized production build
- Service Worker
- PWA Manifest
- All required icons

---

## 🌐 Deployment

### Vercel (Recommended)

The project is configured for Vercel deployment:

1. Push to GitHub
2. Import project to Vercel
3. Vercel automatically detects Vite config
4. Deploy!

**Note**: The `npm warn deprecated node-domexception@1.0.0` warning is harmless and doesn't affect functionality.

### Other Platforms

- **Netlify**: Works out of the box
- **GitHub Pages**: Use `npm run build` and deploy `dist/` folder
- **Self-hosted**: Any static file server

---

## 📊 Build Information

- **Build Tool**: Vite 6.2
- **Target**: ES2020+ browsers
- **Module Type**: ESM
- **Asset Optimization**: Automatic code splitting and minification

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Workflow

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is private and proprietary.

---

## 👤 Author

**madmonkey007**

- GitHub: [@madmonkey007](https://github.com/madmonkey007)
- Project: [EchoListen](https://github.com/madmonkey007/-EchoListenultra)

---

## 🙏 Acknowledgments

- **Deepgram** - Speech recognition technology
- **React Team** - Amazing UI library
- **Vite Team** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework

---

## 📞 Support

For detailed guides, check the documentation files:
- [PWA Installation Guide](./PWA_INSTALLATION_GUIDE.md)
- [Chrome Extension Guide](./CHROME_EXTENSION_README.md)

---

## 🎯 Roadmap

### Planned Features

- [ ] Real-time audio recording
- [ ] Export transcripts (SRT/VTT)
- [ ] Multi-device sync
- [ ] Advanced vocabulary statistics
- [ ] Custom vocabularies
- [ ] Audio waveform visualization
- [ ] Cloud storage integration

### Under Consideration

- [ ] Multiple language support UI
- [ ] Import/export functionality
- [ ] Keyboard shortcuts
- [ ] Playback speed controls
- [ ] Bookmarking specific timestamps

---

<div align="center">

**Built with ❤️ using React + TypeScript + Vite**

**⭐ Star us on GitHub!**

</div>
