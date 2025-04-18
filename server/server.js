const express = require('express')
const cors = require('cors')
const mqtt = require('mqtt')
const crypto = require('crypto')
const multer = require('multer')
const path = require('path')
const admin = require('firebase-admin')
const { promisify } = require('util')
const fetch = require('node-fetch')
const FormData = require('form-data')
const { getFirestore } = require('firebase-admin/firestore')
const app = express()

const class_labels = [
  'Engine',
  'Car Horn',
  'Chainsaw',
  'Drilling',
  'Handsaw',
  'Jackhammer',
  'Street Music',
  'Others',
]

// เชื่อมต่อกับ Firebase
const serviceAccount = require('./serviceAccountKey.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'noise-monitoring-system-5c950.firebasestorage.app', // ใช้ URL นี้
})
const bucket = admin.storage().bucket()
const db = admin.firestore()

// Middleware
app.use(
  cors({
    origin: '*', // or restrict to your frontend domain
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)
app.use(express.json())

// สร้าง API key เริ่มต้น
const defaultApiKey = 'test-api-key'
const apiKeys = new Set([defaultApiKey])

// เก็บข้อมูลอุปกรณ์
const devices = {}
const latestMessages = {}

// ตั้งค่า multer สำหรับการอัพโหลดไฟล์
const storage = multer.memoryStorage()
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'audio/wav' ||
      file.mimetype === 'application/octet-stream' ||
      file.originalname.endsWith('.wav')
    ) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type, only WAV files are allowed'))
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
})

// เชื่อมต่อกับ MQTT broker
const mqttClient = mqtt.connect('mqtt://broker.emqx.io:1883', {
    keepalive: 60,
    reconnectPeriod: 1000,
    clientId: `mqtt_${Math.random().toString(16).slice(3)}`,
    clean: true,
});
mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker')
  mqttClient.subscribe('spl/device/+/data')
  mqttClient.subscribe('spl/device/+/status')
  mqttClient.subscribe('spl/device/+/info')
})

mqttClient.on('error', error => {
  console.error('MQTT connection error:', error)
})

// Utility Functions
async function predictNoiseWithFlaskAPI(audioBuffer) {
  try {
    console.log('Simulating noise prediction')
    console.log('Audio buffer size:', audioBuffer.length)

    const randomIndex = Math.floor(Math.random() * class_labels.length)
    const predictedClass = class_labels[randomIndex]
    const mainProbability = 50 + Math.random() * 50

    const predictions = class_labels.map(label => {
      if (label === predictedClass) {
        return {
          class: label,
          probability: parseFloat(mainProbability.toFixed(2)),
        }
      } else {
        return {
          class: label,
          probability: parseFloat(
            (Math.random() * (mainProbability - 10)).toFixed(2),
          ),
        }
      }
    })

    const sortedPredictions = predictions.sort(
      (a, b) => b.probability - a.probability,
    )

    return {
      class: predictedClass,
      probability: mainProbability,
      allPredictions: sortedPredictions,
    }
  } catch (error) {
    console.error('Prediction error:', error)
    return {
      class: 'Unknown',
      probability: 0,
      allPredictions: [],
    }
  }
}

// เพิ่มฟังก์ชันตรวจสอบการเชื่อมต่อ
async function checkStorageConnection() {
  try {
    console.log('Checking storage connection...')
    console.log('Bucket name:', bucket.name)
    const [exists] = await bucket.exists()
    console.log('Bucket exists:', exists)
    const [files] = await bucket.getFiles()
    console.log('Number of files in bucket:', files.length)
  } catch (error) {
    console.error('Storage connection error:', error)
  }
}

// เรียกใช้ตอนเริ่มต้นเซิร์ฟเวอร์
checkStorageConnection()

