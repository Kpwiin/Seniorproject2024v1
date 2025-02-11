import './DeviceDetail.css';
import History from './History.js';
import { LineGraph } from "./Linegraph";
import CurrentSoundLevel from './CurrentSoundLevel.js';
function DeviceDetail() {
  return (
    <div className="App">
      <div className="App-body">
      <div className="current-container">
          <CurrentSoundLevel />
        </div>
        <div className="graph-container">
          <LineGraph />
        </div>
        <div className="history-container">
          <History />
        </div>
      </div>
    </div>
  );
}

export default DeviceDetail;