import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, where, updateDoc} from 'firebase/firestore';
import { FiSettings } from 'react-icons/fi';
import AddDevice from './AddDevice';

const Container = styled.div`
  padding: 20px;
  width: 100%;
`;

const Title = styled.h1`
  color: white;
  margin-bottom: 20px;
`;

const TabContainer = styled.div`
  margin-bottom: 20px;
  border-bottom: 1px solid #333;
`;

const Tab = styled.span`
  color: ${props => props.active ? '#1a75ff' : '#666'};
  padding: 10px 20px;
  cursor: pointer;
  border-bottom: 2px solid ${props => props.active ? '#1a75ff' : 'transparent'};
  margin-right: 20px;
  display: inline-block;
  transition: all 0.3s ease;

  &:hover {
    color: #1a75ff;
  }
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  color: white;
  table-layout: fixed;
  background: #1a1a1a;
  cursor: pointer; 
`;

const Th = styled.th`
  text-align: left;
  padding: 15px;
  border-bottom: 1px solid #333;
  color: #999;
  font-weight: normal;
`;

const Td = styled.td`
  padding: 15px;
  border-bottom: 1px solid #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
`;

const TableRow = styled.tr`
  &:hover {
    background-color: rgba(26, 117, 255, 0.1);
  }
`;

const StatusBadge = styled.span`
  display: flex;
  align-items: center;
  justify-content: center; 
  gap: 8px;
  
  &::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${props => props.active ? '#4CAF50' : '#f44336'};
    margin-bottom: 1px; 
  }
  color: ${props => props.active ? '#4CAF50' : '#f44336'};
`;

const SettingsIcon = styled(FiSettings)`
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    color: #1a75ff;
    transform: rotate(90deg);
  }
`;

const LoadingContainer = styled.div`
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2rem;
`;

const NoDevicesMessage = styled.div`
  color: #999;
  text-align: center;
  padding: 20px;
  font-style: italic;
`;

const ContentContainer = styled.div`

`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 30px;
  margin-top: 50px;
  background-color: rgba(0, 0, 0, 0.8); 
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  color: white;
`;

const ModalContent = styled.div`
  background: #222; 
  padding: 25px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh; 
  overflow: hidden; 
  border-radius: 10px;
  box-shadow: 0px 6px 15px rgba(255, 255, 255, 0.2); 
  color: white; 
  text-align: center;
  position: relative;
`;

const ScrollableContent = styled.div`
  max-height: 40vh; 
  overflow-y: auto; 
  margin-top: 10px; 
  margin-bottom: 5px; 
  padding-right: 10px;
  scrollbar-color: #666 #222;

  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background: #666;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-track {
    background: #222;
  }
`;

const CloseButton = styled.button`
  background: none; 
  border: none;
  padding: 10px;
  color: #ff4d4d; 
  font-size: 28px;
  cursor: pointer;
  position: absolute;
  top: 5px;
  right: 10px;
  transition: color 0.3s ease, transform 0.2s ease;

  &:hover {
    color: #cc0000; 
    transform: scale(1.1);
  }

  &:active {
    color: #990000; 
    transform: scale(0.9);
  }
`;

const SoundIcon = styled.span`
  font-size: 22px;
  margin-left: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
