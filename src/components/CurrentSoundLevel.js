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
        <div>
          <p><strong>Current Sound Level:</strong> {currentLevel} dB</p>
          <p><strong>Noise Source:</strong> {noiseStatus.text === "Safe" ? "Unidentify" : classification || 'N/A'}</p>
          <p>
            <strong>Status: </strong>
            <span style={{ 
              color: noiseStatus.color, 
              fontWeight: "bold", 
              fontSize: "2rem" 
            }}>
              {noiseStatus.text}
            </span>
          </p>
          {audioURL ? (
            <div>
              <p><strong>Sample:</strong></p>
              <audio controls>
                <source src={audioURL} type="audio/mp3" />
                Your browser does not support the audio element.
              </audio>
            </div>
          ) : (
            <p>No audio sample available.</p>
          )}
        </div>
      ) : (
        <p>Loading latest sound level...</p>
      )}
    </div>
  );
};

export default CurrentSoundLevel;
