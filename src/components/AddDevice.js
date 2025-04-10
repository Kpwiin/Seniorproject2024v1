import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import mqtt from 'mqtt';
import { getStorage, ref as storageRef, uploadBytes } from 'firebase/storage';

const Container = styled.div`
  background-color: #121212;
  min-height: 1vh;
`;

const Title = styled.h1`
  color: #FFFFFF;
  text-align: center;
  font-size: 2rem;
  margin-bottom: 3rem;
`;

const FormContainer = styled.form`
  max-width: 800px;
  margin: 0 auto;
  background-color: #1E1E1E;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 4px 8px rgba(255, 255, 255, 0.1);
  border: 1px solid #333;
`;

const FormGroup = styled.div`
  margin-bottom: 2rem;
`;

const Label = styled.label`
  display: block;
  color: #E0E0E0;
  margin-bottom: 0.5rem;
  font-size: 1rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  border-radius: 8px;
  border: 1px solid #333;
  background-color: #2D2D2D;
  color: #FFFFFF;
  font-size: 1rem;

  &::placeholder {
    color: #808080;
  }

  &:focus {
    outline: none;
    border-color: #FFFFFF;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 3rem;
`;

const Button = styled.button`
  background-color: #FFFFFF;
  color: #121212;
  border: none;
  padding: 0.8rem 3rem;
  border-radius: 10px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #E0E0E0;
    transform: translateY(-2px);
  }

  &:disabled {
    background-color: #404040;
    color: #808080;
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const LocationButton = styled.button`
  background-color: #FFFFFF;
  color: #121212;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  margin-top: 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;

  &:hover {
    background-color: #E0E0E0;
    transform: translateY(-2px);
  }
`;

const ErrorMessage = styled.div`
  color: #FF4444;
  margin-top: 0.5rem;
  font-size: 0.9rem;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  color: #FFFFFF;
  z-index: 1000;
`;

const InfoWindowContent = styled.div`
  color: #121212;
  font-size: 0.9rem;
  line-height: 1.4;
  padding: 0.5rem;
  max-width: 250px;

  h3 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
    color: #121212;
  }

  p {
    margin: 0.2rem 0;
    color: #333333;
  }
`;

const MapContainer = styled.div`
  height: 400px;
  width: 100%;
  margin-bottom: 1.5rem;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(255, 255, 255, 0.1);
  border: 1px solid #333;
`;

const SmallText = styled.small`
  color: #808080;
  display: block;
  margin-top: 0.5rem;
  font-size: 0.8rem;
`;

const NotificationBox = styled.div`
  background-color: #2D2D2D;
  color: #FFFFFF;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  border-left: 4px solid #4CAF50;
  text-align: center;
`;

const SuccessNotification = styled.div`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #4CAF50;
  color: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  text-align: center;
  max-width: 80%;
  animation: fadeIn 0.3s ease-out;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translate(-50%, -20px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }
