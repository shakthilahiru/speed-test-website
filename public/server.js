require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Enhanced CORS configuration
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'HEAD'],
    allowedHeaders: ['Content-Type'],
    exposedHeaders: ['Content-Length', 'X-Response-Time']
}));

app.use(express.static('public'));

// Download endpoint with proper headers
app.get('/download', (req, res) => {
    const size = 10 * 1024 * 1024; // 10MB
    res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Length': size,
        'Cache-Control': 'no-store, max-age=0'
    });
    res.send(Buffer.alloc(size));
});

// Upload endpoint with size limit
app.post('/upload', express.raw({ limit: '15mb' }), (req, res) => {
    res.set('Connection', 'close');
    res.sendStatus(200);
});

// Ping endpoint
app.head('/ping', (req, res) => {
    res.sendStatus(200);
});

module.exports = app;

// Local server
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