// เพิ่มฟังก์ชันตรวจสอบไฟล์ WAV
function validateWavFile(buffer) {
  try {
    // ตรวจสอบว่าเป็นไฟล์ WAV จริงหรือไม่
    if (buffer.length < 44) {
      // WAV header มีขนาด 44 bytes
      console.error('Invalid WAV file: too small')
      return false
    }

    // ตรวจสอบ RIFF header
    if (buffer.toString('ascii', 0, 4) !== 'RIFF') {
      console.error('Invalid WAV file: missing RIFF header')
      return false
    }

    // ตรวจสอบ WAVE format
    if (buffer.toString('ascii', 8, 12) !== 'WAVE') {
      console.error('Invalid WAV file: missing WAVE format')
      return false
    }

    console.log('WAV file validation passed')
    return true
  } catch (error) {
    console.error('Error validating WAV file:', error)
    return false
  }
}

async function getOrCreateDeviceId(macAddress) {
  try {
    const cleanMacAddress = macAddress.replace(/:/g, '').toLowerCase()
    console.log('Searching for device with MAC:', cleanMacAddress)

    const devicesRef = db.collection('devices')
    const snapshot = await devicesRef
      .where('macAddress', '==', cleanMacAddress)
      .get()

    if (!snapshot.empty) {
      const device = snapshot.docs[0]
      return device.id
    }

    const allDevicesSnapshot = await devicesRef
      .orderBy('deviceNumber', 'desc')
      .limit(1)
      .get()
    let nextDeviceNumber = 1

    if (!allDevicesSnapshot.empty) {
      const lastDevice = allDevicesSnapshot.docs[0]
      nextDeviceNumber = (lastDevice.data().deviceNumber || 0) + 1
    }

    const newDeviceId = nextDeviceNumber.toString()

    await devicesRef.doc(newDeviceId).set({
      macAddress: cleanMacAddress,
      deviceNumber: nextDeviceNumber,
      status: 'Active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSeen: admin.firestore.FieldValue.serverTimestamp(),
    })

    return newDeviceId
  } catch (error) {
    console.error('Error in getOrCreateDeviceId:', error)
    throw error
  }
}

function formatSPLValue(value) {
  return parseFloat(parseFloat(value).toFixed(2))
}

async function getNextDocumentId(collectionName) {
  try {
    const snapshot = await db
      .collection(collectionName)
      .orderBy('date._seconds', 'desc')
      .limit(1)
      .get()

    if (snapshot.empty) {
      return '00001'
    }

    const lastDoc = snapshot.docs[0]
    const lastId = parseInt(lastDoc.id)
    const nextId = (lastId + 1).toString().padStart(5, '0')
    return nextId
  } catch (error) {
    console.error('Error getting next document ID:', error)
    throw error
  }
}

