// server.js
const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt');
const crypto = require('crypto');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const app = express();

// เชื่อมต่อกับ Firebase
// ดาวน์โหลด service account key จาก Firebase console และบันทึกเป็นไฟล์ serviceAccountKey.json
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Middleware
app.use(cors());
app.use(express.json());

// สร้าง API key เริ่มต้น
const defaultApiKey = 'test-api-key';

// เก็บ API keys
const apiKeys = new Set([defaultApiKey]);

// เก็บข้อมูลอุปกรณ์
const devices = {};

// ตั้งค่าการเก็บไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // สร้างโฟลเดอร์ถ้ายังไม่มี
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // ใช้ deviceId และเวลาปัจจุบันเป็นชื่อไฟล์
    const deviceId = req.params.deviceId || 'unknown';
    cb(null, `${deviceId}_${Date.now()}${path.extname(file.originalname) || '.wav'}`);
  }
});

const upload = multer({ storage: storage });

// เชื่อมต่อกับ MQTT broker
const mqttClient = mqtt.connect('mqtt://test.mosquitto.org');

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  
  // Subscribe to all device topics
  mqttClient.subscribe('spl/device/+/data');
  mqttClient.subscribe('spl/device/+/status');
  mqttClient.subscribe('spl/device/+/info');
});

mqttClient.on('error', (error) => {
  console.error('MQTT connection error:', error);
});

// Middleware ตรวจสอบ API key
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    console.log('Received API Key:', apiKey);
    
    if (!apiKey) {
        return res.status(401).json({ error: 'API key is missing' });
    }
    
    if (!apiKeys.has(apiKey)) {
        return res.status(401).json({ error: 'Invalid API key' });
    }
    
    next();
};

// Middleware ตรวจสอบสถานะอุปกรณ์
const validateDeviceStatus = async (req, res, next) => {
  try {
    const deviceId = req.params.deviceId || req.body.deviceId;
    
    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID is required' });
    }
    
    // ตรวจสอบสถานะอุปกรณ์จาก Firebase
    const deviceRef = db.collection('devices').doc(deviceId);
    const deviceDoc = await deviceRef.get();
    
    if (!deviceDoc.exists) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    const deviceData = deviceDoc.data();
    
    // ตรวจสอบว่าอุปกรณ์ active หรือไม่
    if (deviceData.status !== 'Active') {
      return res.status(403).json({ error: 'Device is inactive' });
    }
    
    // เพิ่มข้อมูลอุปกรณ์ใน request
    req.deviceData = deviceData;
    next();
  } catch (error) {
    console.error('Error validating device status:', error);
    res.status(500).json({ error: 'Failed to validate device status' });
  }
};

// ฟังก์ชันสำหรับดึงรายการ Device IDs จาก Firebase
async function getAvailableDeviceIds() {
    try {
        const devicesRef = db.collection('devices');
        const snapshot = await devicesRef.get();
        
        const deviceIds = [];
        snapshot.forEach(doc => {
            deviceIds.push(doc.id);
        });
        
        console.log(`Retrieved ${deviceIds.length} device IDs from Firebase`);
        return deviceIds;
    } catch (error) {
        console.error('Error getting device IDs from Firebase:', error);
        return [];
    }
}

// ฟังก์ชันสำหรับตรวจสอบว่า Device ID ถูกใช้งานแล้วหรือไม่
async function isDeviceIdUsed(deviceId) {
    try {
        const deviceRef = db.collection('devices').doc(deviceId);
        const doc = await deviceRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            return data.isAssigned === true;
        }
        
        return false;
    } catch (error) {
        console.error(`Error checking if device ID ${deviceId} is used:`, error);
        return true; // สมมติว่าถูกใช้แล้วเพื่อความปลอดภัย
    }
}

