import React, { useState } from 'react';
import styled from 'styled-components';
import { FiUser, FiBell, FiLogOut, FiCamera, FiChevronRight, FiMail, FiLock } from 'react-icons/fi';
import { useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase"; 


const Container = styled.div`
  padding: 40px;
  background: #0A0A0A;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 1200px;
  animation: fadeIn 0.5s ease-in-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const Title = styled.h1`
  margin-top: 60px;
  color: #FFFFFF;
  font-size: 32px;
  margin-bottom: 30px;
  font-weight: 600;
  letter-spacing: -0.5px;
`;

const ContentLayout = styled.div`
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 40px;
`;

const MenuList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #151515;
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
`;

const MenuItem = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  border-radius: 12px;
  cursor: pointer;
  color: ${props => props.active ? '#FFFFFF' : '#A0A0A0'};
  transition: all 0.2s ease-in-out;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(4px);
  }

  .icon {
    margin-right: 12px;
    font-size: 20px;
  }

  .arrow {
    margin-left: auto;
    opacity: 0.5;
  }
`;

const FormContainer = styled.div`
  background: #151515;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  display: grid;
  grid-template-columns: minmax(auto, 600px) 300px;
  gap: 60px;
  align-items: start;
`;

const FormSection = styled.div`
  width: 100%;
`;

const FormTitle = styled.h2`
  color: #FFFFFF;
  margin-bottom: 40px;
  font-weight: 600;
  font-size: 24px;
  position: relative;
`;

const FormGroup = styled.div`
  margin-bottom: 32px;

  &:last-of-type {
    margin-bottom: 40px;
  }
`;

const Label = styled.div`
  color: #A0A0A0;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;

  .label-icon {
    margin-right: 8px;
    font-size: 16px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 16px;
  background: #1A1A1A;
  border: 1px solid #2A2A2A;
  border-radius: 12px;
  color: #FFFFFF;
  font-size: 14px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #FFFFFF;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
  }

  &::placeholder {
    color: #666666;
  }
`;

const ChangePasswordLink = styled.a`
  color: #FFFFFF;
  font-size: 14px;
  text-decoration: none;
  margin-top: 12px;
  display: inline-block;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: #A0A0A0;
    transform: translateX(4px);
  }
`;

const SaveButton = styled.button`
  width: 100%;
  padding: 16px;
  background: #FFFFFF;
  color: #000000;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  margin-top: 16px;
  position: relative;
  overflow: hidden;

  &:hover {
    background: #E0E0E0;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to right,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  &:hover:after {
    transform: translateX(100%);
  }
`;
const ProfileSection = styled.div`
  text-align: center;
  background: #1A1A1A;
  padding: 32px;
  border-radius: 16px;
  border: 1px solid #2A2A2A;

  h3 {
    color: #FFFFFF;
    margin-bottom: 24px;
    font-size: 18px;
    font-weight: 600;
    position: relative;

    &:after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 30px;
      height: 2px;
      background: #FFFFFF;
      border-radius: 2px;
    }
  }
`;

const UploadBox = styled.div`
  width: 100%;
  aspect-ratio: 1;
  border: 2px dashed #2A2A2A;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #A0A0A0;
  cursor: pointer;
  margin-bottom: 20px;
  background: #151515;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #FFFFFF;
    background: #202020;
    transform: translateY(-2px);
  }

  .camera-icon {
    font-size: 32px;
    margin-bottom: 12px;
    color: #FFFFFF;
  }

  span {
    font-size: 14px;
    margin-top: 8px;
  }
`;

const DeleteLink = styled.a`
  color: #FF4D4F;
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: #FF7875;
  }
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

