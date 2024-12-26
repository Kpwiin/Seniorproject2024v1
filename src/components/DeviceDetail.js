// src/components/DeviceDetail.js
import * as React from 'react';
import { useState, useEffect } from 'react';  // import ครั้งเดียว
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
import { FiFilter } from 'react-icons/fi'; // หรือจะใช้ไอคอนอื่นๆ ก็ได้


const Container = styled.div`
  padding: 2rem;
  background-color: #1a1b2e;
  min-height: 100vh;
`;

const Title = styled.h1`
  color: #4169E1;
  font-size: 2rem;
  margin-bottom: 2rem;
`;

const ContentCard = styled.div`
  background-color: #242538;
  border-radius: 15px;
  padding: 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
`;

const GraphSection = styled.div`
  background: white;
  border-radius: 15px;
  padding: 1.5rem;
`;

const GraphTitle = styled.div`
  position: relative;  // เพิ่มบรรทัดนี้
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const GraphDate = styled.p`
  color: #666;
  margin: 1rem 0;
`;

const NoiseStats = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
`;

const NoiseStat = styled.div`
  span {
    color: #666;
  }
  p {
    color: #ff4444;
    font-size: 2rem;
    margin: 0;
  }
`;

const HistorySection = styled.div`
  background: white;
  border-radius: 15px;
  padding: 1.5rem;
`;

const HistoryTitle = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    
    h2 {
        margin: 0;
        font-size: 1.2rem;
    }
`;

// ปรับแต่ง HistoryRow ให้มี cursor: pointer
const HistoryRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background-color: ${props => props.danger ? '#ffebee' : '#e8f5e9'};
  margin-bottom: 0.5rem;
  border-radius: 5px;
  cursor: pointer; // เพิ่มส่วนนี้
  
  &:hover {
    opacity: 0.8;
  }
`;

const SourceInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ff4444;
  font-size: 1rem;
  
  span {
    font-size: 1.2rem;
  }
  
  p {
    margin: 0;
    line-height: 1.2;
  }
`;

const NoiseButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #242538;
  color: white;
  border: none;
  padding: 0.8rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  
  &:hover {
    opacity: 0.9;
  }
`;
const BackButton = styled.button`
  background: none;
  border: none;
  color: #4169E1;
  font-size: 1rem;
  cursor: pointer;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    opacity: 0.8;
  }
`;
// เพิ่ม styled component สำหรับ graph container
const GraphContainer = styled.div`
  width: 100%;
  height: 300px; // เพิ่มความสูงจาก 200px เป็น 300px
  margin: 1rem 0;
`;
// สร้าง styled component สำหรับปุ่ม View Average
const ViewAverageButton = styled.button`
    border: none;
    background: #4169E1;
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    cursor: pointer;
    &:hover {
        opacity: 0.9;
    }
`;
const FilterDropdown = styled.div`
  position: absolute;
  right: 0;
  top: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0px 2px 8px rgba(0,0,0,0.1);
  min-width: 180px;
  z-index: 1000;
  padding: 8px 0;
`;
const FilterButton = styled.button`
  background: transparent;
  border: none;
  color: #666;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:after {
    content: '';
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 5px solid #666;
    margin-left: 5px;
  }
`;

const DropdownContent = styled.div`
  position: absolute;
  right: 0;
  background: white;
  min-width: 160px;
  box-shadow: 0px 8px 16px rgba(0,0,0,0.1);
  border-radius: 8px;
  padding: 8px 0;
  z-index: 1;
`;

const DropdownItem = styled.div`
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;

  &:hover {
    background-color: #f5f5f5;
  }

  input[type="radio"] {
    width: 16px;
    height: 16px;
    margin: 0;
    accent-color: #4169E1;
  }

  label {
    font-size: 14px;
    color: ${props => props.selected ? '#000' : '#666'};
  }
`;
const FilterTrigger = styled.button`
  background: transparent;
  border: none;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 8px;
  font-size: 20px;
`;
// สร้าง styled component สำหรับ Modal
const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 15px;
  position: relative;
  width: 90%;
  max-width: 500px;
`;

const CloseButton = styled.button`
  position: absolute;
  right: 1rem;
  top: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
`;

const AudioPlayer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const PlayButton = styled.button`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #4169E1;
  border: none;
  color: white;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
