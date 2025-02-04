import './DeviceDetail.css';
import History from './History';
import { LineGraph } from "./Linegraph";

function DeviceDetail() {
  return (
    <div className="App">
      <div className="App-body">
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
