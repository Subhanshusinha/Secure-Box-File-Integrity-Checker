/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║           src/utils/threatScanner.js                        ║
 * ║  PURPOSE : Scan file buffer for known threat signatures     ║
 * ║  USED BY : src/routes/analyze.js                            ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * HOW IT WORKS:
 *  We convert the file's raw bytes into a Latin-1 string so we can
 *  run regex patterns against it. Each pattern matches a known
 *  indicator of compromise (IoC) or dangerous file property.
 *  The risk score increases by 12 per matched threat.
 */

'use strict';

const path = require('path');

// ─── THREAT SIGNATURE DATABASE ────────────────────────────────────────────────
// Each entry has:
//   name    – human-readable label shown in the UI
//   pattern – regex that matches suspicious content in the file bytes
const THREAT_SIGNATURES = [
    { name: 'ELF Executable',          pattern: /^\x7fELF/ },
    { name: 'Windows PE Executable',   pattern: /^MZ/ },
    { name: 'Embedded Script Tag',     pattern: /<script[\s>]/i },
    { name: 'PowerShell Command',      pattern: /powershell/i },
    { name: 'Base64 Encoded Blob',     pattern: /[A-Za-z0-9+/]{200,}={0,2}/ },
    { name: 'SQL Injection Pattern',   pattern: /([\'"";])\s*(OR|AND|SELECT|DROP|INSERT|UPDATE|DELETE)\s/i },
    { name: 'Null Byte Injection',     pattern: /\x00{4,}/ },
    { name: 'Reverse Shell Signature', pattern: /\/bin\/sh|cmd\.exe|nc\s+-[lue]/i },
    { name: 'PHP Eval Obfuscation',    pattern: /eval\s*\(\s*(base64_decode|gzinflate|str_rot13)/i },
    { name: 'Office Macro Trigger',    pattern: /AutoOpen|Document_Open|Workbook_Open/i },
    { name: 'Registry Manipulation',   pattern: /HKEY_(LOCAL_MACHINE|CURRENT_USER|CLASSES_ROOT)/i },
    { name: 'Network Beacon Pattern',  pattern: /https?:\/\/[\w.-]+\/(beacon|c2|gate|panel|upload)/i },
];

// ─── DANGEROUS FILE EXTENSIONS ────────────────────────────────────────────────
// Files with these extensions are directly executable or can run malicious code
const DANGEROUS_EXTENSIONS = [
    '.exe', '.bat', '.sh', '.ps1', '.vbs', '.cmd', '.msi', '.dll', '.scr'
];

/**
 * Scans a file buffer for threat indicators.
 * @param {Buffer} buffer   - Raw file bytes
 * @param {string} filename - Original filename (to check extension)
 * @returns {string[]}      - Array of detected threat names
 */
function scanThreats(buffer, filename) {
    const fileText = buffer.toString('latin1'); // latin1 = 1:1 byte to char mapping
    const detectedThreats = [];

    // ── Check each signature ──
    for (const sig of THREAT_SIGNATURES) {
        if (sig.pattern.test(fileText)) {
            detectedThreats.push(sig.name);
        }
    }

    // ── Check for double-extension masquerading (e.g. "photo.jpg.exe") ──
    if (/\.(jpg|png|pdf|txt)\.(exe|bat|sh|cmd|ps1)$/i.test(filename)) {
        detectedThreats.push('Double Extension Masquerading');
    }

    // ── Check for dangerous file extension ──
    const ext = path.extname(filename).toLowerCase();
    if (DANGEROUS_EXTENSIONS.includes(ext)) {
        detectedThreats.push('Dangerous File Extension: ' + ext);
    }

    return detectedThreats;
}

/**
 * Calculates a 0–100 risk score based on detected threats and entropy.
 * @param {string[]} threats - Detected threat names
 * @param {number}   entropy - Shannon entropy of the file
 * @returns {number} - Risk score between 0 and 100
 */
function calculateRiskScore(threats, entropy) {
    let score = threats.length * 12;          // Each threat adds 12 points
    if (entropy > 7.2) score += 20;           // Very high entropy = suspicious
    if (entropy < 1.0 && entropy > 0) score += 10; // Abnormally low = suspicious
    return Math.min(score, 100);              // Cap at 100
}

module.exports = { scanThreats, calculateRiskScore };
