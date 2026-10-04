/* ═══════════════════════════════════════════════════════════════
   SECUREBOX – main.js  (Complete, clean rewrite)
   ═══════════════════════════════════════════════════════════════ */

// ── Live Clock ────────────────────────────────────────────────
(function () {
    const el = document.getElementById('liveClock');
    if (!el) return;
    const tick = () => { el.textContent = new Date().toLocaleTimeString('en-US', { hour12: false }); };
    tick();
    setInterval(tick, 1000);
})();

// ── Session Stats ─────────────────────────────────────────────
const stats = { scanned: 0, threats: 0, clean: 0 };
function updateStats() {
    document.getElementById('statScanned').textContent = stats.scanned;
    document.getElementById('statThreats').textContent = stats.threats;
    document.getElementById('statClean').textContent = stats.clean;
}

// ── Navigation / Tab Switcher ─────────────────────────────────
const PAGE_TITLES = {
    dashboard: 'Dashboard',
    analyzer:  'File Analyzer',
    verifier:  'Verify Integrity',
    forensics: 'Forensics Lab'
};

function goTo(pageId) {
    // Hide all sections (remove both active and hidden classes first)
    document.querySelectorAll('.view-section').forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });
    document.querySelectorAll('.nav-link[data-page]').forEach(b => b.classList.remove('active'));

    // Show target section
    const sec = document.getElementById('page-' + pageId);
    const btn = document.querySelector(`.nav-link[data-page="${pageId}"]`);
    if (sec) {
        sec.classList.remove('hidden');
        sec.classList.add('active');
    }
    if (btn) btn.classList.add('active');
    document.getElementById('pageTitle').textContent = PAGE_TITLES[pageId] || pageId;
    window.scrollTo(0, 0);
}

document.querySelectorAll('.nav-link[data-page]').forEach(btn => {
    btn.addEventListener('click', () => goTo(btn.dataset.page));
});

// ── User Guide Modal ─────────────────────────────────────────
const howToModal = document.getElementById('howToModal');
document.getElementById('openHtu').addEventListener('click', () => howToModal.classList.remove('hidden'));
document.getElementById('htuClose').addEventListener('click', () => howToModal.classList.add('hidden'));
howToModal.addEventListener('click', e => { if (e.target === howToModal) howToModal.classList.add('hidden'); });

// ── Algo Chip Toggles ─────────────────────────────────────────
document.querySelectorAll('.algo-chip').forEach(chip => {
    const cb = chip.querySelector('input');
    chip.classList.toggle('active', cb.checked);
    cb.addEventListener('change', () => chip.classList.toggle('active', cb.checked));
});

// ── Drop Zone + File Input ────────────────────────────────────
const dropZone  = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) { const dt = new DataTransfer(); dt.items.add(file); fileInput.files = dt.files; onFileSelected(file); }
});
fileInput.addEventListener('change', () => { if (fileInput.files[0]) onFileSelected(fileInput.files[0]); });

function onFileSelected(file) {
    document.getElementById('previewName').textContent = file.name;
    document.getElementById('previewSize').textContent = fmtBytes(file.size);
    document.getElementById('previewType').textContent = file.type || 'Unknown';
    document.getElementById('fileIcon').className = fileTypeIcon(file.name);
    document.getElementById('filePreview').classList.remove('hidden');
    document.getElementById('algoSelectorGroup').classList.remove('hidden');
    document.getElementById('analyzeBtnText').textContent = 'Scan File';

    // Unlock forensics button
    const fBtn  = document.getElementById('forensicsBtn');
    const fRBtn = document.getElementById('forensicsRunBtn');
    const fBtnTxt = document.getElementById('forensicsBtnText');
    const fRBtnTxt = document.getElementById('forensicsRunBtnText');
    if (fBtn)  { fBtn.disabled = false; }
    if (fBtnTxt) fBtnTxt.textContent = 'Launch Forensic Scan';
    if (fRBtn) { fRBtn.disabled = false; }
    if (fRBtnTxt) fRBtnTxt.textContent = 'Launch Forensic Scan';
}

