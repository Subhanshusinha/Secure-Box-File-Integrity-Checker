/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║           src/routes/forensics.js                           ║
 * ║  PURPOSE : POST /api/forensics – Deep binary file analysis  ║
 * ║  USED BY : server.js                                        ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * REQUEST : multipart/form-data with field "file"
 * RESPONSE: JSON with file type, hex dump, strings, byte stats, EXIF data
 */

'use strict';

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const {
    identifyByMagicBytes,
    analyzeByteCategories,
    byteFrequencyDistribution,
    extractStrings,
    buildHexDump,
} = require('../utils/forensics');

const router = express.Router();

// ─── FILE UPLOAD CONFIG (memory-only, no disk writes) ─────────────────────────
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB max
});

// ─── ROUTE: POST /api/forensics ───────────────────────────────────────────────
router.post('/', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    try {
        const buffer   = req.file.buffer;
        const filename = req.file.originalname;

        // ── Step 1: Identify the real file type by magic bytes ──
        const fileType = identifyByMagicBytes(buffer);

        // ── Step 2: Extract raw magic bytes for display in the UI ──
        const magicBytes = Array.from(buffer.slice(0, 16))
            .map(b => b.toString(16).padStart(2, '0').toUpperCase());

        // ── Step 3: Build professional hex dump of first 512 bytes ──
        const hexDump = buildHexDump(buffer, 512);

        // ── Step 4: Extract human-readable strings from binary data ──
        const strings = extractStrings(buffer);

        // ── Step 5: Generate byte frequency distribution (for the bar chart) ──
        const byteFreq = byteFrequencyDistribution(buffer);

        // ── Step 6: Categorize bytes (null / control / printable / high) ──
        const categories = analyzeByteCategories(buffer);

        // ── Step 7: Find top 10 most frequent byte values ──
        const topBytes = byteFreq
            .map((count, val) => ({ val, count }))
            .filter(x => x.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map(x => ({
                val:   x.val,
                hex:   x.val.toString(16).padStart(2, '0').toUpperCase(),
                count: x.count,
                pct:   parseFloat(((x.count / buffer.length) * 100).toFixed(2)),
                char:  (x.val >= 0x20 && x.val < 0x7F) ? String.fromCharCode(x.val) : null,
            }));

        // ── Step 8: Extract EXIF metadata for image files ──
        // EXIF data can contain GPS coordinates, camera model, timestamps, and more.
        // This only runs for known image formats to avoid errors on binary files.
        let exifData = null;
        try {
            const ext     = path.extname(filename).toLowerCase();
            const mime    = req.file.mimetype || '';
            const isImage = mime.startsWith('image/') ||
                ['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.heic', '.webp'].includes(ext);

            if (isImage) {
                const exifr = require('exifr'); // Loaded lazily – only when needed
                exifData = await exifr.parse(buffer, {
                    tiff: true, ifd0: true, exif: true, gps: true, iptc: true, xmp: true,
                });
            }
        } catch (exifErr) {
            // EXIF extraction is optional – log but don't fail the whole request
            console.warn('[forensics] EXIF extraction skipped:', exifErr.message);
        }

        // ── Return full forensics report ──
        res.json({
            fileType,
            magicBytes,
            hexDump,
            strings,
            byteFreq,
            topBytes,
            categories,
            exifData,
            analysisTime: new Date().toISOString(),
        });

    } catch (err) {
        console.error('[forensics] Error:', err.message);
        res.status(500).json({ error: 'Forensic analysis failed. Please try again.' });
    }
});

module.exports = router;
