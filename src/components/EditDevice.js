import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// SERVER_URL คงที่สำหรับใช้ทั่วทั้งแอป
const SERVER_URL = 'http://172.20.10.2:5001';
const DEFAULT_API_KEY = 'test-api-key';

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

// เพิ่ม styled component สำหรับแสดงสถานะ
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

// ฟังก์ชันสำหรับส่งการตั้งค่าไปยังอุปกรณ์ผ่าน MQTT
const sendSettingsToDevice = async (deviceId, settings) => {
  try {
    console.log('Sending settings to device:', deviceId, settings);
    
    // ใช้ API key เริ่มต้นโดยตรง
    const apiKey = DEFAULT_API_KEY;
    console.log('Using API key:', apiKey);
    
    const url = `${SERVER_URL}/api/mqtt/publish`;
    console.log('Sending request to:', url);
    
    // แปลงค่าให้เป็นตัวเลขอย่างชัดเจน
    const payload = {
      topic: `spl/device/${deviceId}/settings`,
      payload: {
        noiseThreshold: parseFloat(settings.noiseThreshold),
        samplingPeriod: parseInt(settings.samplingPeriod, 10),
        recordDuration: parseInt(settings.recordDuration, 10),
        status: settings.status, // เพิ่มสถานะในการส่งข้อมูล
      },
    };
    
    console.log('Request payload:', JSON.stringify(payload));
  
    // ทดลองส่ง API key ในหลายรูปแบบ
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'x-api-key': apiKey, // ลองใช้ตัวพิมพ์เล็กทั้งหมด
      },
      body: JSON.stringify(payload),
    });
  
    console.log('Response status:', response.status);
    
    // อ่านข้อมูลการตอบกลับเป็นข้อความก่อน
    const responseText = await response.text();
    console.log('Response text:', responseText);
  
    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        console.error('Error response:', errorData);
        throw new Error(errorData.error || `Failed to send settings to device: ${response.status}`);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error(`Failed to send settings to device: ${response.status} ${responseText}`);
      }
    }
  
    try {
      const responseData = JSON.parse(responseText);
      console.log('Success response:', responseData);
      return responseData;
    } catch (parseError) {
      console.warn('Response is not JSON, creating default response');
      return { success: true, message: 'Settings sent to device' };
    }
  } catch (error) {
    console.error('Error sending settings to device:', error);
    throw error;
  }
};

// ทดลองส่ง API key ใน URL แทน
const sendSettingsToDeviceAlternative = async (deviceId, settings) => {
  try {
    console.log('Sending settings to device (alternative method):', deviceId, settings);
    
    // ส่ง API key ใน URL
    const url = `${SERVER_URL}/api/mqtt/publish?apiKey=${DEFAULT_API_KEY}`;
    console.log('Sending request to:', url);
    
    const payload = {
      topic: `spl/device/${deviceId}/settings`,
      payload: {
        noiseThreshold: parseFloat(settings.noiseThreshold),
        samplingPeriod: parseInt(settings.samplingPeriod, 10),
        recordDuration: parseInt(settings.recordDuration, 10),
        status: settings.status, // เพิ่มสถานะในการส่งข้อมูล
      },
    };
    
    console.log('Request payload:', JSON.stringify(payload));
  
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  
    console.log('Response status:', response.status);
    
    const responseText = await response.text();
    console.log('Response text:', responseText);
  
    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        console.error('Error response:', errorData);
        throw new Error(errorData.error || `Failed to send settings to device: ${response.status}`);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error(`Failed to send settings to device: ${response.status} ${responseText}`);
      }
    }
  
    try {
      const responseData = JSON.parse(responseText);
      console.log('Success response:', responseData);
      return responseData;
    } catch (parseError) {
      console.warn('Response is not JSON, creating default response');
      return { success: true, message: 'Settings sent to device' };
    }
  } catch (error) {
    console.error('Error sending settings to device (alternative method):', error);
    throw error;
  }
};

// ทดลองส่งการตั้งค่าโดยตรงไปยังอุปกรณ์ผ่าน API ของเซิร์ฟเวอร์
const sendSettingsToDeviceDirectly = async (deviceId, settings) => {
  try {
    console.log('Sending settings to device directly:', deviceId, settings);
    
    const url = `${SERVER_URL}/api/devices/${deviceId}`;
    console.log('Sending request to:', url);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': DEFAULT_API_KEY,
      },
      body: JSON.stringify({
        noiseThreshold: parseFloat(settings.noiseThreshold),
        samplingPeriod: parseInt(settings.samplingPeriod, 10),
        recordDuration: parseInt(settings.recordDuration, 10),
        status: settings.status, // เพิ่มสถานะในการส่งข้อมูล
      }),
    });
  
    console.log('Response status:', response.status);
    
    const responseText = await response.text();
    console.log('Response text:', responseText);
  
    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        console.error('Error response:', errorData);
        throw new Error(errorData.error || `Failed to update device settings: ${response.status}`);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error(`Failed to update device settings: ${response.status} ${responseText}`);
      }
    }
  
    try {
      const responseData = JSON.parse(responseText);
      console.log('Success response:', responseData);
      return responseData;
    } catch (parseError) {
      console.warn('Response is not JSON, creating default response');
      return { success: true, message: 'Device settings updated' };
    }
  } catch (error) {
    console.error('Error updating device settings directly:', error);
    throw error;
  }
};

