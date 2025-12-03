const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Configure Multer for file upload
const upload = multer({ dest: 'uploads/' });

// Serve static files from 'public' directory
app.use(express.static('public'));
app.use(express.json());

// Endpoint to handle file upload and hashing
app.post('/api/hash', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => {
        hash.update(data);
    });

    stream.on('end', () => {
        const fileHash = hash.digest('hex');
        
        // Clean up: delete the uploaded file
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
            }
        });

        res.json({ hash: fileHash });
    });

    stream.on('error', (err) => {
        console.error('Error reading file:', err);
        res.status(500).json({ error: 'Error processing file' });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
