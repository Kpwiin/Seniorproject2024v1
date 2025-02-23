import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase'; // Ensure your firebase configuration is correct

const CurrentSoundLevel = ({ deviceId }) => {
  const [currentLevel, setCurrentLevel] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [classification, setClassification] = useState(null);

  useEffect(() => {
    // Early exit if no deviceId is provided
    console.log("Device ID from props:", deviceId);
    if (!deviceId) return;

    // Create the Firestore query to fetch the latest sound data for the given deviceId
    const q = query(
      collection(db, 'sounds'),
      where('deviceId', '==', deviceId), // Filter by deviceId
      orderBy('date._seconds', 'desc'),  // Order by seconds field of the date object
      limit(1)  // Limit to the most recent document
    );

    // Listen to the query snapshot and update state accordingly
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("Snapshot data:", snapshot);  // Debugging: Check if the snapshot is returned correctly

      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        console.log("Document data:", docData);  // Debugging: Log the fetched document data

        setCurrentLevel(docData.level);
        setClassification(docData.result);
        setAudioURL(docData.audioURL || null);
      } else {
        console.log("No documents found for deviceId:", deviceId);  // Debugging: No data found for the given deviceId
      }
    });

    // Cleanup on component unmount
    return () => unsubscribe();
  }, [deviceId]);

  // Function to determine noise status based on the sound level
  const getNoiseStatus = (level) => {
    if (level > 85) {
      return { text: "Danger", color: "red" };
    } else if (level >= 70) {
      return { text: "Caution", color: "yellow" };
    } else {
      return { text: "Safe", color: "green" };
    }
  };

  // Get the current noise status based on the level
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
            <span style={{ color: noiseStatus.color }}>
              {noiseStatus.text}
            </span>
          </p>
          <p className="source">
            <strong>Noise Source: </strong> 
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
        </div>
      ) : (
        <p>Loading latest sound level...</p>
      )}
    </div>
  );
};

export default CurrentSoundLevel;
