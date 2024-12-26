// src/components/DeviceList.js
import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const DevicesContainer = styled.div`
  background-color: #1e1f2f;
  padding: 2rem;
  border-radius: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin: 1rem;
`;

const DevicesTitle = styled.h1`
  color: #4169E1;
  margin-bottom: 2rem;
  font-size: 2rem;
`;

const DeviceCard = styled.div`
  background-color: ${props => props.status === 'Safe' ? 
    'rgba(76, 175, 80, 0.8)' : 
    'rgba(255, 127, 127, 0.8)'
  };
  padding: 1.5rem;
  border-radius: 15px;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
    background-color: ${props => props.status === 'Safe' ? 
      'rgba(76, 175, 80, 0.9)' : 
      'rgba(255, 127, 127, 0.9)'
    };
  }
`;

const DeviceName = styled.h2`
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
`;

const LocationText = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.2rem;
`;

const ManageButton = styled.button`
  background-color: rgba(65, 105, 225, 0.8);
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 10px;
  cursor: pointer;
  width: 100%;
  font-size: 1.2rem;
  margin-top: 2rem;
  transition: all 0.2s;

  &:hover {
    background-color: rgba(65, 105, 225, 0.9);
    transform: translateY(-2px);
  }
`;

function DeviceList() {
    const navigate = useNavigate(); // เพิ่มบรรทัดนี้

  const handleManageDevice = () => { // เพิ่มฟังก์ชันนี้
    navigate('/devices');
  };
  const devices = [
    {
      id: 1,
      name: 'Device 1',
      location: 'ICT Mahidol',
      status: 'Safe'
    },
    {
      id: 2,
      name: 'Device 2',
      location: '7-11',
      status: 'Danger'
    }
  ];


  return (
    <DevicesContainer>
      <DevicesTitle>Devices</DevicesTitle>
      {devices.map(device => (
        <DeviceCard key={device.id} status={device.status}>
          <DeviceName>{device.name}</DeviceName>
          <LocationText>Location: {device.location}</LocationText>
        </DeviceCard>
      ))}
      <ManageButton onClick={handleManageDevice}>Manage device</ManageButton> {/* เพิ่ม onClick ตรงนี้ */}
    </DevicesContainer>
  );
}

// เพิ่มบรรทัดนี้
export default DeviceList;