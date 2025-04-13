import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import {db} from '../firebase';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, Filler, registerables } from 'chart.js';

ChartJS.register(Filler, ...registerables);

export const History = ({ deviceId }) => {
  const [historyData, setHistoryData] = useState([]);
  const [displayedData, setDisplayedData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [selectedTimestamps, setSelectedTimestamps] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [loadCount, setLoadCount] = useState(7);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedResults, setSelectedResults] = useState([]);
  const [selectedAudioUrls, setSelectedAudioUrls] = useState([]);

  useEffect(() => {
    const fetchHistoryData = async () => {
      try {
        const q = query(collection(db, 'sounds'), where('deviceId', '==', deviceId),orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        const dayDataMap = new Map();

        querySnapshot.forEach((doc) => {
          const docData = doc.data();
          if (docData.date && docData.date._seconds !== undefined) {
            const timestamp = new Date(docData.date._seconds * 1000);
            const noiseLevel = docData.level;
            const dateKey = timestamp.toLocaleDateString('en-US');
            const result = docData.result;
            const audioUrl = docData.audioUrl;
            if (!dayDataMap.has(dateKey)) {
              dayDataMap.set(dateKey, {
                total: 0,
                count: 0,
                levels: [],
                timestamps: [],
                results: [],
              });
            }

            dayDataMap.get(dateKey).total += noiseLevel;
            dayDataMap.get(dateKey).count += 1;
            dayDataMap.get(dateKey).levels.push(noiseLevel);
            dayDataMap.get(dateKey).timestamps.push(timestamp);
            dayDataMap.get(dateKey).results.push(result);
            dayDataMap.get(dateKey).audioUrls = dayDataMap.get(dateKey).audioUrls || [];
            dayDataMap.get(dateKey).audioUrls.push(audioUrl);
          }
        });

        const formattedData = [];
        dayDataMap.forEach((value, key) => {
          const avgNoiseLevel = (value.total / value.count).toFixed(1);
          formattedData.push({
            date: key,
            avg: avgNoiseLevel,
            highNoise: avgNoiseLevel > 85,
            noiseLevels: value.levels,
            timestamps: value.timestamps,
            results: value.results,
            audioUrls: value.audioUrls,
          });
        });

        setHistoryData(formattedData);
        setDisplayedData(formattedData.slice(0, loadCount)); // Show the first 7 items initially
      } catch (error) {
        console.error('Error fetching history data: ', error);
      }
    };

    fetchHistoryData();
  }, [loadCount, deviceId]);

  // Update the displayed data when filtered data or loadCount changes
  useEffect(() => {
    const filteredData = selectedMonth
      ? historyData.filter(
          (item) =>
            new Date(item.date).toLocaleString('default', {
              month: 'long',
              year: 'numeric',
            }) === selectedMonth
        )
      : historyData;

    setDisplayedData(filteredData.slice(0, loadCount));
  }, [historyData, selectedMonth, loadCount]);

  const loadMoreData = () => {
    setLoadCount(loadCount + 7); // Increment the count by 7 each time
  };

  const getChartData = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(1, 'rgb(64, 163, 7)'); // Green for low levels
    gradient.addColorStop(0.9, 'rgb(234, 189, 9)'); 
    gradient.addColorStop(0, 'rgb(255, 0, 0)'); // Red for high levels

    return {
      labels: selectedTimestamps.map((timestamp) =>
        timestamp.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      ),
      datasets: [
        {
          label: 'Noise Levels',
          data: selectedLevels,
          borderColor: gradient,
          backgroundColor: gradient,
          tension: 0.2,
          pointBackgroundColor: selectedLevels.map(level => 
            level >= 85 ? 'rgb(255, 0, 0)' :  
            level >= 70 ? 'rgb(255, 255, 0)' : 
            'rgb(32, 159, 40)'             
        ),
          pointBorderColor: '#fff',
          pointRadius: 5,  
          pointHoverRadius: 7, 
          fill: true,
          spanGaps: true,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
        position: 'top',
        labels: {
          color: '#333',
          font: {
            size: 20,
          },
        },
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (tooltipItem) => {
            const level = tooltipItem.raw;
            const result = selectedLevels[tooltipItem.dataIndex] >= 85 ? selectedResults[tooltipItem.dataIndex] : null;
            return `Sound Level (dB): ${level} ${result ? `| Result: ${result}` : ''}`;
          },
        },
      },
      annotation: {
        annotations: {
          middleLine: {
            type: 'line',
            yMin: 85,
            yMax: 85,
            borderColor: 'red',
            borderWidth: 1,
          },
          PeakLevelLabel: {
            type: 'label',
            backgroundColor: 'rgba(230, 226, 226, 0.85)',
            content: [`Peak Level: ${Math.max(...selectedLevels)} dB`],
            borderColor: 'rgba(0, 0, 0, 0.2)', // Add a subtle border for better separation
            borderRadius: 8,
            font: {
              size: 18,
              weight: 'bold', // Make it stand out
              family: 'Arial, sans-serif',
              color: '#FFFFFF',
            },
            padding: {
              top: 8,
              right: 12,
              bottom: 8,
              left: 12, // Enhanced padding for better content balance
            },
            xAdjust: 0,
            yAdjust: -200,
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time',
          color: '#FFFFFF',
          font: {
            size: 16,
          },
        },
        ticks: {
          color: '#FFFFFF',
        },
        border: {
          color: '#FFFFFF',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Sound Level (dB)',
          color: '#FFFFFF',
          font: {
            size: 16,
          },
        },
        ticks: {
          color: '#FFFFFF',
        },
        border: {
          color: '#FFFFFF',
        },
        
      },
    },
  };

  const months = historyData.map((item) =>
    new Date(item.date).toLocaleString('default', { month: 'long', year: 'numeric' })
  );
  const uniqueMonths = [...new Set(months)];

  return (
    <div className="history-container">
      <h2 style={{ fontSize: '30px' }}>History</h2>

      {/* Dropdown for selecting month */}
      <div className="month-dropdown">
        <label htmlFor="month-select">Jump to: </label>
        <select id="month-select" onChange={(e) => setSelectedMonth(e.target.value)} value={selectedMonth}>
          <option value="">Select a month</option>
          {uniqueMonths.map((month, index) => (
            <option key={index} value={month}>
              {month}
            </option>
          ))}
        </select>
      </div>

      <div className="history-list">
  {displayedData.length === 0 ? (
    <p>No data available.</p>
  ) : (
    <>
      {displayedData.map((item, index) => (
        <div key={index}>
          <div
            className={`history-item ${
              item.avg >= 85 ? 'high-noise' : 
              item.avg >= 70 ? 'medium-noise' : 
              'normal-noise'
            }`}
            
            onClick={() => {
              setSelectedDate(item.date);
              const sortedData = item.timestamps
                .map((timestamp, index) => ({
                  timestamp,
                  level: item.noiseLevels[index],
                  result: item.results[index],
                  audioUrl: item.audioUrls[index],
                }))
                .sort((a, b) => a.timestamp - b.timestamp);
              
              const sortedTimestamps = sortedData.map((data) => data.timestamp);
              const sortedLevels = sortedData.map((data) => data.level);
              const sortedResults = sortedData.map((data) => data.result);
              const sortedAudioUrls = sortedData.map((data) => data.audioUrl);
              setSelectedAudioUrls(sortedAudioUrls);
              setSelectedLevels(sortedLevels);
              setSelectedTimestamps(sortedTimestamps);
              setSelectedIndex(index);
              setSelectedResults(sortedResults);
            }}
            style={{ cursor: 'pointer' }}
          >
            <span>
              {new Date(item.date).toLocaleDateString('en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <span> Average: {item.avg} dB</span>
          </div>

          {selectedIndex === index && selectedLevels.length > 0 && selectedDate && (
            <div className="graph-section">
              <h3 style={{ fontSize: '30px' }}>
                Graph for {new Date(selectedDate).toLocaleDateString()}
              </h3>
              <Line data={getChartData()} options={chartOptions} />
              <div className="a-container">
              {/* All Sound Levels */}
              <div className="all-day-sound-levels">
                <h4>Sound Levels of the Day</h4>
                <ul>
                  {selectedLevels.map((level, idx) => (
                    <li key={idx}>
                      
                        {selectedTimestamps[idx].toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })}
                      
                      <span style={{ 
                       color: level >= 85 ? 'red' : 
                      level >= 70 ? 'yellow' : 
                      'green' 
                      }}>
                      {level} dB
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* High Noise Events */}
              <div className="high-noise-events">
                <h4>Events with Sound Levels higher than 85 dB</h4>
                {selectedLevels.filter((level) => level > 85).length > 0 ? (
                  <ul>
                    {selectedLevels.map((level, idx) => {
                      if (level > 85) {
                        const audioUrl = selectedAudioUrls?.[idx]; 
                        return (
                          <li key={idx}>
                            {/* First Block: Time and Level */}
                            <div style={{ marginBottom: '2px' }}>
                              <span>
                                {selectedTimestamps[idx].toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false,
                                })}
                              </span> - {level} dB
                            </div>

                            {/* Second Block: Result and Audio */}
                            <div style={{ marginTop: '2px' }}>
                              <strong>Source: {selectedResults[idx] || 'N/A'}</strong>
                            </div>
                             
                              {audioUrl ? (
                                <div style={{ marginTop: '10px' }}>
                                  <audio controls style={{ width: '300px', height: '30px' }}>
                                    <source src={audioUrl} type="audio/mpeg" />
                                    Your browser does not support the audio element.
                                  </audio>
                                </div>
                              ) : (
                                <span>No Audio Available</span>
                              )}
                            
                          </li>
                        );
                      }
                      return null;
                    })}
                  </ul>
                ) : (
                  <p>No events with sound levels higher than 85 dB.</p>
                )}
              </div>
            </div>
            </div>
          )}
        </div>
      ))}
      {displayedData.length <
        (selectedMonth
          ? historyData.filter(
              (item) =>
                new Date(item.date).toLocaleString('default', {
                  month: 'long',
                  year: 'numeric',
                }) === selectedMonth
            ).length
          : historyData.length) && (
        <button onClick={loadMoreData} className="view-more-button">
          View More
        </button>
      )}
    </>
  )}
</div>
    </div>
  );
};


export default History;