`;

function DeviceDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState('Sat-26 Oct');
    const [viewMode, setViewMode] = useState('daily');  // เปลี่ยนจาก 'average' เป็น 'daily'
    const [timeFilter, setTimeFilter] = useState('7days');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [noiseDropdownOpen, setNoiseDropdownOpen] = useState(false);
    const [historyDropdownOpen, setHistoryDropdownOpen] = useState(false);
    const [noiseTimeFilter, setNoiseTimeFilter] = useState('7days');
    const [historyTimeFilter, setHistoryTimeFilter] = useState('7days');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // ย้าย graphData มาไว้ในฟังก์ชัน
    const graphData = {
        'Mon-28 Oct': [
            { time: '00:00', level: 65 },
            { time: '06:00', level: 70 },
            { time: '12:00', level: 72 },
            { time: '18:00', level: 69 },
            { time: '24:00', level: 65 }
        ],
        'Sun-27 Oct': [
            { time: '00:00', level: 62 },
            { time: '06:00', level: 68 },
            { time: '12:00', level: 71 },
            { time: '18:00', level: 69 },
            { time: '24:00', level: 65 }
        ],
        'Sat-26 Oct': [
            { time: '00:00', level: 60 },
            { time: '06:00', level: 85 },
            { time: '12:00', level: 119 },
            { time: '18:00', level: 110 },
            { time: '24:00', level: 60 }
        ],
        'Fri-25 Oct': [
            { time: '00:00', level: 63 },
            { time: '06:00', level: 66 },
            { time: '12:00', level: 69 },
            { time: '18:00', level: 67 },
            { time: '24:00', level: 65 }
        ],
        'Thurs-24 Oct': [
            { time: '00:00', level: 62 },
            { time: '06:00', level: 66 },
            { time: '12:00', level: 69 },
            { time: '18:00', level: 67 },
            { time: '24:00', level: 64 }
        ],
        'Wed-23 Oct': [
            { time: '00:00', level: 65 },
            { time: '06:00', level: 70 },
            { time: '12:00', level: 73 },
            { time: '18:00', level: 71 },
            { time: '24:00', level: 68 }
        ]
    };

    const historyData = [
        { date: 'Mon-28 Oct', avg: '69-72', peak: 72 },
        { date: 'Sun-27 Oct', avg: '68-71', peak: 71 },
        { date: 'Sat-26 Oct', avg: '109-111', peak: 119, danger: true },
        { date: 'Fri-25 Oct', avg: '66-69', peak: 69 },
        { date: 'Thurs-24 Oct', avg: '66-69', peak: 69 },
        { date: 'Wed-23 Oct', avg: '70-73', peak: 73 }
    ];
    const noiseTimeFilters = [
        { value: 'Today', label: 'Today' },
        { value: 'lastweek', label: 'Last week' },
        { value: 'Last month', label: 'Last months ' },
        { value: '3 month ago', label: '3 Last ago ' },
        { value: 'lastYear', label: 'Last year' },
    ];

    // สำหรับ History section
const historyTimeFilters = [
    { value: '7days', label: '7 days ago' },
    { value: 'lastMonth', label: 'Last month' },
    { value: '3monthsAgo', label: '3 months ago' },
    { value: 'lastYear', label: 'Last year' },
];
   

    // เพิ่ม useEffect สำหรับจัดการการคลิกภายนอก dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (noiseDropdownOpen && !event.target.closest('.noise-filter-dropdown')) {
                setNoiseDropdownOpen(false);
            }
            if (historyDropdownOpen && !event.target.closest('.history-filter-dropdown')) {
                setHistoryDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [noiseDropdownOpen, historyDropdownOpen]);

   // ปรับฟังก์ชัน handleDateClick
   const handleDateClick = (date) => {
    setSelectedDate(date);
    setViewMode('daily');
};
// เพิ่มฟังก์ชันสำหรับสลับกลับไปดู average
const handleViewAverage = () => {
    setViewMode('average');
};
    // สร้างข้อมูลสำหรับมุมมอง average
    const averageData = [
        { time: '00:00', level: 63 },
        { time: '06:00', level: 71 },
        { time: '12:00', level: 79 },
        { time: '18:00', level: 75 },
        { time: '24:00', level: 65 }
    ];


    return (
        <Container>
            <Title>Device {id} at 7-11</Title>
            <ContentCard>
                <GraphSection>
                <GraphTitle>
    <h2>Noise level graph</h2>
    <div style={{ position: 'relative' }}>
        <FilterTrigger onClick={() => setNoiseDropdownOpen(!noiseDropdownOpen)}>
            <FiFilter />
        </FilterTrigger>
        
        {noiseDropdownOpen && (
            <FilterDropdown className="noise-filter-dropdown">
                {noiseTimeFilters.map((filter) => (
                    <DropdownItem 
                        key={filter.value}
                        selected={noiseTimeFilter === filter.value}
                        onClick={() => {
                            setNoiseTimeFilter(filter.value);
                            setNoiseDropdownOpen(false);
                        }}
                    >
                        <input 
                            type="radio"
                            checked={noiseTimeFilter === filter.value}
                            readOnly
                        />
                        <label>{filter.label}</label>
                    </DropdownItem>
                ))}
            </FilterDropdown>
        )}
    </div>
</GraphTitle>
                    <GraphDate>
                        {viewMode === 'average' ? 'Average View' : selectedDate}
                    </GraphDate>
                    <NoiseStats>
                        <NoiseStat>
                            <span>Peak</span>
                            <p>
                                {viewMode === 'average' 
                                    ? '79 dB' 
                                    : `${historyData.find(d => d.date === selectedDate)?.peak || 0} dB`}
                            </p>
                        </NoiseStat>
                        <NoiseStat>
                            <span>Avg</span>
                            <p>
                                {viewMode === 'average'
                                    ? '70-75 dB'
                                    : `${historyData.find(d => d.date === selectedDate)?.avg || '0'} dB`}
                            </p>
                        </NoiseStat>
                    </NoiseStats>
                    
                    <GraphContainer>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={viewMode === 'average' ? averageData : graphData[selectedDate]}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="time" 
                                    stroke="#666"
                                    fontSize={12}
                                />
                                <YAxis 
                                    stroke="#666"
                                    fontSize={12}
                                    domain={['dataMin - 10', 'dataMax + 10']}
                                />
                                <Tooltip />
                                <Line 
                                    type="monotone"
                                    dataKey="level"
                                    stroke="#4169E1"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </GraphContainer>

                    {viewMode !== 'average' && (
    <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: '2rem',
        padding: '0 0.5rem'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>😞</span>
            <div style={{ color: '#ff4444' }}>
                <div>Drilling</div>
                <div>06:00 - 23:00</div>
            </div>
        </div>
        
        <NoiseButton onClick={() => setIsModalOpen(true)}>
                <span>🔊</span>
                Noise sample
            </NoiseButton>
    </div>
)}
                </GraphSection>

                <HistorySection>
                <HistoryTitle>
    <h2>History</h2>
    <div style={{ position: 'relative' }}>
        <FilterTrigger onClick={() => setHistoryDropdownOpen(!historyDropdownOpen)}>
            <FiFilter />
        </FilterTrigger>
        
        {historyDropdownOpen && (
            <FilterDropdown className="history-filter-dropdown">
                {historyTimeFilters.map((filter) => (
                    <DropdownItem 
                        key={filter.value}
                        selected={historyTimeFilter === filter.value}
                        onClick={() => {
                            setHistoryTimeFilter(filter.value);
                            setHistoryDropdownOpen(false);
                        }}
                    >
                        <input 
                            type="radio"
                            checked={historyTimeFilter === filter.value}
                            readOnly
                        />
                        <label>{filter.label}</label>
                    </DropdownItem>
                ))}
            </FilterDropdown>
        )}
    </div>
</HistoryTitle>
                
                {historyData.map((item, index) => (
                    <HistoryRow 
                        key={index} 
                        danger={item.danger}
                        onClick={() => navigate(`/device/${id}/history/${item.date}`)}
                        style={{
                            backgroundColor: item.danger ? '#ffebee' : '#e8f5e9'
                        }}
                    >
                        <span>{item.date}</span>
                        <span>Avg: {item.avg}</span>
                    </HistoryRow>
                ))}
            </HistorySection>
            </ContentCard>
            {/* Modal */}
            {isModalOpen && (
                <Modal>
                    <ModalContent>
                        <CloseButton onClick={() => setIsModalOpen(false)}>
                            ✕
                        </CloseButton>
                        <AudioPlayer>
                            <div style={{ width: '100%', height: '4px', background: '#eee' }}>
                                <div 
                                    style={{ 
                                        width: '40%', 
                                        height: '100%', 
                                        background: '#4169E1'
                                    }} 
                                />
                            </div>
                            <PlayButton>
                                ▶
                            </PlayButton>
                        </AudioPlayer>
                    </ModalContent>
                </Modal>
            )}
        </Container>
       
    );
    
}

export default DeviceDetail;
