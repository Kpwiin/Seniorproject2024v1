import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTools, FaSearch, FaFilter, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
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
  grid-template-columns: 1fr 380px;
  gap: 1.5rem;
  max-width: 1800px;
  margin: 0 auto;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Section = styled.div`
  background-color: #242538;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
`;

const Title = styled.h2`
  color: #4169E1;
  font-size: 1.5rem;
  font-weight: 600;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background-color: #2a2b3d;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  margin-bottom: 1rem;

  input {
    border: none;
    background: none;
    outline: none;
    width: 100%;
    margin-left: 0.5rem;
    font-size: 0.9rem;
    color: #ffffff;

    &::placeholder {
      color: #6c757d;
    }
  }
`;

const IconButton = styled.button`
  background-color: ${props => props.primary ? '#4169E1' : '#2a2b3d'};
  color: white;
  border: none;
  padding: 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;

  &:hover {
    background-color: ${props => props.primary ? '#3558c0' : '#363749'};
    transform: translateY(-2px);
  }
`;

const FilterButton = styled.button`
  background-color: ${props => props.active ? '#4169E1' : '#2a2b3d'};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;

  &:hover {
    background-color: ${props => props.active ? '#3558c0' : '#363749'};
  }
`;

const DeviceCard = styled.div`
  background-color: #2a2b3d;
  border: 1px solid ${props => props.status === 'active' ? '#4CAF50' : '#FF7F7F'};
  padding: 1rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`;

const StatusBadge = styled.span`
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  background-color: ${props => props.status === 'active' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 127, 127, 0.2)'};
  color: ${props => props.status === 'active' ? '#4CAF50' : '#FF7F7F'};
`;

const DeviceName = styled.h3`
  color: white;
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  padding-right: 100px;
`;

const LocationText = styled.p`
  color: #b2bec3;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem 0;
`;

const LastUpdatedText = styled.p`
  color: #6c757d;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const LoadingText = styled.div`
  color: white;
  font-size: 1.2rem;
  text-align: center;
  padding: 2rem;
`;

const ErrorText = styled.div`
  color: #FF7F7F;
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

const DeviceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  max-height: calc(100vh - 250px);
  overflow-y: auto;
  padding-right: 0.5rem;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #2a2b3d;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #4169E1;
    border-radius: 3px;
  }
`;

const ToggleButton = styled.button`
  background-color: ${props => props.active ? '#4169E1' : '#2a2b3d'};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;

  &:hover {
    background-color: ${props => props.active ? '#3558c0' : '#363749'};
  }
`;
const MapControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ViewToggle = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.8rem;
`;

const FilterButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

function Dashboard() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [mapView, setMapView] = useState('map');

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'devices'));
        const deviceList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          status: doc.data().status === 'active' ? 'active' : 'inactive',
        }));
        setDevices(deviceList);
        setFilteredDevices(deviceList);
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

  const handleManageDevices = () => {
    navigate('/devices');
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    filterDevices(term, filterStatus);
  };

  const handleStatusFilter = (status) => {
    setFilterStatus(status);
    filterDevices(searchTerm, status);
  };

  const filterDevices = (term, status) => {
    let filtered = devices;
    
    if (term) {
      filtered = filtered.filter(device => 
        device.deviceName.toLowerCase().includes(term) ||
        device.location.toLowerCase().includes(term)
      );
    }

    if (status !== 'all') {
      filtered = filtered.filter(device => device.status === status);
    }

    setFilteredDevices(filtered);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <DashboardContainer>
      <ContentGrid>
        <Section>
          <MapControls>
            <Title>Map View</Title>
            <ViewToggle>
              <ToggleButton
                active={mapView === 'map'}
                onClick={() => setMapView('map')}
              >
                Standard
              </ToggleButton>
              <ToggleButton
                active={mapView === 'satellite'}
                onClick={() => setMapView('satellite')}
              >
                Satellite
              </ToggleButton>
            </ViewToggle>
          </MapControls>
          <Map view={mapView} devices={filteredDevices} />
        </Section>

        <Section>
          <SectionHeader>
            <Title>Devices</Title>
            <ActionButtons>
              <IconButton onClick={() => handleStatusFilter('all')}>
                <FaFilter /> Filter
              </IconButton>
              <IconButton primary onClick={handleManageDevices}>
                <FaTools /> Manage
              </IconButton>
            </ActionButtons>
          </SectionHeader>

          <SearchBar>
            <FaSearch color="#a0a0a0" />
            <input
              type="text"
              placeholder="Search devices..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </SearchBar>

          <FilterButtons>
            <FilterButton
              active={filterStatus === 'all'}
              onClick={() => handleStatusFilter('all')}
            >
              All
            </FilterButton>
            <FilterButton
              active={filterStatus === 'active'}
              onClick={() => handleStatusFilter('active')}
            >
              Active
            </FilterButton>
            <FilterButton
              active={filterStatus === 'inactive'}
              onClick={() => handleStatusFilter('inactive')}
            >
              Inactive
            </FilterButton>
          </FilterButtons>

          {isLoading ? (
            <LoadingText>Loading devices...</LoadingText>
          ) : error ? (
            <ErrorText>{error}</ErrorText>
          ) : filteredDevices.length === 0 ? (
            <NoDevicesText>No devices found</NoDevicesText>
          ) : (
            <DeviceList>
              {filteredDevices.map((device) => (
                <DeviceCard
                  key={device.id}
                  status={device.status}
                  onClick={() => handleDeviceClick(device.id)}
                >
                  <StatusBadge status={device.status}>
                    {device.status.toUpperCase()}
                  </StatusBadge>
                  <DeviceName>{device.deviceName}</DeviceName>
                  <LocationText>
                    <FaMapMarkerAlt />
                    {device.location}
                  </LocationText>
                  <LastUpdatedText>
                    <FaClock />
                    Last Updated: {formatDate(device.lastUpdated)}
                  </LastUpdatedText>
                </DeviceCard>
              ))}
            </DeviceList>
          )}
        </Section>
      </ContentGrid>
    </DashboardContainer>
  );
}

export default Dashboard;