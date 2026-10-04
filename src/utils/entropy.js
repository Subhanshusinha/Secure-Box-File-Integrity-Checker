/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║           src/utils/entropy.js                              ║
 * ║  PURPOSE : Shannon Entropy calculation for file buffers     ║
 * ║  USED BY : src/routes/analyze.js                            ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * WHAT IS ENTROPY?
 *  Entropy measures how "random" the data in a file is, scored 0–8.
 *  - Low  (0–3.5) → Plain text, CSV, JSON – structured, readable data
 *  - Mid  (3.5–7) → Executables, images, compressed files
 *  - High (7–8)   → Encrypted files or packed/obfuscated malware
 */

'use strict';

/**
 * Calculates Shannon entropy of a file buffer.
 * @param {Buffer} buffer - Raw file bytes
 * @returns {number} - Entropy value between 0 and 8 (bits per byte)
 */
function shannonEntropy(buffer) {
    // Step 1: Count how often each byte value (0–255) appears
    const frequency = new Array(256).fill(0);
    for (const byte of buffer) frequency[byte]++;

    // Step 2: Apply Shannon entropy formula
    const totalBytes = buffer.length;
    let entropy = 0;
    for (const count of frequency) {
        if (!count) continue;
        const probability = count / totalBytes;
        entropy -= probability * Math.log2(probability);
    }

    return parseFloat(entropy.toFixed(4));
}

module.exports = { shannonEntropy };
