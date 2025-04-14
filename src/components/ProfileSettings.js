import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FiUser, FiBell, FiLogOut, FiCamera, FiChevronRight, FiMail, FiLock, FiVolume2 } from 'react-icons/fi';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile, updateEmail, updatePassword, reauthenticateWithCredential, 
EmailAuthProvider, sendEmailVerification } from "firebase/auth";
import { auth, db } from "../firebase";

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
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
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
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
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
  
  &:disabled {
    background-color: #404040;
    color: #808080;
    cursor: not-allowed;
    opacity: 0.7;
    transform: none;
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

const ProfileImageContainer = styled.div`
  width: 150px;
  height: 150px;
  margin: 0 auto 20px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #2A2A2A;
  position: relative;
  
  &:hover .overlay {
    opacity: 1;
  }
`;

const ProfileImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ProfileImageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  cursor: pointer;
  
  .camera-icon {
    color: white;
    font-size: 32px;
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

const SliderValues = styled.div`
  display: flex;
  justify-content: space-between;
  color: #666666;
  font-size: 12px;
  margin-bottom: 24px;
`;

const StatusMessage = styled.div`
  padding: 12px;
  margin-top: 16px;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
  
  &.success {
    background-color: rgba(76, 175, 80, 0.2);
    color: #4CAF50;
    border: 1px solid rgba(76, 175, 80, 0.3);
  }
  
  &.error {
    background-color: rgba(244, 67, 54, 0.2);
    color: #F44336;
    border: 1px solid rgba(244, 67, 54, 0.3);
  }
  
  &.loading {
    background-color: rgba(33, 150, 243, 0.2);
    color: #2196F3;
    border: 1px solid rgba(33, 150, 243, 0.3);
  }
`;

function Settings() {
  const [activeMenu, setActiveMenu] = useState('account');
  const [newsEnabled, setNewsEnabled] = useState(true);
  const [noiseEnabled, setNoiseEnabled] = useState(true);
  const [threshold, setThreshold] = useState(80);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });
  const fileInputRef = useRef(null);

  // Function to convert file to base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "UserInfo", user.uid);
        const userDoc = await getDoc(userDocRef);
  
        if (userDoc.exists()) {
          const data = userDoc.data();
          
          // Load notification settings
          setNewsEnabled(data.newsEnabled ?? true);
          setNoiseEnabled(data.noiseEnabled ?? true);
          setThreshold(data.threshold ?? 80);
          setUsername(data.username || "");
          setEmail(user.email || "");
          setNewUsername(data.username || "");
          
          // Load profile image from base64 in database
          if (data.profileImageBase64) {
            setProfileImage(data.profileImageBase64);
          }
        }
      }
    });
  
    return () => unsubscribe();
  }, []);
  
  const handleSaveNotifications = async () => {
    try {
      const confirmSave = window.confirm("Are you sure you want to save these notification settings?");
      if (!confirmSave) return; 
  
      const user = auth.currentUser;
  
      if (user) {
        const userDocRef = doc(db, "UserInfo", user.uid);
        await updateDoc(userDocRef, {
          newsEnabled,
          noiseEnabled,
          threshold: Number(threshold),
        });
        
        setStatusMessage({
          type: 'success',
          message: 'Notification settings saved successfully!'
        });
        
        // Clear status message after 3 seconds
        setTimeout(() => {
          setStatusMessage({ type: '', message: '' });
        }, 3000);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      setStatusMessage({
        type: 'error',
        message: `Failed to save settings: ${error.message}`
      });
    }
  };  
  
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setStatusMessage({
        type: 'error',
        message: 'Invalid file type. Please upload a JPEG, PNG, or GIF image.'
      });
      return;
    }
    
    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      setStatusMessage({
        type: 'error',
        message: 'File is too large. Maximum size is 2MB.'
      });
      return;
    }
    
    setIsLoading(true);
    setStatusMessage({ type: 'loading', message: 'Processing image...' });
    
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user is signed in.');
      }
      
      // Convert file to base64
      const base64Image = await convertToBase64(file);
      
      // Update user document in Firestore with base64 image
      const userDocRef = doc(db, "UserInfo", user.uid);
      await updateDoc(userDocRef, {
        profileImageBase64: base64Image
      });
      
      // Update state
      setProfileImage(base64Image);
      setStatusMessage({
        type: 'success',
        message: 'Profile image updated successfully!'
      });
      
      // Clear status message after 3 seconds
      setTimeout(() => {
        setStatusMessage({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error uploading profile image:', error);
      setStatusMessage({
        type: 'error',
        message: `Failed to upload image: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteProfileImage = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    setIsLoading(true);
    setStatusMessage({ type: 'loading', message: 'Deleting profile image...' });
    
    try {
      // Update user document in Firestore
      const userDocRef = doc(db, "UserInfo", user.uid);
      await updateDoc(userDocRef, {
        profileImageBase64: null
      });
      
      // Update state
      setProfileImage(null);
      setStatusMessage({
        type: 'success',
        message: 'Profile image deleted successfully!'
      });
      
      // Clear status message after 3 seconds
      setTimeout(() => {
        setStatusMessage({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error deleting profile image:', error);
      setStatusMessage({
        type: 'error',
        message: `Failed to delete image: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const confirmLogout = window.confirm("Are you sure you want to log out?");
      if (!confirmLogout) return;
      
      await signOut(auth);
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Failed to sign out');
    }
  };

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    setStatusMessage({ type: 'loading', message: 'Updating profile...' });
  
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user is signed in.');
      }
  
      const uid = user.uid;
      const userDocRef = doc(db, "UserInfo", uid);
      const docSnap = await getDoc(userDocRef);
  
      if (!docSnap.exists()) {
        throw new Error('User document does not exist');
      }
  
      // Re-authentication if needed
      if ((email !== user.email || newPassword) && currentPassword) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        try {
          await reauthenticateWithCredential(user, credential);
        } catch (reauthError) {
          throw new Error('Failed to re-authenticate. Please check your current password.');
        }
      } else if ((email !== user.email || newPassword) && !currentPassword) {
        throw new Error('Please enter your current password to update email or password.');
      }
  
      // Update email if changed
      if (email !== user.email) {
        try {
          await updateEmail(user, email);
          await sendEmailVerification(user);
          setStatusMessage({
            type: 'success',
            message: 'A verification email has been sent to your new email. Please verify it.'
          });
          return;
        } catch (emailErr) {
          throw new Error('Failed to update email: ' + emailErr.message);
        }
      }
  
      // Update password if provided
      if (newPassword) {
        try {
          await updatePassword(user, newPassword);
        } catch (passErr) {
          throw new Error('Failed to update password: ' + passErr.message);
        }
      }
  
      // Update username in Firestore
      if (newUsername !== username) {
        await updateDoc(userDocRef, { username: newUsername });
      }
  
      setStatusMessage({
        type: 'success',
        message: 'Profile updated successfully!'
      });
      
      // Update local state
      setUsername(newUsername);
      
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      
      // Clear status message after 3 seconds
      setTimeout(() => {
        setStatusMessage({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setStatusMessage({
        type: 'error',
        message: error.message
      });
    } finally {
      setIsLoading(false);
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
            disabled={isLoading}
            style={{ 
              background: '#4169E1',
              color: '#FFFFFF',
              fontSize: '16px'
            }}
          >
            {isLoading ? 'Saving...' : 'Save changes'}
          </SaveButton>
          
          {statusMessage.message && (
            <StatusMessage className={statusMessage.type}>
              {statusMessage.message}
            </StatusMessage>
          )}
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
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </FormGroup>

          <FormGroup>
            <Label>
              <FiMail className="label-icon" />
              Email
            </Label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Enter new email"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>
              <FiLock className="label-icon" />
              Current Password
            </Label>
            <Input 
              type="password" 
              value={currentPassword} 
              onChange={(e) => setCurrentPassword(e.target.value)} 
              placeholder="Enter your current password (needed for email/password changes)"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>
              <FiLock className="label-icon" />
              New Password
            </Label>
            <Input 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              placeholder="Enter new password (leave blank to keep current)" 
            />
          </FormGroup>
          
          <SaveButton 
            onClick={handleUpdateProfile}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save changes'}
          </SaveButton>
          
          {statusMessage.message && (
            <StatusMessage className={statusMessage.type}>
              {statusMessage.message}
            </StatusMessage>
          )}
        </FormSection>

        <ProfileSection>
          <h3>Your Profile Picture</h3>
          
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/jpeg, image/png, image/gif"
            onChange={handleFileUpload}
          />
          
          {profileImage ? (
            <>
              <ProfileImageContainer>
                <ProfileImage src={profileImage} alt="Profile" />
                <ProfileImageOverlay 
                  className="overlay"
                  onClick={() => fileInputRef.current.click()}
                >
                  <FiCamera className="camera-icon" />
                </ProfileImageOverlay>
              </ProfileImageContainer>
              <DeleteLink onClick={handleDeleteProfileImage}>
                Delete avatar
              </DeleteLink>
            </>
          ) : (
            <UploadBox onClick={() => fileInputRef.current.click()}>
              <FiCamera className="camera-icon" />
              <span>Upload your photo</span>
              <span style={{ fontSize: '12px', color: '#666666' }}>
                Max file size: 2MB
              </span>
            </UploadBox>
          )}
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
            <MenuItem onClick={handleLogout}>
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