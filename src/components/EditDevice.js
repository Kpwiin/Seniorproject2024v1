import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const SERVER_URL = 'http://192.168.1.101:5001';

// Styled Components (คงเดิม)
const Container = styled.div`
  background-color: #000000;
  min-height: 100vh;
  padding: 2rem;
  color: #ffffff;
`;

const Header = styled.div`
  max-width: 800px;
  margin: 0 auto 2rem;
  text-align: center;
`;

const Title = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  margin-top: 4.5rem;
  font-weight: 600;
  letter-spacing: -0.5px;
`;

const Form = styled.form`
  max-width: 800px;
  margin: 0 auto;
  background: #1a1a1a;
  padding: 2.5rem;
  border-radius: 16px;
  border: 1px solid #333;
  box-shadow: 0 4px 24px rgba(255, 255, 255, 0.05);
`;

const FormGroup = styled.div`
  margin-bottom: 2rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.8rem;
  font-size: 1rem;
  color: #999;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 1px solid #333;
  border-radius: 8px;
  background: #0f0f0f;
  color: #ffffff;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #ffffff;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
  }

  &:hover {
    border-color: #666;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 1px solid #333;
  border-radius: 8px;
  background: #0f0f0f;
  color: #ffffff;
  transition: all 0.2s ease;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #ffffff;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
  }

  &:hover {
    border-color: #666;
  }

  option {
    background: #0f0f0f;
    color: #ffffff;
    padding: 1rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 3rem;
`;

const Button = styled.button`
  background-color: #ffffff;
  color: #000000;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #e0e0e0;
    transform: translateY(-2px);
  }

  &:disabled {
    background-color: #555;
    color: #999;
    cursor: not-allowed;
    transform: none;
  }
`;

const CancelButton = styled(Button)`
  background-color: transparent;
  color: #ffffff;
  border: 1px solid #333;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    border-color: #ffffff;
  }

  &:disabled {
    background-color: transparent;
    color: #555;
    border-color: #333;
    cursor: not-allowed;
  }
`;

const LoadingOverlay = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  color: #ffffff;
  font-size: 1.2rem;
  height: 100vh;
  background-color: #000000;
`;

const StatusMessage = styled.div`
  margin-top: 1rem;
  padding: 0.8rem;
  border-radius: 8px;
  background-color: ${props => props.success ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)'};
  color: ${props => props.success ? '#4caf50' : '#f44336'};
  border: 1px solid ${props => props.success ? '#4caf50' : '#f44336'};
`;

const StatusIndicator = styled.div`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.active ? '#4caf50' : '#f44336'};
  margin-right: 8px;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  background-color: ${props => props.active ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)'};
  color: ${props => props.active ? '#4caf50' : '#f44336'};
  border: 1px solid ${props => props.active ? '#4caf50' : '#f44336'};
  margin-left: 1rem;
`;