`;

function DeviceManagement() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Devices list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [brokenDevices, setBrokenDevices] = useState([]);
  
  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'devices'));
      const deviceList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDevices(deviceList);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const DeviceInfoModal = ({ device, onClose }) => {
    const [soundLevels, setSoundLevels] = useState([]);
    
    useEffect(() => {
      if (device) {
        const fetchSoundLevels = async (deviceId) => {
          try {
            const q = query(collection(db, 'sounds'), where('deviceId', '==', String(deviceId)));
            const querySnapshot = await getDocs(q);
    
            const levels = querySnapshot.docs.map(doc => {
              const data = doc.data();
              
              console.log('Fetched document data:', JSON.stringify(data, null, 2));
    
              const date = data.date;
              let formattedDate = 'Invalid timestamp or missing date field';
    
              if (date) {
                if (date._seconds !== undefined && date._nanoseconds !== undefined) {
                  const timestamp = new Date((date._seconds * 1000) + (date._nanoseconds / 1000000));
                  formattedDate = timestamp.toLocaleString(); 
                } else {
                  console.log('Unexpected date format:', date);
                }
              } else {
                console.log('Date field is missing');
              }
    
              return {
                id: doc.id,
                ...data, 
                date: formattedDate 
              };
            });
    
            console.log('Fetched sound levels:', levels);
            setSoundLevels(levels); 
          } catch (error) {
            console.error('Error fetching sound levels:', error); 
          }
        };
    
        fetchSoundLevels(device.deviceId);
      }
    }, [device]); 
    
    
    if (!device) return null;
    return (
      <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>
        <h2>Device Info</h2>
        <p><strong>Name:</strong> {device.deviceName}</p>
        <p><strong>ID:</strong> {device.deviceId}</p>
        <p><strong>Location:</strong> {device.location}</p>
        <p><strong>Status:</strong> {device.status}</p>
        <div style={{ marginBottom: "20px" }}></div> 
        <h2>Sound Levels</h2>
        {soundLevels.length === 0 ? (
          <p>No sound data available</p>
        ) : (
          <ScrollableContent>
            <ul style={{ padding: 0, listStyle: "none" }}>
              {soundLevels.map((sound, index) => (
                <li 
                  key={index}
                  style={{
                    color: sound.level < 70 ? "green" : sound.level <= 85 ? "yellow" : "red",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                    padding: "2px 0",
                    fontSize: "16px",
                  }}
                >
                  {sound.date} - {sound.level} dB - {sound.result}
                  <SoundIcon 
                    onClick={() => {
                      if (sound.sample) {
                        new Audio(sound.sample).play();
                      } else {
                        alert("No Audio Available");
                      }
                    }}
                  >
                    🔊
                  </SoundIcon>
                </li>
              ))}
            </ul>
          </ScrollableContent>
        )}
        <div style={{
  display: 'flex',
  justifyContent: 'center',
  gap: '10px',
  marginTop: '20px',
}}>
  {device.broken ? (
    <button 
      onClick={() => handleMarkAsWorking(device.deviceId)}
      style={{
        padding: '10px',
        backgroundColor: 'green',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => e.target.style.backgroundColor = '#4CAF50'} 
      onMouseLeave={(e) => e.target.style.backgroundColor = 'green'} 
    >
      Mark as Working
    </button>
  ) : (
    <button 
      onClick={() => handleDeviceIssue(device.deviceId)}
      style={{
        padding: '10px',
        backgroundColor: 'red',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => e.target.style.backgroundColor = '#FF6347'} 
      onMouseLeave={(e) => e.target.style.backgroundColor = 'red'} 
    >
      Mark as Not Working
    </button>
  )}
</div>
      </ModalContent>
    </ModalOverlay> 
    );
  };

  const handleSettingsClick = (e, deviceId) => {
    e.stopPropagation(); 
    navigate(`/device/${deviceId}/settings`);
  };

  const handleTabChange = (tabName, url) => {
    setActiveTab(tabName);
    navigate(url);  
  };

  const handleRowClick = (device) => {
    setSelectedDevice(device);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDevice(null);
  };

  const handleDeviceIssue = async (deviceId) => {
    console.log('Handling device issue for deviceId:', deviceId);
    const confirmChange = window.confirm('Are you sure you want to mark this device as not working?');
    if (confirmChange) {
      const q = query(collection(db, 'devices'), where('deviceId', '==', deviceId));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const deviceDoc = querySnapshot.docs[0];
        const deviceRef = deviceDoc.ref;
  
        await updateDoc(deviceRef, { broken: true });
  
        setBrokenDevices([...brokenDevices, deviceId]);
        alert(`Device ${deviceId} is marked as not working!`);
        
        window.location.reload();
      } else {
        alert(`Device with deviceId ${deviceId} not found!`);
      }
    }
  };
  
  const handleMarkAsWorking = async (deviceId) => {
    console.log('Handling device issue for deviceId:', deviceId);
    const confirmChange = window.confirm('Are you sure you want to mark this device as working?');
    if (confirmChange) {
      const q = query(collection(db, 'devices'), where('deviceId', '==', deviceId));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const deviceDoc = querySnapshot.docs[0];
        const deviceRef = deviceDoc.ref;
  
        await updateDoc(deviceRef, { broken: false });
  
        setBrokenDevices(brokenDevices.filter(id => id !== deviceId));
        alert(`Device ${deviceId} is marked as working!`);
        
        window.location.reload();
      } else {
        alert(`Device with deviceId ${deviceId} not found!`);
      }
    }
  };
  

  

  if (loading) {
    return <LoadingContainer>Loading...</LoadingContainer>;
  }
  
  return (
    <Container>
      <Title>Manage Devices</Title>
     
      <TabContainer>
        <Tab active={activeTab === 'Devices list'} onClick={() => handleTabChange('Devices list')}>
          Devices list
        </Tab>
        <Tab active={activeTab === 'Add device'} onClick={() => handleTabChange('Add device')}>
          Add device
        </Tab>
      </TabContainer>

      <ContentContainer>
        {activeTab === 'Devices list' && (
          devices.length === 0 ? (
            <NoDevicesMessage>No devices found</NoDevicesMessage>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th style={{ width: '20%', textAlign: 'center' }}>Device name</Th>
                  <Th style={{ width: '8%', textAlign: 'center' }}>Device ID</Th>
                  <Th style={{ width: '42%' }}>Location</Th>
                  <Th style={{ width: '10%', textAlign: 'center' }}>Date added</Th>
                  <Th style={{ width: '12%', textAlign: 'center' }}>Status</Th>
                  <Th style={{ width: '8%', textAlign: 'center' }}>Setting</Th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <TableRow key={device.id} onClick={() => handleRowClick(device)}>
                    <Td 
                    style={{ 
                    textAlign: 'center', 
                    color: device.broken ? 'red' : 'white' 
                    }}
                    >
                    {device.deviceName}  
                    </Td>
                    <Td style={{ textAlign: 'center' }}>{device.deviceId}</Td>
                    <Td>{device.location}</Td>
                    <Td style={{ textAlign: 'center' }}>
                      {device.createdAt ? new Date(device.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                    </Td>
                    <Td style={{ textAlign: 'center' }}>
                      <StatusBadge 
                        active={device.status === 'Active'}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Status clicked');
                        }}
                      >
                        {device.status}
                      </StatusBadge>
                    </Td>
                    <Td style={{ textAlign: 'center' }}>
                      <SettingsIcon onClick={(e) => handleSettingsClick(e, device.id)} />
                    </Td>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          )
        )}

  {activeTab === 'Add device' && (
    <AddDevice /> 
  )}

</ContentContainer>
{isModalOpen && <DeviceInfoModal device={selectedDevice} onClose={handleCloseModal} />}
    </Container>
  );  
}

export default DeviceManagement;