// API Endpoints
app.post('/api/recordings/upload/:deviceId', async (req, res) => {
  try {
    console.log('Upload request received')
    const { deviceId } = req.params
    const { spl_value } = req.query

    const deviceRef = db.collection('devices').doc(deviceId)
    const deviceDoc = await deviceRef.get()

    if (!deviceDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
      })
    }

    // ดึงค่า threshold จาก device document หรือใช้ค่าเริ่มต้น (85)
    const noiseThreshold = deviceDoc.data().noiseThreshold || 85

    let chunks = []
    req.on('data', chunk => {
      chunks.push(chunk)
    })

    req.on('end', async () => {
      try {
        const audioBuffer = Buffer.concat(chunks)
        console.log('Received audio file size:', audioBuffer.length)

        if (audioBuffer.length === 0) {
          throw new Error('Empty audio file')
        }

        // ตรวจสอบความถูกต้องของไฟล์ WAV
        if (!validateWavFile(audioBuffer)) {
          throw new Error('Invalid WAV file format')
        }

        const timestamp = admin.firestore.Timestamp.now()

        // ตรวจสอบว่ามีการอัปโหลดไฟล์เสียงไปแล้วหรือยัง (เพิ่มช่วงเวลา)
        const existingSoundSnapshot = await db
          .collection('sounds')
          .where('deviceId', '==', deviceId)
          .where('date._seconds', '>=', timestamp.seconds - 5)
          .where('date._seconds', '<=', timestamp.seconds + 5)
          .get()

        if (!existingSoundSnapshot.empty) {
          console.log(
            'Sound data for this timestamp already exists. Skipping upload.',
          )
          return res.status(200).json({
            success: true,
            message: 'Sound data already exists. Skipping upload.',
          })
        }

        // ตรวจสอบค่า SPL กับ threshold
        if (parseFloat(spl_value) <= noiseThreshold) {
          // ถ้าค่าไม่เกิน threshold จะไม่บันทึกเลย (เพราะจะให้ MQTT ทำงานส่วนนี้แทน)
          return res.status(200).json({
            success: true,
            message: 'SPL value below threshold. No recording saved.',
          })
        }

        // ถ้าค่า SPL เกิน threshold จึงทำการบันทึกไฟล์และข้อมูล
        let filename = `recordings/${deviceId}/${timestamp.seconds}_${timestamp.nanoseconds}.wav`
        const file = bucket.file(filename)

        // อัพโหลดไฟล์ไปยัง Cloud Storage
        await file.save(audioBuffer, {
          metadata: {
            contentType: 'audio/wav',
            metadata: {
              deviceId: deviceId,
              timestamp: timestamp.seconds,
            },
          },
        })

        // ตั้งค่าให้ไฟล์เป็น public
        await file.makePublic()
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`
        console.log('Public URL:', publicUrl)

        // ทำนายประเภทเสียง
        const prediction = await predictNoiseWithFlaskAPI(audioBuffer)
        const predictionResult = prediction.class

        // สร้างข้อมูลเสียงที่จะบันทึก (แบบเต็ม)
        const soundData = {
          deviceId: deviceId,
          level: parseFloat(spl_value),
          date: {
            _seconds: timestamp.seconds,
            _nanoseconds: timestamp.nanoseconds,
          },
          macAddress: deviceDoc.data().macAddress,
          audioUrl: publicUrl,
          storagePath: filename,
          result: predictionResult,
        }

        const nextDocId = await getNextDocumentId('sounds')
        const soundRef = db.collection('sounds').doc(nextDocId)
        await soundRef.set(soundData)

        // อัพเดทข้อมูลอุปกรณ์
        await deviceRef.update({
          lastSeen: admin.firestore.FieldValue.serverTimestamp(),
          lastSPLValue: parseFloat(spl_value),
          lastResults: predictionResult,
          lastRecordingId: nextDocId,
          lastAudioUrl: publicUrl,
        })

        // ส่งข้อมูลผ่าน MQTT
        const mqttData = {
          device_id: deviceId,
          recording_id: nextDocId,
          spl_value: parseFloat(spl_value),
          timestamp: Date.now(),
          results: predictionResult,
          audio_url: publicUrl,
        }

        const mqttTopic = `spl/device/${deviceId}/prediction`
        mqttClient.publish(mqttTopic, JSON.stringify(mqttData))

        res.json({
          success: true,
          message: 'Recording processed successfully',
          recordingId: nextDocId,
          level: parseFloat(spl_value),
          results: predictionResult,
          audioUrl: publicUrl,
        })
      } catch (error) {
        console.error('Error processing upload:', error)
        // ถ้าเกิด error ให้ลบไฟล์ที่อัพโหลดไปแล้ว (ถ้ามี)
        if (filename) {
          try {
            const file = bucket.file(filename)
            const [exists] = await file.exists()
            if (exists) {
              await file.delete()
            }
          } catch (deleteError) {
            console.error('Error deleting failed upload:', deleteError)
          }
        }

        res.status(500).json({
          success: false,
          message: 'Failed to process upload',
          error: error.message,
        })
      }
    })
  } catch (error) {
    console.error('Error handling upload:', error)
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message,
    })
  }
})

app.get('/api/recordings/:recordingId/download', async (req, res) => {
  try {
    const { recordingId } = req.params

    const soundRef = db.collection('sounds').doc(recordingId)
    const soundDoc = await soundRef.get()

    if (!soundDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found',
      })
    }

    const soundData = soundDoc.data()

    if (!soundData.storagePath) {
      return res.status(404).json({
        success: false,
        message: 'No storage path found for this recording',
      })
    }

    const file = bucket.file(soundData.storagePath)
    const [exists] = await file.exists()

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: 'Audio file not found in storage',
      })
    }

    // ตั้งค่าให้ไฟล์เป็น public (ถ้ายังไม่ได้ตั้งค่า)
    await file.makePublic()

    // สร้าง URL แบบ public
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${soundData.storagePath}`

    await soundRef.update({
      audioUrl: publicUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    res.redirect(publicUrl)
  } catch (error) {
    console.error('Error getting recording:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get recording',
      error: error.message,
    })
  }
})

app.delete('/api/recordings/:recordingId', async (req, res) => {
  try {
    const { recordingId } = req.params

    const soundRef = db.collection('sounds').doc(recordingId)
    const soundDoc = await soundRef.get()

    if (!soundDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found',
      })
    }

    const soundData = soundDoc.data()

    if (soundData.storagePath) {
      const file = bucket.file(soundData.storagePath)
      const [exists] = await file.exists()
      if (exists) {
        await file.delete()
      }
    }

    await soundRef.delete()

    res.json({
      success: true,
      message: 'Recording deleted successfully',
      recordingId: recordingId,
    })
  } catch (error) {
    console.error('Error deleting recording:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete recording',
      error: error.message,
    })
  }
})

