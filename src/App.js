// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import DeviceManagement from './components/DeviceManagement';
import DeviceSettings from './components/DeviceSettings';
import AddDevice from './components/AddDevice';
import Complaint from './components/Complaint';
import ComplaintVerify from './components/ComplaintVerify';
import ComplaintAdd from './components/ComplaintAdd';
import ProfileSettings from './components/ProfileSettings';
import Classification from './components/Classification';
import Login from './components/Login';
import Register from './components/Register';
import Userdevicelist from './components/Userdevicelist';
import DeviceDetail from './components/DeviceDetail';
import HistoryDetail from './components/HistoryDetail';




function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/devices" element={<DeviceManagement />} />
          <Route path="/device/:id/settings" element={<DeviceSettings />} />
          <Route path="/devices/add" element={<AddDevice />} />
          <Route path="/complaints" element={<Complaint />} />
          <Route path="/complaints/verify" element={<ComplaintVerify />} />
          <Route path="/complaints/add" element={<ComplaintAdd />} />
          <Route path="/settings" element={<ProfileSettings />} />
          <Route path="/classification" element={<Classification />} />
          < Route path="/login" element={<Login/>}/>
          <Route path="/register" element={<Register />} />
          <Route path="/" element={< Userdevicelist/>} />
          <Route path="/device/:id" element={<DeviceDetail />} />
          <Route path="/device/:id/history/:date" element={<HistoryDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;