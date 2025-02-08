// server.js
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// เก็บ API keys
const apiKeys = new Set();

// Middleware ตรวจสอบ API key
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    console.log('Received API Key:', apiKey);
    
    if (!apiKey) {
        return res.status(401).json({ error: 'API key is missing' });
    }
    
    if (!apiKeys.has(apiKey)) {
        return res.status(401).json({ error: 'Invalid API key' });
    }
    
    next();
};

// Register API key
app.post('/api/register-key', (req, res) => {
    const { apiKey } = req.body;
    if (!apiKey) {
        return res.status(400).json({ error: 'API key is required' });
    }
    apiKeys.add(apiKey);
    console.log('Registered API key:', apiKey);
    res.json({ success: true, message: 'API key registered successfully' });
});

// GET device data
app.get('/api/devices/:id', validateApiKey, (req, res) => {
    const deviceId = req.params.id;
    console.log('GET request for device:', deviceId);
    
    res.json({
        success: true,
        deviceId: deviceId,
        data: {
            status: 'active',
            lastUpdate: new Date().toISOString(),
            noiseLevel: 75
        }
    });
});

// POST device data
app.post('/api/devices/:id/data', validateApiKey, (req, res) => {
    const deviceId = req.params.id;
    const data = req.body;
    console.log('POST request for device:', deviceId, 'with data:', data);
    
    res.json({
        success: true,
        message: 'Data received successfully',
        deviceId: deviceId,
        data: data
    });
});

// Debug route - show all API keys
app.get('/api/keys', (req, res) => {
    res.json([...apiKeys]);
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});