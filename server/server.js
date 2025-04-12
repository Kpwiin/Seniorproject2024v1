const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt');
const crypto = require('crypto');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { promisify } = require('util');
const fetch = require('node-fetch');
const FormData = require('form-data');
const { getFirestore } = require('firebase-admin/firestore');
const app = express();
const class_labels = [
    'Engine', 
    'Car Horn', 
    'Chainsaw', 
    'Drilling',
    'Handsaw', 
    'Jackhammer', 
    'Street Music', 
    'Others'
];

// สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// เชื่อมต่อกับ Firebase
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
const apiKeys = new Set([defaultApiKey]);

// เก็บข้อมูลอุปกรณ์
const devices = {};
const latestMessages = {};

// ตั้งค่าการเก็บไฟล์
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const deviceId = req.params.deviceId || 'unknown';
        cb(null, `${deviceId}_${Date.now()}${path.extname(file.originalname) || '.wav'}`);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'audio/wav' || 
            file.mimetype === 'application/octet-stream' ||
            file.originalname.endsWith('.wav')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type, only WAV files are allowed'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// เชื่อมต่อกับ MQTT broker
const mqttClient = mqtt.connect('mqtt://test.mosquitto.org');

mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
    mqttClient.subscribe('spl/device/+/data');
    mqttClient.subscribe('spl/device/+/status');
    mqttClient.subscribe('spl/device/+/info');
});

mqttClient.on('error', (error) => {
    console.error('MQTT connection error:', error);
});

