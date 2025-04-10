import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useJsApiLoader, GoogleMap, Marker } from '@react-google-maps/api';
import { FaCopy, FaEdit, FaKey, FaSync, FaTrash } from 'react-icons/fa';

// Styled Components
const Container = styled.div`
  background-color: #000000;
  min-height: 100vh;
  padding: 2rem;
  padding-top: 80px; // เพิ่มระยะห่างด้านบนเพื่อไม่ให้ถูก navbar บัง
  color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const DeviceHeader = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto 2rem;
  text-align: center;
  margin-top: 20px; // เพิ่มระยะห่างเพิ่มเติมถ้าจำเป็น
`;

const DeviceTitle = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  color: #ffffff;
`;

const Location = styled.p`
  color: #a0a0a0;
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
  background: #1a1a1a;
  border-radius: 15px;
  padding: 1rem;
  height: 500px;
  border: 1px solid #333;
`;

const SettingsSection = styled.div`
  background: #1a1a1a;
  border-radius: 15px;
  padding: 2rem;
  border: 1px solid #333;
`;

const SettingGroup = styled.div`
  margin-bottom: 2rem;
`;

const SettingLabel = styled.p`
  margin-bottom: 1rem;
  font-size: 1.2rem;
  color: #ffffff;
`;

const Value = styled.span`
  display: block;
  margin-top: 0.5rem;
  color: #a0a0a0;
`;

const ActionButton = styled.button`
  width: 100%;
  background-color: ${props => props.color || '#404040'};
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
  border: 1px solid #404040;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255,255,255,0.1);
    background-color: ${props => props.hoverColor || '#505050'};
  }