// Device Management Endpoints
app.put('/api/devices/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params
    const updateData = {}

    if (req.body.noiseThreshold !== undefined) {
      updateData.noiseThreshold = Number(req.body.noiseThreshold)
    }
    if (req.body.samplingPeriod !== undefined) {
      updateData.samplingPeriod = Number(req.body.samplingPeriod)
    }
    if (req.body.recordDuration !== undefined) {
      updateData.recordDuration = Number(req.body.recordDuration)
    }
    if (req.body.status !== undefined) {
      updateData.status = req.body.status
    }

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp()

    const deviceRef = db.collection('devices').doc(deviceId)
    await deviceRef.update(updateData)

    const mqttTopic = `spl/device/${deviceId}/settings`
    const mqttMessage = JSON.stringify({
      ...updateData,
      timestamp: Date.now(),
    })

    mqttClient.publish(mqttTopic, mqttMessage, { retain: true })

    res.json({
      success: true,
      message: 'Settings updated successfully',
      deviceId: deviceId,
      updatedSettings: updateData,
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message,
    })
  }
})

app.get('/api/devices/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params

    const deviceRef = db.collection('devices').doc(deviceId)
    const deviceDoc = await deviceRef.get()

    if (!deviceDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
      })
    }

    res.json({
      success: true,
      device: {
        id: deviceId,
        ...deviceDoc.data(),
      },
    })
  } catch (error) {
    console.error('Error getting device:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get device',
      error: error.message,
    })
  }
})

// เพิ่ม route สำหรับอัพเดทสถานะอุปกรณ์
app.put('/api/devices/:deviceId/status', async (req, res) => {
  try {
    const { deviceId } = req.params
    const { status } = req.body

    console.log(`Updating device ${deviceId} status to: ${status}`) // เพิ่ม log

    // ตรวจสอบว่ามี deviceId และ status
    if (!deviceId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Device ID and status are required',
      })
    }

    // อัพเดทสถานะใน Firestore
    const deviceRef = db.collection('devices').doc(deviceId)
    const deviceDoc = await deviceRef.get()

    if (!deviceDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
      })
    }

    await deviceRef.update({
      status: status,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    })

    // เพิ่มการส่ง MQTT message เพื่อแจ้งอุปกรณ์
    const mqttTopic = `spl/device/${deviceId}/settings`
    const mqttMessage = JSON.stringify({
      device_id: deviceId,
      status: status,
      timestamp: Date.now(),
    })

    mqttClient.publish(mqttTopic, mqttMessage)
    console.log(`Published MQTT message to ${mqttTopic}:`, mqttMessage)

    res.json({
      success: true,
      message: 'Device status updated successfully',
      deviceId: deviceId,
      status: status,
    })
  } catch (error) {
    console.error('Error updating device status:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update device status',
      error: error.message,
    })
  }
})

