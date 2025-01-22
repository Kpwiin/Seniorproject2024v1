// src/components/DeviceSettings.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const Container = styled.div`
  background-color: #1a1b2e;
  min-height: 100vh;
  padding: 2rem;
  color: white;
`;

const DeviceHeader = styled.div`
  max-width: 800px;
  margin: 0 auto 2rem;
`;

const DeviceTitle = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
`;

const Location = styled.p`
  color: #888;
  font-size: 1.2rem;
`;

const SettingsContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const SettingGroup = styled.div`
  margin-bottom: 2rem;
`;

const SettingLabel = styled.p`
  margin-bottom: 1rem;
  font-size: 1.2rem;
`;

const Toggle = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 34px;
    
    &:before {
      position: absolute;
      content: "";
      height: 26px;
      width: 26px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
  }
  
  input:checked + span {
    background-color: #4169E1;
  }
  
  input:checked + span:before {
    transform: translateX(26px);
  }
`;

const Slider = styled.input`
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: #4169E1;
  outline: none;
  -webkit-appearance: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
  }
`;

const Value = styled.span`
  display: block;
  margin-top: 0.5rem;
  color: #888;
`;

const RemoveButton = styled.button`
  color: #ff4444;
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 0;
  margin-top: 2rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const SaveButton = styled.button`
  background-color: #4169E1;
  color: white;
  border: none;
  padding: 0.8rem 3rem;
  border-radius: 10px;
  font-size: 1.1rem;
  cursor: pointer;
  display: block;
  margin: 2rem 0 0 auto;
  
  &:hover {
    background-color: #3151b0;
  }
`;

const LoadingOverlay = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 1.2rem;
  height: 100vh;
`;

function DeviceSettings() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [deviceData, setDeviceData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const [enabled, setEnabled] = useState(false);
    const [noiseThreshold, setNoiseThreshold] = useState(80);
    const [samplingPeriod, setSamplingPeriod] = useState(3);
    const [recordDuration, setRecordDuration] = useState(1);

    useEffect(() => {
        const fetchDevice = async () => {
            try {
                const docRef = doc(db, 'devices', id);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setDeviceData(data);
                    setEnabled(data.status === 'active');
                    setNoiseThreshold(data.noiseThreshold || 80);
                    setSamplingPeriod(data.samplingPeriod || 3);
                    setRecordDuration(data.recordDuration || 1);
                }
            } catch (error) {
                console.error('Error fetching device:', error);
                alert('Failed to load device settings');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDevice();
    }, [id]);

    const handleSave = async () => {
        try {
            const docRef = doc(db, 'devices', id);
            await updateDoc(docRef, {
                status: enabled ? 'active' : 'inactive',
                noiseThreshold,
                samplingPeriod,
                recordDuration,
                lastUpdated: new Date()
            });
            navigate('/devices');
        } catch (error) {
            console.error('Error updating device:', error);
            alert('Failed to save settings');
        }
    };

    const handleRemoveDevice = async () => {
        if (window.confirm('Are you sure you want to remove this device?')) {
            try {
                await deleteDoc(doc(db, 'devices', id));
                navigate('/devices');
            } catch (error) {
                console.error('Error removing device:', error);
                alert('Failed to remove device');
            }
        }
    };

    if (isLoading) return <LoadingOverlay>Loading...</LoadingOverlay>;
    if (!deviceData) return <Container>Device not found</Container>;

    return (
        <Container>
            <DeviceHeader>
                <DeviceTitle>{deviceData.deviceName}</DeviceTitle>
                <Location>Location: {deviceData.location}</Location>
            </DeviceHeader>

            <SettingsContainer>
                <SettingGroup>
                    <SettingLabel>Device Status</SettingLabel>
                    <Toggle>
                        <input 
                            type="checkbox" 
                            checked={enabled}
                            onChange={(e) => setEnabled(e.target.checked)}
                        />
                        <span />
                    </Toggle>
                    <Value>{enabled ? 'Active' : 'Inactive'}</Value>
                </SettingGroup>

                <SettingGroup>
                    <SettingLabel>Noise threshold</SettingLabel>
                    <Slider
                        type="range"
                        min="0"
                        max="100"
                        value={noiseThreshold}
                        onChange={(e) => setNoiseThreshold(e.target.value)}
                    />
                    <Value>{noiseThreshold} dB</Value>
                </SettingGroup>

                <SettingGroup>
                    <SettingLabel>Noise sampling period</SettingLabel>
                    <Slider
                        type="range"
                        min="1"
                        max="10"
                        value={samplingPeriod}
                        onChange={(e) => setSamplingPeriod(e.target.value)}
                    />
                    <Value>{samplingPeriod} min</Value>
                </SettingGroup>

                <SettingGroup>
                    <SettingLabel>Record duration</SettingLabel>
                    <Slider
                        type="range"
                        min="1"
                        max="5"
                        value={recordDuration}
                        onChange={(e) => setRecordDuration(e.target.value)}
                    />
                    <Value>{recordDuration} min</Value>
                </SettingGroup>

                <RemoveButton onClick={handleRemoveDevice}>Remove device</RemoveButton>
                <SaveButton onClick={handleSave}>Save</SaveButton>
            </SettingsContainer>
        </Container>
    );
}

export default DeviceSettings;