// ฟังก์ชันสำหรับเปลี่ยนสถานะอุปกรณ์
const toggleDeviceStatus = async (deviceId, newStatus) => {
  try {
    console.log(`Changing device status to ${newStatus}`);
    
    const url = `${SERVER_URL}/api/devices/${deviceId}/status`;
    console.log('Sending request to:', url);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': DEFAULT_API_KEY,
      },
      body: JSON.stringify({
        status: newStatus
      }),
    });
  
    console.log('Response status:', response.status);
    
    const responseText = await response.text();
    console.log('Response text:', responseText);
  
    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        console.error('Error response:', errorData);
        throw new Error(errorData.error || `Failed to change device status: ${response.status}`);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error(`Failed to change device status: ${response.status} ${responseText}`);
      }
    }
  
    try {
      const responseData = JSON.parse(responseText);
      console.log('Success response:', responseData);
      return responseData;
    } catch (parseError) {
      console.warn('Response is not JSON, creating default response');
      return { success: true, message: 'Device status updated' };
    }
  } catch (error) {
    console.error('Error changing device status:', error);
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

  // Load device data
  const loadDeviceData = async () => {
    try {
      console.log('Loading device data for ID:', id);
      const docRef = doc(db, 'devices', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
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
        console.error('Device not found in Firestore');
        setStatusMessage({
          show: true,
          success: false,
          message: 'Device not found'
        });
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (error) {
      console.error('Error fetching device:', error);
      setStatusMessage({
        show: true,
        success: false,
        message: 'Failed to load device data: ' + error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadDeviceData();
    } else {
      console.error('No device ID provided');
      setStatusMessage({
        show: true,
        success: false,
        message: 'No device ID provided'
      });
      setTimeout(() => navigate('/dashboard'), 2000);
    }
  }, [id, navigate]);

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
    setIsSaving(true);
    setStatusMessage({ show: false, success: false, message: '' });
  
    try {
      console.log('Submitting form data:', formData);
    
      // 1. อัปเดตข้อมูลใน Firestore
      const docRef = doc(db, 'devices', id);
      await updateDoc(docRef, {
        deviceName: formData.deviceName,
        noiseThreshold: parseFloat(formData.noiseThreshold),
        samplingPeriod: parseInt(formData.samplingPeriod, 10),
        recordDuration: parseInt(formData.recordDuration, 10),
        status: formData.status,
        updatedAt: new Date().toISOString()
      });
      console.log('Firestore updated successfully');
      
      // 2. ตรวจสอบว่าสถานะเปลี่ยนแปลงหรือไม่
      if (formData.status !== initialStatus) {
        console.log(`Device status changed from ${initialStatus} to ${formData.status}`);
        
        // เปลี่ยนสถานะอุปกรณ์
        await toggleDeviceStatus(id, formData.status);
        console.log('Device status updated on server');
      }
    
      // 3. ส่งการตั้งค่าไปยังอุปกรณ์ (ลองหลายวิธี)
      let settingsResponse;
      let successMethod = '';
      
      try {
        // วิธีที่ 1: ส่งผ่าน MQTT โดยตรง
        settingsResponse = await sendSettingsToDevice(id, {
          noiseThreshold: formData.noiseThreshold,
          samplingPeriod: formData.samplingPeriod,
          recordDuration: formData.recordDuration,
          status: formData.status,
        });
        successMethod = 'MQTT direct';
      } catch (error1) {
        console.warn('First method failed:', error1);
        
        try {
          // วิธีที่ 2: ส่ง API key ใน URL
          settingsResponse = await sendSettingsToDeviceAlternative(id, {
            noiseThreshold: formData.noiseThreshold,
            samplingPeriod: formData.samplingPeriod,
            recordDuration: formData.recordDuration,
            status: formData.status,
          });
          successMethod = 'MQTT with URL API key';
        } catch (error2) {
          console.warn('Second method failed:', error2);
          
          // วิธีที่ 3: อัปเดตการตั้งค่าโดยตรงผ่าน API
          settingsResponse = await sendSettingsToDeviceDirectly(id, {
            noiseThreshold: formData.noiseThreshold,
            samplingPeriod: formData.samplingPeriod,
            recordDuration: formData.recordDuration,
            status: formData.status,
          });
          successMethod = 'Direct API update';
        }
      }
    
      console.log(`Device settings updated via ${successMethod}:`, settingsResponse);
    
      setStatusMessage({
        show: true,
        success: true,
        message: `Device updated successfully and settings applied to device via ${successMethod}`
      });
    
      setTimeout(() => {
        navigate(`/device/${id}/settings`);
      }, 1500);
    } catch (error) {
      console.error('Error updating device:', error);
      setStatusMessage({
        show: true,
        success: false,
        message: 'Failed to update device: ' + error.message
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
          <Label>Record Duration (min)</Label>
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