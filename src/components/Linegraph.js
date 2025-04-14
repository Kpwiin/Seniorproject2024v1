import React, { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import {collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import annotationPlugin from 'chartjs-plugin-annotation';
import {db} from '../firebase'; 

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin,
  Filler,
);

export const LineGraph = ({ deviceId }) => {
  const [filteredData, setFilteredData] = useState({ labels: [], datasets: [] });
  const [timeRange, setTimeRange] = useState('last24hours'); // Default to "last24hours"

  const fetchData = useCallback(async (range) => {
    try {
      const now = new Date();
      let startDate;
  

      // Set startDate based on selected range
      if (range === 'last24hours') {
        startDate = new Date(now.setHours(now.getHours() - 24)); // 24 hours ago
      } else if (range === 'last7days') {
        startDate = new Date();
        startDate.setDate(now.getDate() - 7); // Last 7 days
        startDate.setHours(0, 0, 0, 0); 
      } else if (range === 'last30days') {
        startDate = new Date();
        startDate.setDate(now.getDate() - 30); // Last 30 days
        startDate.setHours(0, 0, 0, 0); 
      } else if (range === 'last12months') {
        startDate = new Date();
        startDate.setMonth(now.getMonth() - 12); // Last 12 months
        startDate.setDate(1); 
        startDate.setHours(0, 0, 0, 0); 
      }

      // Firestore query to fetch data sorted by date
      const q = query(
        collection(db, "sounds"),
        where('deviceId', '==', deviceId),
        orderBy("date", "desc")
      );

      const querySnapshot = await getDocs(q);
      const data = [];
    
      if (querySnapshot.empty) {
        // No data found
      }

      querySnapshot.forEach((doc) => {
        console.log(doc.data());
        const docData = doc.data();
      
        if (docData.date && docData.date._seconds !== undefined && docData.date._nanoseconds !== undefined) {
          const timestamp = new Date(
            docData.date._seconds * 1000 + docData.date._nanoseconds / 1000000
          );
          const noiseLevel = docData.level;
          const result = docData.result; // Fetch the 'result' field
      
          // Filter data for the selected range
          if (timestamp >= startDate) {
            data.push({ timestamp, noiseLevel, result }); // Include 'result' in the data
          }
        }
      });
      

      // Process data for last 24 hours
      if (range === 'last24hours') {
        data.sort((a, b) => a.timestamp - b.timestamp);

        const sortedLabels = data.map((item) =>
          item.timestamp.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        );
        const sortedData = data.map((item) => item.noiseLevel);

        setFilteredData({
          labels: sortedLabels,
          datasets: [
            {
              label: "Sound Level (dB)",
              data: sortedData,
              results: data.map((item) => item.result),
              // Create gradient within the setFilteredData function
              borderColor: (() => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const gradient = ctx.createLinearGradient(0, 0, 0, 400); // Vertical gradient
                gradient.addColorStop(1, 'rgb(32, 159, 40)'); // Green for low levels
                gradient.addColorStop(0.9, 'rgb(234, 189, 9)'); 
                gradient.addColorStop(0, 'rgb(255, 0, 0)');  // Red for high levels
                return gradient;
              })(), // Define gradient here
              backgroundColor: (() => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const gradient = ctx.createLinearGradient(0, 0, 0, 400); // Vertical gradient
                gradient.addColorStop(1, 'rgb(32, 159, 40)'); // Green for low levels
                gradient.addColorStop(0.9, 'rgb(234, 189, 9)'); 
                gradient.addColorStop(0, 'rgb(255, 0, 0)');  // Red for high levels
                return gradient;
              })(), // Same gradient for the fill area under the line
              tension: 0.2, // Reduced tension for a more pronounced curve
              pointBackgroundColor: sortedData.map(level => 
                level >= 85 ? 'rgb(255, 0, 0)' :   
                level >= 70 ? 'rgb(227, 174, 41)' : 
                'rgb(32, 159, 40)'          
            ), // Set pointer color based on noise level
              pointBorderColor: "#fff", // White point borders
              pointRadius: 5,  
              pointHoverRadius: 7, 
              fill: true, // Fill the area under the line
              spanGaps: true, // Allow the line to span across gaps
            },
          ],
        });
        
        
      } else if (range === 'last7days' || range === 'last30days') {
        // Group data by exact date
        const dayDataMap = new Map();
        data.forEach((item) => {
          const dateKey = item.timestamp.toLocaleDateString('en-US'); // Use date as key
          if (!dayDataMap.has(dateKey)) {
            dayDataMap.set(dateKey, { total: 0, count: 0, noiseLevels: [] });
          }
          dayDataMap.get(dateKey).total += item.noiseLevel;
          dayDataMap.get(dateKey).count += 1;
          dayDataMap.get(dateKey).noiseLevels.push({ 
            level: item.noiseLevel,
            time: item.timestamp.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }),
            date: item.timestamp.toLocaleDateString('en-US'), // Add full date to each record
          }); 
        });

        // Calculate averages for the past X days 
        const averages = [];
        const sortedLabels = [];

        const daysToFetch = range === 'last7days' ? 7 : 30; // Fetch last 7 or 30 days

        // Loop to fetch the last X days (including today)
        for (let i = daysToFetch - 1; i >= 0; i--) {
          const pastDay = new Date(now);
          pastDay.setDate(now.getDate() - i); // Calculate the exact date for the past X days
          pastDay.setHours(0, 0, 0, 0); // Set time to midnight for accurate comparison
          const dateString = pastDay.toLocaleDateString('en-US');

          // If data exists for the specific date
          if (dayDataMap.has(dateString)) {
            const { total, count, noiseLevels } = dayDataMap.get(dateString);
            const avgNoiseLevel = total / count;
            averages.push(avgNoiseLevel);
            sortedLabels.push(dateString); // Use date as label

            // Log the data used for calculating the average
            console.log(`Data for ${dateString}:`);
            console.log(`Noise Levels:`);
            noiseLevels.forEach((entry) => {
              console.log(`Level: ${entry.level} dB (Time: ${entry.time}) (Date: ${entry.date})`);
            });
            console.log(`Count: ${count}`);
            console.log(`Average for ${dateString}: ${avgNoiseLevel} dB`);
          } else {
            averages.push(0); // No data for this day
            sortedLabels.push(dateString); // Use date as label
            console.log(`No data for ${dateString}`);
          }
        }

        setFilteredData({
          labels: sortedLabels,
          datasets: [
            {
              label: "Average Sound Level (dB)",
              data: averages.map(level => level.toFixed(2)),
              // Create gradient within the setFilteredData function
              borderColor: (() => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const gradient = ctx.createLinearGradient(0, 0, 0, 400); // Vertical gradient
                gradient.addColorStop(1, 'rgb(32, 159, 40)'); // Green for low levels
                gradient.addColorStop(0.9, 'rgb(234, 189, 9)'); 
                gradient.addColorStop(0, 'rgb(255, 0, 0)');  // Red for high levels
                return gradient;
              })(), // Define gradient for the line color
              fill: true, // Fill the area under the line
              tension: 0.3, // Line curve tension
              pointBackgroundColor: averages.map(level => 
                level >= 85 ? 'rgb(255, 0, 0)' : 
                level >= 70 ? 'rgb(255, 255, 0)' : 
                'rgb(32, 159, 40)'                
            ), // Point color based on noise level
              pointBorderColor: "#fff", // White point borders
              pointRadius: 5,  
              pointHoverRadius: 7, 
              backgroundColor: (() => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const gradient = ctx.createLinearGradient(0, 0, 0, 400); // Vertical gradient
                gradient.addColorStop(1, 'rgb(32, 159, 40)'); // Green for low levels
                gradient.addColorStop(0.9, 'rgb(234, 189, 9)'); 
                gradient.addColorStop(0, 'rgb(255, 0, 0)');  // Red for high levels
                return gradient;
              })(), // Same gradient for the fill area under the line
            },
          ],
        });
        
      } else if (range === 'last12months') {
        // Group data by month
        const monthDataMap = new Map();
        data.forEach((item) => {
          const monthKey = item.timestamp.getMonth(); // Get the month (0-11)
          const yearKey = item.timestamp.getFullYear(); // Get the year
          const monthYearKey = `${yearKey}-${monthKey}`; // Combine year and month for unique key

          if (!monthDataMap.has(monthYearKey)) {
            monthDataMap.set(monthYearKey, { total: 0, count: 0 });
          }
          monthDataMap.get(monthYearKey).total += item.noiseLevel;
          monthDataMap.get(monthYearKey).count += 1;
        });

        // Calculate averages for the past 12 months
        const averages = [];
        const sortedLabels = [];

        for (let i = 11; i >= 0; i--) {
          const pastMonth = new Date(now);
          pastMonth.setMonth(now.getMonth() - i); // Calculate the exact month for the past 12 months
          pastMonth.setDate(1); 
          const monthYearKey = `${pastMonth.getFullYear()}-${pastMonth.getMonth()}`;

          // Month name for the x-axis label
          const monthName = pastMonth.toLocaleString('default', { month: 'long' });

          if (monthDataMap.has(monthYearKey)) {
            const { total, count } = monthDataMap.get(monthYearKey);
            const avgNoiseLevel = total / count;
            averages.push(avgNoiseLevel);
            sortedLabels.push(monthName); // Use month name as label
            // Log the data used for calculating the average
            console.log(`Data for ${monthName}`);
            console.log(`Count: ${count}`);
            console.log(`Average for ${monthName}: ${avgNoiseLevel} dB`);
          } else {
            averages.push(0); // No data for this month
            sortedLabels.push(monthName); // Use month name as label
            console.log(`No data for ${monthName}`);
          }
        }

        setFilteredData({
  labels: sortedLabels,
  datasets: [
    {
      label: "Average Sound Level (dB)",
      data: averages.map(level => level.toFixed(2)),
      // Apply gradient for borderColor and backgroundColor
      borderColor: (() => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 400); // Vertical gradient
        gradient.addColorStop(1, 'rgb(32, 159, 40)'); // Green for low levels
        gradient.addColorStop(0.9, 'rgb(234, 189, 9)'); 
        gradient.addColorStop(0, 'rgb(255, 0, 0)');  // Red for high levels
        return gradient;
      })(), // Apply the gradient to the line
      fill: true, // Fill the area under the line
      tension: 0.3, // Line tension
      pointBackgroundColor: averages.map(level => 
        level >= 85 ? 'rgb(255, 0, 0)' : 
        level >= 70 ? 'rgb(255, 255, 0)' : 
        'rgb(32, 159, 40)'                
    ), // Set point color based on level
      pointBorderColor: "#fff", // White point borders
      pointRadius: 5,  
      pointHoverRadius: 7, 
      backgroundColor: (() => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 400); // Vertical gradient
        gradient.addColorStop(1, 'rgb(32, 159, 40)'); // Green for low levels
        gradient.addColorStop(0.9, 'rgb(234, 189, 9)'); 
        gradient.addColorStop(0, 'rgb(255, 0, 0)');  // Red for high levels
        return gradient;
      })(), // Same gradient for the fill area
    },
  ],
});

      }
    } catch (error) {
      console.error("Error fetching data from Firestore: ", error);
    }
  }, [deviceId]); 

  useEffect(() => {
    fetchData(timeRange);
  }, [timeRange, fetchData]);

  const options = {
    responsive: true,
    plugins: {
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function (tooltipItem) {
            const dataIndex = tooltipItem.dataIndex;
            const dataset = tooltipItem.dataset;
            const noiseLevel = dataset.data[dataIndex];
            const result = dataset.results ? dataset.results[dataIndex] : "N/A"; // Use 'results' array
      
            // Choose the label text based on the time range
            const labelPrefix = timeRange === 'last24hours' ? "Sound Level (dB):" : "Average Sound Level (dB):";
      
            // Format label based on condition
            return `${labelPrefix} ${noiseLevel} ${result && noiseLevel >= 85 ? `| Result: ${result}` : ''}`;
          },
        },
      },
      
      
      
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 
          timeRange === 'last12months'
            ? "Sound Level Graph: Last 12 Months"
            : timeRange === 'last30days'
            ? "Sound Level Graph: Last 30 Days"
            : timeRange === 'last7days'
            ? "Sound Level Graph: Last 7 Days"
            : "Sound Level Graph: Last 24 Hours",
        font: {
          size: 30,
          family: "'Arial', sans-serif",
          weight: 'bold',
          color: '#FFFFFF', 
        },
        color: '#FFFFFF',
        padding: {
          bottom: 40,
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
          // Add PeakLevelLabel and CurrentLevelLabel only if the timeRange is 'last24hours'
          ...(timeRange === 'last24hours' && {
            PeakLevelLabel: {
              type: 'label',
              content: [`Peak Level: ${Math.max(...(filteredData.datasets[0]?.data || []))} dB`],
              backgroundColor: 'rgba(255, 255, 255, 0.85)', // Slightly brighter and more modern
              borderColor: 'rgba(0, 0, 0, 0.2)', // Add a subtle border for better separation
              borderWidth: 1,
              borderRadius: 8, // Rounded corners for a softer look
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
              xAdjust: -150, // Adjust for a more centered position
              yAdjust: -200,
            },
            
            CurrentLevelLabel: {
              type: 'label',
              content: [
                `Current Level: ${
                  (filteredData.datasets[0]?.data || []).slice(-1)[0] || 0
                } dB`,
              ],
              backgroundColor: (filteredData.datasets[0]?.data || []).slice(-1)[0] >= 85 
              ? 'rgba(255, 35, 35, 0.85)'  
              : (filteredData.datasets[0]?.data || []).slice(-1)[0] >= 70
              ? 'rgba(255, 255, 0, 0.85)' 
              : 'rgba(26, 226, 11, 0.85)', 
              borderColor: 'rgba(0, 0, 0, 0.2)', // Subtle border
              borderWidth: 1,
              borderRadius: 8, // Rounded corners
              font: {
                size: 18,
                weight: 'bold', // Make it stand out
                family: 'Arial, sans-serif',
                color: '#FFFFFF', // Ensure font color is white
              },
            
              padding: {
                top: 8,
                right: 12,
                bottom: 8,
                left: 12, // Enhanced padding for better content balance
              },
              xAdjust: 110, // Adjust for a more centered position
              yAdjust: -200,
            },
          }),
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 
            timeRange === 'last24hours'
              ? "Time"
              : timeRange === 'last12months'
              ? "Month"
              : "Date",
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
          text: timeRange === 'last24hours' ? "Sound Level (dB)" : "Average Sound Level (dB)",
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
        // Adjusted suggestedMax calculation
        suggestedMax: timeRange === 'last24hours' ? Math.max(...(filteredData.datasets[0]?.data || [0])) + 20 : Math.max(...(filteredData.datasets[0]?.data || [0])) + 10,
      },
    },
  };
  
  return (
    <div>
       <h2 style={{ fontSize: '30px' }}>Historical Graph</h2>
      {/* Filter Dropdown */}
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="time-range">Show data for: </label>
        <select
          id="time-range"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          style={{ padding: '5px', marginLeft: '10px' }}
        >
          <option value="last24hours">Last 24 hours</option>
          <option value="last7days">Last 7 days</option>
          <option value="last30days">Last 30 days</option>
          <option value="last12months">Last 12 months</option> 
        </select>
      </div>
  
      {/* Line Chart */}
      <Line options={options} data={filteredData} />
    </div>
  );
}  