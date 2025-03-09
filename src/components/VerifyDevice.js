import React, { useEffect, useState } from 'react';
import { db } from '../firebase'; // Ensure you have Firebase initialized
import { collection, getDocs, query, where } from 'firebase/firestore';

const VerifyDevice = () => {
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [soundData, setSoundData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const deviceSnapshot = await getDocs(collection(db, 'devices'));
                const deviceList = deviceSnapshot.docs.map(doc => ({ deviceId: doc.id, ...doc.data() }));
                setDevices(deviceList);
            } catch (error) {
                console.error("Error fetching devices: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDevices();
    }, []);

    const handleDeviceClick = async (deviceId) => {
        setSelectedDevice(deviceId);
        setSoundData(null);
        
        try {
            const soundQuery = query(collection(db, 'sounds'), where('deviceId', '==', deviceId));
            const soundSnapshot = await getDocs(soundQuery);
            
            if (!soundSnapshot.empty) {
                const latestSound = soundSnapshot.docs[0].data();
                setSoundData({
                    soundLevel: latestSound.soundLevel || 'N/A',
                    classification: latestSound.classification || 'Unknown'
                });
            } else {
                setSoundData({ soundLevel: 'N/A', classification: 'Unknown' });
            }
        } catch (error) {
            console.error("Error fetching sound data: ", error);
        }
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div>
            <h2>Device List</h2>
            <ul>
                {devices.map(device => (
                    <li 
                        key={device.deviceId} 
                        style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
                        onClick={() => handleDeviceClick(device.deviceId)}
                    >
                        <strong>{device.name || 'Unknown Device'}</strong> - {device.location || 'Location Not Available'}
                    </li>
                ))}
            </ul>

            {selectedDevice && (
                <div>
                    <h3>Sound Data for Device: {selectedDevice}</h3>
                    <p>Sound Level: {soundData?.soundLevel}</p>
                    <p>Classification: {soundData?.classification}</p>
                </div>
            )}
        </div>
    );
};
export default VerifyDevice;