function fmtBytes(b) {
    if (!b) return '0 B';
    const k = 1024, sizes = ['B','KB','MB','GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return +(b / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

function fileTypeIcon(name) {
    const ext = (name.split('.').pop() || '').toLowerCase();
    const map = {
        pdf:'fas fa-file-pdf', doc:'fas fa-file-word', docx:'fas fa-file-word',
        xls:'fas fa-file-excel', xlsx:'fas fa-file-excel',
        zip:'fas fa-file-zipper', rar:'fas fa-file-zipper', gz:'fas fa-file-zipper',
        exe:'fas fa-file-code', dll:'fas fa-file-code', sh:'fas fa-file-code',
        jpg:'fas fa-file-image', jpeg:'fas fa-file-image', png:'fas fa-file-image', gif:'fas fa-file-image',
        mp4:'fas fa-file-video', mkv:'fas fa-file-video',
        mp3:'fas fa-file-audio', wav:'fas fa-file-audio',
        txt:'fas fa-file-lines', csv:'fas fa-file-csv',
        js:'fas fa-file-code', py:'fas fa-file-code', html:'fas fa-file-code'
    };
    return map[ext] || 'fas fa-file-alt';
}

// ── Loading Overlay ───────────────────────────────────────────
function showLoading(title) {
    document.getElementById('loadingTitle').textContent = title || 'Processing…';
    document.getElementById('loadingBar').style.width = '0%';
    document.getElementById('loadingPct').textContent = '0%';
    document.getElementById('loadingOverlay').classList.remove('hidden');

    // reset steps
    ['ls1','ls2','ls3','ls4'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.color = '#94a3b8';
        el.querySelector('i').className = 'fas fa-circle';
        el.querySelector('i').style.fontSize = '0.5rem';
    });

    let pct = 0, si = 0;
    const thresholds = [
        { id:'ls1', t:28 }, { id:'ls2', t:55 },
        { id:'ls3', t:80 }, { id:'ls4', t:95 }
    ];
    const iv = setInterval(() => {
        pct = Math.min(pct + 2, 95);
        document.getElementById('loadingBar').style.width = pct + '%';
        document.getElementById('loadingPct').textContent = pct + '%';
        while (si < thresholds.length && pct >= thresholds[si].t) {
            const el = document.getElementById(thresholds[si].id);
            if (el) {
                el.style.color = 'var(--primary)';
                el.style.fontWeight = '600';
                el.querySelector('i').className = 'fas fa-check-circle';
                el.querySelector('i').style.fontSize = '';
            }
            si++;
        }
        if (pct >= 95) clearInterval(iv);
    }, 40);
    return iv;
}

function hideLoading(iv) {
    clearInterval(iv);
    document.getElementById('loadingBar').style.width = '100%';
    document.getElementById('loadingPct').textContent = '100%';
    setTimeout(() => document.getElementById('loadingOverlay').classList.add('hidden'), 400);
}

// ═══════════════════════════════════════════════════════════════
// ANALYZER
// ═══════════════════════════════════════════════════════════════
let analysisData = {};
const analyzeBtn = document.getElementById('analyzeBtn');

analyzeBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) { toast('Please upload a file first.', 'warn'); goTo('analyzer'); return; }

    const iv = showLoading('Scanning File…');
    analyzeBtn.disabled = true;
    document.getElementById('analyzeBtnText').textContent = 'Scanning…';

    try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/analyze', { method: 'POST', body: fd });
        if (!res.ok) throw new Error('Server returned ' + res.status);
        const data = await res.json();
        hideLoading(iv);
        analysisData = data;

        stats.scanned++;
        if (data.threats && data.threats.length > 0) stats.threats++;
        else stats.clean++;
        updateStats();

        renderResults(data);
        goTo('analyzer');
    } catch (err) {
        hideLoading(iv);
        toast('Analysis failed: ' + err.message, 'danger');
    } finally {
        analyzeBtn.disabled = false;
        document.getElementById('analyzeBtnText').textContent = 'Scan File';
    }
});

