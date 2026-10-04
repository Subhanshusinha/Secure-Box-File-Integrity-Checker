/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║           src/utils/forensics.js                            ║
 * ║  PURPOSE : Deep binary file inspection utilities            ║
 * ║  USED BY : src/routes/forensics.js                          ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

'use strict';

// ─── MAGIC BYTE DATABASE ──────────────────────────────────────────────────────
// "Magic bytes" are the first few bytes of a file that reveal its TRUE format,
// regardless of what extension the file has. For example, a file renamed from
// "malware.exe" to "photo.jpg" will still have MZ magic bytes revealing it's
// a Windows executable.
const MAGIC_DB = [
    { sig: [0x50,0x4B,0x03,0x04], label: 'ZIP Archive / Office Document',        icon: 'fa-file-zipper' },
    { sig: [0x52,0x61,0x72,0x21], label: 'RAR Archive',                            icon: 'fa-file-zipper' },
    { sig: [0x1F,0x8B],           label: 'GZIP Compressed File',                   icon: 'fa-file-zipper' },
    { sig: [0x42,0x5A,0x68],      label: 'BZIP2 Compressed File',                  icon: 'fa-file-zipper' },
    { sig: [0x37,0x7A,0xBC,0xAF], label: '7-Zip Archive',                          icon: 'fa-file-zipper' },
    { sig: [0x75,0x73,0x74,0x61,0x72], label: 'TAR Archive',                       icon: 'fa-file-zipper' },
    { sig: [0x4D,0x53,0x43,0x46], label: 'Microsoft Cabinet (.cab)',                icon: 'fa-file-zipper' },
    { sig: [0x7F,0x45,0x4C,0x46], label: 'ELF Executable (Linux/Unix)',             icon: 'fa-file-code' },
    { sig: [0x4D,0x5A],           label: 'Windows PE Executable / DLL',             icon: 'fa-file-code' },
    { sig: [0xCA,0xFE,0xBA,0xBE], label: 'Java Class / Mach-O Fat Binary',         icon: 'fa-file-code' },
    { sig: [0xCF,0xFA,0xED,0xFE], label: 'Mach-O 64-bit Binary (macOS)',            icon: 'fa-file-code' },
    { sig: [0x00,0x61,0x73,0x6D], label: 'WebAssembly Binary',                     icon: 'fa-microchip' },
    { sig: [0x23,0x21],           label: 'Script / Shebang File (bash/python/etc)', icon: 'fa-file-code' },
    { sig: [0x25,0x50,0x44,0x46], label: 'PDF Document',                            icon: 'fa-file-pdf' },
    { sig: [0xD0,0xCF,0x11,0xE0], label: 'Microsoft Office (DOC/XLS/PPT)',          icon: 'fa-file-word' },
    { sig: [0x89,0x50,0x4E,0x47], label: 'PNG Image',                               icon: 'fa-file-image' },
    { sig: [0xFF,0xD8,0xFF],      label: 'JPEG Image',                              icon: 'fa-file-image' },
    { sig: [0x47,0x49,0x46,0x38], label: 'GIF Image',                               icon: 'fa-file-image' },
    { sig: [0x42,0x4D],           label: 'BMP Image',                               icon: 'fa-file-image' },
    { sig: [0x49,0x49,0x2A,0x00], label: 'TIFF Image (little-endian)',              icon: 'fa-file-image' },
    { sig: [0x52,0x49,0x46,0x46], label: 'RIFF Container (WAV / AVI / WebP)',       icon: 'fa-file-video' },
    { sig: [0x66,0x74,0x79,0x70], label: 'MP4 Container (ftyp box)',                icon: 'fa-file-video' },
    { sig: [0x1A,0x45,0xDF,0xA3], label: 'Matroska / WebM Video',                  icon: 'fa-file-video' },
    { sig: [0x49,0x44,0x33],      label: 'MP3 Audio (ID3 tag)',                     icon: 'fa-file-audio' },
    { sig: [0x66,0x4C,0x61,0x43], label: 'FLAC Audio',                              icon: 'fa-file-audio' },
    { sig: [0x4F,0x67,0x67,0x53], label: 'OGG Audio/Video Container',               icon: 'fa-file-audio' },
    { sig: [0x4D,0x54,0x68,0x64], label: 'MIDI Audio',                              icon: 'fa-file-audio' },
    { sig: [0x53,0x51,0x4C,0x69], label: 'SQLite Database',                         icon: 'fa-database' },
    { sig: [0x30,0x26,0xB2,0x75], label: 'Windows Media (ASF / WMV / WMA)',         icon: 'fa-file-video' },
    { sig: [0x46,0x57,0x53],      label: 'Adobe Flash SWF',                         icon: 'fa-file-video' },
    { sig: [0xFD,0x37,0x7A,0x58], label: 'XZ Compressed File',                     icon: 'fa-file-zipper' },
    { sig: [0xED,0xAB,0xEE,0xDB], label: 'RPM Package',                             icon: 'fa-box' },
];

