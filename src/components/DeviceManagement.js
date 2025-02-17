import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { FiSettings } from 'react-icons/fi';

const Container = styled.div`
  padding: 20px;
  width: 100%;
`;

const Title = styled.h1`
  color: white;
  margin-bottom: 20px;
`;

const TabContainer = styled.div`
  margin-bottom: 20px;
  border-bottom: 1px solid #333;
`;

const Tab = styled.span`
  color: ${props => props.active ? '#1a75ff' : '#666'};
  padding: 10px 20px;
  cursor: pointer;
  border-bottom: 2px solid ${props => props.active ? '#1a75ff' : 'transparent'};
  margin-right: 20px;
  display: inline-block;
  transition: all 0.3s ease;

  &:hover {
    color: #1a75ff;
  }
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  color: white;
  table-layout: fixed;
  background: #1a1a1a;
`;

const Th = styled.th`
  text-align: left;
  padding: 15px;
  border-bottom: 1px solid #333;
  color: #999;
  font-weight: normal;
`;

const Td = styled.td`
  padding: 15px;
  border-bottom: 1px solid #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
`;

const TableRow = styled.tr`
  &:hover {
    background-color: rgba(26, 117, 255, 0.1);
  }
`;

const LocationCell = styled(Td)`
  position: relative;
  
  &:hover::after {
    content: attr(data-location);
    position: absolute;
    left: 0;
    top: 100%;
    background: #333;
    padding: 5px;
    border-radius: 4px;
    z-index: 1000;
    white-space: normal;
    max-width: 400px;
    word-wrap: break-word;
  }
`;

const StatusBadge = styled.span`
  display: flex;
  align-items: center;
  justify-content: center; // เพิ่มเพื่อจัดให้อยู่กึ่งกลาง
  gap: 8px;
  
  &::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${props => props.active ? '#4CAF50' : '#f44336'};
    margin-bottom: 1px; // ปรับให้จุดอยู่ในแนวเดียวกับตัวอักษร
  }
  color: ${props => props.active ? '#4CAF50' : '#f44336'};
`;

const SettingsIcon = styled(FiSettings)`
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    color: #1a75ff;
    transform: rotate(90deg);
  }
`;

const LoadingContainer = styled.div`
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2rem;
`;

const NoDevicesMessage = styled.div`
  color: #999;
  text-align: center;
  padding: 20px;
  font-style: italic;
`;

function DeviceManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Devices list');
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'devices'));
      const deviceList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDevices(deviceList);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (deviceId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      const deviceRef = doc(db, 'devices', deviceId);
      
      await updateDoc(deviceRef, {
        status: newStatus,
        lastUpdated: new Date()
      });

      setDevices(devices.map(device => 
        device.id === deviceId 
          ? { ...device, status: newStatus }
          : device
      ));
    } catch (error) {
      console.error('Error updating device status:', error);
    }
  };

  const handleSettingsClick = (deviceId) => {
    navigate(`/device/${deviceId}/settings`);
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    if (tabName === 'Add device') {
      navigate('/devices/add');
    }
  };

  if (loading) {
    return <LoadingContainer>Loading...</LoadingContainer>;
  }

  return (
    <Container>
      <Title>Manage Devices</Title>
      
      <TabContainer>
        <Tab 
          active={activeTab === 'Devices list'} 
          onClick={() => handleTabChange('Devices list')}
        >
          Devices list
        </Tab>
        <Tab 
          active={activeTab === 'Add device'} 
          onClick={() => handleTabChange('Add device')}
        >
          Add device
        </Tab>
      </TabContainer>

      {devices.length === 0 ? (
        <NoDevicesMessage>No devices found</NoDevicesMessage>
      ) : (
        <Table>
  <thead>
    <tr>
      <Th style={{ width: '20%', textAlign: 'center' }}>Device name</Th>
      <Th style={{ width: '8%', textAlign: 'center' }}>Device ID</Th>
      <Th style={{ width: '42%' }}>Location</Th>
      <Th style={{ width: '10%', textAlign: 'center' }}>Date added</Th>
      <Th style={{ width: '12%', textAlign: 'center' }}>Status</Th>
      <Th style={{ width: '8%', textAlign: 'center' }}>Setting</Th>
    </tr>
  </thead>
  <tbody>
    {devices.map((device) => (
      <TableRow key={device.id}>
        <Td style={{ textAlign: 'center' }}>{device.deviceName}</Td>
        <Td style={{ textAlign: 'center' }}>{device.deviceId}</Td>
        <LocationCell data-location={device.location}>
          {device.location}
        </LocationCell>
        <Td style={{ textAlign: 'center' }}>
          {device.createdAt ? new Date(device.createdAt.toDate()).toLocaleDateString() : 'N/A'}
        </Td>
        <Td style={{ textAlign: 'center' }}>
          <StatusBadge 
            active={device.status === 'Active'}
            onClick={() => handleStatusToggle(device.id, device.status)}
          >
            {device.status === 'Active' ? 'Active' : 'Inactive'}
          </StatusBadge>
        </Td>
        <Td style={{ textAlign: 'center' }}>
          <SettingsIcon onClick={() => handleSettingsClick(device.id)} />
        </Td>
      </TableRow>
    ))}
  </tbody>
</Table>
      )}
    </Container>
  );
}

export default DeviceManagement;