app.get('/api/devices', async (req, res) => {
  try {
    const devicesRef = db.collection('devices')
    const snapshot = await devicesRef.get()

    const devices = []
    snapshot.forEach(doc => {
      devices.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    res.json({
      success: true,
      devices: devices,
    })
  } catch (error) {
    console.error('Error getting devices:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get devices',
      error: error.message,
    })
  }
})

// MQTT Message Handler - แก้ไขเพื่อลดการบันทึกซ้ำซ้อน
mqttClient.on('message', async (topic, message) => {
  try {
    console.log(`Received MQTT message from ${topic}:`, message.toString())

    const messageData = JSON.parse(message.toString())

    if (topic.includes('/status')) {
      const deviceId = messageData.device_id
      if (!deviceId) {
        console.log('No device ID in status message')
        return
      }

      const deviceRef = db.collection('devices').doc(deviceId)
      await deviceRef.update({
        status: messageData.status,
        lastSeen: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      const confirmTopic = `spl/device/${deviceId}/status/confirm`
      mqttClient.publish(
        confirmTopic,
        JSON.stringify({
          status: messageData.status,
          timestamp: Date.now(),
        }),
      )
    } else if (topic.includes('/data')) {
      const deviceId = messageData.device_id
      const macAddress = messageData.mac_address

      if (!deviceId || !macAddress) {
        console.log('Missing device ID or MAC address in data message')
        return
      }

      if (messageData.spl_value !== undefined) {
        const formattedSPLValue = formatSPLValue(messageData.spl_value)
        const timestamp = admin.firestore.Timestamp.now()

        // ตรวจสอบว่ามีการบันทึกข้อมูลเสียงในช่วงเวลานี้ไปแล้วหรือยัง (ช่วงเวลา ±5 วินาที)
        const existingSoundSnapshot = await db
          .collection('sounds')
          .where('deviceId', '==', deviceId)
          .where('date._seconds', '>=', timestamp.seconds - 5)
          .where('date._seconds', '<=', timestamp.seconds + 5)
          .get()

        if (!existingSoundSnapshot.empty) {
          console.log(
            'Sound data for this timestamp already exists. Skipping MQTT data.',
          )
          return
        }

        // ดึงข้อมูลอุปกรณ์เพื่อดู threshold
        const deviceRef = db.collection('devices').doc(deviceId)
        const deviceDoc = await deviceRef.get()

        if (!deviceDoc.exists) {
          console.log('Device not found')
          return
        }

        // ดึงค่า threshold จาก device document หรือใช้ค่าเริ่มต้น (85)
        const noiseThreshold = deviceDoc.data().noiseThreshold || 85

        // บันทึกเฉพาะเมื่อค่า SPL ไม่เกิน threshold
        // (ถ้าเกิน threshold จะถูกจัดการโดยส่วน upload endpoint)
        if (formattedSPLValue <= noiseThreshold) {
          console.log(
            `SPL value (${formattedSPLValue}) is below threshold (${noiseThreshold}). Recording basic data.`,
          )

          // สร้างข้อมูลเสียงที่จะบันทึก (พื้นฐาน)
          const soundData = {
            deviceId: deviceId,
            level: formattedSPLValue,
            date: {
              _seconds: timestamp.seconds,
              _nanoseconds: timestamp.nanoseconds,
            },
            macAddress: macAddress,
          }

          const nextDocId = await getNextDocumentId('sounds')
          const soundRef = db.collection('sounds').doc(nextDocId)
          await soundRef.set(soundData)

          // อัพเดทข้อมูลอุปกรณ์
          const updateData = {
            lastSeen: admin.firestore.FieldValue.serverTimestamp(),
            lastSPLValue: formattedSPLValue,
          }

          await deviceRef.update(updateData)

          console.log(`Saved basic sound data with ID: ${nextDocId}`)
        } else {
          console.log(
            `SPL value (${formattedSPLValue}) is above threshold (${noiseThreshold}). Waiting for upload endpoint to handle.`,
          )
        }
      }
    }
  } catch (error) {
    console.error('Error processing MQTT message:', error)
  }
})

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err)
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      error: err.message,
    })
  }
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message,
  })
})

// Start Server
const PORT = process.env.SERVER_PORT || 5001
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on all interfaces on port ${PORT}`)
})
