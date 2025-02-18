import './DeviceDetail.css';
import History from './History.js';
import { LineGraph } from "./Linegraph";
import CurrentSoundLevel from './CurrentSoundLevel.js';
import React from 'react';
import { useParams } from 'react-router-dom';
import { Link } from "react-router-dom";

function DeviceDetail() {
  const {deviceName} = useParams();  
  const decodedDeviceName = decodeURIComponent(deviceName);
  return (
    <div className="Device-Detail">
      
      <div className="App-body">
      <div className="DeNav">
        <h2>Device Detail of "{decodedDeviceName}"</h2>
        <nav>
          <ul>
            <li><a href="#current">Current Sound Status</a></li>
            <li><a href="#graph">Historical Graph</a></li>
            <li><a href="#history">Sound History</a></li>
            <li><Link to="/complaints">View Complaints</Link></li>
          </ul>
        </nav>
      </div>
        <div id="current" className="current-container">
          <CurrentSoundLevel />
        </div>
        <div id="graph" className="graph-container">
          <LineGraph />
        </div>
        <div id="history" className="history-container">
          <History />
        </div>
      </div>
    </div>
  );
}

export default DeviceDetail;
