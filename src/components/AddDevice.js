import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

const Container = styled.div`
  background-color: #1a1b2e;
  min-height: 100vh;
  padding: 2rem;
`;

const Title = styled.h1`
  color: #4169E1;
  text-align: center;
  font-size: 2rem;
  margin-bottom: 3rem;
`;

const FormContainer = styled.form`
  max-width: 800px;
  margin: 0 auto;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  color: white;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  border-radius: 8px;
  border: none;
  background-color: white;
  margin-bottom: 0.5rem;
  pointer-events: ${(props) => (props.readOnly ? 'none' : 'auto')};
  color: ${(props) => (props.readOnly ? '#999' : 'black')};

  &::placeholder {
    color: #999;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 3rem;
`;

const Button = styled.button`
  background-color: #4169E1;
  color: white;
  border: none;
  padding: 0.8rem 3rem;
  border-radius: 10px;
  font-size: 1.1rem;
  cursor: pointer;

  &:hover {
    background-color: #3151b0;
  }
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  z-index: 1000;
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  margin-top: 0.5rem;
  font-size: 0.9rem;
`;

const MapContainer = styled.div`
  height: 400px;
  width: 100%;
  margin-bottom: 1.5rem;
  border-radius: 8px;
  overflow: hidden;
`;

const LocationButton = styled.button`
  background-color: #4169E1;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  margin-bottom: 1rem;
  cursor: pointer;
  width: auto;
  display: inline-block;

  &:hover {
    background-color: #3151b0;
  }
`;

const InfoWindowContent = styled.div`
  padding: 10px;
  
  h3 {
    margin: 0 0 8px 0;
    color: #333;
  }
  
  p {
    margin: 4px 0;
    color: #666;
  }
`;

const LocationInfo = styled.div`
  background: #2a2b3d;
  padding: 15px;
  border-radius: 8px;
  margin-top: 10px;
  color: white;

  h4 {
    margin: 0 0 8px 0;
    color: #4169E1;
  }

  p {
    margin: 4px 0;
  }
`;