function renderResults(data) {
    document.getElementById('resultsSection').classList.remove('hidden');
    renderRisk(data.riskScore, data.threats);
    renderHashes(data.hashes);
    renderEntropy(data.entropy);
    renderMeta(data);
    setTimeout(() => document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
}

function renderRisk(score, threats) {
    const arc   = document.getElementById('riskArcFill');
    const text  = document.getElementById('riskScoreText');
    const badge = document.getElementById('riskBadge');
    const offset = 251 - (251 * score / 100);

    let color, badgeCls, badgeTxt;
    if (score < 30)      { color = '#10b981'; badgeCls = 'badge-success'; badgeTxt = 'LOW RISK'; }
    else if (score < 60) { color = '#f59e0b'; badgeCls = 'badge-warning'; badgeTxt = 'MEDIUM RISK'; }
    else                 { color = '#ef4444'; badgeCls = 'badge-danger';  badgeTxt = 'HIGH RISK'; }

    badge.className = 'badge ' + badgeCls;
    badge.textContent = badgeTxt;
    setTimeout(() => { arc.style.stroke = color; arc.style.strokeDashoffset = offset; }, 50);

    let cur = 0;
    const iv = setInterval(() => {
        cur = Math.min(cur + Math.ceil(score / 40), score);
        text.textContent = cur;
        if (cur >= score) clearInterval(iv);
    }, 25);

    const list = document.getElementById('threatList');
    list.innerHTML = '';
    if (!threats || !threats.length) {
        list.innerHTML = '<div class="no-threats"><i class="fas fa-check-circle"></i> No threats detected — file looks safe.</div>';
    } else {
        threats.forEach(t => {
            const d = document.createElement('div');
            d.className = 'threat-item';
            d.innerHTML = `<i class="fas fa-triangle-exclamation"></i> ${t}`;
            list.appendChild(d);
        });
    }
}

function renderHashes(hashes) {
    const c = document.getElementById('hashResults');
    c.innerHTML = '';
    const selected = [...document.querySelectorAll('.algo-chip input:checked')].map(i => i.value);
    Object.entries(hashes || {}).forEach(([algo, val]) => {
        if (!selected.includes(algo)) return;
        const row = document.createElement('div');
        row.className = 'hash-row';
        row.innerHTML = `
            <span class="hash-algo">${algo.toUpperCase().replace('SHA','SHA-')}</span>
            <code class="hash-val" title="${val}">${val}</code>
            <button class="hash-copy" title="Copy" data-h="${val}"><i class="far fa-copy"></i></button>`;
        c.appendChild(row);
    });
    c.querySelectorAll('.hash-copy').forEach(btn => btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.h).then(() => {
            btn.innerHTML = '<i class="fas fa-check" style="color:var(--success)"></i>';
            setTimeout(() => { btn.innerHTML = '<i class="far fa-copy"></i>'; }, 2000);
        });
    }));
}

function renderEntropy(e) {
    document.getElementById('entropyValue').textContent = e.toFixed(4);
    const bar = document.getElementById('entropyBar');
    setTimeout(() => { bar.style.width = ((e / 8) * 100) + '%'; }, 100);
    if (e < 3.5)      bar.style.backgroundColor = '#10b981';
    else if (e < 7.2) bar.style.backgroundColor = '#3b82f6';
    else              bar.style.backgroundColor = '#ef4444';

    let desc;
    if (e < 1.5)      desc = 'Very low entropy — file may be empty or contain uniform/repetitive data.';
    else if (e < 3.5) desc = 'Low entropy — typical of plain text or very structured files.';
    else if (e < 6)   desc = 'Normal entropy — typical for documents, source code, and binaries.';
    else if (e < 7.2) desc = 'High entropy — typical for compressed archives or rich media (images, video).';
    else              desc = `Very high entropy (${e.toFixed(2)}/8) — strong indicator of encrypted content or packed/obfuscated malware.`;
    document.getElementById('entropyDesc').textContent = desc;
}

