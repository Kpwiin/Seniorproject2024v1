// src/components/DeviceManagement.js
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const Container = styled.div`
  background-color: #1a1b2e;
  min-height: 100vh;
  padding: 2rem;
`;

const Title = styled.h1`
  color: #4169E1;
  text-align: center;
  font-size: 2rem;
  margin-bottom: 2rem;
`;

const DeviceCard = styled.div`
  background-color: white;
  border-radius: 15px;
  padding: 1.5rem;
  margin: 1rem auto;
  max-width: 800px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
`;

const DeviceInfo = styled.div`
  h2 {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
    color: #333;
  }
  p {
    color: #666;
    margin: 0.3rem 0;
    font-size: 0.9rem;
  }
`;

const LocationDetails = styled.div`
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #777;
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  background-color: #4CAF50;
  border-radius: 50%;
  margin-left: 0.5rem;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.2);
  }
`;

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  color: black;
  font-size: 0.9rem;
`;

const AddButton = styled.button`
  width: 40px;
  height: 40px;
  border: 2px solid white;
  background: transparent;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 2rem auto;
  border-radius: 8px;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    transform: scale(1.05);
  }
`;

const ExitButton = styled.button`
  background-color: #4169E1;
  color: white;
  border: none;
  padding: 0.8rem 3rem;
  border-radius: 10px;
  font-size: 1.1rem;
  cursor: pointer;
  display: block;
  margin: 2rem auto;
  transition: all 0.2s;
  
  &:hover {
    background-color: #3151b0;
    transform: translateY(-2px);
  }
`;

const LoadingOverlay = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 1.2rem;
  margin: 2rem 0;
`;

function DeviceManagement() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
        alert('Failed to load devices');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDevices();
  }, []);

  const handleStatusToggle = async (e, deviceId, currentStatus) => {
    e.stopPropagation(); // Prevent navigation to settings page
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const docRef = doc(db, 'devices', deviceId);
      await updateDoc(docRef, {
        status: newStatus,
        lastUpdated: new Date()
      });
      
      // Update local state
      setDevices(devices.map(device => 
        device.id === deviceId 
          ? { ...device, status: newStatus }
          : device
      ));
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
    navigate('/');
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Container>
      <Title>Devices</Title>
      
      {isLoading ? (
        <LoadingOverlay>Loading devices...</LoadingOverlay>
      ) : devices.length === 0 ? (
        <DeviceCard style={{ justifyContent: 'center' }}>
          <DeviceInfo>
            <h2>No devices found</h2>
            <p>Click the + button to add a device</p>
          </DeviceInfo>
        </DeviceCard>
      ) : (
        devices.map(device => (
          <DeviceCard 
            key={device.id}
            onClick={() => handleDeviceClick(device.id)}
          >
            <DeviceInfo>
              <h2>{device.deviceName}</h2>
              <p><strong>Location:</strong> {device.location}</p>
              <p><strong>Device ID:</strong> {device.deviceId}</p>
              <p><strong>Token:</strong> {device.token}</p>
              <p><strong>Last Updated:</strong> {formatDate(device.lastUpdated)}</p>
              {device.locationInfo && (
                <LocationDetails>
                  <p><strong>Street:</strong> {device.locationInfo.street}</p>
                  <p><strong>District:</strong> {device.locationInfo.district}</p>
                  <p><strong>Province:</strong> {device.locationInfo.province}</p>
                  <p><strong>Postal Code:</strong> {device.locationInfo.postalCode}</p>
                </LocationDetails>
              )}
            </DeviceInfo>
            <StatusContainer>
              Status 
              <StatusDot 
                onClick={(e) => handleStatusToggle(e, device.id, device.status)}
                style={{ 
                  backgroundColor: device.status === 'active' ? '#4CAF50' : '#ff4444'
                }}
              />
            </StatusContainer>
          </DeviceCard>
        ))
      )}

      <AddButton onClick={handleAddDevice}>+</AddButton>
      <ExitButton onClick={handleExit}>Exit</ExitButton>
    </Container>
  );
}

export default DeviceManagement;