# GitHub Repository & Android APK Hub

A high-performance repository explorer and Android application distribution platform designed with a modern Neobrutalist aesthetic. Built with React, TypeScript, Tailwind CSS, Framer Motion, and Node.js.

---

## Overview

SwiftSlate Hub connects directly to the GitHub REST API to provide seamless repository browsing, release asset tracking, real-time statistics synchronization, and direct Android APK downloads. Designed specifically for developers and users who need instant access to open-source software, starred collections, and verified build releases.

---

## Key Features

- **Live GitHub Synchronization**: Real-time fetching of public repositories, starred repositories, commit activity, release metadata, and stargazer metrics.
- **Direct Android APK Distribution**: Automatic parsing of GitHub release assets to enable in-browser and in-app direct APK downloads with checksum verification and file size indications.
- **Dynamic Category Filtering**: Intelligent taxonomy sorting projects into Android & APK, Media & Music, AI & Vision, Web & 3D, and Tools & Utilities.
- **Interactive Neobrutalist Design**: High-contrast borders, bold typography, tactile shadows, interactive 3D cards, and automated text echo effects.
- **In-App Update Checker**: Automated version checker detecting the latest production APK releases across connected repositories.
- **Advanced Search & Multi-criteria Sorting**: Instant search across repository names, descriptions, and topics with sorting by update time, stars, or alphabetically.
- **Multi-User Profile Switching**: Built-in drawer menu supporting on-the-fly username lookup and portfolio inspection.
- **Vercel & Production Ready**: Pre-configured single-page application routing, server-side proxies, and static asset handling.

---

## Tech Stack

- **Frontend Framework**: React 18, TypeScript
- **Styling & Design System**: Tailwind CSS (Neobrutalism Architecture)
- **Animations & Interactivity**: Framer Motion
- **Icons**: Lucide React
- **Backend / API Proxy**: Express.js (Node.js)
- **Build Tool**: Vite
- **Deployment Targets**: Vercel, Docker, Google Cloud Run, Standard Node.js Environments

---

## Project Structure

```
├── App.tsx                    # Main application controller and layout
├── components/
│   ├── AppUpdateModal.tsx     # In-app APK release and update modal
│   ├── EchoText.tsx           # Motion echo typography component
│   ├── FlipCard.tsx           # Interactive 3D tilt flip card
│   ├── Icons.tsx              # Custom SVG icon definitions
│   ├── InAppDownloadModal.tsx # APK download and release info modal
│   ├── LogoLoop.tsx           # Infinite tech stack logo ticker
│   ├── MenuDrawer.tsx         # Sidebar settings and profile selector
│   ├── NeobrutalistHeader.tsx # Top navigation bar and profile stats
│   ├── RepoCard.tsx           # Interactive repository card component
│   ├── RepoDetailsModal.tsx   # Markdown README and repo inspector
│   └── TotalStarredCard.tsx   # Star count summary card
├── data/
│   └── sampleRepos.ts         # Initial profile data and fallbacks
├── services/
│   └── githubApi.ts           # GitHub API client, parser, and caching logic
├── server.ts                  # Express API proxy and Vite middleware server
├── index.html                 # Entry point with SEO metadata
├── index.css                  # Global styling and custom scrollbars
├── vercel.json                # Vercel deployment configuration
├── package.json               # Dependencies and build scripts
└── tsconfig.json              # TypeScript compiler configuration
```

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your development machine:
- Node.js (version 18.0 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AlexJamesHQ/SwiftSlate.git
   ```

2. Navigate to the project directory:
   ```bash
   cd SwiftSlate
   ```

3. Install project dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## Environment Variables

For higher GitHub API rate limits in production, you may optionally provide a personal access token.

Create a `.env` file in the root directory:

```env
PORT=3000
GITHUB_TOKEN=your_personal_access_token_here
```

---

## Building for Production

To create an optimized production build:

```bash
npm run build
```

To run the production server locally:

```bash
npm run start
```

---

## Deployment

### Vercel Deployment

This project includes a pre-configured `vercel.json` file. To deploy:

1. Push your code to GitHub.
2. Import the repository in your Vercel Dashboard.
3. Select Vite as the Framework Preset.
4. Deploy.

---

## Author & Credits

- **Developer**: Alex James
- **GitHub**: [https://github.com/AlexJamesHQ](https://github.com/AlexJamesHQ)
- **Portfolio**: [https://alex-james.vercel.app](https://alex-james.vercel.app)

---

## License

This project is open-source software licensed under the MIT License.
