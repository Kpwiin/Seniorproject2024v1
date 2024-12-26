// src/components/NotificationSettings.js
import React, { useState } from 'react';
import styled from 'styled-components';

const NotificationContainer = styled.div`
  color: white;
  padding: 2rem;
`;

const ToggleContainer = styled.div`
  margin-bottom: 2rem;
`;

const ToggleLabel = styled.div`
  font-size: 1.1rem;
  margin-bottom: 1rem;
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

const ThresholdContainer = styled.div`
  margin-top: 2rem;
`;

const ThresholdLabel = styled.div`
  font-size: 1.1rem;
  margin-bottom: 1rem;
`;

const SliderContainer = styled.div`
  width: 100%;
  max-width: 400px;
`;

const Slider = styled.input`
  width: 100%;
  height: 4px;
  background: #4169E1;
  outline: none;
  -webkit-appearance: none;
  border-radius: 2px;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: #4169E1;
    border-radius: 50%;
    cursor: pointer;
  }
`;

const SliderValues = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  color: #8892b0;
`;

function NotificationSettings() {
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [threshold, setThreshold] = useState(80);

  return (
    <NotificationContainer>
      <ToggleContainer>
        <ToggleLabel>Turn off-on notification</ToggleLabel>
        <Toggle>
          <input
            type="checkbox"
            checked={isNotificationEnabled}
            onChange={(e) => setIsNotificationEnabled(e.target.checked)}
          />
          <span></span>
        </Toggle>
      </ToggleContainer>

      <ThresholdContainer>
        <ThresholdLabel>Set alert threshold</ThresholdLabel>
        <SliderContainer>
          <div>{threshold} dB</div>
          <Slider
            type="range"
            min="0"
            max="200"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
          <SliderValues>
            <span>0 dB</span>
            <span>100 dB</span>
            <span>200 dB</span>
          </SliderValues>
        </SliderContainer>
      </ThresholdContainer>
    </NotificationContainer>
  );
}

export default NotificationSettings;