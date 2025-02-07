import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useJsApiLoader, GoogleMap, Marker } from '@react-google-maps/api';
import { FaCopy, FaEdit, FaKey, FaSync, FaTrash } from 'react-icons/fa';

// Styled Components
const Container = styled.div`
  background-color: #1a1b2e;
  min-height: 100vh;
  padding: 2rem;
  color: white;
`;

const DeviceHeader = styled.div`
  max-width: 1200px;
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

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const MapSection = styled.div`
  background: #242538;
  border-radius: 15px;
  padding: 1rem;
  height: 500px;
`;

const SettingsSection = styled.div`
  background: #242538;
  border-radius: 15px;
  padding: 2rem;
`;

const SettingGroup = styled.div`
  margin-bottom: 2rem;
`;

const SettingLabel = styled.p`
  margin-bottom: 1rem;
  font-size: 1.2rem;
`;

const Value = styled.span`
  display: block;
  margin-top: 0.5rem;
  color: #888;
`;

const ButtonGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 2rem;
`;

const ActionButton = styled.button`
  width: 100%;
  background-color: ${props => props.color || '#4169E1'};
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    background-color: ${props => props.hoverColor || '#3151b0'};
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
`;

const SaveButton = styled.button`
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 0.8rem 3rem;
  border-radius: 10px;
  font-size: 1.1rem;
  cursor: pointer;
  display: block;
  margin: 2rem auto 0 auto;
  transition: all 0.3s ease;

  &:hover {
    background-color: #3e8e41;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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

const StatusIndicator = styled.div`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
  background-color: ${props => props.status === 'Active' ? '#4CAF50' : '#FF5252'};
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #1a1b2e;
  padding: 2.5rem;
  border-radius: 15px;
  text-align: center;
  color: white;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  animation: modalFadeIn 0.3s ease;

  @keyframes modalFadeIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ModalTitle = styled.h3`
  margin-bottom: 1rem;
  font-size: 1.5rem;
`;

const TokenContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #242538;
  padding: 1.2rem;
  border-radius: 10px;
  font-size: 1.2rem;
  word-break: break-all;
  margin: 1.5rem 0;
  color: #fff;
  border: 1px solid rgba(255,255,255,0.1);
`;

const ApiSection = styled.div`
  text-align: left;
  background: #242538;
  padding: 1.2rem;
  border-radius: 10px;
  margin: 1rem 0;
  font-family: monospace;
`;

const ApiLabel = styled.div`
  color: #888;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`;

const ApiValue = styled.div`
  word-break: break-all;
  margin-bottom: 1rem;
`;

const ApiMethod = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255,255,255,0.1);
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 1rem;
`;

const Tab = styled.button`
  padding: 0.5rem 1rem;
  background: ${props => props.active ? '#4CAF50' : '#242538'};
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 5px;
  margin-right: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.active ? '#45a049' : '#2f3047'};
  }
`;

const CopyIcon = styled(FaCopy)`
  cursor: pointer;
  color: #4CAF50;
  margin-left: 1rem;
  transition: all 0.3s ease;

  &:hover {
    color: #3e8e41;
    transform: scale(1.1);
  }