// API Functions
// API Functions
const updateDeviceStatus = async (deviceId, newStatus) => {
  try {
    console.log(`Updating device ${deviceId} status to ${newStatus}`);
    
    const response = await fetch(`${SERVER_URL}/api/devices/${deviceId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: newStatus
      }),
    });

    const responseText = await response.text();
    console.log('Status update response:', responseText);

    if (!response.ok) {
      throw new Error(`Failed to update status: ${responseText}`);
    }

    try {
      return JSON.parse(responseText);
    } catch (e) {
      return { success: true, message: 'Status updated' };
    }
  } catch (error) {
    console.error('Error updating device status:', error);
    throw error;
  }
};

const updateDeviceSettings = async (deviceId, settings) => {
  try {
    console.log(`Updating device ${deviceId} settings:`, settings);
    
    // อัพเดท Firestore ก่อน
    const deviceRef = doc(db, 'devices', deviceId);
    await updateDoc(deviceRef, {
      ...settings,
      updatedAt: new Date().toISOString()
    });
    console.log('Firestore updated successfully');

    // ส่งการตั้งค่าไปที่ server
    const response = await fetch(`${SERVER_URL}/api/devices/${deviceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        noiseThreshold: settings.noiseThreshold,
        samplingPeriod: settings.samplingPeriod,
        recordDuration: settings.recordDuration
      }),
    });

    const responseText = await response.text();
    console.log('Settings update response:', responseText);

    if (!response.ok) {
      throw new Error(`Failed to update settings: ${responseText}`);
    }

    try {
      return JSON.parse(responseText);
    } catch (e) {
      return { success: true, message: 'Settings updated' };
    }
  } catch (error) {
    console.error('Error updating device settings:', error);
    throw error;
  }
};
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
  const [initialStatus, setInitialStatus] = useState('Inactive');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ show: false, success: false, message: '' });

  useEffect(() => {
    const loadDeviceData = async () => {
      try {
        console.log('Loading device data for ID:', id);
        const deviceRef = doc(db, 'devices', id);
        const deviceSnap = await getDoc(deviceRef);

        if (deviceSnap.exists()) {
          const data = deviceSnap.data();
          console.log('Device data loaded:', data);
          
          const status = data.status || 'Inactive';
          setInitialStatus(status);
          
          setFormData({
            deviceName: data.deviceName || '',
            noiseThreshold: data.noiseThreshold || 85,
            samplingPeriod: data.samplingPeriod || 2,
            recordDuration: data.recordDuration || 4,
            status: status,
          });
        } else {
          throw new Error('Device not found');
        }
      } catch (error) {
        console.error('Error loading device:', error);
        setStatusMessage({
          show: true,
          success: false,
          message: error.message
        });
        setTimeout(() => navigate('/dashboard'), 2000);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadDeviceData();
    } else {
      setStatusMessage({
        show: true,
        success: false,
        message: 'No device ID provided'
      });
      setTimeout(() => navigate('/dashboard'), 2000);
    }
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage({ show: false, success: false, message: '' });

    try {
      console.log('Submitting form data:', formData);

      // 1. Update device settings
      const settingsData = {
        deviceName: formData.deviceName,
        noiseThreshold: parseFloat(formData.noiseThreshold),
        samplingPeriod: parseInt(formData.samplingPeriod, 10),
        recordDuration: parseInt(formData.recordDuration, 10),
        status: formData.status
      };

      await updateDeviceSettings(id, settingsData);
      console.log('Settings updated successfully');

      // 2. Update status if changed
      if (formData.status !== initialStatus) {
        await updateDeviceStatus(id, formData.status);
        console.log('Status updated successfully');
      }

      setStatusMessage({
        show: true,
        success: true,
        message: 'Device updated successfully'
      });

      setTimeout(() => {
        navigate(`/device/${id}/settings`);
      }, 1500);
    } catch (error) {
      console.error('Error updating device:', error);
      setStatusMessage({
        show: true,
        success: false,
        message: error.message
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingOverlay>Loading...</LoadingOverlay>;

  return (
    <Container>
      <Header>
        <Title>
          Edit Device
          <div style={{ fontSize: '1rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <StatusIndicator active={formData.status === 'Active'} />
            Current Status: 
            <StatusBadge active={formData.status === 'Active'}>
              {formData.status}
            </StatusBadge>
          </div>
        </Title>
      </Header>

      <Form onSubmit={handleSubmit}>
        {statusMessage.show && (
          <StatusMessage success={statusMessage.success}>
            {statusMessage.message}
          </StatusMessage>
        )}
      
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
            min="0"
            max="120"
          />
          <small style={{ color: '#999', marginTop: '0.5rem', display: 'block' }}>
            The device will start recording when noise exceeds this level
          </small>
        </FormGroup>

        <FormGroup>
          <Label>Sampling Period (min)</Label>
          <Input
            type="number"
            name="samplingPeriod"
            value={formData.samplingPeriod}
            onChange={handleInputChange}
            required
            min="1"
            max="60"
          />
          <small style={{ color: '#999', marginTop: '0.5rem', display: 'block' }}>
            How often the device measures sound levels
          </small>
        </FormGroup>

        <FormGroup>
          <Label>Record Duration (sec)</Label>
          <Input
            type="number"
            name="recordDuration"
            value={formData.recordDuration}
            onChange={handleInputChange}
            required
            min="1"
            max="10"
          />
          <small style={{ color: '#999', marginTop: '0.5rem', display: 'block' }}>
            How long the device records when triggered
          </small>
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
          <small style={{ color: '#999', marginTop: '0.5rem', display: 'block' }}>
            {formData.status === 'Active' 
              ? 'Device is currently active and will respond to commands and record audio when triggered.' 
              : 'Device is currently inactive and will not record audio or respond to commands.'}
          </small>
        </FormGroup>

        <ButtonGroup>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <CancelButton type="button" onClick={() => navigate(`/device/${id}/settings`)} disabled={isSaving}>
            Cancel
          </CancelButton>
        </ButtonGroup>
      </Form>
    </Container>
  );
}

export default EditDevice;