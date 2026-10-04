/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  SECUREBOX – server.js                                                  ║
 * ║  Entry point for the Node.js / Express backend server                   ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  Author  : SecureBox Project                                            ║
 * ║  Purpose : Serve the frontend and handle all API requests               ║
 * ║  Port    : 3000 (http://localhost:3000)                                 ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  API ENDPOINTS:                                                         ║
 * ║    POST /api/analyze   → Hash + threat scan + entropy + risk score      ║
 * ║    POST /api/forensics → Magic bytes + hex dump + strings + EXIF        ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  SECURITY NOTE:                                                         ║
 * ║    Files are processed entirely in RAM (multer.memoryStorage).          ║
 * ║    Nothing is written to disk. No file is retained after the response.  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const express = require('express');
const path    = require('path');

// ─── IMPORT ROUTE HANDLERS ─────────────────────────────────────────────────────
// Each route is a separate module in src/routes/ for clean separation of concerns
const analyzeRoute   = require('./src/routes/analyze');
const forensicsRoute = require('./src/routes/forensics');

// ─── APP SETUP ────────────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
// Serve the public/ folder as static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));
// Parse incoming JSON request bodies (for any future JSON endpoints)
app.use(express.json());

// ─── API ROUTES ───────────────────────────────────────────────────────────────
// All API endpoints are prefixed with /api/ to separate them from static files
app.use('/api/analyze',   analyzeRoute);   // File hashing, threat detection
app.use('/api/forensics', forensicsRoute); // Deep forensic inspection + EXIF

// ─── CATCH-ALL: Serve index.html for any unmatched route ──────────────────────
// This ensures the frontend always loads even if the user navigates directly
// to a sub-path (future-proofing for client-side routing).
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log('\n');
    console.log('┌─────────────────────────────────────────┐');
    console.log(`│  🔒 SecureBox Server Started             │`);
    console.log(`│     http://localhost:${PORT}               │`);
    console.log('│                                         │');
    console.log('│  Routes:                                │');
    console.log('│    POST  /api/analyze                   │');
    console.log('│    POST  /api/forensics                 │');
    console.log('│                                         │');
    console.log('│  Files are processed in-memory only.    │');
    console.log('│  Nothing is stored on disk.             │');
    console.log('└─────────────────────────────────────────┘');
    console.log('\n');
});