function Settings() {
  const [activeMenu, setActiveMenu] = useState('account');
  const [newsEnabled, setNewsEnabled] = useState(true);
  const [noiseEnabled, setNoiseEnabled] = useState(true);
  const [threshold, setThreshold] = useState(80);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();  

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();
  
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "UserInfo", user.uid);
        const userDoc = await getDoc(userDocRef);
  
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUsername(data.username || "");
          setEmail(data.email || "");
  
          // Load notification settings
          setNewsEnabled(data.newsEnabled ?? true);
          setNoiseEnabled(data.noiseEnabled ?? true);
          setThreshold(data.threshold ?? 80);
        }
      }
    });
  
    return () => unsubscribe();
  }, []);
  
  const handleSaveNotifications = async () => {
    try {
      const confirmSave = window.confirm("Are you sure you want to save these notification settings?");
      if (!confirmSave) return; 
  
      const auth = getAuth();
      const db = getFirestore();
      const user = auth.currentUser;
  
      if (user) {
        const userDocRef = doc(db, "UserInfo", user.uid);
        await updateDoc(userDocRef, {
          newsEnabled,
          noiseEnabled,
          threshold: Number(threshold),
        });
        alert("Notification settings saved!");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings.");
    }
  };  
  
  const handleSignOut = async () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    
    if (confirmLogout) {
      try {
        await signOut(auth);
        navigate('/login'); // Redirect to login page
      } catch (error) {
        console.error('Error signing out:', error);
      }
    }
  };  
  
  const renderContent = () => {
    if (activeMenu === 'notifications') {
      return (
        <FormContainer style={{ display: 'block', padding: '40px' }}>
          <h2 style={{ 
            color: '#FFFFFF', 
            fontSize: '32px', 
            marginBottom: '40px',
            fontWeight: '600' 
          }}>
            Notification Settings
          </h2>
    
          {/* News and Updates Toggle */}
          <div style={{ 
            background: '#151515', 
            borderRadius: '12px', 
            padding: '24px',
            marginBottom: '16px',
            position: 'relative'
          }}>
            <div style={{ paddingRight: '80px' }}>
              <h3 style={{ 
                color: '#FFFFFF', 
                fontSize: '16px',
                marginBottom: '8px'
              }}>
                News and updates
              </h3>
              <p style={{ 
                color: '#666666',
                fontSize: '14px'
              }}>
                News about new updates and features
              </p>
            </div>
            <Toggle style={{ 
              position: 'absolute', 
              right: '24px', 
              top: '50%', 
              transform: 'translateY(-50%)'
            }}>
              <input
                type="checkbox"
                checked={newsEnabled}
                onChange={(e) => setNewsEnabled(e.target.checked)}
              />
              <span></span>
            </Toggle>
          </div>
    
          {/* Loud Noise Notification Toggle */}
          <div style={{ 
            background: '#151515', 
            borderRadius: '12px', 
            padding: '24px',
            marginBottom: '40px',
            position: 'relative'
          }}>
            <div style={{ paddingRight: '80px' }}>
              <h3 style={{ 
                color: '#FFFFFF', 
                fontSize: '16px',
                marginBottom: '8px'
              }}>
                Loud noise notification
              </h3>
              <p style={{ 
                color: '#666666',
                fontSize: '14px'
              }}>
                Alert when noise exceeds a set threshold
              </p>
            </div>
            <Toggle style={{ 
              position: 'absolute', 
              right: '24px', 
              top: '50%', 
              transform: 'translateY(-50%)'
            }}>
              <input
                type="checkbox"
                checked={noiseEnabled}
                onChange={(e) => setNoiseEnabled(e.target.checked)}
              />
              <span></span>
            </Toggle>
          </div>
    
          {/* Alert Threshold Section */}
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <span style={{ 
                color: '#FFFFFF',
                fontSize: '16px',
                fontWeight: '500'
              }}>
                Alert threshold
              </span>
              <span style={{ 
                color: '#FFFFFF',
                fontSize: '16px',
                fontWeight: '500'
              }}>
                {threshold} dB
              </span>
            </div>
    
            <div style={{ marginBottom: '40px' }}>
              <Slider
                type="range"
                min="0"
                max="100"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                style={{
                  background: `linear-gradient(to right, #4169E1 ${threshold}%, #2A2A2A ${threshold}%)`
                }}
              />
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '8px',
                color: '#666666',
                fontSize: '14px'
              }}>
                <span>0 dB</span>
                <span>50 dB</span>
                <span>100 dB</span>
              </div>
            </div>
          </div>
    
          {/* Save Button */}
          <SaveButton 
      onClick={handleSaveNotifications}
      style={{ 
        background: '#4169E1',
        color: '#FFFFFF',
        fontSize: '16px'
      }}
    >
      Save change
    </SaveButton>

        </FormContainer>
      );
    }

    return (
      <FormContainer>
         <FormSection>
        <FormTitle>Edit your profile</FormTitle>
        <FormGroup>
          <Label>
            <FiUser className="label-icon" />
            Username
          </Label>
          <Input 
          type="text" 
          value={username}
          placeholder="Enter your username"
        />

        </FormGroup>


        <FormGroup>
          <Label>
            <FiMail className="label-icon" />
            Email
          </Label>
          <Input type="email" defaultValue={email} placeholder="Enter your email" />
        </FormGroup>
        <FormGroup>
          <Label>
            <FiLock className="label-icon" />
            Password
          </Label>
          <Input type="password" defaultValue="••••••••••••••••••••••••" />
          <ChangePasswordLink>Change password</ChangePasswordLink>
        </FormGroup>
        <SaveButton>Save changes</SaveButton>
      </FormSection>

        <ProfileSection>
          <h3>Your Profile Picture</h3>
          <UploadBox>
            <FiCamera className="camera-icon" />
            <span>Upload your photo</span>
            <span style={{ fontSize: '12px', color: '#666666' }}>
              Max file size: 2MB
            </span>
          </UploadBox>
          <DeleteLink>Delete avatar</DeleteLink>
        </ProfileSection>
      </FormContainer>
    );
  };

  return (
    <Container>
      <ContentWrapper>
        <Title>Settings</Title>
        <ContentLayout>
          <MenuList>
            <MenuItem 
              active={activeMenu === 'account'} 
              onClick={() => setActiveMenu('account')}
            >
              <FiUser className="icon" />
              Account settings
              <FiChevronRight className="arrow" />
            </MenuItem>
            <MenuItem 
              active={activeMenu === 'notifications'}
              onClick={() => setActiveMenu('notifications')}
            >
              <FiBell className="icon" />
              Notification settings
              <FiChevronRight className="arrow" />
            </MenuItem>
            <MenuItem onClick={handleSignOut}>
              <FiLogOut className="icon" />
              Log Out
              <FiChevronRight className="arrow" />
            </MenuItem>
          </MenuList>

          {renderContent()}
        </ContentLayout>
      </ContentWrapper>
    </Container>
  );
}

export default Settings;