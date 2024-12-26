// src/components/Dashboard.js
import React from 'react';
import { styled } from 'styled-components';
import Map from './Map';
import DeviceList from './DeviceList';

const DashboardContainer = styled.div`
  min-height: 100vh;
  background-color: #1a1b2e;
  padding: 2rem;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;
  max-width: 1800px;
  margin: 0 auto;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const MapSection = styled.div`
  background-color: #242538;
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const MapHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  color: #4169E1;
  font-size: 1.5rem;
  font-weight: 600;
`;

const ViewToggle = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ToggleButton = styled.button`
  background-color: ${props => props.active ? '#4169E1' : '#2a2b3d'};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.active ? '#3558c0' : '#363749'};
  }
`;

function Dashboard() {
  const [mapView, setMapView] = React.useState('map');

  return (
    <DashboardContainer>
      <ContentGrid>
        <MapSection>
          <MapHeader>
            <Title>Map</Title>
            <ViewToggle>
              <ToggleButton 
                active={mapView === 'map'}
                onClick={() => setMapView('map')}
              >
                Map
              </ToggleButton>
              <ToggleButton 
                active={mapView === 'satellite'}
                onClick={() => setMapView('satellite')}
              >
                Satellite
              </ToggleButton>
            </ViewToggle>
          </MapHeader>
          <Map />
        </MapSection>
        
        <DeviceList />
      </ContentGrid>
    </DashboardContainer>
  );
}

export default Dashboard;