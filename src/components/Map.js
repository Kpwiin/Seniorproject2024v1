import React, { useState } from 'react';
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

const Map = ({ devices }) => {
  const [hoveredDevice, setHoveredDevice] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

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

  const getMarkerIcon = (soundLevel) => {
    if (soundLevel >= 85) {
      return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
    } else if (soundLevel >= 70) {
      return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
    }
    return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
  };

  const getSoundLevelClass = (soundLevel) => {
    if (soundLevel >= 85) return 'sound-high';
    if (soundLevel >= 70) return 'sound-medium';
    return 'sound-low';
  };

  return (
    <MapContainer>
      <LoadScript googleMapsApiKey="AIzaSyCTREfSARKCah8_j3CSMXgsBZUMQyJWZYk">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={center}
          zoom={17}
          options={mapOptions}
        >
          {devices.map(device => (
            <React.Fragment key={device.id}>
              <Marker
                position={{
                  lat: parseFloat(device.latitude),
                  lng: parseFloat(device.longitude)
                }}
                icon={{
                  url: getMarkerIcon(device.soundLevel),
                  scaledSize: mapLoaded && window.google ? 
                    new window.google.maps.Size(35, 35) : undefined
                }}
                onMouseOver={() => setHoveredDevice(device)}
                onMouseOut={() => setHoveredDevice(null)}
              />
              
              {hoveredDevice && hoveredDevice.id === device.id && (
                <OverlayView
                  position={{
                    lat: parseFloat(device.latitude),
                    lng: parseFloat(device.longitude)
                  }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <MarkerTooltip>
                    <div className="title">{device.deviceName}</div>
                    <div className="info-row">
                      <span className="label">Location</span>
                      <span className="value">{device.location}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Sound Level</span>
                      <span className={`sound-level ${getSoundLevelClass(device.soundLevel)}`}>
                        {device.soundLevel} dB
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="label">Status</span>
                      <span className="value">{device.status}</span>
                    </div>
                  </MarkerTooltip>
                </OverlayView>
              )}
            </React.Fragment>
          ))}
        </GoogleMap>
      </LoadScript>
    </MapContainer>
  );
};

export default Map;