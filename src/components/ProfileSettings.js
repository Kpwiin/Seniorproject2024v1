// src/components/ProfileSettings.js
import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import NotificationSettings from './NotificationSettings';

const SettingsContainer = styled.div`
  min-height: 100vh;
  background-color: #1a1b2e;
  padding: 2rem;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 2rem;
`;

const Tab = styled.button`
  color: ${props => props.active ? '#4169E1' : '#8892b0'};
  border: none;
  background: none;
  padding: 0.5rem 1rem;
  font-size: 1.2rem;
  cursor: pointer;
  border-bottom: 2px solid ${props => props.active ? '#4169E1' : 'transparent'};
  transition: all 0.2s;

  &:hover {
    color: #4169E1;
  }
`;

const ProfileSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
`;

const ImageUploadContainer = styled.div`
  width: 150px;
  height: 150px;
  background-color: #2a2b3d;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-bottom: 2rem;
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  color: #8892b0;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  background-color: #2a2b3d;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1rem;

  &::placeholder {
    color: #8892b0;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
`;

const UpdateButton = styled.button`
  background-color: #4169E1;
  color: white;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #3558c0;
    transform: translateY(-2px);
  }
`;

const ResetButton = styled.button`
  background: none;
  color: #8892b0;
  border: none;
  padding: 0.8rem 2rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: white;
  }
`;


const SettingsContent = styled.div`
  background-color: #242538;
  border-radius: 15px;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

function ProfileSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = () => {
    console.log('Form submitted:', formData);
  };

  const handleReset = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: ''
    });
  };

  return (
    <SettingsContainer>
      <TabContainer>
        <Tab 
          active={activeTab === 'account'} 
          onClick={() => setActiveTab('account')}
        >
          Account Setting
        </Tab>
        <Tab 
          active={activeTab === 'notification'} 
          onClick={() => setActiveTab('notification')}
        >
          Notification
        </Tab>
      </TabContainer>
  
      {activeTab === 'account' ? (
        <>
          <ProfileSection>
            <div>
              <ImageUploadContainer>
                <span>Upload your photo</span>
              </ImageUploadContainer>
  
              <InputGroup>
                <Label>Username</Label>
                <Input 
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Please enter your username"
                />
              </InputGroup>
  
              <InputGroup>
                <Label>Password</Label>
                <Input 
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Please enter your new password"
                />
              </InputGroup>
  
              <InputGroup>
                <Label>Confirm Password</Label>
                <Input 
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Please confirm your new password"
                />
              </InputGroup>
            </div>
  
            <div>
              <InputGroup>
                <Label>Email</Label>
                <Input 
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Please enter your email"
                />
              </InputGroup>
  
              <InputGroup>
                <Label>Phone Number</Label>
                <Input 
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Please enter your phone number"
                />
              </InputGroup>
            </div>
          </ProfileSection>
  
          <ButtonContainer>
            <UpdateButton onClick={handleSubmit}>
              Update Profile
            </UpdateButton>
            <ResetButton onClick={handleReset}>
              Reset
            </ResetButton>
          </ButtonContainer>
        </>
      ) : (
        <NotificationSettings />
      )}
    </SettingsContainer>
  );
}

export default ProfileSettings;