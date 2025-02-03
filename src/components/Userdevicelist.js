// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Map from './Map';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

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

const LoadingText = styled.div`
  color: white;
  font-size: 1.2rem;
  text-align: center;
  padding: 2rem;
`;

const ErrorText = styled.div`
  color: #ff4444;
  font-size: 1.2rem;
  text-align: center;
  padding: 2rem;
`;

const NoDevicesText = styled.div`
  color: white;
  font-size: 1.2rem;
  text-align: center;
  padding: 2rem;
`;

const LastUpdatedText = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  margin-top: 0.5rem;
`;

function Userdevicelist() {
    const navigate = useNavigate();
    const [devices, setDevices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'devices'));
                const deviceList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    status: doc.data().status === 'active' ? 'Safe' : 'Danger'
                }));
                setDevices(deviceList);
                setError(null);
            } catch (error) {
                console.error('Error fetching devices:', error);
                setError('Failed to load devices. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDevices();
    }, []);

    const handleDeviceClick = (deviceId) => {
        navigate(`/device/${deviceId}`);
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
        <DashboardContainer>
            <ContentGrid>
                <Section>
                    <Title>Map</Title>
                    <Map />
                </Section>

                <Section>
                    <Title>Devices</Title>
                    {isLoading ? (
                        <LoadingText>Loading devices...</LoadingText>
                    ) : error ? (
                        <ErrorText>{error}</ErrorText>
                    ) : devices.length === 0 ? (
                        <NoDevicesText>No devices found</NoDevicesText>
                    ) : (
                        <DeviceList>
                            {devices.map(device => (
                                <DeviceCard 
                                    key={device.id} 
                                    status={device.status}
                                    onClick={() => handleDeviceClick(device.id)}
                                >
                                    <DeviceName>{device.deviceName}</DeviceName>
                                    <LocationText>Location: {device.location}</LocationText>
                                    {device.lastUpdated && (
                                        <LastUpdatedText>
                                            Last Updated: {formatDate(device.lastUpdated)}
                                        </LastUpdatedText>
                                    )}
                                    {device.status === 'Danger' && (
                                        <WarningIcon>⚠️</WarningIcon>
                                    )}
                                </DeviceCard>
                            ))}
                        </DeviceList>
                    )}
                </Section>
            </ContentGrid>
        </DashboardContainer>
    );
}

export default Userdevicelist;