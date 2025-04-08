// src/components/Navbar.js
import React, { useState, useEffect, useRef } from 'react';
import { styled } from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, getDocs} from 'firebase/firestore';
import { useAuth } from "./AuthContext";

import { 
  FaHome,
  FaExclamationCircle,
  FaList,
  FaCog,
  FaServer,
  FaBell,
  FaUser,
  FaSignOutAlt,
  FaBars
} from 'react-icons/fa';

const NavbarContainer = styled.div`
  display: flex;
  
  .content {
    margin-left: ${props => props.isSidebarOpen ? '250px' : '0'};
    transition: margin-left 0.3s ease;
    width: 100%;
  }
`;

const TopBar = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  left: ${props => props.isSidebarOpen ? '250px' : '0'};
  height: 70px;
  background-color: #1a1a1a;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30px;
  z-index: 1000;
  border-bottom: 1px solid #2a2a2a;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease;
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: #b0b0b0;
  cursor: pointer;
  font-size: 20px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border-radius: 50%;

  &:hover {
    color: white;
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  background-color: #2a2a2a;
  padding: 10px 20px;
  border-radius: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    background-color: #323232;
  }
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: #b0b0b0;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    color: white;
    background-color: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  padding: 0 10px;
  
  .username {
    font-size: 15px;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 2px;
  }
  
  .role {
    font-size: 13px;
    color: #2196F3;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const UserProfile = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2196F3, #1976D2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
  text-transform: uppercase;
  box-shadow: 0 3px 6px rgba(33, 150, 243, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);
`;

const Sidebar = styled.div`
  width: 250px;
  background-color: #1a1a1a;
  padding: 25px 20px;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
  transform: translateX(${props => props.isOpen ? '0' : '-100%'});
  transition: transform 0.3s ease;
   z-index: 10000;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 35px;
  padding: 0 10px;
  
  img {
    width: 45px;
    height: 45px;
    object-fit: contain;
  }
  
  span {
    color: white;
    font-size: 26px;
    font-weight: bold;
    background: linear-gradient(135deg, #2196F3, #64B5F6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const MenuItem = styled.a`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  color: ${props => props.active ? '#ffffff' : '#888'};
  background: ${props => props.active ? 'linear-gradient(135deg, #2196F3, #1976D2)' : 'transparent'};
  margin-bottom: 8px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease;
  font-weight: 500;
  white-space: nowrap;
  border-radius: 8px;
  
  svg {
    font-size: 20px;
    min-width: 20px;
  }
  
  span {
    margin-left: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &:hover {
    background: ${props => props.active ? 'linear-gradient(135deg, #2196F3, #1976D2)' : 'rgba(255, 255, 255, 0.1)'};
    color: white;
  }
`;

const NotificationBadge = styled.div`
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: -2px;
    right: -2px;
    width: 10px;
    height: 10px;
    background-color: #ff4444;
    border-radius: 50%;
    border: 2px solid #1a1a1a;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.2);
      opacity: 0.8;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
`;
const NotificationModal = styled.div`
  position: absolute;
  top: 70px;
  right: 30px;
  background-color: #1a1a1a;
  padding: 15px;
  border-radius: 8px;
  width: 300px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1001;
`;

const ModalTitle = styled.h3`
  color: white;
  margin-bottom: 10px;
`;

const DeviceNotification = styled.div`
  color: white;
  padding: 8px 0;
  border-bottom: 1px solid #333;
`;

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [hasNotifications, setHasNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { role } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const bellRef = useRef(null);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
  
        try {
          const userDoc = await getDoc(doc(db, 'UserInfo', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserProfile({
              ...userData,
              username: userData.username || currentUser.email.split('@')[0],
            });
  
            // 👇 Check and update notification state
            const shouldNotify = userData.noiseEnabled && checkIfRecentAlert(userData.threshold);
            setHasNotifications(shouldNotify);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        navigate('/login');
      }
    });
  
    return () => unsubscribe();
  }, [navigate]);
  
  const checkIfRecentAlert = (threshold) => {
    // TODO: Replace this with real alert-checking logic from Firestore
    const lastNoiseLevel = 85; // Example simulated last value
    const recentTimestamp = Date.now() - 5 * 60 * 1000; // 5 minutes ago
  
    return lastNoiseLevel >= threshold && Date.now() - recentTimestamp < 10 * 60 * 1000;
  };

  const fetchNotifications = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
  
      // Get user settings from 'UserInfo' collection
      const userDoc = await getDoc(doc(db, 'UserInfo', user.uid));
      if (!userDoc.exists()) return;
  
      const { threshold, noiseEnabled } = userDoc.data();
      if (!noiseEnabled) return; // Exit if notifications are disabled
  
      // Fetch devices and sound levels
      const devicesSnapshot = await getDocs(collection(db, 'devices'));
      const soundsSnapshot = await getDocs(collection(db, 'sounds'));
  
      const devicesData = devicesSnapshot.docs.map(doc => doc.data());
      const soundsData = soundsSnapshot.docs.map(doc => doc.data());
  
      // Match devices with their sound levels and filter by threshold
      const notificationsData = devicesData
        .map(device => {
          // Filter related sounds based on deviceId
          const relatedSounds = soundsData
            .filter(s => String(s.deviceId) === String(device.deviceId))
            .sort((a, b) => {
              // Sort based on document ID to get the most recent one
              const aDocID = a.id || ''; // Access document ID
              const bDocID = b.id || ''; // Access document ID
              return bDocID.localeCompare(aDocID); // Sort by document ID in descending order
            });
  
          const latestSound = relatedSounds[0]; // Get the latest sound based on document ID
  
          // If there's no sound or the sound level is below the threshold, ignore it
          if (!latestSound || latestSound.level < threshold) return null;
  
          // Check if this sound level is recent and above the threshold
          if (!checkIfRecentAlert(latestSound.level, threshold)) return null;
  
          return {
            deviceName: device.deviceName,
            level: latestSound.level,
          };
        })
        .filter(n => n !== null); // Remove null values
  
      // Set notifications
      setNotifications(notificationsData);
  
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };
  
  
  const handleBellClick = () => {
    if (bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      setModalPosition({ top: rect.bottom + 20, left: rect.left - 150});
    }
    fetchNotifications();
    setShowNotifications(!showNotifications);
  };
  
  
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleMenuClick = (path) => (e) => {
    e.preventDefault();
    navigate(path);
  };

  return (
    <NavbarContainer isSidebarOpen={isSidebarOpen}>
      <Sidebar isOpen={isSidebarOpen}>
        <Logo>
          <img src="/logo.png" alt="Shockwave" />
          <span>Soundwave</span>
        </Logo>
        
        <MenuItem 
          href="/dashboard" 
          active={currentPath === '/dashboard'}
          onClick={handleMenuClick('/dashboard')}
        >
          <FaHome />
          <span>Dashboard</span>
        </MenuItem>
        
        <MenuItem 
          href="/complaints" 
          active={currentPath === '/complaints'}
          onClick={handleMenuClick('/complaints')}
        >
          <FaExclamationCircle />
          <span>Complaints</span>
        </MenuItem>
        
        <MenuItem 
          href="/classification" 
          active={currentPath === '/classification'}
          onClick={handleMenuClick('/classification')}
        >
          <FaList />
          <span>Classification</span>
        </MenuItem>
        
        <MenuItem 
          href="/settings" 
          active={currentPath === '/settings'}
          onClick={handleMenuClick('/settings')}
        >
          <FaCog />
          <span>Settings</span>
        </MenuItem>
         
        {role === 'admin' && (
          <MenuItem 
            href="/managedevices" 
            active={currentPath === '/managedevices'}
            onClick={handleMenuClick('/managedevices')}
          >
            <FaServer />
            <span>Manage Devices</span>
          </MenuItem>
        )}

          <MenuItem 
            href="/mydevices" 
            active={currentPath === '/mydevices'}
            onClick={handleMenuClick('/mydevices')}
          >
            <FaServer />
            <span>My Devices</span>
          </MenuItem>
      </Sidebar>

      <TopBar isSidebarOpen={isSidebarOpen}>
  <ToggleButton onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
    <FaBars />
  </ToggleButton>

  <UserSection>
    {hasNotifications ? (
      <NotificationBadge>
        <IconButton ref={bellRef} title="Notifications" onClick={handleBellClick}>
          <FaBell />
        </IconButton>
      </NotificationBadge>
    ) : (
      <IconButton ref={bellRef} title="Notifications" onClick={handleBellClick}>
        <FaBell />
      </IconButton>
    )}

    {showNotifications && (
      <NotificationModal style={{ position: 'absolute', top: modalPosition.top, left: modalPosition.left }}>
        <ModalTitle>Device Alerts</ModalTitle>
        {notifications.length > 0 ? (
          notifications.map((notif, index) => (
            <DeviceNotification key={index}>
              <strong>{notif.deviceName}</strong>: Level {notif.level}
            </DeviceNotification>
          ))
        ) : (
          <p>No notifications</p>
        )}
      </NotificationModal>
    )}

    <IconButton title="Settings">
      <FaCog />
    </IconButton>

    <UserInfo>
      <UserProfile>
        <div>
          <div className="username">
            {userProfile?.username || user?.email.split('@')[0] || 'User'}
          </div>
          <div className="role">
            {userProfile?.role === 'admin' ? 'Administrator' : 'User'}
          </div>
        </div>
        <UserAvatar>
          {getInitials(userProfile?.username || user?.email.split('@')[0])}
        </UserAvatar>
      </UserProfile>
    </UserInfo>

    <IconButton onClick={handleSignOut} title="Sign Out">
      <FaSignOutAlt />
    </IconButton>
  </UserSection>
</TopBar>

    </NavbarContainer>
  );
}

export default Navbar;