// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
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
    // ถ้าสถานะเป็น inactive ให้แสดงสีเทา
    if (props.status?.toLowerCase() === 'inactive') {
      return 'linear-gradient(135deg, rgba(108, 117, 125, 0.95) 0%, rgba(73, 80, 87, 0.95) 100%)';
    }
    
    // ถ้าไม่ใช่ inactive ให้แสดงสีตามระดับเสียงเหมือนเดิม
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
  opacity: ${props => props.status?.toLowerCase() === 'inactive' ? 0.7 : 1};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    opacity: ${props => props.status?.toLowerCase() === 'inactive' ? 0.9 : 1};
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
      switch(props.status?.toLowerCase()) {
        case 'active': return 'rgba(40, 167, 69, 0.2)';
        case 'inactive': return 'rgba(220, 53, 69, 0.2)';
        default: return 'rgba(108, 117, 125, 0.2)';
      }
    }};
    color: ${props => {
      switch(props.status?.toLowerCase()) {
        case 'active': return '#28a745';
        case 'inactive': return '#dc3545';
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching devices data...");
        // ดึงข้อมูลอุปกรณ์ทั้งหมดจาก collection 'devices'
        const devicesSnapshot = await getDocs(collection(db, 'devices'));
        const devicesList = devicesSnapshot.docs.map(doc => ({
          id: doc.id,
          deviceId: doc.data().deviceId || doc.id, 
          ...doc.data()
        }));
        
        console.log("Devices from Firestore:", devicesList);

        // ถ้าไม่มีข้อมูลใน Firestore ให้ใช้ข้อมูลตัวอย่าง
        if (devicesList.length === 0) {
          console.log("No devices found in Firestore, using sample data");
          const sampleDevices = getSampleDevices();
          setDevices(sampleDevices);
          return;
        }

        // ดึงข้อมูลเสียงล่าสุดของแต่ละอุปกรณ์
        const devicesWithSounds = await Promise.all(
          devicesList.map(async (device) => {
            try {
              // ใช้วิธีดึงข้อมูลแบบง่ายๆ ไม่ต้องใช้ where และ orderBy พร้อมกัน
              const soundsRef = collection(db, 'sounds');
              const q = query(soundsRef, where('deviceId', '==', device.deviceId));
              const soundSnapshot = await getDocs(q);
              
              // หาข้อมูลล่าสุดด้วยการเรียงลำดับหลังจากดึงข้อมูลมาแล้ว
              let latestSound = null;
              let latestTimestamp = 0;
              
              soundSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.timestamp && data.timestamp.seconds > latestTimestamp) {
                  latestSound = data;
                  latestTimestamp = data.timestamp.seconds;
                }
              });
              
              console.log(`Latest sound for device ${device.deviceId}:`, latestSound);
              
              // ตรวจสอบสถานะอุปกรณ์จากเวลาล่าสุดที่ส่งข้อมูล
              const isActive = latestSound && 
                (Date.now()/1000 - latestTimestamp < 3600);
              
              return {
                ...device,
                // ถ้า inactive ไม่ต้องแสดงค่าใดๆ
                soundLevel: isActive ? (latestSound?.soundLevel || 0) : 0,
                source: isActive ? (latestSound?.source || 'Unknown') : '',
                status: isActive ? 'Active' : 'Inactive'
              };
            } catch (err) {
              console.error(`Error fetching sound data for device ${device.deviceId}:`, err);
              return {
                ...device,
                soundLevel: 0,
                source: 'Unknown',
                status: 'Inactive'
              };
            }
          })
        );

        console.log('Devices with sounds:', devicesWithSounds);
        setDevices(devicesWithSounds);

      } catch (err) {
        console.error('Error fetching data:', err);
        // ใช้ข้อมูลตัวอย่างในกรณีที่มีข้อผิดพลาด
        const sampleDevices = getSampleDevices();
        setDevices(sampleDevices);
      }
    };

    fetchData();
    // อัพเดทข้อมูลทุก 5 นาที
    const interval = setInterval(fetchData, 300000);
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
        status: "Active",
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
        status: "Active",
        source: "Construction",
        noiseThreshold: 80
      },
      {
        deviceId: "device3",
        deviceName: "Sample Device 3",
        latitude: 13.793185,
        longitude: 100.324802,
        location: "Sample Location 3",
        status: "Inactive",
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
            <h2 style={{ color: 'white', marginBottom: '20px' }}>All Devices</h2>
            
            <SearchInput
              placeholder="Search devices"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {filteredDevices.map(device => (
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
                  
                  {device.status?.toLowerCase() === 'inactive' ? (
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
            ))}
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
                {selectedDevice.status?.toLowerCase() !== 'inactive' && (
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