// src/components/HistoryDetail.js
import React from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Container = styled.div`
  padding: 2rem;
  background-color: #1a1b2e;
  min-height: 100vh;
  color: white;
`;

const ContentCard = styled.div`
  background-color: #242538;
  border-radius: 15px;
  padding: 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin: 0 auto;
  max-width: 1200px;
`;

const Title = styled.h1`
  color: #4169E1;
  font-size: 2rem;
  margin-bottom: 2rem;
  text-align: center;
`;

const HistorySection = styled.div`
  background: white;
  border-radius: 15px;
  padding: 1.5rem;
  color: black;
`;

const GraphSection = styled.div`
  background: white;
  border-radius: 15px;
  padding: 1.5rem;
  color: black;
`;

const HistoryRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.8rem;
  background-color: ${props => 
    props.selected ? '#e3f2fd' :
    props.danger ? '#ffebee' : '#e8f5e9'
  };
  margin-bottom: 0.5rem;
  border-radius: 5px;
  cursor: pointer;
  
  &:hover {
    opacity: 0.8;
  }
`;

const NoiseInfo = styled.div`
  text-align: center;
  margin: 2rem 0;
  
  .stats-container {
    display: flex;
    justify-content: space-around;
    margin: 1rem 0;
  }
  
  .stat-box {
    text-align: center;
  }
  
  .label {
    color: #666;
    font-size: 0.9rem;
  }
  
  .value {
    color: #ff4444;
    font-size: 2.5rem;
    font-weight: bold;
  }
`;

// แก้ไข SourceInfo styled component
const SourceInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #ff4444;
  padding: 0.8rem 1.5rem;
  background: #ffebee;
  border-radius: 8px;
`;

const NoiseButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #4169E1;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 5px;
  cursor: pointer;
  margin: 1rem 0;
  
  &:hover {
    opacity: 0.9;
  }
`;

const BackButton = styled.button`
  background: #4169E1;
  color: white;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 5px;
  cursor: pointer;
  margin: 2rem auto;
  display: block;
  
  &:hover {
    opacity: 0.9;
  }
`;
// เพิ่ม styled component ใหม่
const BottomContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
`;

const HistoryDetail = () => {
    const { date } = useParams();
    const navigate = useNavigate();

    // ข้อมูลประวัติ
    const historyData = [
        { date: 'Mon-28 Oct', avg: '69-72', peak: 72 },
        { date: 'Sun-27 Oct', avg: '68-71', peak: 71 },
        { date: 'Sat-26 Oct', avg: '109-111', peak: 119, danger: true },
        { date: 'Fri-25 Oct', avg: '66-69', peak: 69 },
        { date: 'Thurs-24 Oct', avg: '66-69', peak: 69 },
        { date: 'Wed-23 Oct', avg: '70-73', peak: 73 }
    ];

    // ข้อมูลกราฟ
    const graphData = [
        { time: '00:00', level: 60 },
        { time: '06:00', level: 85 },
        { time: '12:00', level: 119 },
        { time: '18:00', level: 110 },
        { time: '24:00', level: 60 }
    ];

    const selectedDay = historyData.find(item => item.date === date) || historyData[2];

    return (
        <Container>
            <Title>Device 2 at 7-11</Title>
            <ContentCard>
                <HistorySection>
                    <h2>History</h2>
                    {historyData.map((item, index) => (
                        <HistoryRow 
                            key={index}
                            danger={item.danger}
                            selected={item.date === date}
                            onClick={() => navigate(`/device/2/history/${item.date}`)}
                        >
                            <span>{item.date}</span>
                            <span>Avg: {item.avg}</span>
                        </HistoryRow>
                    ))}
                </HistorySection>

                <GraphSection>
    <h2>Noise level graph</h2>
    <h3>{selectedDay.date}</h3>
    
    <NoiseInfo>
        <div className="stats-container">
            <div className="stat-box">
                <span className="label">Peak</span>
                <div className="value">{selectedDay.peak} dB</div>
            </div>
            <div className="stat-box">
                <span className="label">Avg</span>
                <div className="value">{selectedDay.avg} dB</div>
            </div>
        </div>
    </NoiseInfo>

    <ResponsiveContainer width="100%" height={300}>
        <LineChart data={graphData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis domain={[0, 120]} />
            <Tooltip />
            <Line 
                type="monotone" 
                dataKey="level" 
                stroke="#4169E1" 
                strokeWidth={2}
            />
        </LineChart>
    </ResponsiveContainer>

    <BottomContainer>
        <SourceInfo>
            <span>😞</span>
            <p>Drilling<br/>06:00 - 23:00</p>
        </SourceInfo>

        <NoiseButton>
            <span>🔊</span>
            Noise sample
        </NoiseButton>
    </BottomContainer>
</GraphSection>
            </ContentCard>
            <BackButton onClick={() => navigate(-1)}>Back</BackButton>
        </Container>
    );
};

export default HistoryDetail;