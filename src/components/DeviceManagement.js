// src/components/DeviceManagement.js
import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

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
`;

const DeviceInfo = styled.div`
  h2 {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
  }
  p {
    color: #666;
  }
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  background-color: #4CAF50;
  border-radius: 50%;
  margin-left: 0.5rem;
`;

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  color: black;
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
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
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
  
  &:hover {
    background-color: #3151b0;
  }
`;

function DeviceManagement() {
  const navigate = useNavigate();
  
  const devices = [
    {
      id: 1,
      name: 'Device 1',
      location: 'ICT Mahidol',
    },
    {
      id: 2,
      name: 'Device 2',
      location: '7-11',
    }
  ];
  const handleAddDevice = () => {
    navigate('/devices/add');
  };

  const handleDeviceClick = (deviceId) => {
    navigate(`/device/${deviceId}/settings`);
  };

  const handleExit = () => {
    navigate('/');
  };

  return (
    <Container>
      <Title>Devices</Title>
      
      {devices.map(device => (
        <DeviceCard 
          key={device.id}
          onClick={() => handleDeviceClick(device.id)}
        >
          <DeviceInfo>
            <h2>{device.name}</h2>
            <p>Location: {device.location}</p>
          </DeviceInfo>
          <StatusContainer>
            Status <StatusDot />
          </StatusContainer>
        </DeviceCard>
      ))}

        <AddButton onClick={handleAddDevice}>+</AddButton>
      <ExitButton onClick={handleExit}>Exit</ExitButton>
    </Container>
  );
}

export default DeviceManagement;