function AddDevice() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    deviceName: '',
    location: '',
    deviceId: '',
    token: '',
    latitude: null,
    longitude: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [center, setCenter] = useState({ lat: 13.7563, lng: 100.5018 });
  const [locationInfo, setLocationInfo] = useState(null);
  const [showInfoWindow, setShowInfoWindow] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchDeviceId = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'devices'));
        const deviceCount = querySnapshot.size;
        setFormData((prev) => ({
          ...prev,
          deviceId: String(deviceCount + 1)
        }));
      } catch (error) {
        console.error('Error fetching device count:', error);
        alert('Failed to fetch device ID. Please try again.');
      }
    };

    fetchDeviceId();
  }, []);

  const fetchLocationInfo = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyAt02FUjfI5nnVTGSROXaGKaJ-dHtFomOo`
      );
      const data = await response.json();
      
      if (data.results && data.results[0]) {
        const result = data.results[0];
        const addressComponents = result.address_components;
        
        // เก็บที่อยู่แบบเต็ม
        const fullAddress = result.formatted_address;
  
        const locationData = {
          fullAddress: fullAddress, // เก็บที่อยู่แบบเต็ม
          street: addressComponents.find(c => c.types.includes('route'))?.long_name || '',
          subdistrict: addressComponents.find(c => c.types.includes('sublocality'))?.long_name || '',
          district: addressComponents.find(c => c.types.includes('locality'))?.long_name || '',
          province: addressComponents.find(c => c.types.includes('administrative_area_level_1'))?.long_name || '',
          postalCode: addressComponents.find(c => c.types.includes('postal_code'))?.long_name || '',
        };
  
        setLocationInfo(locationData);
        setFormData(prev => ({
          ...prev,
          location: fullAddress // ใช้ที่อยู่แบบเต็มในฟอร์ม
        }));
      }
    } catch (error) {
      console.error('Error fetching location info:', error);
    }
  };

  const searchLocation = async (query) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=AIzaSyAt02FUjfI5nnVTGSROXaGKaJ-dHtFomOo`
      );
      const data = await response.json();
      
      if (data.results && data.results[0]) {
        const result = data.results[0];
        const { lat, lng } = result.geometry.location;
        
        setCenter({ lat, lng });
        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }));
        
        await fetchLocationInfo(lat, lng);
        setShowInfoWindow(true);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.deviceName.trim()) {
      newErrors.deviceName = 'Device name is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    if (!formData.latitude || !formData.longitude) {
      newErrors.location = 'Please select location on map';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleMapClick = async (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
    
    await fetchLocationInfo(lat, lng);
    setShowInfoWindow(true);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setCenter({ lat, lng });
          setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng
          }));
          
          await fetchLocationInfo(lat, lng);
          setShowInfoWindow(true);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'location') {
      setSearchQuery(value);
    }
    
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      searchLocation(searchQuery);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const deviceData = {
        ...formData,
        token: formData.token || `TKN-${Math.random().toString(36).substr(2, 16).toUpperCase()}`,
        createdAt: new Date(),
        status: 'active',
        locationInfo: locationInfo
      };

      await addDoc(collection(db, 'devices'), deviceData);
      alert('Device added successfully!');
      navigate('/devices');
    } catch (error) {
      console.error('Error adding device:', error);
      alert('Failed to add device. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (window.confirm('Are you sure you want to go back? Any unsaved changes will be lost.')) {
      navigate('/devices');
    }
  };

  return (
    <Container>
      {isLoading && (
        <LoadingOverlay>
          <div>Adding device...</div>
        </LoadingOverlay>
      )}

      <Title>Add device</Title>

      <FormContainer onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Device name</Label>
          <Input
            type="text"
            name="deviceName"
            placeholder="Please enter device name"
            value={formData.deviceName}
            onChange={handleChange}
          />
          {errors.deviceName && <ErrorMessage>{errors.deviceName}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label>Location</Label>
          <Input
            type="text"
            name="location"
            placeholder="Search location or enter address"
            value={formData.location}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
          />
          <LocationButton 
            type="button" 
            onClick={() => searchQuery.trim() && searchLocation(searchQuery)}
            style={{ marginTop: '10px' }}
          >
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
            <LoadScript googleMapsApiKey="AIzaSyAt02FUjfI5nnVTGSROXaGKaJ-dHtFomOo">
              <GoogleMap
                mapContainerStyle={{ height: "100%", width: "100%" }}
                center={center}
                zoom={13}
                onClick={handleMapClick}
              >
                {formData.latitude && formData.longitude && (
                  <Marker
                    position={{
                      lat: formData.latitude,
                      lng: formData.longitude
                    }}
                  >
                    {showInfoWindow && locationInfo && (
                      <InfoWindow
                        position={{
                          lat: formData.latitude,
                          lng: formData.longitude
                        }}
                        onCloseClick={() => setShowInfoWindow(false)}
                      >
                        <InfoWindowContent>
                          <h3>Location Details</h3>
                          <p>{locationInfo.fullAddress}</p>
                        </InfoWindowContent>
                      </InfoWindow>
                    )}
                  </Marker>
                )}
              </GoogleMap>
            </LoadScript>
          </MapContainer>

          {locationInfo && (
            <LocationInfo>
              <h4>Selected Location Details</h4>
              <p><strong>Street:</strong> {locationInfo.street}</p>
              <p><strong>Subdistrict:</strong> {locationInfo.subdistrict}</p>
              <p><strong>District:</strong> {locationInfo.district}</p>
              <p><strong>Province:</strong> {locationInfo.province}</p>
              <p><strong>Postal Code:</strong> {locationInfo.postalCode}</p>
            </LocationInfo>
          )}
        </FormGroup>

        <FormGroup>
          <Label>Device ID</Label>
          <Input
            type="text"
            name="deviceId"
            value={formData.deviceId}
            readOnly
          />
        </FormGroup>

        <FormGroup>
          <Label>Token</Label>
          <Input
            type="text"
            name="token"
            value={formData.token}
            readOnly
          />
        </FormGroup>

        <ButtonContainer>
          <Button type="button" onClick={handleBack}>Back</Button>
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