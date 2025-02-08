// src/components/Map.js
import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const mapStyles = {
  container: {
    width: '100%',
    height: '500px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    border: '1px solid #eaeaea'
  },
  infoWindow: {
    content: {
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)',
      backgroundColor: '#fff',
      maxWidth: '300px',
      fontFamily: '"Segoe UI", Arial, sans-serif'
    },
    header: {
      margin: '0 0 15px 0',
      fontWeight: '600',
      fontSize: '1.3em',
      color: '#2c3e50',
      borderBottom: '2px solid #f0f0f0',
      paddingBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    text: {
      margin: '12px 0',
      fontSize: '0.95em',
      color: '#34495e',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    status: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '6px 12px',
      borderRadius: '20px',
      fontWeight: '500',
      fontSize: '0.9em',
      gap: '6px'
    }
  }
};

const center = {
  lat: 13.794185,
  lng: 100.325802
};

const markerIcons = {
  active: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
  inactive: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
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
    if (!timestamp) return 'N/A';
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
    <LoadScript googleMapsApiKey="AIzaSyCTREfSARKCah8_j3CSMXgsBZUMQyJWZYk">
      <GoogleMap
        mapContainerStyle={mapStyles.container}
        center={center}
        zoom={17}
        options={{
          styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControlOptions: { mapTypeIds: [] }
        }}
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
                  url: device.status === 'active' ? markerIcons.active : markerIcons.inactive,
                  scaledSize: new window.google.maps.Size(35, 35)
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
    <div style={mapStyles.infoWindow.content}>
      <h3 style={mapStyles.infoWindow.header}>
        <i className="fas fa-microchip" 
           style={{ 
             color: '#4a90e2',
             backgroundColor: '#f8f9fa',
             padding: '8px',
             borderRadius: '8px',
             fontSize: '0.9em'
           }}
        ></i>
        {selectedDevice.deviceName || 'Unknown Device'}
      </h3>

      <div style={mapStyles.infoWindow.text}>
        <i className="fas fa-map-marker-alt" 
           style={{ 
             color: '#e74c3c',
             backgroundColor: '#fff5f5',
             padding: '8px',
             borderRadius: '8px',
             fontSize: '0.9em'
           }}
        ></i>
        <div>
          <div style={{ fontWeight: '500', marginBottom: '4px' }}>Location</div>
          <div style={{ color: '#666' }}>{selectedDevice.location || 'N/A'}</div>
        </div>
      </div>

      <div style={{
        ...mapStyles.infoWindow.text,
        backgroundColor: '#f8f9fa',
        padding: '12px',
        borderRadius: '8px',
        margin: '15px 0'
      }}>
        <span
          style={{
            ...mapStyles.infoWindow.status,
            backgroundColor: selectedDevice.status === 'active' ? '#e8f5e9' : '#ffebee',
            color: selectedDevice.status === 'active' ? '#2e7d32' : '#c62828',
            border: `1px solid ${selectedDevice.status === 'active' ? '#a5d6a7' : '#ef9a9a'}`
          }}
        >
          <i className={`fas fa-${selectedDevice.status === 'active' ? 'check-circle' : 'times-circle'}`}></i>
          {selectedDevice.status.toUpperCase()}
        </span>
      </div>

      <div style={{
        ...mapStyles.infoWindow.text,
        marginTop: '15px',
        fontSize: '0.85em',
        color: '#666',
        borderTop: '1px solid #f0f0f0',
        paddingTop: '15px'
      }}>
        <i className="far fa-clock" 
           style={{ 
             color: '#7f8c8d',
             backgroundColor: '#f8f9fa',
             padding: '8px',
             borderRadius: '8px',
             fontSize: '0.9em'
           }}
        ></i>
        <div>
          <div style={{ fontWeight: '500', marginBottom: '4px' }}>Last Updated</div>
          <div>{formatDate(selectedDevice.lastUpdated)}</div>
        </div>
      </div>
    </div>
  </InfoWindow>
)}
      </GoogleMap>
    </LoadScript>
  );
};

export default Map;