function renderMeta(data) {
    const g = document.getElementById('metaGrid');
    g.innerHTML = '';
    [
        ['Filename', data.filename],
        ['File Size', fmtBytes(data.size)],
        ['MIME Type', data.mime || 'Unknown'],
        ['Extension', '.' + (data.filename.split('.').pop() || 'none')],
        ['Scanned At', new Date(data.analysisTime).toLocaleString()],
    ].forEach(([key, val]) => {
        const d = document.createElement('div');
        d.className = 'meta-item';
        d.innerHTML = `<div class="meta-key">${key}</div><div class="meta-val">${val}</div>`;
        g.appendChild(d);
    });
}

// ═══════════════════════════════════════════════════════════════
// VERIFY INTEGRITY
// ═══════════════════════════════════════════════════════════════
document.getElementById('verifyBtn').addEventListener('click', () => {
    const algo  = document.getElementById('verifyAlgo').value;
    const known = document.getElementById('originalHash').value.trim().toLowerCase();
    const out   = document.getElementById('verifyResult');

    if (!known) { toast('Please paste a hash to compare against.', 'warn'); return; }
    if (!analysisData.hashes) { toast('Please scan a file in File Analyzer first.', 'warn'); return; }

    const computed = (analysisData.hashes[algo] || '').toLowerCase();
    out.classList.remove('hidden', 'match', 'no-match');

    if (computed === known) {
        out.className = 'verify-result match';
        out.innerHTML = `<i class="fas fa-check-circle"></i><div><div class="vr-text">✅ Integrity Verified!</div><div class="vr-sub">The ${algo.toUpperCase()} hash matches perfectly. This file is authentic.</div></div>`;
    } else if (!computed) {
        out.className = 'verify-result no-match';
        out.innerHTML = `<i class="fas fa-triangle-exclamation"></i><div><div class="vr-text">Algorithm Not Computed</div><div class="vr-sub">Enable ${algo.toUpperCase()} in the File Analyzer and re-scan first.</div></div>`;
    } else {
        out.className = 'verify-result no-match';
        out.innerHTML = `<i class="fas fa-circle-xmark"></i><div><div class="vr-text">⚠️ Integrity Violation!</div><div class="vr-sub">Hash mismatch — this file may be corrupted or tampered with. Do not use it.</div></div>`;
    }
});

// ═══════════════════════════════════════════════════════════════
// FORENSICS LAB
// ═══════════════════════════════════════════════════════════════
let forensicsRan = false;

async function runForensics() {
    const file = fileInput.files[0];
    if (!file) { toast('Please upload a file in File Analyzer first.', 'warn'); goTo('analyzer'); return; }

    const iv = showLoading('Running Forensic Scan…');
    document.getElementById('forensicsBtn').disabled = true;
    document.getElementById('forensicsBtnText').textContent = 'Scanning…';
    const rBtn = document.getElementById('forensicsRunBtn');
    if (rBtn) { rBtn.disabled = true; document.getElementById('forensicsRunBtnText').textContent = 'Scanning…'; }

    try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/forensics', { method: 'POST', body: fd });
        if (!res.ok) throw new Error('Server returned ' + res.status);
        const data = await res.json();
        hideLoading(iv);
        forensicsRan = true;
        renderForensics(data);
    } catch (err) {
        hideLoading(iv);
        toast('Forensic scan failed: ' + err.message, 'danger');
    } finally {
        document.getElementById('forensicsBtn').disabled = false;
        document.getElementById('forensicsBtnText').textContent = 'Re-run Scan';
        if (rBtn) { rBtn.disabled = false; document.getElementById('forensicsRunBtnText').textContent = 'Re-run Forensic Scan'; }
    }
}

// Wire both forensics buttons
document.getElementById('forensicsBtn').addEventListener('click', runForensics);
document.getElementById('forensicsRunBtn')?.addEventListener('click', runForensics);

