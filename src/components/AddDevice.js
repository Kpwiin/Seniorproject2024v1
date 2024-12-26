// src/components/AddDevice.js
import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

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

const HelpText = styled.div`
  color: white;
  text-align: center;
  margin-top: 2rem;
  
  a {
    color: #4169E1;
    text-decoration: none;
    margin-left: 0.5rem;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;
// เพิ่ม styled components สำหรับ loading และ error states
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

function AddDevice() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    deviceName: '',
    location: '',
    deviceId: '',
    token: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const generateToken = () => {
    return 'TKN-' + Math.random().toString(36).substr(2, 16).toUpperCase();
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.deviceName.trim()) {
      newErrors.deviceName = 'Device name is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    if (!formData.deviceId.trim()) {
      newErrors.deviceId = 'Device ID is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
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
        token: formData.token || generateToken(),
        createdAt: new Date(),
        status: 'active'
      };

      await addDoc(collection(db, "devices"), deviceData);
      alert('Device added successfully!');
      navigate('/devices');
    } catch (error) {
      console.error("Error adding device:", error);
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
            error={errors.deviceName}
          />
          {errors.deviceName && <ErrorMessage>{errors.deviceName}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label>Location</Label>
          <Input
            type="text"
            name="location"
            placeholder="Please enter device location"
            value={formData.location}
            onChange={handleChange}
            error={errors.location}
          />
          {errors.location && <ErrorMessage>{errors.location}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label>Device ID</Label>
          <Input
            type="text"
            name="deviceId"
            placeholder="Please enter device id"
            value={formData.deviceId}
            onChange={handleChange}
            error={errors.deviceId}
          />
          {errors.deviceId && <ErrorMessage>{errors.deviceId}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label>Token (Optional - will be auto-generated if empty)</Label>
          <Input
            type="text"
            name="token"
            placeholder="Please enter Token or leave empty for auto-generation"
            value={formData.token}
            onChange={handleChange}
          />
        </FormGroup>

        <HelpText>
          If you've never had a Device id and Token
          <a href="/help">Click here</a>
        </HelpText>

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