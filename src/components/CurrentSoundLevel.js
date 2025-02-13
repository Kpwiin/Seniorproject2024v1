import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const CurrentSoundLevel = () => {
  const [currentLevel, setCurrentLevel] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [classification, setClassification] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'sounds'), orderBy('date', 'desc'), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        setCurrentLevel(docData.level);
        setClassification(docData.result);
        setAudioURL(docData.audioURL || null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Determine noise status and color
  const getNoiseStatus = (level) => {
    if (level > 85) {
      return { text: "Danger", color: "red" };
    } else if (level >= 70) {
      return { text: "Caution", color: "yellow" };
    } else {
      return { text: "Safe", color: "green" };
    }
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
            <strong>Status: </strong>
            <span style={{ 
              color: noiseStatus.color, 
             
            }}>
              {noiseStatus.text}
            </span>
          </p>
          <p className="source">
            <strong>Noise Source: </strong> 
            <span style={{ color: noiseStatus.color }}>
              {noiseStatus.text === "Safe" ? "Unidentify" : classification || 'N/A'}
              
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
        </div>
      ) : (
        <p>Loading latest sound level...</p>
      )}
    </div>
  );
}  

export default CurrentSoundLevel;
