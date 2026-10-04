/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║           src/utils/hashing.js                              ║
 * ║  PURPOSE : Cryptographic hash generation for uploaded files  ║
 * ║  USED BY : src/routes/analyze.js                            ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

'use strict';

const crypto = require('crypto');

// ─── SUPPORTED ALGORITHMS ─────────────────────────────────────────────────────
// MD5     – fast, widely used, NOT collision-safe (legacy use only)
// SHA-1   – widely used but deprecated for security purposes
// SHA-256 – current gold standard for file integrity checking
// SHA-384 – stronger variant of SHA-256
// SHA-512 – maximum strength; very long but very secure
const ALGORITHMS = ['md5', 'sha1', 'sha256', 'sha384', 'sha512'];

/**
 * Computes all supported hash digests for a given file buffer.
 * @param {Buffer} buffer - Raw file bytes
 * @returns {Object} - { md5: "...", sha1: "...", sha256: "...", ... }
 */
function computeHashes(buffer) {
    const result = {};
    for (const algo of ALGORITHMS) {
        result[algo] = crypto.createHash(algo).update(buffer).digest('hex');
    }
    return result;
}

module.exports = { computeHashes };