// ฟังก์ชันสำหรับอัปเดตสถานะการใช้งาน Device ID ใน Firebase
async function markDeviceIdAsUsed(deviceId, macAddress) {
    try {
        const deviceRef = db.collection('devices').doc(deviceId);
        const doc = await deviceRef.get();
        
        if (doc.exists) {
            // อัปเดตเอกสารที่มีอยู่
            await deviceRef.update({
                isAssigned: true,
                macAddress: macAddress,
                status: 'Active',
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            });
        } else {
            // สร้างเอกสารใหม่
            await deviceRef.set({
                deviceId: deviceId,
                isAssigned: true,
                macAddress: macAddress,
                status: 'Active',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        
        console.log(`Marked device ID ${deviceId} as used by MAC ${macAddress}`);
        return true;
    } catch (error) {
        console.error(`Error marking device ID ${deviceId} as used:`, error);
        return false;
    }
}

// ฟังก์ชันสำหรับปลดการใช้งาน Device ID ใน Firebase
async function unassignDeviceId(deviceId) {
    try {
        const deviceRef = db.collection('devices').doc(deviceId);
        const doc = await deviceRef.get();
        
        if (doc.exists) {
            // อัปเดตเอกสารที่มีอยู่
            await deviceRef.update({
                isAssigned: false,
                macAddress: admin.firestore.FieldValue.delete(),
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            });
            
            console.log(`Unassigned device ID ${deviceId}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`Error unassigning device ID ${deviceId}:`, error);
        return false;
    }
}

// ฟังก์ชันสำหรับตรวจสอบและปลดการใช้งาน Device ID "1" ถ้าถูกใช้งานแล้ว
async function ensureDeviceIdOneIsAvailable() {
    try {
        const deviceId = "1";
        const isUsed = await isDeviceIdUsed(deviceId);
        
        if (isUsed) {
            console.log(`Device ID ${deviceId} is already in use. Unassigning...`);
            await unassignDeviceId(deviceId);
        }
        
        console.log(`Device ID ${deviceId} is now available for use`);
        return true;
    } catch (error) {
        console.error(`Error ensuring device ID 1 is available:`, error);
        return false;
    }
}

// เรียกใช้ฟังก์ชันเมื่อเริ่มต้นเซิร์ฟเวอร์
ensureDeviceIdOneIsAvailable().then(() => {
    console.log("Device ID 1 is ready for assignment");
});

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

// Generate new API key
app.post('/api/generate-key', (req, res) => {
    // สร้าง API key ใหม่
    const newApiKey = crypto.randomBytes(16).toString('hex');
    
    // เพิ่ม API key ใหม่ลงในชุด API keys
    apiKeys.add(newApiKey);
    
    console.log('Generated new API key:', newApiKey);
    
    res.json({
        success: true,
        message: 'API key generated successfully',
        apiKey: newApiKey
    });
});

// ===== เพิ่ม API สำหรับการลงทะเบียนอุปกรณ์ =====
// ลงทะเบียนอุปกรณ์ใหม่
app.post('/api/devices/register', validateApiKey, async (req, res) => {
    try {
        const { name, noiseThreshold, samplingPeriod, recordDuration, macAddress } = req.body;
        
        // ตรวจสอบว่ามี MAC address หรือไม่
        if (!macAddress) {
            return res.status(400).json({ 
                success: false, 
                error: 'MAC address is required for device registration' 
            });
        }
        
        // ตรวจสอบว่าอุปกรณ์นี้เคยลงทะเบียนแล้วหรือไม่
        const existingDeviceId = Object.keys(devices).find(id => 
            devices[id].macAddress === macAddress
        );
        
        if (existingDeviceId) {
            // ถ้าเคยลงทะเบียนแล้ว ให้ส่ง Device ID เดิมกลับไป
            console.log(`Device with MAC ${macAddress} already registered with ID: ${existingDeviceId}`);
            
            // อัปเดตข้อมูลล่าสุด
            devices[existingDeviceId].lastSeen = new Date().toISOString();
            if (noiseThreshold) devices[existingDeviceId].noiseThreshold = noiseThreshold;
            if (samplingPeriod) devices[existingDeviceId].samplingPeriod = samplingPeriod;
            if (recordDuration) devices[existingDeviceId].recordDuration = recordDuration;
            
            return res.json({
                success: true,
                deviceId: existingDeviceId,
                deviceData: devices[existingDeviceId]
            });
        }
        
        // ใช้ Device ID "1" โดยเฉพาะ
        const deviceId = "1";
        
        // ตรวจสอบว่า Device ID "1" ถูกใช้งานแล้วหรือไม่
        const isUsed = await isDeviceIdUsed(deviceId);
        
        if (isUsed) {
            // ถ้า Device ID "1" ถูกใช้งานแล้ว ให้ปลดการใช้งานก่อน
            await unassignDeviceId(deviceId);
        }
        
        // อัปเดตสถานะการใช้งาน Device ID ใน Firebase
        await markDeviceIdAsUsed(deviceId, macAddress);
        
        // บันทึกข้อมูลอุปกรณ์
        devices[deviceId] = {
            name: name || `SPL Device ${deviceId}`,
            macAddress: macAddress,
            noiseThreshold: noiseThreshold || 85.0,
            samplingPeriod: samplingPeriod || 1,
            recordDuration: recordDuration || 10,
            status: 'Active',
            createdAt: new Date().toISOString(),
            lastSeen: new Date().toISOString()
        };
        
        console.log(`Device registered with fixed ID: ${deviceId} with MAC: ${macAddress}`, devices[deviceId]);
        
        res.json({
            success: true,
            deviceId: deviceId,
            deviceData: devices[deviceId]
        });
    } catch (error) {
        console.error('Error registering device:', error);
        res.status(500).json({ success: false, error: 'Failed to register device' });
    }
});

// ดึงข้อมูลอุปกรณ์
app.get('/api/devices/:deviceId', validateApiKey, (req, res) => {
    try {
        const { deviceId } = req.params;
        
        if (!devices[deviceId]) {
            return res.status(404).json({ success: false, error: 'Device not found' });
        }
        
        // อัปเดตเวลาที่เห็นล่าสุด
        devices[deviceId].lastSeen = new Date().toISOString();
        
        res.json({
            success: true,
            data: devices[deviceId]
        });
    } catch (error) {
        console.error('Error getting device:', error);
        res.status(500).json({ success: false, error: 'Failed to get device data' });
    }
});

// อัปเดตการตั้งค่าอุปกรณ์
app.put('/api/devices/:deviceId', validateApiKey, (req, res) => {
    try {
        const { deviceId } = req.params;
        const { noiseThreshold, samplingPeriod, recordDuration, name, status } = req.body;
        
        if (!devices[deviceId]) {
            return res.status(404).json({ success: false, error: 'Device not found' });
        }
        
        // อัปเดตการตั้งค่า
        if (name !== undefined) devices[deviceId].name = name;
        if (noiseThreshold !== undefined) devices[deviceId].noiseThreshold = noiseThreshold;
        if (samplingPeriod !== undefined) devices[deviceId].samplingPeriod = samplingPeriod;
        if (recordDuration !== undefined) devices[deviceId].recordDuration = recordDuration;
        if (status !== undefined) devices[deviceId].status = status;
        
        devices[deviceId].lastSeen = new Date().toISOString();
        
        // ส่งการตั้งค่าใหม่ไปยังอุปกรณ์ผ่าน MQTT
        const topic = `spl/device/${deviceId}/settings`;
        const payload = {
            noiseThreshold: devices[deviceId].noiseThreshold,
            samplingPeriod: devices[deviceId].samplingPeriod,
            recordDuration: devices[deviceId].recordDuration,
            status: devices[deviceId].status
        };
        
        mqttClient.publish(topic, JSON.stringify(payload));
        
        res.json({
            success: true,
            data: devices[deviceId]
        });
    } catch (error) {
        console.error('Error updating device:', error);
        res.status(500).json({ success: false, error: 'Failed to update device' });
    }
});

// API endpoint สำหรับเปลี่ยนสถานะอุปกรณ์
app.put('/api/devices/:deviceId/status', validateApiKey, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { status } = req.body;
    
    if (!status || (status !== 'Active' && status !== 'Inactive')) {
      return res.status(400).json({ error: 'Invalid status. Must be "Active" or "Inactive"' });
    }
    
    // ตรวจสอบว่าอุปกรณ์มีอยู่หรือไม่
    if (!devices[deviceId]) {
      // ถ้าไม่พบอุปกรณ์ในเซิร์ฟเวอร์ ให้ตรวจสอบใน Firebase
      try {
        const deviceRef = db.collection('devices').doc(deviceId);
        const deviceDoc = await deviceRef.get();
        
        if (deviceDoc.exists) {
          // ถ้าพบใน Firebase ให้สร้างข้อมูลในเซิร์ฟเวอร์
          const deviceData = deviceDoc.data();
          devices[deviceId] = {
            name: deviceData.name || `SPL Device ${deviceId}`,
            macAddress: deviceData.macAddress || 'unknown',
            noiseThreshold: deviceData.noiseThreshold || 85.0,
            samplingPeriod: deviceData.samplingPeriod || 1,
            recordDuration: deviceData.recordDuration || 10,
            status: status, // ใช้สถานะที่ส่งมา
            createdAt: new Date().toISOString(),
            lastSeen: new Date().toISOString()
          };
          console.log(`Created device record from Firebase for: ${deviceId}`);
        } else {
          return res.status(404).json({ success: false, error: 'Device not found in Firebase' });
        }
      } catch (firebaseError) {
        console.error('Error checking device in Firebase:', firebaseError);
        return res.status(500).json({ error: 'Failed to check device in Firebase' });
      }
    }
    
    // อัปเดตสถานะอุปกรณ์ในเซิร์ฟเวอร์
    devices[deviceId].status = status;
    devices[deviceId].lastSeen = new Date().toISOString();
    
    // อัปเดตสถานะใน Firebase
    try {
      const deviceRef = db.collection('devices').doc(deviceId);
      await deviceRef.update({
        status: status,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Updated device status in Firebase: ${deviceId} -> ${status}`);
    } catch (firebaseError) {
      console.error('Error updating device status in Firebase:', firebaseError);
      // ไม่ต้องหยุดการทำงานถ้า Firebase มีปัญหา
    }
    
    // ส่งข้อมูลสถานะใหม่ผ่าน MQTT
    const topic = `spl/device/${deviceId}/settings`;
    const payload = {
      status: status,
      timestamp: new Date().toISOString()
    };
    
    mqttClient.publish(topic, JSON.stringify(payload));
    
    res.json({
      success: true,
      message: `Device status updated to ${status}`,
      deviceId,
      status
    });
  } catch (error) {
    console.error('Error updating device status:', error);
    res.status(500).json({ error: 'Failed to update device status' });
  }
});

// ดึงรายการอุปกรณ์ทั้งหมด
app.get('/api/devices', validateApiKey, (req, res) => {
    try {
        const deviceList = Object.entries(devices).map(([id, data]) => ({
            deviceId: id,
            ...data
        }));
        
        res.json({
            success: true,
            devices: deviceList
        });
    } catch (error) {
        console.error('Error getting devices:', error);
        res.status(500).json({ success: false, error: 'Failed to get devices' });
    }
});

// ===== เพิ่ม API สำหรับการอัปโหลดไฟล์เสียง =====
// อัปโหลดไฟล์เสียงด้วย multer
app.post('/api/recordings/upload/:deviceId', validateApiKey, validateDeviceStatus, upload.single('file'), (req, res) => {
    try {
        const { deviceId } = req.params;
        
        if (!devices[deviceId] && deviceId !== 'unknown') {
            // ถ้าไม่พบอุปกรณ์ ให้สร้างข้อมูลอุปกรณ์ใหม่
            devices[deviceId] = {
                name: `SPL Device ${deviceId}`,
                noiseThreshold: 85.0,
                samplingPeriod: 1,
                recordDuration: 10,
                status: 'Active',
                createdAt: new Date().toISOString(),
                lastSeen: new Date().toISOString()
            };
            console.log(`Created new device record for: ${deviceId}`);
        }
        
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        
        console.log(`File uploaded from device ${deviceId}: ${req.file.filename}`);
        
        // ในที่นี้คุณอาจจะเพิ่มการวิเคราะห์เสียงหรือส่งต่อไปยังบริการอื่น
        // สำหรับตัวอย่างนี้ เราจะส่งผลการวิเคราะห์จำลอง
        
        res.json({
            success: true,
            filename: req.file.filename,
            predictions: "Example noise classification result" // ตัวอย่างผลการวิเคราะห์
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ success: false, error: 'Failed to upload file' });
    }
});

// รับไฟล์เสียงโดยตรง (สำหรับ ESP32)
app.post('/api/recordings/upload-raw/:deviceId', validateApiKey, validateDeviceStatus, (req, res) => {
    try {
        const { deviceId } = req.params;
        
        if (!devices[deviceId] && deviceId !== 'unknown') {
            // ถ้าไม่พบอุปกรณ์ ให้สร้างข้อมูลอุปกรณ์ใหม่
            devices[deviceId] = {
                name: `SPL Device ${deviceId}`,
                noiseThreshold: 85.0,
                samplingPeriod: 1,
                recordDuration: 10,
                status: 'Active',
                createdAt: new Date().toISOString(),
                lastSeen: new Date().toISOString()
            };
            console.log(`Created new device record for: ${deviceId}`);
        }
        
        // สร้างโฟลเดอร์ถ้ายังไม่มี
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const filename = `${deviceId}_${Date.now()}.wav`;
        const filePath = path.join(uploadDir, filename);
        
        // สร้างไฟล์จาก request body
        const fileStream = fs.createWriteStream(filePath);
        
        req.pipe(fileStream);
        
        fileStream.on('finish', () => {
            console.log(`File uploaded from device ${deviceId}: ${filename}`);
            
            res.json({
                success: true,
                filename: filename,
                predictions: "Example noise classification result" // ตัวอย่างผลการวิเคราะห์
            });
        });
        
        fileStream.on('error', (err) => {
            console.error('Error saving file:', err);
            res.status(500).json({ success: false, error: 'Error saving file' });
        });
    } catch (error) {
        console.error('Error uploading raw file:', error);
        res.status(500).json({ success: false, error: 'Failed to upload file' });
    }
});

// Debug route - show all API keys
app.get('/api/keys', (req, res) => {
    res.json([...apiKeys]);
});

// ===== MQTT endpoints =====
// ส่งข้อความ MQTT ไปยังอุปกรณ์
app.post('/api/mqtt/publish', validateApiKey, async (req, res) => {
    try {
        const { topic, payload } = req.body;
        
        if (!topic || !payload) {
            return res.status(400).json({ error: 'Topic and payload are required' });
        }
        
        // ตรวจสอบว่าเป็นการส่งข้อมูลไปยังอุปกรณ์หรือไม่
        const topicParts = topic.split('/');
        if (topicParts[0] === 'spl' && topicParts[1] === 'device' && topicParts[3] === 'settings') {
            const deviceId = topicParts[2];
            
            // ตรวจสอบสถานะอุปกรณ์จาก Firebase
            try {
                const deviceRef = db.collection('devices').doc(deviceId);
                const deviceDoc = await deviceRef.get();
                
                if (deviceDoc.exists) {
                    const deviceData = deviceDoc.data();
                    
                    // ตรวจสอบว่าอุปกรณ์ active หรือไม่
                    if (deviceData.status === 'Inactive' && !payload.status) {
                        return res.status(403).json({ error: 'Cannot send settings to inactive device' });
                    }
                }
            } catch (firebaseError) {
                console.error('Error checking device status in Firebase:', firebaseError);
                // ไม่ต้องหยุดการทำงานถ้า Firebase มีปัญหา
            }
            
            // ตรวจสอบสถานะอุปกรณ์ในเซิร์ฟเวอร์
            if (devices[deviceId] && devices[deviceId].status === 'Inactive' && !payload.status) {
                return res.status(403).json({ error: 'Cannot send settings to inactive device' });
            }
        }
        
        console.log(`Publishing MQTT message to ${topic}:`, payload);
        
        // ส่งข้อความ MQTT
        mqttClient.publish(topic, JSON.stringify(payload), (err) => {
            if (err) {
                console.error('Error publishing MQTT message:', err);
                return res.status(500).json({ error: 'Failed to publish message' });
            }
            
            console.log(`MQTT message published to ${topic}`);
            res.json({ 
                success: true, 
                message: 'Settings sent to device',
                topic,
                timestamp: new Date().toISOString()
            });
        });
    } catch (error) {
        console.error('Error in MQTT publish endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// รับข้อความตอบกลับจากอุปกรณ์
app.post('/api/mqtt/subscribe', validateApiKey, (req, res) => {
    try {
        const { topic } = req.body;
        
        if (!topic) {
            return res.status(400).json({ error: 'Topic is required' });
        }
        
        console.log(`Subscribing to MQTT topic: ${topic}`);
        
        // Subscribe to topic
        mqttClient.subscribe(topic, (err) => {
            if (err) {
                console.error('Error subscribing to topic:', err);
                return res.status(500).json({ error: 'Failed to subscribe to topic' });
            }
            
            console.log(`Subscribed to MQTT topic: ${topic}`);
            res.json({ 
                success: true, 
                message: 'Subscribed to topic',
                topic,
                timestamp: new Date().toISOString()
            });
        });
    } catch (error) {
        console.error('Error in MQTT subscribe endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// เก็บข้อความล่าสุดจากแต่ละ topic
const latestMessages = {};

// รับข้อความจาก MQTT
mqttClient.on('message', (topic, message) => {
    try {
        console.log(`Received MQTT message from ${topic}:`, message.toString());
        
        // เก็บข้อความล่าสุด
        latestMessages[topic] = {
            message: JSON.parse(message.toString()),
            timestamp: new Date().toISOString()
        };
        
        // ตรวจสอบว่าเป็นข้อมูลจากอุปกรณ์หรือไม่
        const deviceInfoMatch = topic.match(/spl\/device\/([^\/]+)\/info/);
        if (deviceInfoMatch) {
            const deviceId = deviceInfoMatch[1];
            const deviceInfo = JSON.parse(message.toString());
            
            // อัปเดตหรือสร้างข้อมูลอุปกรณ์
            if (!devices[deviceId]) {
                devices[deviceId] = {
                    name: `SPL Device ${deviceId}`,
                    status: 'Active', // เพิ่มสถานะเริ่มต้นเป็น Active
                    createdAt: new Date().toISOString()
                };
            }
            
            // อัปเดตข้อมูลจาก MQTT
            devices[deviceId].lastSeen = new Date().toISOString();
            if (deviceInfo.noiseThreshold) devices[deviceId].noiseThreshold = deviceInfo.noiseThreshold;
            if (deviceInfo.samplingPeriod) devices[deviceId].samplingPeriod = deviceInfo.samplingPeriod;
            if (deviceInfo.recordDuration) devices[deviceId].recordDuration = deviceInfo.recordDuration;
            if (deviceInfo.status) devices[deviceId].status = deviceInfo.status;
            
            console.log(`Updated device info for ${deviceId}:`, devices[deviceId]);
        }
        
        // ตรวจสอบว่าเป็นข้อมูลสถานะจากอุปกรณ์หรือไม่
        const deviceStatusMatch = topic.match(/spl\/device\/([^\/]+)\/status/);
        if (deviceStatusMatch) {
            const deviceId = deviceStatusMatch[1];
            const statusInfo = JSON.parse(message.toString());
            
            // อัปเดตหรือสร้างข้อมูลอุปกรณ์
            if (!devices[deviceId]) {
                devices[deviceId] = {
                    name: `SPL Device ${deviceId}`,
                    status: 'Active', // เพิ่มสถานะเริ่มต้นเป็น Active
                    createdAt: new Date().toISOString()
                };
            }
            
            // อัปเดตสถานะจาก MQTT
            devices[deviceId].lastSeen = new Date().toISOString();
            if (statusInfo.status) {
                devices[deviceId].status = statusInfo.status;
                
                // อัปเดตสถานะใน Firebase
                try {
                    const deviceRef = db.collection('devices').doc(deviceId);
                    deviceRef.update({
                        status: statusInfo.status,
                        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                    });
                    console.log(`Updated device status in Firebase from MQTT: ${deviceId} -> ${statusInfo.status}`);
                } catch (firebaseError) {
                    console.error('Error updating device status in Firebase from MQTT:', firebaseError);
                }
            }
            
            console.log(`Updated device status for ${deviceId}:`, devices[deviceId]);
        }
    } catch (error) {
        console.error('Error processing MQTT message:', error);
        latestMessages[topic] = {
            message: message.toString(),
            timestamp: new Date().toISOString(),
            error: 'Failed to parse JSON'
        };
    }
});

// ดึงข้อความล่าสุดจาก topic
app.get('/api/mqtt/messages/:topic', validateApiKey, (req, res) => {
    const topic = req.params.topic;
    
    if (!latestMessages[topic]) {
        return res.status(404).json({ error: 'No messages received from this topic' });
    }
    
    res.json({
        success: true,
        topic,
        data: latestMessages[topic]
    });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on all interfaces on port ${PORT}`);
});