// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import Map from './Map';

const DashboardContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #0a0a0a;
  color: #fff;
`;

const MainContent = styled.div`
  flex: 1;
  position: relative;
  background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
`;

const MapContainer = styled.div`
  margin-top: 65px;
  width: 100%;
  height: 100vh;
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`;

const DevicesOverlay = styled.div`
  position: absolute;
  top: 50px;
  left: 20px;
  background: rgba(15, 15, 15, 0.95);
  padding: 20px;
  border-radius: 16px;
  width: 300px;
  max-height: calc(100vh - 150px);
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);

  h2 {
    color: white;
    margin-bottom: 15px;
    font-size: 20px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: white;
  margin-bottom: 15px;
  font-size: 13px;
  transition: all 0.3s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.08);
  }
`;

const DeviceCard = styled.div`
  background: ${props => {
    // ถ้าสถานะเป็น Inactive ให้แสดงสีเทา
    if (props.status === 'Inactive') {
      return 'linear-gradient(135deg, rgba(108, 117, 125, 0.95) 0%, rgba(73, 80, 87, 0.95) 100%)';
    }

    // ถ้าไม่ใช่ Inactive ให้แสดงสีตามระดับเสียงเหมือนเดิม
    const level = Number(props.soundLevel);
    if (level >= 85) return 'linear-gradient(135deg, rgba(220, 53, 69, 0.95) 0%, rgba(187, 45, 59, 0.95) 100%)';
    if (level >= 70) return 'linear-gradient(135deg, rgba(255, 193, 7, 0.95) 0%, rgba(224, 168, 0, 0.95) 100%)';
    return 'linear-gradient(135deg, rgba(40, 167, 69, 0.95) 0%, rgba(34, 139, 57, 0.95) 100%)';
  }};
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  opacity: ${props => props.status === 'Inactive' ? 0.7 : 1};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    opacity: ${props => props.status === 'Inactive' ? 0.9 : 1};
  }
`;

const DeviceInfo = styled.div`
  color: white;

  .device-name {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 6px;
    letter-spacing: 0.5px;
  }

  .location {
    font-size: 12px;
    margin-bottom: 6px;
    color: white;
    opacity: 0.9;
    text-align: left;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
    margin-top: 6px;
  }

  .info-item {
    font-size: 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .label {
    color: rgba(255, 255, 255, 0.7);
    font-size: 11px;
  }

  .value {
    color: white;
    font-weight: 500;
  }

  .inactive-status {
    font-size: 14px;
    font-weight: 500;
    color: #dc3545;
    text-align: center;
    margin-top: 6px;
    padding: 4px;
    border-radius: 4px;
    background: rgba(220, 53, 69, 0.1);
  }
`;

const InfoPopup = styled.div`
  position: absolute;
  background: rgba(15, 15, 15, 0.98);
  color: white;
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: ${props => props.show ? 'block' : 'none'};
  left: ${props => props.x}px;
  top: ${props => props.y}px;
  min-width: 300px;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);

  div {
    margin-bottom: 12px;
    font-size: 14px;
    line-height: 1.6;
    display: flex;
    justify-content: space-between;
    align-items: center;

    strong {
      color: rgba(255, 255, 255, 0.6);
      font-weight: 500;
    }

    span {
      color: white;
      font-weight: 500;
    }
  }

  .status {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    background: ${props => {
      switch(props.status) {
        case 'Active': return 'rgba(40, 167, 69, 0.2)';
        case 'Inactive': return 'rgba(220, 53, 69, 0.2)';
        default: return 'rgba(108, 117, 125, 0.2)';
      }
    }};
    color: ${props => {
      switch(props.status) {
        case 'Active': return '#28a745';
        case 'Inactive': return '#dc3545';
        default: return '#6c757d';
      }
    }};
  }
