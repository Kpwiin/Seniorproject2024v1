// server/server.js
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { validateApiKey } = require('./middleware/auth');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(cors());
app.use(express.json());

// Rate limiting middleware
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Protected routes
app.get('/api/devices/:id', validateApiKey, async (req, res) => {
  try {
    const deviceDoc = await admin.firestore()
      .collection('devices')
      .doc(req.params.id)
      .get();

    if (!deviceDoc.exists) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const deviceData = deviceDoc.data();
    delete deviceData.apiKey; // ไม่ส่ง API key กลับไป

    res.json({ 
      success: true, 
      data: deviceData 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/devices/:id', validateApiKey, async (req, res) => {
  try {
    const updateData = req.body;
    
    // Validate input
    if (updateData.noiseLevel && typeof updateData.noiseLevel !== 'number') {
      return res.status(400).json({ error: 'noiseLevel must be a number' });
    }

    await admin.firestore()
      .collection('devices')
      .doc(req.params.id)
      .update(updateData);

    res.json({ 
      success: true, 
      message: 'Device updated successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});