/**
 * Identifies the real file type by comparing magic bytes against MAGIC_DB.
 * Falls back to "Unknown" if no match is found.
 * @param {Buffer} buffer - Raw file bytes
 * @returns {Object} - { label, icon }
 */
function identifyByMagicBytes(buffer) {
    for (const entry of MAGIC_DB) {
        const sig = entry.sig;
        let match = true;
        for (let i = 0; i < sig.length; i++) {
            if (buffer[i] !== sig[i]) { match = false; break; }
        }
        if (match) return { label: entry.label, icon: entry.icon };
    }
    return { label: 'Unknown / Plain Text', icon: 'fa-file-lines' };
}

/**
 * Counts bytes in each category to understand file composition.
 * @param {Buffer} buffer - Raw file bytes
 * @returns {Object} - Counts and percentages for each byte category
 */
function analyzeByteCategories(buffer) {
    let nullBytes = 0, control = 0, printable = 0, highByte = 0;

    for (const b of buffer) {
        if (b === 0)                   nullBytes++;   // Empty / padding bytes
        else if (b < 0x20 || b === 0x7F) control++;  // Non-printable control chars
        else if (b < 0x80)             printable++;   // Normal readable ASCII text
        else                           highByte++;    // Extended / non-ASCII bytes
    }

    const total = buffer.length || 1;
    const pct = (n) => parseFloat(((n / total) * 100).toFixed(1));

    return {
        nullBytes,   nullPct:    pct(nullBytes),
        control,     controlPct: pct(control),
        printable,   printPct:   pct(printable),
        highByte,    highPct:    pct(highByte),
    };
}

/**
 * Counts occurrences of every possible byte value (0–255).
 * Used to draw the byte frequency bar chart in the Forensics Lab.
 * @param {Buffer} buffer - Raw file bytes
 * @returns {number[]} - Array of 256 counts, index = byte value
 */
function byteFrequencyDistribution(buffer) {
    const freq = new Array(256).fill(0);
    for (const b of buffer) freq[b]++;
    return freq;
}

/**
 * Extracts human-readable ASCII strings from binary data.
 * Useful for finding URLs, file paths, and commands hidden inside executables.
 * @param {Buffer} buffer - Raw file bytes
 * @param {number} minLen - Minimum string length to return (default: 5)
 * @returns {string[]} - Unique strings found, capped at 80
 */
function extractStrings(buffer, minLen = 5) {
    const text    = buffer.toString('latin1');
    const matches = text.match(/[\x20-\x7E]{5,}/g) || [];
    const unique  = [...new Set(matches)].filter(s => s.trim().length >= minLen);
    return unique.slice(0, 80);
}

/**
 * Builds a professional hex dump (offset | hex columns | ASCII).
 * Mimics the output of tools like `xxd` or HxD.
 * @param {Buffer} buffer - Raw file bytes
 * @param {number} limit  - How many bytes to dump (default: 512)
 * @returns {Object[]} - Array of row objects { offset, hexPart, asciiPart, rawBytes }
 */
function buildHexDump(buffer, limit = 512) {
    const slice = buffer.slice(0, limit);
    const rows  = [];

    for (let i = 0; i < slice.length; i += 16) {
        const chunk     = slice.slice(i, i + 16);
        const offset    = i.toString(16).padStart(8, '0').toUpperCase();
        const hexPart   = Array.from(chunk).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ').padEnd(47);
        const asciiPart = Array.from(chunk).map(b => (b >= 0x20 && b < 0x7F) ? String.fromCharCode(b) : '.').join('');
        rows.push({ offset, hexPart, asciiPart, rawBytes: Array.from(chunk) });
    }

    return rows;
}

module.exports = {
    identifyByMagicBytes,
    analyzeByteCategories,
    byteFrequencyDistribution,
    extractStrings,
    buildHexDump,
};