`;

function Dashboard() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // แยกฟังก์ชัน fetchData ออกมาเพื่อให้เรียกใช้ได้จากปุ่ม
  const fetchData = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching devices data with timestamp:", Date.now());

      // ดึงข้อมูลอุปกรณ์ทั้งหมดจาก collection 'devices'
      const devicesSnapshot = await getDocs(collection(db, 'devices'));
      const devicesList = devicesSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`Raw device data for ${doc.id}:`, data);
        console.log(`Status from Firebase for device ${doc.id}:`, data.status);
        return {
          id: doc.id,
          deviceId: data.deviceId || doc.id, 
          ...data
        };
      });

      console.log("Devices from Firestore (raw):", devicesList);

      // ถ้าไม่มีข้อมูลใน Firestore ให้ใช้ข้อมูลตัวอย่าง
      if (devicesList.length === 0) {
        console.log("No devices found in Firestore, using sample data");
        const sampleDevices = getSampleDevices();
        setDevices(sampleDevices);
        setIsLoading(false);
        return;
      }

      // ดึงข้อมูลเสียงล่าสุดของแต่ละอุปกรณ์
      const devicesWithSounds = await Promise.all(
        devicesList.map(async (device) => {
          try {
            console.log(`Fetching sounds for device ${device.deviceId}`);

            // ดึงข้อมูลเสียงทั้งหมดของอุปกรณ์นี้ (ไม่ใช้ orderBy เพื่อหลีกเลี่ยงปัญหา index)
            const soundsRef = collection(db, 'sounds');
            const q = query(soundsRef, where('deviceId', '==', device.deviceId));
            const soundSnapshot = await getDocs(q);

            console.log(`Found ${soundSnapshot.size} sound records for device ${device.deviceId}`);

            // หาข้อมูลล่าสุดด้วยการเรียงลำดับหลังจากดึงข้อมูลมาแล้ว
            let latestSound = null;
            let latestTimestamp = 0;

            soundSnapshot.forEach(doc => {
              const data = doc.data();
              console.log(`Sound data for doc ${doc.id}:`, data);

              // ตรวจสอบว่ามี timestamp หรือไม่
              if (data.timestamp) {
                // ถ้าเป็น Firestore Timestamp
                if (data.timestamp.seconds) {
                  console.log(`Found timestamp.seconds: ${data.timestamp.seconds}`);
                  if (data.timestamp.seconds > latestTimestamp) {
                    latestSound = data;
                    latestTimestamp = data.timestamp.seconds;
                  }
                } 
                // ถ้าเป็น date object
                else if (data.timestamp._seconds) {
                  console.log(`Found timestamp._seconds: ${data.timestamp._seconds}`);
                  if (data.timestamp._seconds > latestTimestamp) {
                    latestSound = data;
                    latestTimestamp = data.timestamp._seconds;
                  }
                }
              }
              // ตรวจสอบว่ามี date หรือไม่
              else if (data.date) {
                if (data.date.seconds) {
                  console.log(`Found date.seconds: ${data.date.seconds}`);
                  if (data.date.seconds > latestTimestamp) {
                    latestSound = data;
                    latestTimestamp = data.date.seconds;
                  }
                }
                else if (data.date._seconds) {
                  console.log(`Found date._seconds: ${data.date._seconds}`);
                  if (data.date._seconds > latestTimestamp) {
                    latestSound = data;
                    latestTimestamp = data.date._seconds;
                  }
                }
              }
            });

            console.log(`Latest sound for device ${device.deviceId}:`, latestSound);

            // ตรวจสอบค่า level ในทุกรูปแบบที่เป็นไปได้
            let soundLevel = 0;
            if (latestSound) {
              if (typeof latestSound.level === 'number') {
                console.log(`Found level as number: ${latestSound.level}`);
                soundLevel = latestSound.level;
              } 
              else if (typeof latestSound.level === 'string') {
                console.log(`Found level as string: ${latestSound.level}`);
                soundLevel = parseFloat(latestSound.level);
              }
              else if (typeof latestSound.soundLevel === 'number') {
                console.log(`Found soundLevel as number: ${latestSound.soundLevel}`);
                soundLevel = latestSound.soundLevel;
              }
              else if (typeof latestSound.soundLevel === 'string') {
                console.log(`Found soundLevel as string: ${latestSound.soundLevel}`);
                soundLevel = parseFloat(latestSound.soundLevel);
              }
              // ตรวจสอบเพิ่มเติมสำหรับค่าที่อาจอยู่ในรูปแบบอื่น
              else {
                for (const key in latestSound) {
                  if (key.toLowerCase().includes('level') || key.toLowerCase().includes('sound')) {
                    console.log(`Found potential sound level in field ${key}: ${latestSound[key]}`);
                    if (typeof latestSound[key] === 'number') {
                      soundLevel = latestSound[key];
                      break;
                    } else if (typeof latestSound[key] === 'string') {
                      soundLevel = parseFloat(latestSound[key]);
                      break;
                    }
                  }
                }
              }
            }

            console.log(`Final sound level for device ${device.deviceId}: ${soundLevel}`);

            // ตรวจสอบค่า source/result ในทุกรูปแบบที่เป็นไปได้
            let source = 'Unknown';
            if (latestSound) {
              if (latestSound.result) {
                source = latestSound.result;
              } else if (latestSound.source) {
                source = latestSound.source;
              }
            }

            console.log(`Final source for device ${device.deviceId}: ${source}`);

            return {
              ...device,
              soundLevel: soundLevel,
              source: source
            };
          } catch (err) {
            console.error(`Error fetching sound data for device ${device.deviceId}:`, err);
            return {
              ...device,
              soundLevel: 0,
              source: 'Unknown'
            };
          }
        })
      );

      console.log('Devices with sounds:', devicesWithSounds);
      setDevices(devicesWithSounds);
      setIsLoading(false);

    } catch (err) {
      console.error('Error fetching data:', err);
      // ใช้ข้อมูลตัวอย่างในกรณีที่มีข้อผิดพลาด
      const sampleDevices = getSampleDevices();
      setDevices(sampleDevices);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // อัพเดทข้อมูลทุก 1 นาที (ลดลงจาก 5 นาที)
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  // ฟังก์ชันสร้างข้อมูลตัวอย่าง
  const getSampleDevices = () => {
    return [
      {
        deviceId: "device1",
        deviceName: "Sample Device 1",
        latitude: 13.794185,
        longitude: 100.325802,
        location: "Sample Location 1",
        soundLevel: 65,
        status: "Active",  // ใช้ตัวพิมพ์ใหญ่ตามที่เก็บใน Firebase
        source: "Traffic",
        noiseThreshold: 80
      },
      {
        deviceId: "device2",
        deviceName: "Sample Device 2",
        latitude: 13.795185,
        longitude: 100.326802,
        location: "Sample Location 2",
        soundLevel: 75,
        status: "Active",  // ใช้ตัวพิมพ์ใหญ่ตามที่เก็บใน Firebase
        source: "Construction",
        noiseThreshold: 80
      },
      {
        deviceId: "device3",
        deviceName: "Sample Device 3",
        latitude: 13.793185,
        longitude: 100.324802,
        location: "Sample Location 3",
        status: "Inactive",  // ใช้ตัวพิมพ์ใหญ่ตามที่เก็บใน Firebase
        noiseThreshold: 80
      }
    ];
  };

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX + 10, y: e.clientY + 10 });
  };

  const handleDeviceClick = (deviceId, deviceName) => {
    if (!deviceName) {
      console.error("Device name is missing!");
    } else {
      const encodedDeviceName = encodeURIComponent(deviceName);
      navigate(`/device/${deviceId}/${encodedDeviceName}`);
    }
  };

  const filteredDevices = devices.filter(device => 
    device.deviceName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log("Filtered devices:", filteredDevices);

  return (
    <DashboardContainer>
      <MainContent>
        <MapContainer>
          <Map devices={filteredDevices} onDeviceHover={setSelectedDevice} />

          <DevicesOverlay>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: 'white', margin: 0 }}>All Devices</h2>
              <button 
                onClick={() => fetchData()} 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.1)', 
                  border: 'none', 
                  color: 'white', 
                  padding: '5px 10px', 
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Refresh
              </button>
            </div>

            <SearchInput
              placeholder="Search devices"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255, 255, 255, 0.7)' }}>
                Loading devices...
              </div>
            ) : filteredDevices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255, 255, 255, 0.7)' }}>
                No devices found
              </div>
            ) : (
              filteredDevices.map(device => (
                <DeviceCard
                  key={device.deviceId}
                  soundLevel={device.soundLevel}
                  status={device.status}
                  onMouseMove={handleMouseMove}
                  onMouseEnter={() => setSelectedDevice(device)}
                  onMouseLeave={() => setSelectedDevice(null)}
                  onClick={() => handleDeviceClick(device.deviceId, device.deviceName)}
                >
                  <DeviceInfo>
                    <div className="device-name">
                      {device.deviceName || 'Unnamed Device'}
                    </div>
                    <div className="location">
                      {device.location || 'No location'}
                    </div>

                    {device.status === 'Inactive' ? (
                      <div className="inactive-status">INACTIVE</div>
                    ) : (
                      <div className="info-grid">
                        <div className="info-item">
                          <span className="label">Sound Level</span>
                          <span className="value">{device.soundLevel} dB</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Status</span>
                          <span className="value">{device.status}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Source</span>
                          <span className="value">{device.source}</span>
                        </div>
                      </div>
                    )}
                  </DeviceInfo>
                </DeviceCard>
              ))
            )}
          </DevicesOverlay>

          <InfoPopup
            show={selectedDevice !== null ? true : false}
            x={mousePos.x}
            y={mousePos.y}
            status={selectedDevice?.status}
          >
            {selectedDevice && (
              <>
                <div>
                  <strong>Device ID:</strong> 
                  <span>{selectedDevice.deviceId}</span>
                </div>
                <div>
                  <strong>Device Name:</strong> 
                  <span>{selectedDevice.deviceName}</span>
                </div>
                {selectedDevice.status !== 'Inactive' && (
                  <>
                    <div>
                      <strong>Sound Level:</strong> 
                      <span>{selectedDevice.soundLevel} dB</span>
                    </div>
                    <div>
                      <strong>Noise Threshold:</strong> 
                      <span>{selectedDevice.noiseThreshold} dB</span>
                    </div>
                    <div>
                      <strong>Sound Source:</strong> 
                      <span>{selectedDevice.source}</span>
                    </div>
                  </>
                )}
                <div>
                  <strong>Status:</strong> 
                  <span className="status">{selectedDevice.status}</span>
                </div>
                <div>
                  <strong>Location:</strong> 
                  <span>{selectedDevice.latitude}, {selectedDevice.longitude}</span>
                </div>
              </>
            )}
          </InfoPopup>
        </MapContainer>
      </MainContent>
    </DashboardContainer>
  );
}

export default Dashboard;