// src/components/DeviceSettings.js
import React, { useEffect, useState } from 'react'; // เพิ่ม useState
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

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

function DeviceSettings() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [deviceData, setDeviceData] = useState(null);
    
    // ข้อมูล mock สำหรับอุปกรณ์
    const devices = {
      1: {
        name: 'Device 1',
        location: 'ICT Mahidol',
        noiseThreshold: 80,
        samplingPeriod: 3,
        recordDuration: 1,
        enabled: false
      },
      2: {
        name: 'Device 2',
        location: '7-11',
        noiseThreshold: 75,
        samplingPeriod: 2,
        recordDuration: 1,
        enabled: true
      }
    };
  
    useEffect(() => {
      // ดึงข้อมูลอุปกรณ์ตาม id ที่ได้จาก URL
      const device = devices[id];
      if (device) {
        setDeviceData(device);
      }
    }, [id]);
  
    const [enabled, setEnabled] = useState(false);
    const [noiseThreshold, setNoiseThreshold] = useState(80);
    const [samplingPeriod, setSamplingPeriod] = useState(3);
    const [recordDuration, setRecordDuration] = useState(1);
  
    useEffect(() => {
      if (deviceData) {
        setEnabled(deviceData.enabled);
        setNoiseThreshold(deviceData.noiseThreshold);
        setSamplingPeriod(deviceData.samplingPeriod);
        setRecordDuration(deviceData.recordDuration);
      }
    }, [deviceData]);
  
    const handleSave = () => {
      // บันทึกการตั้งค่า
      navigate('/device-management');
    };
  
    if (!deviceData) return null;
  
    return (
      <Container>
        <DeviceHeader>
          <DeviceTitle>{deviceData.name}</DeviceTitle>
          <Location>Location: {deviceData.location}</Location>
        </DeviceHeader>
  
        <SettingsContainer>
          <SettingGroup>
            <SettingLabel>Disable-Enable device</SettingLabel>
            <Toggle>
              <input 
                type="checkbox" 
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              <span />
            </Toggle>
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
  
          <RemoveButton>Remove device</RemoveButton>
          <SaveButton onClick={handleSave}>Save</SaveButton>
        </SettingsContainer>
      </Container>
    );
  }
  
  export default DeviceSettings;