// server/middleware/auth.js
const admin = require('firebase-admin');

const validateApiKey = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No API key provided' });
    }

    const apiKey = authHeader.split('Bearer ')[1];
    
    // ตรวจสอบ API key จาก Firestore
    const deviceSnapshot = await admin.firestore()
      .collection('devices')
      .where('apiKey', '==', apiKey)
      .get();

    if (deviceSnapshot.empty) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    req.device = deviceSnapshot.docs[0].data();
    req.deviceId = deviceSnapshot.docs[0].id;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { validateApiKey };