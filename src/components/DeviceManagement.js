import React, { useState, useEffect, useMemo} from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, where, updateDoc, doc} from 'firebase/firestore';
import { FiSettings } from 'react-icons/fi';
import AddDevice from './AddDevice';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';

const Container = styled.div`
  padding: 20px;
  width: 100%;
`;

const Title = styled.h1`
  color: white;
  margin-bottom: 20px;
  margin-top: 100px;
`;

const TabContainer = styled.div`
  margin-bottom: 20px;
  border-bottom: 1px solid #333;
`;

const Tab = styled.span`
  color: ${props => props.active ? '#1a75ff' : '#666'};
  padding: 10px 20px;
  cursor: pointer;
  border-bottom: 2px solid ${props => props.active ? '#1a75ff' : 'transparent'};
  margin-right: 20px;
  display: inline-block;
  transition: all 0.3s ease;

  &:hover {
    color: #1a75ff;
  }
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  color: white;
  table-layout: fixed;
  background: #1a1a1a;
  cursor: pointer; 
`;

const Th = styled.th`
  text-align: left;
  padding: 15px;
  border-bottom: 1px solid #333;
  color: #999;
  font-weight: normal;
`;

const Td = styled.td`
  padding: 15px;
  border-bottom: 1px solid #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
`;

const TableRow = styled.tr`
  &:hover {
    background-color: rgba(26, 117, 255, 0.1);
  }
`;

const StatusBadge = styled.span`
  display: flex;
  align-items: center;
  justify-content: center; 
  gap: 8px;
  
  &::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${props => props.active ? '#4CAF50' : '#f44336'};
    margin-bottom: 1px; 
  }
  color: ${props => props.active ? '#4CAF50' : '#f44336'};
`;

const SettingsIcon = styled(FiSettings)`
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    color: #1a75ff;
    transform: rotate(90deg);
  }
`;

const LoadingContainer = styled.div`
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2rem;
`;

const NoDevicesMessage = styled.div`
  color: #999;
  text-align: center;
  padding: 20px;
  font-style: italic;
`;

const ContentContainer = styled.div`

`;

const ScrollableContent = styled.div`
  max-height: 40vh;
  overflow-y: auto;
  margin-top: 10px;
  margin-bottom: 5px;
  padding-right: 10px;
  scrollbar-color: #666 #222;

  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background: #666;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-track {
    background: #222;
  }

  display: flex;  
  flex-direction: column;  
  justify-content: start;  
  align-items: center;  
  text-align: center;  
  width: 100%;
`;

const SoundIcon = styled.span`
  font-size: 22px;
  margin-left: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
`;
const FiltersWrapper = styled.div`
  display: flex;
  justify-content: center;  
  align-items: center;
  gap: 20px;
  margin-bottom: 10px;
  flex-wrap: nowrap; /* Prevents wrapping */
`;

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap; /* Ensures text stays on one line */
`;

const FilterSelect = styled.select`
  margin-top: 15px;
  padding: 8px 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #333333;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  min-width: 100px; 

  &:hover,
  &:focus {
    border-color:#1a75ff;
    outline: none;
  }
`;

const SortButton = styled.button`
  background-color: #333333;
  border: 1px solid #ccc;
  color: #fff;
  font-size: 14px; 
  padding: 4px 2px; 
  margin-top: 15px;
  cursor: pointer;
  border-radius: 5px;
  transition: all 0.3s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center; 
  min-width: 120px; 
  
  &:hover,
  &:focus {
    border-color: #1a75ff;
    outline: none;
  }

  span {
    margin-right: 2px;
    margin-left: 6px;
  }

  svg {
    font-size: 20px;
    color: #fff;
  }
