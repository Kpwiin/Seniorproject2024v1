import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import DeviceManagement from './components/DeviceManagement';
import DeviceSettings from './components/DeviceSettings';
import Complaint from './components/Complaint';
import ComplaintAdd from './components/ComplaintAdd';
import Settings from './components/Settings';
import Classification from './components/Classification';
import Login from './components/Login';
import Register from './components/Register';
import DeviceDetail from './components/DeviceDetail';
import EditDevice from './components/EditDevice';
import {AuthProvider} from './components/AuthContext';
import AdminRoute from './components/AdminRoute';
import MyDevice from './components/MyDevice';
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
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* หน้าที่ไม่ต้องการ Navbar */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* หน้าที่ต้องการ Navbar */}
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/device/:id/settings" element={<Layout><DeviceSettings /></Layout>} />
            <Route path="/complaints" element={<Layout><Complaint /></Layout>} />
            <Route path="/complaints/add" element={<Layout><ComplaintAdd /></Layout>} />
            <Route path="/settings" element={<Layout><Settings /></Layout>} />
            <Route path="/classification" element={<Layout><Classification /></Layout>} />
            <Route path="/device/:deviceId/:deviceName" element={<Layout><DeviceDetail /></Layout>} />
            <Route path="/device/:id/edit" element={<Layout><EditDevice /></Layout>} />
            <Route path="/complaints/:deviceName" element={<Layout><Complaint /></Layout>} />
            <Route path="/mydevices" element={<Layout><MyDevice /></Layout>} />
            {/* หน้าที่ต้องเป็น Admin เท่านั้น */}
            <Route path="/managedevices" element={<AdminRoute><Layout><DeviceManagement /></Layout></AdminRoute>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;