function renderForensics(data) {
    document.getElementById('forensicsLocked').classList.add('hidden');
    document.getElementById('forensicsResults').classList.remove('hidden');

    renderFileType(data.fileType, data.magicBytes);
    renderByteCategories(data.categories);
    renderExif(data.exifData);
    renderByteFrequency(data.byteFreq, data.topBytes);
    renderStrings(data.strings);
    renderHexDump(data.hexDump);
}

function renderFileType(ft, magicBytes) {
    document.getElementById('ftLabel').textContent = ft.label;
    document.getElementById('ftIcon').className = 'fas ' + (ft.icon || 'fa-file');
    const row = document.getElementById('magicBytesRow');
    row.innerHTML = '';
    (magicBytes || []).forEach((b, i) => {
        const sp = document.createElement('span');
        sp.className = 'mb-byte' + (i < 6 ? ' sig' : '');
        sp.textContent = b;
        row.appendChild(sp);
    });
}

function renderByteCategories(cats) {
    const g = document.getElementById('byteCatGrid');
    g.innerHTML = '';
    [
        { label: 'Null Bytes',    pct: cats.nullPct,    count: cats.nullBytes },
        { label: 'Control Chars', pct: cats.controlPct, count: cats.control },
        { label: 'Printable',     pct: cats.printPct,   count: cats.printable },
        { label: 'High Bytes',    pct: cats.highPct,    count: cats.highByte },
    ].forEach(it => {
        const d = document.createElement('div');
        d.className = 'bc-item';
        d.innerHTML = `<div class="bc-label">${it.label}</div><div class="bc-pct">${it.pct}%</div><div class="bc-count">${(it.count||0).toLocaleString()} bytes</div>`;
        g.appendChild(d);
    });
}

function renderExif(exif) {
    const sec  = document.getElementById('exifSection');
    const grid = document.getElementById('exifGrid');
    if (!exif || Object.keys(exif).length === 0) { sec.classList.add('hidden'); return; }
    sec.classList.remove('hidden');
    grid.innerHTML = '';
    Object.entries(exif).forEach(([key, val]) => {
        if (val === null || val === undefined || val === '') return;
        if (typeof val === 'object') {
            if (val instanceof Date) val = val.toLocaleString();
            else if (Array.isArray(val)) val = val.join(', ');
            else return;
        }
        const d = document.createElement('div');
        d.className = 'exif-item';
        d.innerHTML = `<div class="exif-key">${esc(key)}</div><div class="exif-val">${esc(String(val))}</div>`;
        grid.appendChild(d);
    });
}

function renderByteFrequency(freq, topBytes) {
    const chart = document.getElementById('byteFreqChart');
    chart.innerHTML = '';
    if (!freq || !freq.length) return;
    const max = Math.max(...freq, 1);
    freq.forEach((count, val) => {
        const bar = document.createElement('div');
        bar.className = 'bf-bar';
        bar.style.height = '0%';
        bar.title = `0x${val.toString(16).padStart(2,'0').toUpperCase()} = ${count}`;
        chart.appendChild(bar);
        setTimeout(() => { bar.style.height = ((count / max) * 100) + '%'; }, 80 + val * 0.3);
    });
    const tbl = document.getElementById('topBytesTable');
    tbl.innerHTML = '';
    if (!topBytes || !topBytes.length) return;
    const maxPct = topBytes[0].pct;
    topBytes.forEach(tb => {
        const row = document.createElement('div');
        row.className = 'tb-row';
        row.innerHTML = `
            <span class="tb-hex">0x${tb.hex}</span>
            <span class="tb-char">${tb.char ? `'${esc(tb.char)}'` : '—'}</span>
            <div class="tb-bar-wrap"><div class="tb-bar" style="width:0" data-w="${(tb.pct/maxPct)*100}"></div></div>
            <span class="tb-pct">${tb.pct}%</span>`;
        tbl.appendChild(row);
    });
    setTimeout(() => {
        tbl.querySelectorAll('.tb-bar').forEach(b => { b.style.width = b.dataset.w + '%'; });
    }, 300);
}