`;

const SaveButton = styled.button`
  background-color: #ffffff;
  color: #000000;
  border: none;
  padding: 0.8rem 3rem;
  border-radius: 10px;
  font-size: 1.1rem;
  cursor: pointer;
  display: block;
  margin: 2rem auto 0 auto;
  transition: all 0.3s ease;

  &:hover {
    background-color: #e0e0e0;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255,255,255,0.1);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #1a1a1a;
  padding: 2.5rem;
  border-radius: 15px;
  text-align: center;
  color: white;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(255,255,255,0.1);
  border: 1px solid #333;
`;

const TokenContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #000000;
  padding: 1.2rem;
  border-radius: 10px;
  font-size: 1.2rem;
  word-break: break-all;
  margin: 1.5rem 0;
  color: #fff;
  border: 1px solid #333;
`;

const Tab = styled.button`
  padding: 0.5rem 1rem;
  background: ${props => props.active ? '#ffffff' : '#333333'};
  color: ${props => props.active ? '#000000' : '#ffffff'};
  border: none;
  cursor: pointer;
  border-radius: 5px;
  margin-right: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.active ? '#e0e0e0' : '#404040'};
  }
`;

const CopyIcon = styled(FaCopy)`
  cursor: pointer;
  color: #ffffff;
  margin-left: 1rem;
  transition: all 0.3s ease;

  &:hover {
    color: #a0a0a0;
    transform: scale(1.1);
  }
`;

const StatusIndicator = styled.div`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
  background-color: ${props => props.status === 'Active' ? '#4CAF50' : '#FF5252'};
  box-shadow: 0 0 8px ${props => props.status === 'Active' ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255, 82, 82, 0.5)'};
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 ${props => props.status === 'Active' ? 'rgba(76, 175, 80, 0.4)' : 'rgba(255, 82, 82, 0.4)'};
    }
    70% {
      box-shadow: 0 0 0 6px ${props => props.status === 'Active' ? 'rgba(76, 175, 80, 0)' : 'rgba(255, 82, 82, 0)'};
    }
    100% {
      box-shadow: 0 0 0 0 ${props => props.status === 'Active' ? 'rgba(76, 175, 80, 0)' : 'rgba(255, 82, 82, 0)'};
    }
  }
`;
const LoadingOverlay = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 1.2rem;
  height: 100vh;
  background-color: #000000;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
`;

const ButtonGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 2rem;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 1rem;
`;

const ModalTitle = styled.h3`
  margin-bottom: 1rem;
  font-size: 1.5rem;
  color: #ffffff;
`;

const ApiSection = styled.div`
  text-align: left;
  background: #000000;
  padding: 1.2rem;
  border-radius: 10px;
  margin: 1rem 0;
  font-family: monospace;
  border: 1px solid #333;
  max-height: 400px;
  overflow-y: auto;
`;

const ApiLabel = styled.div`
  color: #a0a0a0;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`;

const ApiValue = styled.div`
  word-break: break-all;
  margin-bottom: 1rem;
  color: #ffffff;
`;

const ApiMethod = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #333;
`;

const CloseButton = styled.button`
  background-color: #ffffff;
  color: #000000;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
  transition: all 0.3s ease;

  &:hover {
    background-color: #e0e0e0;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255,255,255,0.1);
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
        setIsLoading(true);
        
        // สร้าง API Key
        const newApiKey = `api_${Math.random().toString(36).substring(2, 15)}`;
        
        // สร้าง MQTT topics
        const mqttTopics = {
            data: `spl/device/${id}/data`,
            audio: `spl/device/${id}/audio`,
            settings: `spl/device/${id}/settings`,
            status: `spl/device/${id}/status`,
            registration: `spl/registration/broadcast`
        };
        
        // สร้าง API documentation
        const apiDoc = {
            endpoint: `http://localhost:5001/api/devices/${id}`,
            apiKey: newApiKey,
            mqttTopics: mqttTopics,
            methods: {
                GET: {
                    description: "Get device data",
                    url: `http://localhost:5001/api/devices/${id}`,
                    headers: {
                        "x-api-key": newApiKey,
                        "Content-Type": "application/json"
                    }
                },
                POST_DATA: {
                    description: "Send noise level data",
                    url: `http://localhost:5001/api/devices/${id}/data`,
                    headers: {
                        "x-api-key": newApiKey,
                        "Content-Type": "application/json"
                    },
                    body: {
                        noiseLevel: "number (dB)",
                        timestamp: "string (ISO format)"
                    }
                },
                POST_AUDIO: {
                    description: "Upload audio file (.wav)",
                    url: `http://localhost:5001/api/devices/${id}/audio`,
                    headers: {
                        "x-api-key": newApiKey,
                        "Content-Type": "multipart/form-data"
                    },
                    body: {
                        audio: "file (.wav)",
                        timestamp: "string (ISO format)",
                        noiseLevel: "number (dB)"
                    }
                }
            }
        };

        // บันทึกข้อมูล API ลงใน Firebase
        const docRef = doc(db, 'devices', id);
        await updateDoc(docRef, {
            apiKey: newApiKey,
            apiEndpoint: apiDoc.endpoint,
            apiDocumentation: apiDoc,
            mqttTopics: mqttTopics
        });

        // อัพเดท state
        setApiData(apiDoc);
        setDeviceData(prev => ({
            ...prev,
            apiKey: newApiKey,
            apiEndpoint: apiDoc.endpoint,
            mqttTopics: mqttTopics
        }));

        // แสดง API documentation
        setActiveTab('api');
        setIsModalOpen(true);

    } catch (error) {
        console.error('Error generating API:', error);
        alert('Failed to generate API: ' + error.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleShowToken = async () => {
    // ถ้ายังไม่มี API data ให้สร้างก่อน
    if (!apiData) {
      try {
        await generateApi();
      } catch (error) {
        console.error('Error generating API:', error);
      }
    }
    
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
      navigate('/managedevices');
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
      navigate('/managedevices');
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
                Show Token & API
              </ActionButton>
            </ButtonGroup>

            <ButtonGroup>
              <ActionButton 
                onClick={handleRemoveDevice}
                color="#FF5252"
                hoverColor="#D43F3F"
                style={{ gridColumn: "1 / span 2" }}
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
                    <CopyIcon onClick={() => {
                      navigator.clipboard.writeText(apiData?.endpoint);
                      alert('Endpoint copied to clipboard!');
                    }} />
                  </ApiValue>

                  <ApiLabel>API Key:</ApiLabel>
                  <ApiValue>
                    {apiData?.apiKey}
                    <CopyIcon onClick={() => {
                      navigator.clipboard.writeText(apiData?.apiKey);
                      alert('API Key copied to clipboard!');
                    }} />
                  </ApiValue>

                  <ApiMethod>
                    <ApiLabel>MQTT Topics:</ApiLabel>
                    <ApiValue>
                      Data Topic: {apiData?.mqttTopics?.data}
                      <CopyIcon onClick={() => {
                        navigator.clipboard.writeText(apiData?.mqttTopics?.data);
                        alert('Data topic copied to clipboard!');
                      }} />
                    </ApiValue>
                    <ApiValue>
                      Audio Topic: {apiData?.mqttTopics?.audio}
                      <CopyIcon onClick={() => {
                        navigator.clipboard.writeText(apiData?.mqttTopics?.audio);
                        alert('Audio topic copied to clipboard!');
                      }} />
                    </ApiValue>
                    <ApiValue>
                      Settings Topic: {apiData?.mqttTopics?.settings}
                      <CopyIcon onClick={() => {
                        navigator.clipboard.writeText(apiData?.mqttTopics?.settings);
                        alert('Settings topic copied to clipboard!');
                      }} />
                    </ApiValue>
                    <ApiValue>
                      Status Topic: {apiData?.mqttTopics?.status}
                      <CopyIcon onClick={() => {
                        navigator.clipboard.writeText(apiData?.mqttTopics?.status);
                        alert('Status topic copied to clipboard!');
                      }} />
                    </ApiValue>
                    <ApiValue>
                      Registration Topic: {apiData?.mqttTopics?.registration}
                      <CopyIcon onClick={() => {
                        navigator.clipboard.writeText(apiData?.mqttTopics?.registration);
                        alert('Registration topic copied to clipboard!');
                      }} />
                    </ApiValue>
                  </ApiMethod>

                  <ApiMethod>
                    <ApiLabel>GET Request Example:</ApiLabel>
                    <ApiValue>
                      {`curl -X GET ${apiData?.methods?.GET?.url} \\
-H "x-api-key: ${apiData?.apiKey}" \\
-H "Content-Type: application/json"`}
                      <CopyIcon onClick={() => {
                        const curlCommand = `curl -X GET ${apiData?.methods?.GET?.url} -H "x-api-key: ${apiData?.apiKey}" -H "Content-Type: application/json"`;
                        navigator.clipboard.writeText(curlCommand);
                        alert('GET request copied to clipboard!');
                      }} />
                    </ApiValue>
                  </ApiMethod>

                  <ApiMethod>
                    <ApiLabel>POST Noise Data Example:</ApiLabel>
                    <ApiValue>
                      {`curl -X POST ${apiData?.methods?.POST_DATA?.url} \\
-H "x-api-key: ${apiData?.apiKey}" \\
-H "Content-Type: application/json" \\
-d '{"noiseLevel": 75, "timestamp": "${new Date().toISOString()}"}'`}
                      <CopyIcon onClick={() => {
                        const curlCommand = `curl -X POST ${apiData?.methods?.POST_DATA?.url} -H "x-api-key: ${apiData?.apiKey}" -H "Content-Type: application/json" -d '{"noiseLevel": 75, "timestamp": "${new Date().toISOString()}"}'`;
                        navigator.clipboard.writeText(curlCommand);
                        alert('POST noise data request copied to clipboard!');
                      }} />
                    </ApiValue>
                  </ApiMethod>

                  <ApiMethod>
                    <ApiLabel>POST Audio File (.wav) Example:</ApiLabel>
                    <ApiValue>
                      {`curl -X POST ${apiData?.methods?.POST_AUDIO?.url} \\
-H "x-api-key: ${apiData?.apiKey}" \\
-F "audio=@recording.wav" \\
-F "timestamp=${new Date().toISOString()}" \\
-F "noiseLevel=75"`}
                      <CopyIcon onClick={() => {
                        const curlCommand = `curl -X POST ${apiData?.methods?.POST_AUDIO?.url} -H "x-api-key: ${apiData?.apiKey}" -F "audio=@recording.wav" -F "timestamp=${new Date().toISOString()}" -F "noiseLevel=75"`;
                        navigator.clipboard.writeText(curlCommand);
                        alert('POST audio file request copied to clipboard!');
                      }} />
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