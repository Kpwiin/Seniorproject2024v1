// src/components/Map.js
import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const containerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '8px'
};

const center = {
  lat: 13.794185,
  lng: 100.325802
};

const Map = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);

  useEffect(() => {
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
      }
    };

    fetchDevices();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <LoadScript googleMapsApiKey="AIzaSyAt02FUjfI5nnVTGSROXaGKaJ-dHtFomOo">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={17}
      >
        {devices.map(device => {
          if (device.latitude && device.longitude) {
            return (
              <Marker
                key={device.id}
                position={{
                  lat: parseFloat(device.latitude),
                  lng: parseFloat(device.longitude)
                }}
                icon={{
                  url: device.status === 'active' 
                    ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                    : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                }}
                onClick={() => setSelectedDevice(device)}
              />
            );
          }
          return null;
        })}

        {selectedDevice && (
          <InfoWindow
            position={{
              lat: parseFloat(selectedDevice.latitude),
              lng: parseFloat(selectedDevice.longitude)
            }}
            onCloseClick={() => setSelectedDevice(null)}
          >
            <div style={{ padding: '5px' }}>
              <h3 style={{ margin: '0 0 5px 0' }}>{selectedDevice.deviceName}</h3>
              <p style={{ margin: '5px 0' }}>Location: {selectedDevice.location}</p>
              <p style={{ margin: '5px 0' }}>Status: {selectedDevice.status}</p>
              <p style={{ margin: '5px 0', fontSize: '0.8em' }}>
                Last Updated: {formatDate(selectedDevice.lastUpdated)}
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default Map;