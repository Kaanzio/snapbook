# 📸 Snapbook

A personal photo notebook app — capture, organize, and explore your visual memories. No cloud storage, no subscriptions, everything stays on your device.
https://kaanzio.github.io/snapbook/
---

## ✨ Features

### Core
- **Photo upload** — drag & drop or file picker, works on mobile camera
- **Categories** — organize photos with customizable categories and emojis
- **Notes & tags** — add short descriptions and multiple tags to each photo
- **Star / favorite** — mark important photos with a single tap
- **Date & location** — automatic timestamp, optional GPS coordinates
- **Collections** — group photos into named albums or projects

### Search & Discovery
- **Smart search** — full-text search across notes and tags
- **Filters** — filter by category, tags, starred, or collection
- **Masonry grid** — responsive layout (2 / 3 / 4 columns)

### Canvas Mode
- **Infinite canvas** — pannable and zoomable workspace (powered by React Flow)
- **Photo nodes** — drag photos from your library onto the canvas
- **Text nodes** — add free-floating text anywhere
- **Connections** — draw arrows between nodes to create mind maps
- **Multiple canvases** — create, rename, and delete named canvases

### Personalization
- **Themes** — Light / Dark / OLED Black
- **Accent colors** — 6 presets + custom hex
- **Grid density** — Comfortable / Compact / List
- **Font size** — Small / Medium / Large
- **System theme** — auto-follows your OS setting

### PWA
- Installable on iOS and Android from the browser
- Works offline — no internet required
- All data stored locally on your device (IndexedDB)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Local storage | IndexedDB via `idb` |
| Canvas | React Flow |
| PWA | next-pwa |
| Hosting | Vercel (free) |

> **No backend. No database. No cloud storage.** Everything lives in your browser's IndexedDB.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Kaanzio/snapbook.git
cd snapbook

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for production

```bash
npm run build
npm start
```

---

## 📱 Install as Mobile App

Since Snapbook is a PWA, you can install it on your phone without any app store.

**iPhone / iPad:**
1. Open the app URL in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"

**Android:**
1. Open the app URL in Chrome
2. Tap the browser menu (⋮)
3. Tap "Add to Home screen"

---

## 📁 Project Structure

```
snapbook/
├── app/                  # Next.js App Router pages
├── components/
│   ├── layout/           # Navigation, sidebar, bottom bar
│   ├── photos/           # Photo grid, photo card, detail view
│   ├── upload/           # Upload modal and form
│   ├── collections/      # Collection list and manager
│   ├── search/           # Search bar and results
│   └── ui/               # Reusable primitives (button, modal, etc.)
├── hooks/                # Custom React hooks
├── lib/                  # IndexedDB client, utilities
├── types/                # TypeScript type definitions
└── public/               # Static assets, PWA manifest
```

---

## 🔒 Privacy

Snapbook stores **all data locally on your device**. No data is ever sent to any server. No analytics, no tracking, no accounts.

---

## 📄 License

MIT — free to use, modify, and distribute.
