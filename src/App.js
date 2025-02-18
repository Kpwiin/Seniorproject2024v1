import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import DeviceManagement from './components/DeviceManagement';
import DeviceSettings from './components/DeviceSettings';
import AddDevice from './components/AddDevice';
import Complaint from './components/Complaint';
import ComplaintAdd from './components/ComplaintAdd';
import ProfileSettings from './components/ProfileSettings';
import Classification from './components/Classification';
import Login from './components/Login';
import Register from './components/Register';
import Userdevicelist from './components/Userdevicelist';
import DeviceDetail from './components/DeviceDetail';
import EditDevice from './components/EditDevice';

// สร้าง Layout component สำหรับหน้าที่ต้องการ Navbar
const Layout = ({ children }) => {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* หน้าที่ไม่ต้องการ Navbar */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* หน้าที่ต้องการ Navbar */}
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/devices" element={<Layout><DeviceManagement /></Layout>} />
          <Route path="/device/:id/settings" element={<Layout><DeviceSettings /></Layout>} />
          <Route path="/devices/add" element={<Layout><AddDevice /></Layout>} />
          <Route path="/complaints" element={<Layout><Complaint /></Layout>} />
          <Route path="/complaints/add" element={<Layout><ComplaintAdd /></Layout>} />
          <Route path="/settings" element={<Layout><ProfileSettings /></Layout>} />
          <Route path="/classification" element={<Layout><Classification /></Layout>} />
          <Route path="/" element={<Layout><Userdevicelist /></Layout>} />
          <Route path="/device/:deviceId/:deviceName" element={<Layout><DeviceDetail /></Layout>} />
          <Route path="/device/:id/edit" element={<Layout><EditDevice /></Layout>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;