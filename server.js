const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Ensure data directory exists
const dataDir = path.join(__dirname, 'collected-data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Save endpoint
app.post('/save', (req, res) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `faceid-${timestamp}.json`;
        
        fs.writeFileSync(
            path.join(dataDir, filename),
            JSON.stringify(req.body, null, 2)
        );
        
        console.log(`Data saved: ${filename}`);
        res.sendStatus(200);
    } catch (err) {
        console.error('Save error:', err);
        res.sendStatus(500);
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Data will be saved to: ${dataDir}`);
});