let allStrings = [];
function renderStrings(strings) {
    allStrings = strings || [];
    displayStrings(allStrings);
    const search = document.getElementById('stringsSearch');
    // Remove old listener to avoid duplicates
    const newSearch = search.cloneNode(true);
    search.parentNode.replaceChild(newSearch, search);
    newSearch.addEventListener('input', function () {
        const q = this.value.toLowerCase();
        displayStrings(q ? allStrings.filter(s => s.toLowerCase().includes(q)) : allStrings);
    });
}

function displayStrings(list) {
    const c = document.getElementById('stringsContainer');
    c.innerHTML = '';
    document.getElementById('stringsCount').textContent = `${list.length} strings found`;
    if (!list.length) {
        c.innerHTML = '<span style="font-size:0.8rem;color:var(--text-muted);">No strings found.</span>';
        return;
    }
    list.forEach(s => {
        const tag = document.createElement('span');
        tag.className = 'str-tag';
        tag.textContent = s;
        tag.title = s;
        if (/https?:\/\//i.test(s)) tag.classList.add('url');
        else if (/^\d{1,3}(\.\d{1,3}){3}/.test(s)) tag.classList.add('ip');
        tag.addEventListener('click', () => navigator.clipboard.writeText(s).then(() => toast('Copied!')));
        c.appendChild(tag);
    });
}

function renderHexDump(rows) {
    const v = document.getElementById('proHexViewer');
    v.innerHTML = '';
    if (!rows || !rows.length) return;

    const tbl = document.createElement('table');
    tbl.className = 'hex-dump-table';
    tbl.innerHTML = `<thead><tr>
        <th class="hd-offset">OFFSET</th>
        <th colspan="16">HEX (00–0F)</th>
        <th class="hd-ascii">ASCII</th>
    </tr></thead>`;
    const tbody = document.createElement('tbody');

    rows.forEach(row => {
        const tr = document.createElement('tr');
        let cells = '';
        row.rawBytes.forEach(b => {
            const hex = b.toString(16).padStart(2,'0').toUpperCase();
            let cls = 'hd-hex';
            if (b === 0) cls += ' hd-null';
            else if (b >= 0x20 && b < 0x7F) cls += ' hd-print';
            cells += `<td class="${cls}">${hex}</td>`;
        });
        for (let p = row.rawBytes.length; p < 16; p++) cells += `<td class="hd-hex hd-null">--</td>`;
        const ascii = esc(row.asciiPart);
        tr.innerHTML = `<td class="hd-offset">${row.offset}</td>${cells}<td class="hd-ascii">${ascii}</td>`;
        tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
    v.appendChild(tbl);

    const copyBtn = document.getElementById('copyFullHexBtn');
    if (copyBtn) {
        const newBtn = copyBtn.cloneNode(true);
        copyBtn.parentNode.replaceChild(newBtn, copyBtn);
        newBtn.addEventListener('click', () => {
            const txt = rows.map(r => `${r.offset}  ${r.hexPart}  ${r.asciiPart}`).join('\n');
            navigator.clipboard.writeText(txt).then(() => {
                newBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => { newBtn.innerHTML = '<i class="fas fa-copy"></i> Copy'; }, 2000);
            });
        });
    }
}

// ── Toast Notifications ───────────────────────────────────────
function toast(msg, type = 'info') {
    const colors = { danger: '#ef4444', warn: '#f59e0b', info: '#2563eb' };
    const t = document.createElement('div');
    t.style.cssText = `
        position:fixed; bottom:1.5rem; right:1.5rem; z-index:9999;
        background:#fff; color:#1e293b; padding:0.9rem 1.2rem;
        border-radius:10px; font-size:0.875rem; font-weight:500;
        box-shadow:0 8px 24px rgba(0,0,0,0.12); border-left:4px solid ${colors[type]||colors.info};
        animation:slideUp 0.3s ease-out;
    `;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, 3500);
}

// ── Helper ────────────────────────────────────────────────────
function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Inject toast animation
const sty = document.createElement('style');
sty.textContent = '@keyframes slideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }';
document.head.appendChild(sty);
