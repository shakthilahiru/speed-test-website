require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Configuration
const SPEED_TEST_CONFIG = {
    downloadSize: 10 * 1024 * 1024, // 10MB
    uploadLimit: '15mb'
};

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'HEAD'],
    allowedHeaders: ['Content-Type'],
    exposedHeaders: ['Content-Length', 'X-Response-Time']
}));

app.use(express.static('public'));

// Speed Test Endpoints
app.get('/download', (req, res) => {
    res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Length': SPEED_TEST_CONFIG.downloadSize,
        'Cache-Control': 'no-store, max-age=0'
    });
    res.send(Buffer.alloc(SPEED_TEST_CONFIG.downloadSize));
});

app.post('/upload', express.raw({
    type: 'application/octet-stream',
    limit: SPEED_TEST_CONFIG.uploadLimit
}), (req, res) => res.sendStatus(200));

app.head('/ping', (req, res) => res.sendStatus(200));
app.get('/status', (req, res) => res.json({ status: 'ok', timestamp: Date.now() }));

module.exports = app;

// Local development
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