`;

const CloseButton = styled.button`
  background-color: #FF5252;
  color: white;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
  transition: all 0.3s ease;

  &:hover {
    background-color: #D43F3F;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
`;
function DeviceSettings() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [deviceData, setDeviceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [map, setMap] = useState(null);
  const [locationData, setLocationData] = useState({ lat: 13.7563, lng: 100.5018 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('token');
  const [apiData, setApiData] = useState(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyCTREfSARKCah8_j3CSMXgsBZUMQyJWZYk",
    libraries: ['places', 'maps']
  });

  const mapContainerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '10px'
  };

  const options = {
    disableDefaultUI: false,
    zoomControl: true,
  };

  const loadDeviceData = async () => {
    try {
      const docRef = doc(db, 'devices', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const updatedData = {
          ...data,
          status: data.status || 'Inactive',
          noiseThreshold: data.noiseThreshold || 85,
          samplingPeriod: data.samplingPeriod || 2,
          recordDuration: data.recordDuration || 4
        };

        setDeviceData(updatedData);
        setApiData(data.apiDocumentation || null);

        if (updatedData.latitude && updatedData.longitude) {
          const newLocation = {
            lat: parseFloat(updatedData.latitude),
            lng: parseFloat(updatedData.longitude)
          };
          setLocationData(newLocation);

          if (map) {
            map.panTo(newLocation);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching device:', error);
      alert('Failed to load device settings');
    } finally {
      setIsLoading(false);
    }
  };

  const generateToken = async () => {
    try {
      const newToken = Math.random().toString(36).substr(2, 15) + 
                      Math.random().toString(36).substr(2, 15);
      
      const docRef = doc(db, 'devices', id);
      await updateDoc(docRef, {
        token: newToken
      });

      setDeviceData(prev => ({
        ...prev,
        token: newToken
      }));

      setActiveTab('token');
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error generating token:', error);
      alert('Failed to generate new token');
    }
  };

  const generateApi = async () => {
    try {
      const baseUrl = "https://your-api-base-url.com/api/v1";
      const endpoint = `${baseUrl}/devices/${id}`;
      const apiKey = `dev_${Math.random().toString(36).substr(2, 15)}`;

      const apiDoc = {
        endpoint: endpoint,
        apiKey: apiKey,
        methods: {
          GET: {
            description: "Get device data",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            }
          },
          POST: {
            description: "Update device data",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            }
          }
        }
      };

      const docRef = doc(db, 'devices', id);
      await updateDoc(docRef, {
        apiEndpoint: endpoint,
        apiKey: apiKey,
        apiDocumentation: apiDoc
      });

      setApiData(apiDoc);
      setActiveTab('api');
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error generating API:', error);
      alert('Failed to generate API endpoint');
    }
  };

  const handleShowToken = () => {
    setActiveTab('token');
    setIsModalOpen(true);
  };

  const handleCopyToken = () => {
    if (deviceData?.token) {
      navigator.clipboard.writeText(deviceData.token);
      alert('Token copied to clipboard!');
    }
  };

  const handleRemoveDevice = async () => {
    const confirmDelete = window.confirm("Are you sure you want to remove this device?");
    if (!confirmDelete) return;

    try {
      const docRef = doc(db, 'devices', id);
      await deleteDoc(docRef);
      alert('Device removed successfully');
      navigate('/devices');
    } catch (error) {
      console.error('Error removing device:', error);
      alert('Failed to remove device');
    }
  };

  const handleSave = async () => {
    try {
      const docRef = doc(db, 'devices', id);
      await updateDoc(docRef, deviceData);
      alert('Changes saved successfully!');
      navigate('/devices');
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes');
    }
  };

  useEffect(() => {
    if (location.state?.updatedData) {
      setDeviceData(location.state.updatedData);
    } else {
      loadDeviceData();
    }
  }, [id, location.state]);

  const onMapLoad = (mapInstance) => {
    setMap(mapInstance);
  };

  const renderMap = () => {
    if (!isLoaded || !window.google) return <div>Loading maps...</div>;

    const maps = window.google.maps;

    const customMarker = {
      url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
      scaledSize: new maps.Size(40, 40),
      origin: new maps.Point(0, 0),
      anchor: new maps.Point(20, 20)
    };

    return (
      <MapSection>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={locationData}
          zoom={15}
          options={options}
          onLoad={onMapLoad}
        >
          <Marker
            key={`${locationData.lat}-${locationData.lng}-${Date.now()}`}
            position={locationData}
            icon={customMarker}
            animation={maps.Animation.DROP}
          />
        </GoogleMap>
      </MapSection>
    );
  };

  if (isLoading) return <LoadingOverlay>Loading...</LoadingOverlay>;
  if (!deviceData) return <Container>Device not found</Container>;

  return (
    <Container>
      <DeviceHeader>
        <DeviceTitle>
          <StatusIndicator status={deviceData.status} />
          {deviceData.deviceName}
        </DeviceTitle>
        <Location>Location: {deviceData.location}</Location>
      </DeviceHeader>

      <ContentWrapper>
        {renderMap()}

        <SettingsSection>
          <SettingGroup>
            <SettingLabel>Device Status</SettingLabel>
            <Value>{deviceData.status}</Value>
          </SettingGroup>

          <SettingGroup>
            <SettingLabel>Noise threshold</SettingLabel>
            <Value>{deviceData.noiseThreshold} dB</Value>
          </SettingGroup>

          <SettingGroup>
            <SettingLabel>Noise sampling period</SettingLabel>
            <Value>{deviceData.samplingPeriod} min</Value>
          </SettingGroup>

          <SettingGroup>
            <SettingLabel>Record duration</SettingLabel>
            <Value>{deviceData.recordDuration} min</Value>
          </SettingGroup>

          <ButtonContainer>
            <ButtonGroup>
              <ActionButton 
                onClick={() => navigate(`/device/${id}/edit`, { state: { deviceData } })}
                color="#4169E1"
                hoverColor="#3151b0"
              >
                <FaEdit />
                Edit Settings
              </ActionButton>
              
              <ActionButton 
                onClick={handleShowToken}
                color="#4CAF50"
                hoverColor="#3e8e41"
              >
                <FaKey />
                Show Token
              </ActionButton>
            </ButtonGroup>

            <ButtonGroup>
              <ActionButton 
                onClick={generateApi}
                color="#FF9800"
                hoverColor="#F57C00"
              >
                <FaSync />
                Generate API
              </ActionButton>
              
              <ActionButton 
                onClick={handleRemoveDevice}
                color="#FF5252"
                hoverColor="#D43F3F"
              >
                <FaTrash />
                Remove Device
              </ActionButton>
            </ButtonGroup>
          </ButtonContainer>
        </SettingsSection>
      </ContentWrapper>

      <SaveButton onClick={handleSave}>Save</SaveButton>

      {isModalOpen && (
        <ModalOverlay>
          <ModalContent>
            <TabContainer>
              <Tab 
                active={activeTab === 'token'} 
                onClick={() => setActiveTab('token')}
              >
                Token
              </Tab>
              <Tab 
                active={activeTab === 'api'} 
                onClick={() => setActiveTab('api')}
              >
                API
              </Tab>
            </TabContainer>

            {activeTab === 'token' ? (
              <>
                <ModalTitle>Device Token</ModalTitle>
                <TokenContainer>
                  {deviceData?.token || 'No token available'}
                  <CopyIcon onClick={handleCopyToken} />
                </TokenContainer>
              </>
            ) : (
              <>
                <ModalTitle>API Documentation</ModalTitle>
                <ApiSection>
                  <ApiLabel>Endpoint:</ApiLabel>
                  <ApiValue>
                    {apiData?.endpoint}
                    <CopyIcon onClick={() => navigator.clipboard.writeText(apiData?.endpoint)} />
                  </ApiValue>

                  <ApiLabel>API Key:</ApiLabel>
                  <ApiValue>
                    {apiData?.apiKey}
                    <CopyIcon onClick={() => navigator.clipboard.writeText(apiData?.apiKey)} />
                  </ApiValue>

                  <ApiMethod>
                    <ApiLabel>GET Request Example:</ApiLabel>
                    <ApiValue>
                      {`curl -X GET ${apiData?.endpoint} \\
-H "Authorization: Bearer ${apiData?.apiKey}" \\
-H "Content-Type: application/json"`}
                      <CopyIcon onClick={() => navigator.clipboard.writeText(
                        `curl -X GET ${apiData?.endpoint} -H "Authorization: Bearer ${apiData?.apiKey}" -H "Content-Type: application/json"`
                      )} />
                    </ApiValue>
                  </ApiMethod>

                  <ApiMethod>
                    <ApiLabel>POST Request Example:</ApiLabel>
                    <ApiValue>
                      {`curl -X POST ${apiData?.endpoint} \\
-H "Authorization: Bearer ${apiData?.apiKey}" \\
-H "Content-Type: application/json" \\
-d '{"noiseLevel": 75}'`}
                      <CopyIcon onClick={() => navigator.clipboard.writeText(
                        `curl -X POST ${apiData?.endpoint} -H "Authorization: Bearer ${apiData?.apiKey}" -H "Content-Type: application/json" -d '{"noiseLevel": 75}'`
                      )} />
                    </ApiValue>
                  </ApiMethod>
                </ApiSection>
              </>
            )}
            <CloseButton onClick={() => setIsModalOpen(false)}>Close</CloseButton>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}

export default DeviceSettings;