// Utility Functions
async function predictNoiseWithFlaskAPI(audioBuffer) {
    try {
        console.log('Simulating noise prediction');
        console.log('Audio buffer size:', audioBuffer.length);

        // สุ่มเลือกประเภทเสียง
        const randomIndex = Math.floor(Math.random() * class_labels.length);
        const predictedClass = class_labels[randomIndex];

        // สร้างค่าความน่าจะเป็นแบบสุ่ม (50-100%)
        const mainProbability = 50 + Math.random() * 50;

        // สร้าง predictions สำหรับทุกประเภทเสียง
        const predictions = class_labels.map(label => {
            if (label === predictedClass) {
                return {
                    class: label,
                    probability: parseFloat(mainProbability.toFixed(2))
                };
            } else {
                // สำหรับ class อื่นๆ ให้มีค่าความน่าจะเป็นน้อยกว่า class หลัก
                return {
                    class: label,
                    probability: parseFloat((Math.random() * (mainProbability - 10)).toFixed(2))
                };
            }
        });

        // เรียงลำดับตามความน่าจะเป็นจากมากไปน้อย
        const sortedPredictions = predictions.sort((a, b) => b.probability - a.probability);

        console.log('Prediction result:', {
            class: predictedClass,
            probability: mainProbability,
            allPredictions: sortedPredictions
        });

        return {
            class: predictedClass,
            probability: mainProbability,
            allPredictions: sortedPredictions
        };

    } catch (error) {
        console.error('Prediction error:', error);
        return {
            class: 'Unknown',
            probability: 0,
            allPredictions: []
        };
    }
}
async function getOrCreateDeviceId(macAddress) {
    try {
        const cleanMacAddress = macAddress.replace(/:/g, '').toLowerCase();
        console.log('Searching for device with MAC:', cleanMacAddress);

        const devicesRef = db.collection('devices');
        const snapshot = await devicesRef.where('macAddress', '==', cleanMacAddress).get();

        if (!snapshot.empty) {
            const device = snapshot.docs[0];
            const deviceId = device.id;
            console.log(`Found existing device with MAC ${cleanMacAddress}, ID: ${deviceId}`);
            return deviceId;
        }

        const allDevicesSnapshot = await devicesRef.orderBy('deviceNumber', 'desc').limit(1).get();
        let nextDeviceNumber = 1;

        if (!allDevicesSnapshot.empty) {
            const lastDevice = allDevicesSnapshot.docs[0];
            nextDeviceNumber = (lastDevice.data().deviceNumber || 0) + 1;
        }

        const newDeviceId = nextDeviceNumber.toString();

        await devicesRef.doc(newDeviceId).set({
            macAddress: cleanMacAddress,
            deviceNumber: nextDeviceNumber,
            status: 'Active',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastSeen: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`Created new device with MAC ${cleanMacAddress}, ID: ${newDeviceId}`);
        return newDeviceId;
    } catch (error) {
        console.error('Error in getOrCreateDeviceId:', error);
        throw error;
    }
}

function formatSPLValue(value) {
    return parseFloat(parseFloat(value).toFixed(2));
}

async function getNextDocumentId(collectionName) {
    try {
        const snapshot = await db.collection(collectionName)
            .orderBy('date._seconds', 'desc')
            .limit(1)
            .get();

        if (snapshot.empty) {
            return '00001';
        }

        const lastDoc = snapshot.docs[0];
        const lastId = parseInt(lastDoc.id);
        const nextId = (lastId + 1).toString().padStart(5, '0');
        return nextId;
    } catch (error) {
        console.error('Error getting next document ID:', error);
        throw error;
    }
}

// Middleware
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

const validateDeviceStatus = async (req, res, next) => {
    try {
        const deviceId = req.params.deviceId || req.body.deviceId;
        
        if (!deviceId) {
            return res.status(400).json({ error: 'Device ID is required' });
        }
        
        const deviceRef = db.collection('devices').doc(deviceId);
        const deviceDoc = await deviceRef.get();
        
        if (!deviceDoc.exists) {
            return res.status(404).json({ error: 'Device not found' });
        }
        
        const deviceData = deviceDoc.data();
        
        if (deviceData.status !== 'Active') {
            return res.status(403).json({ error: 'Device is inactive' });
        }
        
        req.deviceData = deviceData;
        next();
    } catch (error) {
        console.error('Error validating device status:', error);
        res.status(500).json({ error: 'Failed to validate device status' });
    }
};

// API Endpoints
app.post('/api/recordings/upload/:deviceId', async (req, res) => {
    try {
        console.log('Upload request received');
        const { deviceId } = req.params;
        const { spl_value } = req.query;

        // สร้าง reference ไปยัง device document ตั้งแต่ต้น
        const deviceRef = db.collection('devices').doc(deviceId);
        const deviceDoc = await deviceRef.get();

        if (!deviceDoc.exists) {
            return res.status(404).json({
                success: false,
                message: 'Device not found'
            });
        }

        let chunks = [];
        req.on('data', chunk => {
            chunks.push(chunk);
        });

        req.on('end', async () => {
            try {
                const audioBuffer = Buffer.concat(chunks);
                console.log('Received audio file size:', audioBuffer.length);

                // แปลงเป็น base64
                const audioBase64 = audioBuffer.toString('base64');
                const timestamp = admin.firestore.Timestamp.now();

                // ทำนายประเภทเสียง
                console.log('Predicting noise type...');
                const prediction = await predictNoiseWithFlaskAPI(audioBuffer);
                console.log('Prediction result:', prediction);
                
                // สร้างข้อมูลพื้นฐาน
                const soundData = {
                    deviceId: deviceId,
                    level: parseFloat(spl_value),
                    date: {
                        _seconds: timestamp.seconds,
                        _nanoseconds: timestamp.nanoseconds
                    },
                    audioData: audioBase64,
                    result: prediction.class,
                    macAddress: deviceDoc.data().macAddress // ใช้ MAC address จาก device document
                };

                // บันทึกข้อมูล
                const nextDocId = await getNextDocumentId('sounds');
                const soundRef = db.collection('sounds').doc(nextDocId);
                await soundRef.set(soundData);

                // อัพเดทข้อมูลอุปกรณ์
                await deviceRef.update({
                    lastSeen: admin.firestore.FieldValue.serverTimestamp(),
                    lastSPLValue: parseFloat(spl_value),
                    lastResults: prediction.class,
                    lastRecordingId: nextDocId
                });

                // ส่งผลการทำนายผ่าน MQTT
                const mqttTopic = `spl/device/${deviceId}/prediction`;
                const mqttMessage = JSON.stringify({
                    device_id: deviceId,
                    recording_id: nextDocId,
                    spl_value: parseFloat(spl_value),
                    results: prediction.class,
                    timestamp: Date.now()
                });

                mqttClient.publish(mqttTopic, mqttMessage);

                console.log(`Successfully saved recording with ID: ${nextDocId}`);
                console.log('Result:', prediction.class);

                res.json({
                    success: true,
                    message: 'Recording uploaded and processed successfully',
                    recordingId: nextDocId,
                    results: prediction.class
                });

            } catch (error) {
                console.error('Error processing upload:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to process upload',
                    error: error.message
                });
            }
        });
    } catch (error) {
        console.error('Error handling upload:', error);
        res.status(500).json({
            success: false,
            message: 'Upload failed',
            error: error.message
        });
    }
});
// แก้ไข endpoint สำหรับอัพเดตการตั้งค่า
app.put('/api/devices/:deviceId', async (req, res) => {
    try {
        const { deviceId } = req.params;
        const updateData = {};

        // รวบรวมข้อมูลที่จะอัพเดต
        if (req.body.noiseThreshold !== undefined) {
            updateData.noiseThreshold = Number(req.body.noiseThreshold);
        }
        if (req.body.samplingPeriod !== undefined) {
            updateData.samplingPeriod = Number(req.body.samplingPeriod);
        }
        if (req.body.recordDuration !== undefined) {
            updateData.recordDuration = Number(req.body.recordDuration);
        }
        if (req.body.status !== undefined) {
            updateData.status = req.body.status;
        }

        updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        // อัพเดตข้อมูลใน Firestore
        const deviceRef = db.collection('devices').doc(deviceId);
        await deviceRef.update(updateData);

        // ส่งข้อมูลผ่าน MQTT ไปยังอุปกรณ์
        const mqttTopic = `spl/device/${deviceId}/settings`;
        const mqttMessage = JSON.stringify({
            ...updateData,
            timestamp: Date.now()
        });

        mqttClient.publish(mqttTopic, mqttMessage, { retain: true }, (err) => {
            if (err) {
                console.error('Error publishing MQTT message:', err);
            } else {
                console.log('Published MQTT message:', mqttTopic, mqttMessage);
            }
        });

        res.json({
            success: true,
            message: 'Settings updated successfully',
            deviceId: deviceId,
            updatedSettings: updateData
        });

    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update settings',
            error: error.message
        });
    }
});
// เพิ่ม endpoint สำหรับอัพเดตสถานะ
app.put('/api/devices/:deviceId/status', async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { status } = req.body;

        console.log('Updating device status:', {
            deviceId,
            status
        });

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        // อัพเดตสถานะใน Firestore
        const deviceRef = db.collection('devices').doc(deviceId);
        const deviceDoc = await deviceRef.get();

        if (!deviceDoc.exists) {
            return res.status(404).json({
                success: false,
                message: 'Device not found'
            });
        }

        await deviceRef.update({
            status: status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // ส่งข้อมูลผ่าน MQTT ไปยังอุปกรณ์
        const mqttTopic = `spl/device/${deviceId}/settings`;
        const mqttMessage = JSON.stringify({
            status: status,
            timestamp: Date.now()
        });

        mqttClient.publish(mqttTopic, mqttMessage, { retain: true }, (err) => {
            if (err) {
                console.error('Error publishing MQTT message:', err);
            } else {
                console.log('Published MQTT message:', mqttTopic, mqttMessage);
            }
        });

        console.log(`Successfully updated device ${deviceId} status to ${status}`);

        res.json({
            success: true,
            message: `Device status updated to ${status}`,
            deviceId: deviceId,
            status: status
        });

    } catch (error) {
        console.error('Error updating device status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update device status',
            error: error.message
        });
    }
});
// เพิ่ม endpoint สำหรับดึงข้อมูลอุปกรณ์
app.get('/api/devices/:deviceId', async (req, res) => {
    try {
        const { deviceId } = req.params;
        
        const deviceRef = db.collection('devices').doc(deviceId);
        const deviceDoc = await deviceRef.get();

        if (!deviceDoc.exists) {
            return res.status(404).json({
                success: false,
                message: 'Device not found'
            });
        }

        const deviceData = deviceDoc.data();

        res.json({
            success: true,
            device: {
                id: deviceId,
                ...deviceData
            }
        });

    } catch (error) {
        console.error('Error getting device:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get device',
            error: error.message
        });
    }
});

