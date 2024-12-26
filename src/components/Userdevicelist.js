// src/components/Dashboard.js
import React from 'react';
import styled from 'styled-components';
import Map from './Map';
import { useNavigate } from 'react-router-dom'; // แก้ไขให้เหลือแค่ useNavigate

const DashboardContainer = styled.div`
  min-height: 100vh;
  background-color: #1a1b2e;
  padding: 2rem;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;
  max-width: 1800px;
  margin: 0 auto;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Section = styled.div`
  background-color: #242538;
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  color: #4169E1;
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
`;

const DeviceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const DeviceCard = styled.div`
  background-color: ${props => props.status === 'Safe' ? 
    'rgba(76, 175, 80, 0.8)' : 
    'rgba(255, 127, 127, 0.8)'
  };
  padding: 1rem;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s;
  position: relative;

  &:hover {
    transform: translateY(-2px);
  }
`;

const DeviceName = styled.h3`
  color: white;
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
`;

const LocationText = styled.p`
  color: white;
  font-size: 1rem;
`;

const WarningIcon = styled.div`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #ff4444;
  font-size: 1.5rem;
`;

function Userdevicelist() {
    const navigate = useNavigate(); // ใช้ได้แล้วหลังจาก import
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
    },
  ];
  const handleDeviceClick = (deviceId) => {
    navigate(`/device/${deviceId}`);
  };

  return (
    <DashboardContainer>
        <ContentGrid>
            <Section>
                <Title>Map</Title>
                <Map />
            </Section>

            <Section>
                <Title>Devices</Title>
                <DeviceList>
                    {devices.map(device => (
                        <DeviceCard 
                            key={device.id} 
                            status={device.status}
                            onClick={() => handleDeviceClick(device.id)}
                        >
                            <DeviceName>{device.name}</DeviceName>
                            <LocationText>Location: {device.location}</LocationText>
                            {device.status === 'Danger' && (
                                <WarningIcon>⚠️</WarningIcon>
                            )}
                        </DeviceCard>
                    ))}
                </DeviceList>
            </Section>
        </ContentGrid>
    </DashboardContainer>
);
}

export default Userdevicelist;