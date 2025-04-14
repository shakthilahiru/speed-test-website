require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.static('public'));

// Speed test endpoints
app.get('/download', (req, res) => {
    const size = 10 * 1024 * 1024; // 10MB
    res.setHeader('Content-Length', size);
    res.send(Buffer.alloc(size));
});

app.post('/upload', (req, res) => {
    req.on('data', () => {});
    req.on('end', () => res.sendStatus(200));
});

app.get('/ping', (req, res) => {
    res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
