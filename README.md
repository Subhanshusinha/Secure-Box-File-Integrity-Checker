# SecureBox – File Integrity & Security Checker

A professional, browser-based file security toolkit built with Node.js and Express.

---

## 📁 Project Structure

```
securebox/
│
├── server.js                  ← App entry point. Starts the server, loads routes.
│
├── src/                       ← All backend source code
│   ├── routes/                ← HTTP route handlers (one file per endpoint)
│   │   ├── analyze.js         ← POST /api/analyze  → hashing, threat scan, risk score
│   │   └── forensics.js       ← POST /api/forensics → hex dump, EXIF, strings, byte analysis
│   │
│   └── utils/                 ← Helper modules (pure functions, no HTTP logic)
│       ├── hashing.js         ← Generates MD5, SHA-1, SHA-256, SHA-384, SHA-512 hashes
│       ├── entropy.js         ← Calculates Shannon entropy to detect encrypted/packed data
│       ├── threatScanner.js   ← Regex-based threat signature detection
│       └── forensics.js       ← Magic byte detection, hex dump, string extraction, byte stats
│
├── public/                    ← Frontend (served as static files)
│   ├── index.html             ← Single-page app shell with sidebar navigation
│   ├── css/
│   │   └── style.css          ← All styles (layout, components, dashboard, forensics)
│   └── js/
│       └── main.js            ← All frontend logic (navigation, API calls, rendering)
│
├── package.json               ← Dependencies and npm scripts
└── README.md                  ← This file
```

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Start the server
```bash
npm start
```

### 3. Open in browser
```
http://localhost:3000
```

---

## 🔧 How It Works

### Frontend (Browser)
- Single HTML page with 4 sections: Dashboard, File Analyzer, Verify Integrity, Forensics Lab
- JavaScript handles navigation, file uploads, and rendering all results
- No frameworks — pure vanilla JS + CSS

### Backend (Node.js / Express)
- Files are uploaded via `multipart/form-data` to API endpoints
- Processed **entirely in memory** using `multer.memoryStorage()`
- **Nothing is written to disk** — files are discarded after each response

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze` | Computes hashes, entropy, threat scan, and risk score |
| `POST` | `/api/forensics` | Runs magic byte detection, hex dump, string extraction, EXIF parsing |

---

## 🛡️ Features

| Feature | Description |
|---------|-------------|
| **Multi-Algorithm Hashing** | MD5, SHA-1, SHA-256, SHA-384, SHA-512 |
| **Threat Detection** | 12 regex-based threat signatures (scripts, PE headers, macros, etc.) |
| **Shannon Entropy** | Detects encrypted or heavily obfuscated files |
| **Integrity Verification** | Compare computed hash against a vendor-provided trusted hash |
| **Magic Byte Detection** | Identifies real file type from raw bytes (ignores extension) |
| **EXIF Metadata Extraction** | Extracts GPS, camera, software, and timestamp data from images |
| **Hex Dump** | Professional offset + hex + ASCII view of first 512 bytes |
| **String Extraction** | Pulls readable ASCII strings from binary files |
| **Byte Frequency Analysis** | Visual chart of byte value distribution |

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `express` | Web server framework |
| `multer` | File upload handling (memory storage) |
| `exifr` | EXIF metadata extraction from images |

---

## 🔐 Security Design

- Files are **never stored on disk**
- All processing happens in RAM per-request
- No user data or files are logged or persisted
- The app does not make any outbound network requests