`;

function DeviceManagement() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Devices list');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [saving, setSaving] = useState(false);
  const [soundLevels, setSoundLevels] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [isFetching, setIsFetching] = useState(false); 

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'devices'));
      const deviceList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDevices(deviceList);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSettingsClick = (e, deviceId) => {
    e.stopPropagation(); 
    navigate(`/device/${deviceId}/settings`);
  };

  const handleTabChange = (tabName, url) => {
    setActiveTab(tabName);
    navigate(url);  
  };
  
  const soundLevelsMemoized = useMemo(() => {
    return soundLevels.map((sound) => ({
      ...sound,
      color: sound.level < 70 ? "green" : sound.level <= 85 ? "yellow" : "red",
      formattedDate: new Date(sound.date).toLocaleString(),
    }));
  }, [soundLevels]); 

  const handleRowClick = (device) => {
    const newExpandedRow = expandedRow === device.id ? null : device.id;
    setExpandedRow(newExpandedRow);
  
    if (newExpandedRow) {
      fetchSoundLevels(device.deviceId); 
    }
  };

  const fetchSoundLevels = async (deviceId) => {
    setIsFetching(true);
    try {
      const q = query(collection(db, 'sounds'), where('deviceId', '==', String(deviceId)));
      const querySnapshot = await getDocs(q);
      const levels = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: new Date(doc.data().date._seconds * 1000).toLocaleString(), 
      }));
      setSoundLevels(levels);
    } catch (error) {
      console.error('Error fetching sound levels:', error);
    } finally {
      setIsFetching(false);
    }
  };
  
  const handleEditClick = (index, sound) => {
    setEditingIndex(index);
    setEditedData({ ...sound });
    
  };
  
  const handleChange = (e, field) => {
    setEditedData({ ...editedData, [field]: e.target.value });
  };

  const [sortByLevelOrder, setSortByLevelOrder] = useState("asc"); 
  const toggleSortByLevelOrder = () => {
    setSortByLevelOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
  };
  


  const [timeFilter, setTimeFilter] = useState("1 hour");
  const [dangerFilter, setDangerFilter] = useState("all"); 
  const filterSoundLevels = useMemo(() => {
    const now = new Date();
    let timeRange = 0;
  
    // Set time range based on the time filter
    switch (timeFilter) {
      case "1 hour":
        timeRange = 1;
        break;
      case "3 hours":
        timeRange = 3;
        break;
      case "7 hours":
        timeRange = 7;
        break;
      case "12 hours":
        timeRange = 12;
        break;
      case "1 day":
        timeRange = 24;
        break;
      case "3 days":
        timeRange = 72;
        break;
      case "7 days":
        timeRange = 168;
        break;
      default:
        timeRange = 1;
    }
  
    // Filter sound levels by time and danger filter
    const filteredLevels = soundLevelsMemoized.filter((sound) => {
      const soundDate = new Date(sound.date);
      const diffHours = (now - soundDate) / (1000 * 60 * 60);
  
      // Apply time filter
      const matchesTimeFilter = diffHours <= timeRange;
  
      // Apply danger filter
      const matchesDangerFilter = dangerFilter === "all" || sound.level > 85;
  
      return matchesTimeFilter && matchesDangerFilter;
    });
  
    // Sort by level (ascending or descending based on the order)
    return filteredLevels.sort((a, b) => {
      if (sortByLevelOrder === "asc") {
        return a.level - b.level;
      } else {
        return b.level - a.level;
      }
    });
  
  }, [soundLevelsMemoized, timeFilter, dangerFilter, sortByLevelOrder]);  // Include `sortByLevelOrder` in dependencies
  

  const handleSave = async (soundId) => {
    if (!editedData.level || !editedData.result) {
      alert("Please enter both sound level and result.");
      return;
    }
  
    setSaving(true);
    try {
      const soundRef = doc(db, "sounds", soundId);
      await updateDoc(soundRef, {
        level: Number(editedData.level),
        result: editedData.result,
      });
  
      setSoundLevels((prev) =>
        prev.map((s) => (s.id === soundId ? { ...s, ...editedData } : s))
      );
      setEditingIndex(null);
      alert("Sound data updated successfully!");
    } catch (error) {
      console.error("Error updating sound data:", error);
      alert("Failed to update sound data.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingContainer>Loading...</LoadingContainer>;
  }
  
  return (
    <Container>
      <Title>Manage Devices</Title>
      <TabContainer>
        <Tab active={activeTab === 'Devices list'} onClick={() => handleTabChange('Devices list')}>
          Devices list
        </Tab>
        <Tab active={activeTab === 'Add device'} onClick={() => handleTabChange('Add device')}>
          Add device
        </Tab>
      </TabContainer>

      <ContentContainer>
        {activeTab === 'Devices list' && (
          devices.length === 0 ? (
            <NoDevicesMessage>No devices found</NoDevicesMessage>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th style={{ width: '20%', textAlign: 'center' }}>Device name</Th>
                  <Th style={{ width: '8%', textAlign: 'center' }}>Device ID</Th>
                  <Th style={{ width: '42%' }}>Location</Th>
                  <Th style={{ width: '10%', textAlign: 'center' }}>Date added</Th>
                  <Th style={{ width: '12%', textAlign: 'center' }}>Status</Th>
                  <Th style={{ width: '8%', textAlign: 'center' }}>Setting</Th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <React.Fragment key={device.id}>
                    <TableRow onClick={() => handleRowClick(device)}>
                      <Td style={{ textAlign: 'center' }}>{device.deviceName}</Td>
                      <Td style={{ textAlign: 'center' }}>{device.deviceId}</Td>
                      <Td>{device.location}</Td>
                      <Td style={{ textAlign: 'center' }}>
                        {device.createdAt ? new Date(device.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                      </Td>
                      <Td style={{ textAlign: 'center' }}>
                        <StatusBadge active={device.status === 'Active'}>
                          {device.status}
                        </StatusBadge>
                      </Td>
                      <Td style={{ textAlign: 'center' }}>
                        <SettingsIcon onClick={(e) => handleSettingsClick(e, device.id)} />
                      </Td>
                    </TableRow>
                    {expandedRow === device.id && (
                      <tr style={{ backgroundColor: '#222222' }}> 
                        <Td colSpan="6" style={{ padding: '10px' }}>
                          
                          <div>
                            <h2>Sound Levels</h2>
                            <FiltersWrapper>
                            <div>
                            <FilterContainer>
                            <FilterSelect
                              value={dangerFilter}
                              onChange={(e) => setDangerFilter(e.target.value)}
                              style={{ marginLeft: "10px", padding: "5px" }}
                            >
                              <option value="all">Show All Sounds</option>
                              <option value="danger">Show Only Danger Sounds</option>
                            </FilterSelect>
                            </FilterContainer>
                          </div>
                            <div>
                            <FilterContainer>
                            <FilterSelect
                              value={timeFilter}
                              onChange={(e) => setTimeFilter(e.target.value)}
                              style={{ marginLeft: "10px", padding: "5px" }}
                            >
                              <option value="1 hour">Last 1 Hour</option>
                              <option value="3 hours">Last 3 Hours</option>
                              <option value="7 hours">Last 7 Hours</option>
                              <option value="12 hours">Last 12 Hours</option>
                              <option value="1 day">Last 1 Day</option>
                              <option value="3 days">Last 3 Days</option>
                              <option value="7 days">Last 7 Days</option>
                            </FilterSelect>
                            </FilterContainer>
                          </div>
                          <div>
                            <FilterContainer>
                            <SortButton onClick={toggleSortByLevelOrder}>
                              <span>Sort by Level</span>
                              {sortByLevelOrder === "asc" ? (
                                <ArrowUpward />
                              ) : (
                                <ArrowDownward />
                              )}
                            </SortButton>
                            </FilterContainer>
                          </div>
                          </FiltersWrapper>
                            {isFetching ? (
                              <p>Loading sound levels...</p>
                            ) : soundLevelsMemoized.length === 0 ? (
                              <p>No sound data available</p>
                            ) : (
                              <ScrollableContent>
                              <ul style={{ padding: 0, listStyle: "none" }}>
                                {filterSoundLevels.map((sound, index) => (
                                  <li 
                                    key={index}
                                    style={{
                                      color: sound.color,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",  
                                      gap: "10px",  
                                      padding: "2px",
                                      fontSize: "16px",
                                      width: "100%", 
                                      textAlign: "center", 
                                    }}
                                  >
                                    {sound.level > 85 ? (
                                      <>
                                        {editingIndex === index ? (
                                          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                            <span>{sound.formattedDate} - {sound.level} dB - </span>
                                            <select
                                              value={editedData.result || sound.result}
                                              onChange={(e) => handleChange(e, "result")}
                                              style={{ width: "120px", padding: "5px" }}
                                            >
                                              <option value="Engine">Engine</option>
                                              <option value="Airplane">Airplane</option>
                                              <option value="Car">Car</option>
                                              <option value="Train">Train</option>
                                              <option value="Car Horn">Car Horn</option>
                                              <option value="Chainsaw">Chainsaw</option>
                                              <option value="Drilling">Drilling</option>
                                              <option value="Handsaw">Handsaw</option>
                                              <option value="Jackhammer">Jackhammer</option>
                                              <option value="Street Music">Street Music</option>
                                              <option value="Other Sounds">Other Sounds</option>
                                            </select>
                                            <button 
                                              onClick={() => handleSave(sound.id)} 
                                              disabled={saving} 
                                              style={{ backgroundColor: "#28a745", color: "white", padding: "6px 10px", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "14px", transition: "0.3s ease-in-out" }}
                                            >
                                              {saving ? "Saving..." : "Save"}
                                            </button>
                                          </div>
                                        ) : (
                                          <>
                                            <span>{sound.formattedDate} - {sound.level} dB - </span>
                                            <span onClick={() => handleEditClick(index, sound)} style={{ cursor: "pointer", textDecoration: "underline" }}>
                                              {sound.result}
                                            </span>
                                            <SoundIcon onClick={() => sound.sample ? new Audio(sound.sample).play() : alert("No Audio Available")}>
                                              🔊
                                            </SoundIcon>
                                          </>
                                        )}
                                      </>
                                    ) : (
                                      <span>{sound.formattedDate} - {sound.level} dB</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </ScrollableContent>
                            
                            )}
                          </div>
                        </Td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </Table>
          )
        )}
        {activeTab === 'Add device' && <AddDevice />}
      </ContentContainer>
    </Container>
  );
}

export default DeviceManagement;
