# OrionStore - Decentralized Open-Source APK Marketplace

An open-source, high-performance decentralized Android application marketplace and open-source repository directory built with a modern Neobrutalist design system. OrionStore enables seamless discovery, live GitHub release synchronization, and direct APK package downloads.

---

## 🌟 Overview

OrionStore connects directly with official GitHub releases and public open-source repositories to provide instant access to verified Android applications, modded builds, utilities, privacy tools, and system applications. Designed with performance and usability in mind, it features real-time search, category taxonomy filtering, and direct package acquisition without unnecessary redirections or tracking.

---

## ✨ Key Features

- **🚀 Direct GitHub Releases Integration**: Triggers instant APK package downloads straight from official GitHub releases and CDN mirrors.
- **⚡ Live Repository Synchronization**: Real-time sync engine fetching the latest app listings, patch notes, and package metadata.
- **🔍 Intelligent Multi-Weighted Search**: Instant fuzzy search across app names, descriptions, author handles, package IDs, and patch tags.
- **🎨 Modern Neobrutalist Aesthetic**: Bold typography, high-contrast borders, tactile drop-shadows, and smooth motion entrance transitions.
- **📱 Responsive & View Mode Toggle**: Seamless support for both Grid Card view and Compact List view across desktop and mobile screens.
- **📍 Sticky Navigation & Controls**: Sticky search control center for effortless scrolling and fast category switching.
- **❤️ Local Offline Bookmarks**: Heart-bookmarking system allowing users to save favorite applications to local browser storage.
- **📖 In-Drawer Guide & FAQs**: Comprehensive English user guide and expandable interactive FAQs in the settings drawer.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS (Neobrutalism Architecture)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Backend / Proxy**: Express.js (Node.js)
- **Deployment**: Vercel, Docker, Node.js

---

## 📁 Project Structure

```
├── App.tsx                      # Main store interface, sticky search, & state
├── components/
│   ├── OrionAppCard.tsx         # Interactive app card with Grid/Compact views
│   ├── OrionAppDetailModal.tsx   # Detailed app inspector and release notes
│   ├── InAppDownloadModal.tsx   # APK package download modal
│   ├── MenuDrawer.tsx           # Guide, FAQs, and developer settings
│   ├── NeobrutalistHeader.tsx   # Top navigation header bar
│   ├── TextType.tsx             # Typing animation text component
│   └── Icons.tsx                # Custom SVG icons (GitHub, Telegram, etc.)
├── services/
│   └── orionAppsService.ts      # Live sync & GitHub repository fetcher
├── data/
│   └── orion-apps.json          # Verified open-source application catalog
├── index.html                   # HTML entry point with metadata
├── index.css                    # Tailwind CSS global styles
├── package.json                 # Dependencies and npm scripts
└── tsconfig.json                # TypeScript compiler configuration
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (version 18.0 or higher)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AlexJamesHQ/OrionStore.git
   ```

2. **Navigate into the directory**:
   ```bash
   cd OrionStore
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open in browser**:
   Navigating to `http://localhost:3000`

---

## 📦 Building for Production

To generate an optimized production build:

```bash
npm run build
```

To run the built production server:

```bash
npm run start
```

---

## 👨‍💻 Author & Credits

- **Developer**: Alex James
- **GitHub**: [AlexJamesHQ](https://github.com/AlexJamesHQ)
- **Telegram Channel**: [ALEX_JAMES_DEV](https://t.me/ALEX_JAMES_DEV)

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE).
