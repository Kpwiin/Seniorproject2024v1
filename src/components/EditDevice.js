import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// Styled Components
const Container = styled.div`
  background-color: #1a1b2e;
  min-height: 100vh;
  padding: 2rem;
  color: white;
`;

const Header = styled.div`
  max-width: 800px;
  margin: 0 auto 2rem;
  text-align: center;
`;

const Title = styled.h2`
  font-size: 2rem;
  margin-bottom: 1rem;
`;

const Form = styled.form`
  max-width: 800px;
  margin: 0 auto;
  background: #242538;
  padding: 2rem;
  border-radius: 15px;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  font-size: 1rem;
  border: none;
  border-radius: 8px;
  background: #1a1b2e;
  color: white;

  &:focus {
    outline: none;
    border: 1px solid #4169E1;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.8rem;
  font-size: 1rem;
  border: none;
  border-radius: 8px;
  background: #1a1b2e;
  color: white;

  &:focus {
    outline: none;
    border: 1px solid #4169E1;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`;

const Button = styled.button`
  background-color: #4169E1;
  color: white;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 10px;
  font-size: 1.1rem;
  cursor: pointer;

  &:hover {
    background-color: #3151b0;
  }
`;

const CancelButton = styled(Button)`
  background-color: #FF5252;

  &:hover {
    background-color: #D43F3F;
  }
`;

const LoadingOverlay = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 1.2rem;
  height: 100vh;
`;

// Main Component
function EditDevice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    deviceName: '',
    noiseThreshold: '',
    samplingPeriod: '',
    recordDuration: '',
    status: 'Inactive',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load device data
  const loadDeviceData = async () => {
    try {
      const docRef = doc(db, 'devices', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          deviceName: data.deviceName || '',
          noiseThreshold: data.noiseThreshold || 85, // Default: 85
          samplingPeriod: data.samplingPeriod || 2, // Default: 2
          recordDuration: data.recordDuration || 4, // Default: 4
          status: data.status || 'Inactive', // Default: Inactive
        });
      } else {
        alert('Device not found');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching device:', error);
      alert('Failed to load device data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeviceData();
  }, [id]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, 'devices', id);
      await updateDoc(docRef, formData);
      alert('Device updated successfully');
      navigate(`/device/${id}/settings`);
    } catch (error) {
      console.error('Error updating device:', error);
      alert('Failed to update device');
    }
  };

  if (isLoading) return <LoadingOverlay>Loading...</LoadingOverlay>;

  return (
    <Container>
      <Header>
        <Title>Edit Device</Title>
      </Header>

      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Device Name</Label>
          <Input
            type="text"
            name="deviceName"
            value={formData.deviceName}
            onChange={handleInputChange}
            required
          />
        </FormGroup>

        <FormGroup>
          <Label>Noise Threshold (dB)</Label>
          <Input
            type="number"
            name="noiseThreshold"
            value={formData.noiseThreshold}
            onChange={handleInputChange}
            required
          />
        </FormGroup>

        <FormGroup>
          <Label>Sampling Period (min)</Label>
          <Input
            type="number"
            name="samplingPeriod"
            value={formData.samplingPeriod}
            onChange={handleInputChange}
            required
          />
        </FormGroup>

        <FormGroup>
          <Label>Record Duration (min)</Label>
          <Input
            type="number"
            name="recordDuration"
            value={formData.recordDuration}
            onChange={handleInputChange}
            required
          />
        </FormGroup>

        <FormGroup>
          <Label>Status</Label>
          <Select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            required
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </Select>
        </FormGroup>

        <ButtonGroup>
          <Button type="submit">Save</Button>
          <CancelButton type="button" onClick={() => navigate(`/device/${id}/settings`)}>
            Cancel
          </CancelButton>
        </ButtonGroup>
      </Form>
    </Container>
  );
}

export default EditDevice;