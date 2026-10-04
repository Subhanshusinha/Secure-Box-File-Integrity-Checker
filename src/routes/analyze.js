/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║           src/routes/analyze.js                             ║
 * ║  PURPOSE : POST /api/analyze – File hashing & threat scan   ║
 * ║  USED BY : server.js                                        ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * REQUEST : multipart/form-data with field "file"
 * RESPONSE: JSON object containing hashes, entropy, threats, risk score
 */

'use strict';

const express    = require('express');
const multer     = require('multer');
const { computeHashes }                   = require('../utils/hashing');
const { shannonEntropy }                  = require('../utils/entropy');
const { scanThreats, calculateRiskScore } = require('../utils/threatScanner');

const router = express.Router();

// ─── FILE UPLOAD CONFIG ────────────────────────────────────────────────────────
// memoryStorage() means files are NEVER written to disk.
// They exist only in RAM during the request and are garbage collected after.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB max
});

// ─── ROUTE: POST /api/analyze ─────────────────────────────────────────────────
router.post('/', upload.single('file'), (req, res) => {
    // Guard: ensure a file was attached to the request
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded. Please attach a file.' });
    }

    try {
        const buffer   = req.file.buffer;
        const filename = req.file.originalname;

        // ── Step 1: Generate all cryptographic fingerprints ──
        const hashes = computeHashes(buffer);

        // ── Step 2: Measure data randomness ──
        const entropy = shannonEntropy(buffer);

        // ── Step 3: Scan for known threat patterns ──
        const threats = scanThreats(buffer, filename);

        // ── Step 4: Calculate final risk score (0–100) ──
        const riskScore = calculateRiskScore(threats, entropy);

        // ── Step 5: Extract first 256 bytes as hex preview ──
        const hexSample = buffer.slice(0, 256).toString('hex').match(/.{1,2}/g).join(' ');

        // ── Return all results ──
        res.json({
            filename,
            size:         req.file.size,
            mime:         req.file.mimetype,
            hashes,
            entropy,
            threats,
            riskScore,
            hexSample,
            analysisTime: new Date().toISOString(),
        });

    } catch (err) {
        console.error('[analyze] Error:', err.message);
        res.status(500).json({ error: 'Analysis failed. Please try again.' });
    }
});

module.exports = router;
