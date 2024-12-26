// src/components/Map.js
import React from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '8px'
};

const center = {
  lat: 13.794185,
  lng: 100.325802  // พิกัดมหาวิทยาลัยมหิดล
};

function Map() {
  return (
    <LoadScript googleMapsApiKey="AIzaSyAt02FUjfI5nnVTGSROXaGKaJ-dHtFomOo">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={17}
      >
        {/* Add markers here */}
      </GoogleMap>
    </LoadScript>
  );
}

export default Map;