import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Get current device count for deviceId
      const querySnapshot = await getDocs(collection(db, 'devices'));
      const deviceCount = querySnapshot.size;
      const newDeviceId = String(deviceCount + 1);
      
      // Generate random token
      const newToken = `TKN-${Math.random().toString(36).substr(2, 16).toUpperCase()}`;

      const deviceData = {
        ...formData,
        deviceId: newDeviceId,
        token: newToken,
        locationInfo,
        createdAt: new Date(),
        status: 'Inactive'
      };

      const docRef = await addDoc(collection(db, 'devices'), deviceData);
      alert('Device added successfully!');
      // Navigate to device settings with the new path format
      navigate(`/device/${docRef.id}/settings`);
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

        <ButtonContainer>
          <Button type="button" onClick={() => navigate('/devices')}>
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