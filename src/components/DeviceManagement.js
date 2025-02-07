import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { FiPlus, FiLogOut, FiSettings, FiRefreshCw } from 'react-icons/fi';

const Container = styled.div`
  background: linear-gradient(135deg, #1a1b2e 0%, #2d2e47 100%);
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Header = styled.header`
  width: 100%;
  max-width: 1200px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #fff;
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(90deg, #4169E1, #00bfff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const DeviceGrid = styled.div`
  width: 100%;
  max-width: 1200px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const DeviceCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    border-color: rgba(65, 105, 225, 0.5);
  }
`;

const DeviceInfo = styled.div`
  h2 {
    color: #fff;
    font-size: 1.5rem;
    margin: 0 0 1rem 0;
  }

  p {
    color: rgba(255, 255, 255, 0.8);
    margin: 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.active ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'};
  color: ${props => props.active ? '#4CAF50' : '#f44336'};
  border: 1px solid ${props => props.active ? '#4CAF50' : '#f44336'};

  &:hover {
    transform: scale(1.05);
  }
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  
  ${props => props.primary ? `
    background: linear-gradient(90deg, #4169E1, #00bfff);
    color: white;
    
    &:hover {
      background: linear-gradient(90deg, #3151b0, #0095ff);
      transform: translateY(-2px);
    }
  ` : `
    background: transparent;
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
    }
  `}
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

const LoadingSpinner = styled.div`
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top: 4px solid #4169E1;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 2rem 0;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

function DeviceManagement() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'devices'));
        const deviceList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDevices(deviceList);
      } catch (error) {
        console.error('Error fetching devices:', error);
        alert('Failed to load devices');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDevices();
  }, []);

  const handleStatusToggle = async (e, deviceId, currentStatus) => {
    e.stopPropagation();
    try {
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      const updatedTime = new Date();
      const docRef = doc(db, 'devices', deviceId);

      await updateDoc(docRef, {
        status: newStatus,
        lastUpdated: updatedTime,
      });

      console.log(`Firestore updated: ${deviceId}, status: ${newStatus}, lastUpdated: ${updatedTime}`);

      setDevices((prevDevices) =>
        prevDevices.map((device) =>
          device.id === deviceId
            ? { ...device, status: newStatus, lastUpdated: { toDate: () => updatedTime } }
            : device
        )
      );

      console.log('State updated:', devices);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update device status');
    }
  };

  const handleAddDevice = () => {
    navigate('/devices/add');
  };

  const handleDeviceClick = (deviceId) => {
    navigate(`/device/${deviceId}/settings`);
  };

  const handleExit = () => {
    navigate('/dashboard');
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Container>
      <Header>
        <Title>Device Management</Title>
        <ButtonGroup>
          <Button onClick={() => window.location.reload()}>
            <FiRefreshCw /> Refresh
          </Button>
          <Button primary onClick={handleAddDevice}>
            <FiPlus /> Add Device
          </Button>
          <Button onClick={handleExit}>
            <FiLogOut /> Exit
          </Button>
        </ButtonGroup>
      </Header>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <DeviceGrid>
          {devices.map(device => (
            <DeviceCard key={device.id}>
            <DeviceInfo>
              <h2>{device.deviceName}</h2>
              <p><strong>Location:</strong> {device.location}</p>
              <p><strong>Noise Threshold:</strong> {device.noiseThreshold} dB</p>
              <p><strong>Sampling Period:</strong> {device.samplingPeriod} min</p>
              <p><strong>Record Duration:</strong> {device.recordDuration || 'N/A'} sec</p>

            </DeviceInfo>
            
            <ButtonGroup>
              <StatusBadge
                active={device.status === 'Active'}
                onClick={(e) => handleStatusToggle(e, device.id, device.status)}
              >
                {device.status === 'Active' ? '● Active' : '○ Inactive'}
              </StatusBadge>
              <Button onClick={() => handleDeviceClick(device.id)}>
                <FiSettings /> Settings
              </Button>
            </ButtonGroup>
          </DeviceCard>
          ))}
        </DeviceGrid>
      )}
    </Container>
  );
}

export default DeviceManagement;