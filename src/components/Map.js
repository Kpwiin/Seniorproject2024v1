import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, OverlayView } from '@react-google-maps/api';
import styled from 'styled-components';

const MapContainer = styled.div`
  width: 95%;
  height: 90vh;
  margin: 20px auto;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  position: relative;
`;

const MarkerTooltip = styled.div`
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 200px;
  transform: translate(-50%, -130%);
  
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid rgba(0, 0, 0, 0.85);
  }

  .title {
    font-weight: 600;
    font-size: 15px;
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    margin: 4px 0;
    align-items: center;
  }

  .label {
    color: #999;
    font-size: 13px;
  }

  .value {
    font-weight: 500;
    color: #fff;
  }

  .sound-level {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  }

  .sound-high {
    background-color: rgba(255, 59, 48, 0.2);
    color: #ff3b30;
  }

  .sound-medium {
    background-color: rgba(255, 204, 0, 0.2);
    color: #ffcc00;
  }

  .sound-low {
    background-color: rgba(52, 199, 89, 0.2);
    color: #34c759;
  }

  .sound-inactive {
    background-color: rgba(128, 128, 128, 0.2);
    color: #808080;
  }
  
  .close-button {
    position: absolute;
    top: 8px;
    right: 8px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    font-size: 16px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    
    &:hover {
      color: white;
      background: rgba(255, 255, 255, 0.1);
    }
  }
`;

const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{"color": "#1a1a1a"}]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{"color": "#1a1a1a"}]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#999999"}]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{"color": "#333333"}]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#777777"}]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{"color": "#000000"}]
  }
];

const Map = ({ devices, onDeviceSelect }) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  useEffect(() => {
    console.log("Selected device ID:", selectedDeviceId);
    console.log("Devices:", devices);
  }, [selectedDeviceId, devices]);

  const center = {
    lat: 13.794185,
    lng: 100.325802
  };

  const mapOptions = {
    styles: darkMapStyle,
    fullscreenControl: false,
    streetViewControl: false,
    mapTypeControlOptions: { mapTypeIds: [] },
    zoomControl: true,
    zoomControlOptions: {
      position: mapLoaded && window.google ? window.google.maps.ControlPosition.RIGHT_CENTER : undefined
    },
    disableDefaultUI: true,
    scrollwheel: true,
    mapTypeControl: false,
    minZoom: 3,
    maxZoom: 18
  };

  const getMarkerIcon = (soundLevel, status) => {
    if (status && status.toLowerCase() === 'inactive') {
      return 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'; // เปลี่ยนเป็นสีฟ้า
    }
    if (soundLevel >= 85) {
      return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
    } else if (soundLevel >= 70) {
      return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
    }
    return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
  };

  const getSoundLevelClass = (soundLevel, status) => {
    if (status && status.toLowerCase() === 'inactive') return 'sound-inactive';
    if (soundLevel >= 85) return 'sound-high';
    if (soundLevel >= 70) return 'sound-medium';
    return 'sound-low';
  };
  
  const handleMapLoad = (map) => {
    setMapLoaded(true);
  };
  
  const handleMarkerClick = (deviceId, device) => {
    console.log("Marker clicked, device ID:", deviceId);
    setSelectedDeviceId(deviceId);
    if (onDeviceSelect) {
      onDeviceSelect(device);
    }
  };
  
  const handleCloseTooltip = (e) => {
    if (e) e.stopPropagation();
    setSelectedDeviceId(null);
    if (onDeviceSelect) {
      onDeviceSelect(null);
    }
  };
  
  const handleMapClick = () => {
    handleCloseTooltip();
  };

  return (
    <MapContainer>
      <LoadScript googleMapsApiKey="AIzaSyCTREfSARKCah8_j3CSMXgsBZUMQyJWZYk">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={center}
          zoom={17}
          options={mapOptions}
          onLoad={handleMapLoad}
          onClick={handleMapClick}
        >
          {devices.map(device => {
            console.log('Device:', device); // ตรวจสอบข้อมูลอุปกรณ์
            const deviceId = device.deviceId || device.id;
            
            return (
              <React.Fragment key={deviceId}>
                <Marker
                  position={{
                    lat: parseFloat(device.latitude),
                    lng: parseFloat(device.longitude)
                  }}
                  icon={{
                    url: getMarkerIcon(device.soundLevel, device.status),
                    scaledSize: mapLoaded && window.google ? 
                      new window.google.maps.Size(35, 35) : undefined
                  }}
                  onClick={() => handleMarkerClick(deviceId, device)}
                />
                
                {selectedDeviceId === deviceId && (
                  <OverlayView
                    position={{
                      lat: parseFloat(device.latitude),
                      lng: parseFloat(device.longitude)
                    }}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                  >
                    <MarkerTooltip>
                      <button className="close-button" onClick={handleCloseTooltip}>×</button>
                      <div className="title">{device.deviceName || 'Unnamed Device'}</div>
                      <div className="info-row">
                        <span className="label">Device ID</span>
                        <span className="value">{deviceId}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Location</span>
                        <span className="value">{device.location || 'Unknown'}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Sound Level</span>
                        <span className={`sound-level ${getSoundLevelClass(device.soundLevel, device.status)}`}>
                          {device.soundLevel} dB
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="label">Status</span>
                        <span className="value">{device.status || 'Unknown'}</span>
                      </div>
                      {device.source && (
                        <div className="info-row">
                          <span className="label">Source</span>
                          <span className="value">{device.source}</span>
                        </div>
                      )}
                      {device.noiseThreshold && (
                        <div className="info-row">
                          <span className="label">Threshold</span>
                          <span className="value">{device.noiseThreshold} dB</span>
                        </div>
                      )}
                    </MarkerTooltip>
                  </OverlayView>
                )}
              </React.Fragment>
            );
          })}
        </GoogleMap>
      </LoadScript>
    </MapContainer>
  );
};

export default Map;