// เพิ่ม endpoint สำหรับดึงรายการอุปกรณ์ทั้งหมด
app.get('/api/devices', async (req, res) => {
    try {
        const devicesRef = db.collection('devices');
        const snapshot = await devicesRef.get();

        const devices = [];
        snapshot.forEach(doc => {
            devices.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.json({
            success: true,
            devices: devices
        });

    } catch (error) {
        console.error('Error getting devices:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get devices',
            error: error.message
        });
    }
});

// MQTT message handler
mqttClient.on('message', async (topic, message) => {
    try {
        console.log(`Received MQTT message from ${topic}:`, message.toString());
        
        const messageData = JSON.parse(message.toString());
        
        // แยกประเภทของ topic
        if (topic.includes('/status')) {
            // จัดการข้อความสถานะ
            const deviceId = messageData.device_id;
            if (!deviceId) {
                console.log('No device ID in status message');
                return;
            }

            const deviceRef = db.collection('devices').doc(deviceId);
            await deviceRef.update({
                status: messageData.status,
                lastSeen: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`Updated device ${deviceId} status to ${messageData.status}`);

            // ส่งการยืนยันกลับไปยังอุปกรณ์
            const confirmTopic = `spl/device/${deviceId}/status/confirm`;
            mqttClient.publish(confirmTopic, JSON.stringify({
                status: messageData.status,
                timestamp: Date.now()
            }));

        } else if (topic.includes('/settings/update')) {
            // จัดการการอัพเดทการตั้งค่า
            const deviceId = messageData.device_id;
            if (!deviceId) {
                console.log('No device ID in settings update message');
                return;
            }

            const updateData = {};
            if (messageData.noiseThreshold !== undefined) {
                updateData.noiseThreshold = Number(messageData.noiseThreshold);
            }
            if (messageData.samplingPeriod !== undefined) {
                updateData.samplingPeriod = Number(messageData.samplingPeriod);
            }
            if (messageData.recordDuration !== undefined) {
                updateData.recordDuration = Number(messageData.recordDuration);
            }
            if (messageData.status !== undefined) {
                updateData.status = messageData.status;
            }

            updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

            const deviceRef = db.collection('devices').doc(deviceId);
            await deviceRef.update(updateData);

            console.log(`Updated device ${deviceId} settings:`, updateData);

            // ส่งการยืนยันกลับไปยังอุปกรณ์
            const confirmTopic = `spl/device/${deviceId}/settings/confirm`;
            mqttClient.publish(confirmTopic, JSON.stringify({
                ...updateData,
                timestamp: Date.now()
            }));

        } else if (topic.includes('/data')) {
            // จัดการข้อมูล SPL
            const deviceId = messageData.device_id;
            const macAddress = messageData.mac_address;
            
            if (!deviceId || !macAddress) {
                console.log('Missing device ID or MAC address in data message');
                return;
            }

            if (messageData.spl_value !== undefined) {
                const formattedSPLValue = formatSPLValue(messageData.spl_value);
                const timestamp = admin.firestore.Timestamp.now();
                
                const soundData = {
                    deviceId: deviceId,
                    level: formattedSPLValue,
                    date: {
                        _seconds: timestamp.seconds,
                        _nanoseconds: timestamp.nanoseconds
                    },
                    macAddress: macAddress
                };

                const nextDocId = await getNextDocumentId('sounds');
                const soundRef = db.collection('sounds').doc(nextDocId);
                await soundRef.set(soundData);
                
                const deviceRef = db.collection('devices').doc(deviceId);
                await deviceRef.update({
                    lastSeen: admin.firestore.FieldValue.serverTimestamp(),
                    lastSPLValue: formattedSPLValue
                });
                
                console.log(`Saved SPL data to Firebase with ID: ${nextDocId}`);
            }
        }
    } catch (error) {
        console.error('Error processing MQTT message:', error);
    }
});

// เพิ่ม MQTT subscriptions
mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
    mqttClient.subscribe('spl/device/+/data');
    mqttClient.subscribe('spl/device/+/status');
    mqttClient.subscribe('spl/device/+/info');
    mqttClient.subscribe('spl/device/+/settings/update');
});
// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message: 'File upload error',
            error: err.message
        });
    }
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
    });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on all interfaces on port ${PORT}`);
});