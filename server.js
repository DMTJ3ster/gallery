const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const PORT = 8443;

// SSL Certificate
const sslOptions = {
    key: fs.readFileSync('./ssl/key.pem'),
    cert: fs.readFileSync('./ssl/cert.pem')
};

// Create secure data directory
const dataDir = path.join(__dirname, 'secure-data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Secure save endpoint
app.post('/save', (req, res) => {
    try {
        const sessionId = `session-${Date.now()}`;
        const sessionDir = path.join(dataDir, sessionId);
        fs.mkdirSync(sessionDir);
        
        // Save metadata
        fs.writeFileSync(
            path.join(sessionDir, 'metadata.json'),
            JSON.stringify(req.body.metadata, null, 2)
        );
        
        // Save locations
        fs.writeFileSync(
            path.join(sessionDir, 'locations.json'),
            JSON.stringify(req.body.locations, null, 2)
        );
        
        // Save photos as actual JPG files
        req.body.photos.forEach((photo, index) => {
            const base64Data = photo.data.replace(/^data:image\/jpeg;base64,/, '');
            fs.writeFileSync(
                path.join(sessionDir, `photo-${index}.jpg`),
                Buffer.from(base64Data, 'base64')
            );
        });
        
        console.log(`Secure data saved to: ${sessionDir}`);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Secure save error:', err);
        res.status(500).json({ error: 'Secure save failed' });
    }
});

// Create HTTPS server
const server = https.createServer(sslOptions, app);

server.listen(PORT, () => {
    console.log(`Secure server running on https://localhost:${PORT}`);
    console.log(`Data will be securely stored in: ${dataDir}`);
});

// Redirect HTTP to HTTPS (optional)
const http = require('http');
http.createServer((req, res) => {
    res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
    res.end();
}).listen(8080);