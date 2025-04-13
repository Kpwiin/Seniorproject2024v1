import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const CurrentSoundLevel = ({ deviceId }) => {
  const [currentLevel, setCurrentLevel] = useState(null);
  const [highestLevelToday, setHighestLevelToday] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [classification, setClassification] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [latestAudioDoc, setLatestAudioDoc] = useState(null);

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
        console.log('Latest document data:', docData);
        
        setCurrentLevel(docData.level);
        
        // ถ้าเอกสารล่าสุดมีข้อมูล result ให้ใช้เลย
        if (docData.result) {
          setClassification(docData.result);
        }
        
        // ถ้าเอกสารล่าสุดมีข้อมูลเสียง ให้ใช้เลย
        if (docData.audioUrl || docData.storagePath) {
          updateAudioInfo(docData);
        } else {
          // ถ้าไม่มี ให้ค้นหาเอกสารล่าสุดที่มีข้อมูลเสียง
          fetchLatestAudioDocument();
        }
      }
    });

    // ฟังก์ชันสำหรับค้นหาเอกสารล่าสุดที่มีข้อมูลเสียง
    const fetchLatestAudioDocument = async () => {
      try {
        const audioQuery = query(
          collection(db, 'sounds'),
          where('deviceId', '==', deviceId),
          orderBy('date._seconds', 'desc'),
          limit(10) // ดึงมา 10 เอกสารล่าสุดเพื่อค้นหา
        );
        
        const snapshot = await getDocs(audioQuery);
        if (!snapshot.empty) {
          // ค้นหาเอกสารแรกที่มี audioUrl หรือ storagePath
          const audioDoc = snapshot.docs.find(doc => {
            const data = doc.data();
            return data.audioUrl || data.storagePath;
          });
          
          if (audioDoc) {
            const audioData = audioDoc.data();
            console.log('Found audio document:', audioData);
            setLatestAudioDoc(audioData);
            updateAudioInfo(audioData);
            
            // ถ้าเอกสารนี้มี result และเอกสารล่าสุดไม่มี result ให้ใช้ result จากเอกสารนี้
            if (audioData.result && !classification) {
              console.log('Using result from audio document:', audioData.result);
              setClassification(audioData.result);
            }
          } else {
            console.log('No documents with audio found in the last 10 records');
            setAudioUrl(null);
            setAudioError('No recent audio recordings available');
          }
        }
      } catch (error) {
        console.error('Error fetching audio document:', error);
        setAudioError(`Error fetching audio: ${error.message}`);
      }
    };
    
    // ฟังก์ชันสำหรับอัปเดตข้อมูลเสียง
    const updateAudioInfo = (docData) => {
      if (docData.audioUrl) {
        console.log('Found audioUrl:', docData.audioUrl);
        setAudioUrl(docData.audioUrl);
        setAudioError(null);
      } else if (docData.storagePath) {
        // ถ้ามี storagePath แต่ไม่มี audioUrl ให้สร้าง URL จาก storagePath
        const url = `https://storage.googleapis.com/noise-monitoring-system-5c950.firebasestorage.app/${docData.storagePath}`;
        console.log('Created URL from storagePath:', url);
        setAudioUrl(url);
        setAudioError(null);
      }
    };

    return () => unsubscribe();
  }, [deviceId]);

  const handlePlayAudio = () => {
    setIsPlaying(true);
    console.log('Playing audio from:', audioUrl);
  };

  const handlePauseAudio = () => {
    setIsPlaying(false);
  };

  const handleAudioError = (event) => {
    console.error('Audio playback error:', event);
    setAudioError(`Playback error: ${event.target.error?.message || 'Unknown error'}`);
    setIsPlaying(false);
  };

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
              {noiseStatus.text === "Safe" ? "Unidentified" : classification || 
                (latestAudioDoc && latestAudioDoc.result ? latestAudioDoc.result : 'N/A')}
            </span>
          </p>
          
          <div className="audio-container">
            <p><strong>Sample:</strong></p>
            {audioUrl ? (
              <>
                <audio 
                  controls
                  onPlay={handlePlayAudio}
                  onPause={handlePauseAudio}
                  onError={handleAudioError}
                >
                  <source src={audioUrl} type="audio/wav" />
                  Your browser does not support the audio element.
                </audio>
                {isPlaying && <p>Playing audio...</p>}
                {audioError && <p className="error" style={{ color: 'red' }}>{audioError}</p>}
                {latestAudioDoc && latestAudioDoc.date && (
                  <p className="audio-date">
                    <small>
                      Audio recorded: {new Date(latestAudioDoc.date._seconds * 1000).toLocaleString()}
                    </small>
                  </p>
                )}
              </>
            ) : (
              <p className="no-audio">
                {audioError || "No audio sample available."}
              </p>
            )}
          </div>

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