import React, { useState } from 'react';
import styled from 'styled-components';
import { FiBell, FiVolume2 } from 'react-icons/fi';

const NotificationContainer = styled.div`
  background: #151515;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  color: white;
  animation: fadeIn 0.5s ease-in-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const Section = styled.div`
  background: #1A1A1A;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  border: 1px solid #2A2A2A;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 24px;

  .icon {
    margin-right: 12px;
    font-size: 20px;
  }
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #151515;
  border-radius: 12px;
  margin-bottom: 16px;
`;

const ToggleLabel = styled.div`
  font-size: 14px;
  color: #A0A0A0;
`;

const Toggle = styled.label`
  position: relative;
  display: inline-block;
  width: 52px;
  height: 28px;

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
    background-color: #2A2A2A;
    transition: .3s;
    border-radius: 34px;

    &:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .3s;
      border-radius: 50%;
    }
  }

  input:checked + span {
    background-color: #4169E1;
  }

  input:checked + span:before {
    transform: translateX(24px);
  }
`;

const ThresholdContainer = styled.div`
  padding: 16px;
`;

const ThresholdValue = styled.div`
  font-size: 32px;
  font-weight: 600;
  color: #FFFFFF;
  margin-bottom: 24px;
  text-align: center;

  span {
    font-size: 16px;
    color: #A0A0A0;
    margin-left: 8px;
  }
`;

const SliderContainer = styled.div`
  width: 100%;
  padding: 0 12px;
`;

const Slider = styled.input`
  width: 100%;
  height: 4px;
  background: #2A2A2A;
  outline: none;
  -webkit-appearance: none;
  border-radius: 2px;
  margin-bottom: 16px;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: #4169E1;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(65, 105, 225, 0.3);
    transition: all 0.2s ease;

    &:hover {
      transform: scale(1.1);
      background: #5479E8;
    }
  }
`;

const SliderValues = styled.div`
  display: flex;
  justify-content: space-between;
  color: #666666;
  font-size: 12px;
`;

const Description = styled.p`
  color: #A0A0A0;
  font-size: 14px;
  line-height: 1.6;
  margin-top: 24px;
  padding: 0 12px;
`;

function NotificationSettings() {
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [threshold, setThreshold] = useState(80);

  return (
    <NotificationContainer>
      <Section>
        <SectionTitle>
          <FiBell className="icon" />
          Notification Settings
        </SectionTitle>
        <ToggleContainer>
          <ToggleLabel>Enable notifications</ToggleLabel>
          <Toggle>
            <input
              type="checkbox"
              checked={isNotificationEnabled}
              onChange={(e) => setIsNotificationEnabled(e.target.checked)}
            />
            <span></span>
          </Toggle>
        </ToggleContainer>
        <Description>
          Receive notifications when important events occur in your application.
          You can customize the types of notifications below.
        </Description>
      </Section>

      <Section>
        <SectionTitle>
          <FiVolume2 className="icon" />
          Sound Threshold
        </SectionTitle>
        <ThresholdContainer>
          <ThresholdValue>
            {threshold}<span>dB</span>
          </ThresholdValue>
          <SliderContainer>
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
          <Description>
            Set the sound threshold level at which you'll receive notifications.
            We recommend setting it between 70-90 dB for optimal results.
          </Description>
        </ThresholdContainer>
      </Section>
    </NotificationContainer>
  );
}

export default NotificationSettings;