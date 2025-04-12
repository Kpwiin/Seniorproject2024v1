import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const CurrentSoundLevel = ({ deviceId }) => {
  const [currentLevel, setCurrentLevel] = useState(null);
  const [highestLevelToday, setHighestLevelToday] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [classification, setClassification] = useState(null);

  useEffect(() => {
    if (!deviceId) return;

    // Get the start and end timestamps for today
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const startTimestamp = Math.floor(startOfDay.getTime() / 1000); // in seconds
    const endTimestamp = Math.floor(endOfDay.getTime() / 1000);     // in seconds

    // Fetch the highest level recorded today
    const fetchHighestLevel = async () => {
      const dailyQuery = query(
        collection(db, 'sounds'),
        where('deviceId', '==', deviceId),
        where('date._seconds', '>=', startTimestamp),
        where('date._seconds', '<=', endTimestamp)
      );

      const snapshot = await getDocs(dailyQuery);
      if (!snapshot.empty) {
        const levels = snapshot.docs.map(doc => doc.data().level || 0);
        const maxLevel = Math.max(...levels);
        setHighestLevelToday(maxLevel);
      } else {
        setHighestLevelToday(null);
      }
    };

    fetchHighestLevel();

    // Real-time listener for the most recent sound level
    const latestQuery = query(
      collection(db, 'sounds'),
      where('deviceId', '==', deviceId),
      orderBy('date._seconds', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(latestQuery, (snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        setCurrentLevel(docData.level);
        setClassification(docData.result);
        setAudioURL(docData.audioURL || null);
      }
    });

    return () => unsubscribe();
  }, [deviceId]);

  const getNoiseStatus = (level) => {
    if (level > 85) return { text: "Danger", color: "red" };
    if (level >= 70) return { text: "Caution", color: "yellow" };
    return { text: "Safe", color: "green" };
  };

  const noiseStatus = currentLevel !== null ? getNoiseStatus(currentLevel) : null;

  return (
    <div className="current-sound-level">
      {currentLevel !== null ? (
        <div className="current-container">
          <p className="current">
            <strong>Current Sound Level:</strong>
            <span style={{ color: noiseStatus.color }}> {currentLevel} dB</span>
          </p>
          <p className="status">
            <strong>Status:</strong>
            <span style={{ color: noiseStatus.color }}> {noiseStatus.text}</span>
          </p>
          <p className="source">
            <strong>Noise Source:</strong>
            <span style={{ color: noiseStatus.color }}>
              {noiseStatus.text === "Safe" ? "Unidentified" : classification || 'N/A'}
            </span>
          </p>
          {audioURL ? (
            <div className="audio-container">
              <p><strong>Sample:</strong></p>
              <audio controls>
                <source src={audioURL} type="audio/mp3" />
                Your browser does not support the audio element.
              </audio>
            </div>
          ) : (
            <p className="no-audio">No audio sample available.</p>
          )}

          {highestLevelToday !== null && (
            <p className="highest-today">
              <strong>Highest Level Today:</strong> {highestLevelToday} dB
            </p>
          )}
        </div>
      ) : (
        <p>Loading latest sound level...</p>
      )}
    </div>
  );
};

export default CurrentSoundLevel;