`;

function AddDevice() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    deviceName: '',
    location: '',
    latitude: null,
    longitude: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [center, setCenter] = useState({ lat: 13.7563, lng: 100.5018 });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showInfoWindow, setShowInfoWindow] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapInstance, setMapInstance] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);
  const [user, setUser] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deviceDetails, setDeviceDetails] = useState(null);

  // ตรวจสอบการล็อกอิน
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        navigate('/login', { state: { from: '/add-device' } });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // ฟังก์ชันสร้างที่เก็บไฟล์เสียง
  const createAudioStorage = async (deviceId) => {
    try {
      const storage = getStorage();
      
      // สร้างไฟล์ placeholder เพื่อสร้างโฟลเดอร์
      const emptyBlob = new Blob([''], { type: 'text/plain' });
      const audioFolderRef = storageRef(storage, `audio/${deviceId}/.placeholder`);
      
      // อัปโหลดไฟล์ placeholder
      await uploadBytes(audioFolderRef, emptyBlob);
      console.log(`Created audio storage folder for device: ${deviceId}`);
      
      return true;
    } catch (error) {
      console.error('Error creating audio storage:', error);
      return false;
    }
  };

  const getAddressFromLatLng = async (lat, lng) => {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const latlng = { lat, lng };

      const result = await new Promise((resolve, reject) => {
        geocoder.geocode({ location: latlng, language: 'en' }, (results, status) => {
          if (status === 'OK') {
            resolve(results[0]);
          } else {
            reject(status);
          }
        });
      });

      const addressComponents = result.address_components;
      const formattedAddress = result.formatted_address;

      const locationData = {
        fullAddress: formattedAddress,
        street: addressComponents.find(c => c.types.includes('route'))?.long_name || '',
        subdistrict: addressComponents.find(c => c.types.includes('sublocality_level_1'))?.long_name || '',
        district: addressComponents.find(c => c.types.includes('administrative_area_level_2'))?.long_name || '',
        province: addressComponents.find(c => c.types.includes('administrative_area_level_1'))?.long_name || '',
        postalCode: addressComponents.find(c => c.types.includes('postal_code'))?.long_name || '',
      };

      setLocationInfo(locationData);
      return formattedAddress;
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Address not found';
    }
  };

  const handleMapClick = async (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    
    setSelectedLocation({ lat, lng });
    const address = await getAddressFromLatLng(lat, lng);
    
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      location: address
    }));
    setShowInfoWindow(true);
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    try {
      const geocoder = new window.google.maps.Geocoder();
      
      geocoder.geocode(
        { 
          address: searchQuery,
          region: 'TH',
          language: 'en'
        }, 
        async (results, status) => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            const lat = location.lat();
            const lng = location.lng();
            const address = await getAddressFromLatLng(lat, lng);

            setCenter({ lat, lng });
            setSelectedLocation({ lat, lng });
            setFormData(prev => ({
              ...prev,
              location: address,
              latitude: lat,
              longitude: lng
            }));
            setShowInfoWindow(true);

            if (mapInstance) {
              mapInstance.panTo({ lat, lng });
              mapInstance.setZoom(17);
            }
          } else {
            alert('Location not found. Please try again.');
          }
        }
      );
    } catch (error) {
      console.error('Error searching location:', error);
      alert('Error searching location');
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setCenter({ lat, lng });
          setSelectedLocation({ lat, lng });
          
          const address = await getAddressFromLatLng(lat, lng);
          
          setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            location: address
          }));
          
          if (mapInstance) {
            mapInstance.panTo({ lat, lng });
            mapInstance.setZoom(17);
          }
          
          setShowInfoWindow(true);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get current location');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  const handleMapLoad = (map) => {
    setMapInstance(map);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.deviceName.trim()) {
      newErrors.deviceName = 'Device name is required';
    }
    if (!formData.location) {
      newErrors.location = 'Please select location on map';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ฟังก์ชันส่งข้อมูลไปยัง ESP32 ผ่าน MQTT
  const sendDataToESP32 = async (deviceId, token) => {
    try {
      // เชื่อมต่อกับ MQTT broker
      const client = mqtt.connect('mqtt://test.mosquitto.org:1883');
      
      return new Promise((resolve, reject) => {
        client.on('connect', () => {
          console.log('Connected to MQTT broker');
          
          // สร้าง topic สำหรับส่งข้อมูลไปยัง ESP32
          const topic = `spl/registration/broadcast`;
          
          // สร้างข้อมูลที่จะส่ง
          const message = JSON.stringify({
            deviceId: deviceId,
            token: token,
            status: 'registered',
            noiseThreshold: 85.0,
            samplingPeriod: 1,
            recordDuration: 10
          });
          
          // ส่งข้อมูลไปยัง ESP32
          client.publish(topic, message, () => {
            console.log(`Registration data sent to ${topic}`);
            client.end();
            resolve(true);
          });
        });
        
        client.on('error', (err) => {
          console.error('MQTT error:', err);
          reject(err);
        });
      });
    } catch (mqttError) {
      console.error('Error connecting to MQTT:', mqttError);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!user) {
      alert('Please login to add device');
      navigate('/login');
      return;
    }

    setIsLoading(true);
    try {
      // Get current device count for deviceId
      const querySnapshot = await getDocs(collection(db, 'devices'));
      const deviceCount = querySnapshot.size;
      const newDeviceId = String(deviceCount + 1);
      
      // Generate random token
      const newToken = `TKN-${Math.random().toString(36).substr(2, 16).toUpperCase()}`;

      const deviceData = {
        deviceName: formData.deviceName,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        deviceId: newDeviceId,
        token: newToken,
        locationInfo,
        createdAt: new Date(),
        status: 'Inactive',
        userId: user.uid,
        // เพิ่มข้อมูลผู้เพิ่มอุปกรณ์
        addby: user.displayName || user.email,
        userEmail: user.email,
        noiseThreshold: 85.0,
        samplingPeriod: 1,
        recordDuration: 10,
        audioStorage: {
          path: `audio/${newDeviceId}`,
          created: new Date()
        }
      };

      // หา document ID ล่าสุด
      const devicesRef = collection(db, 'devices');
      const docsSnapshot = await getDocs(devicesRef);
      
      let maxId = 0;
      docsSnapshot.forEach((doc) => {
        // พยายามแปลง ID เป็นตัวเลข
        const docId = parseInt(doc.id);
        if (!isNaN(docId) && docId > maxId) {
          maxId = docId;
        }
      });
      
      // สร้าง document ID ใหม่ (เริ่มจาก 1 ถ้าไม่มีเอกสารใดๆ)
      let newDocId;
      if (maxId < 0) {
        // ถ้ายังไม่มีเอกสารใดๆ ให้เริ่มที่ 1
        newDocId = "1";
      } else {
        // ถ้ามีเอกสารอยู่แล้ว ให้เพิ่มขึ้นอีก 1
        newDocId = String(maxId + 1);
      }
      
      // บันทึกลง Firestore ด้วย document ID ที่กำหนดเอง
      await setDoc(doc(db, 'devices', newDocId), deviceData);
      
      // สร้างที่เก็บไฟล์เสียง
      await createAudioStorage(newDeviceId);
      
      // ส่งข้อมูลไปยัง ESP32
      await sendDataToESP32(newDeviceId, newToken);
      
      // เก็บข้อมูลอุปกรณ์เพื่อแสดงในการแจ้งเตือน
      setDeviceDetails({
        deviceId: newDeviceId,
        token: newToken,
        name: formData.deviceName
      });
      
      // แสดงการแจ้งเตือนความสำเร็จ
      setSuccessMessage(`Device "${formData.deviceName}" added successfully!`);
      setShowSuccess(true);
      
      // ซ่อนการแจ้งเตือนหลังจาก 5 วินาที
      setTimeout(() => {
        setShowSuccess(false);
        navigate(`/device/${newDocId}/settings`);
      }, 5000);
    } catch (error) {
      console.error('Error adding device:', error);
      alert('Error adding device');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      {isLoading && (
        <LoadingOverlay>
          <div>Adding device...</div>
        </LoadingOverlay>
      )}
      
      {showSuccess && (
        <SuccessNotification>
          <h3 style={{ margin: '0 0 10px 0' }}>{successMessage}</h3>
          {deviceDetails && (
            <div>
              <p style={{ margin: '5px 0' }}>Device ID: {deviceDetails.deviceId}</p>
              <p style={{ margin: '5px 0' }}>Token: {deviceDetails.token}</p>
              <p style={{ margin: '10px 0 0 0', fontSize: '0.9rem' }}>Your ESP32 should now display these details.</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem' }}>Redirecting to device settings...</p>
            </div>
          )}
        </SuccessNotification>
      )}

      <Title>Add Device</Title>
      
      <FormContainer onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Device Name</Label>
          <Input
            type="text"
            value={formData.deviceName}
            onChange={(e) => setFormData(prev => ({ ...prev, deviceName: e.target.value }))}
            placeholder="Enter device name"
          />
          {errors.deviceName && <ErrorMessage>{errors.deviceName}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label>Location</Label>
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search location"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                searchLocation();
              }
            }}
          />
          <LocationButton type="button" onClick={searchLocation}>
            Search Location
          </LocationButton>
          {errors.location && <ErrorMessage>{errors.location}</ErrorMessage>}
        </FormGroup>
        
        <FormGroup>
          <Label>Select Location on Map</Label>
          <LocationButton type="button" onClick={getCurrentLocation}>
            Get Current Location
          </LocationButton>
          <MapContainer>
            <LoadScript googleMapsApiKey="AIzaSyCTREfSARKCah8_j3CSMXgsBZUMQyJWZYk">
              <GoogleMap
                mapContainerStyle={{ height: "100%", width: "100%" }}
                center={center}
                zoom={15}
                onClick={handleMapClick}
                onLoad={handleMapLoad}
                options={{
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: true,
                  fullscreenControl: true,
                }}
              >
                {selectedLocation && (
                  <Marker position={selectedLocation} animation={2}>
                    {showInfoWindow && locationInfo && (
                      <InfoWindow
                        position={selectedLocation}
                        onCloseClick={() => setShowInfoWindow(false)}
                      >
                        <InfoWindowContent>
                          <h3>Selected Location</h3>
                          <p>{locationInfo.fullAddress}</p>
                          {locationInfo.street && <p>Street: {locationInfo.street}</p>}
                          {locationInfo.subdistrict && <p>Sub-district: {locationInfo.subdistrict}</p>}
                          {locationInfo.district && <p>District: {locationInfo.district}</p>}
                          {locationInfo.province && <p>Province: {locationInfo.province}</p>}
                          {locationInfo.postalCode && <p>Postal Code: {locationInfo.postalCode}</p>}
                        </InfoWindowContent>
                      </InfoWindow>
                    )}
                  </Marker>
                )}
              </GoogleMap>
            </LoadScript>
          </MapContainer>
        </FormGroup>

        <FormGroup>
          <Label>Audio Storage</Label>
          <SmallText>
            A storage folder for .wav audio files will be automatically created for this device.
            The ESP32 will be able to upload audio recordings to this storage.
          </SmallText>
        </FormGroup>

        <ButtonContainer>
          <Button type="button" onClick={() => navigate('/managedevices')}>
            Back
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? 'Adding...' : 'Add'}
          </Button>
        </ButtonContainer>
      </FormContainer>
    </Container>
  );
}

export default AddDevice;