import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore'; 
import { getAuth, onAuthStateChanged } from 'firebase/auth'; 
import { db } from '../firebase';
import './ComplaintAdd.css';
import { useNavigate } from 'react-router-dom';

function ComplaintAdd() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState('');
  const [locations, setLocations] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const auth = getAuth(); 
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUsername(user.displayName); 
      } else {
        setUsername('');
      }
    });
    return () => unsubscribe(); 
  }, [auth]);

  // Fetch device names from Firestore
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const devicesSnapshot = await getDocs(collection(db, 'devices'));
        const deviceNames = devicesSnapshot.docs.map(doc => doc.data().deviceName).filter(Boolean);
        setLocations(deviceNames);
      } catch (err) {
        console.error('Error fetching locations:', err);
      }
    };
    fetchLocations();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !message || !location) {
      setError('All fields are required.');
      return;
    }
  
    // Confirmation dialog before submitting
    const confirmed = window.confirm('Are you sure you want to submit this complaint?');
    if (!confirmed) return;  // Exit if the user cancels the submission
    
    setLoading(true);
    try {
      // Add the complaint to Firestore
      await addDoc(collection(db, 'complaints'), {
        username,
        message,
        location,
        timestamp: serverTimestamp(),
      });
      
      // Clear form fields
      setMessage('');
      setLocation('');
      setError('');
      
      alert('Complaint added successfully!');
      
      // Redirect back to the complaints page
      navigate('/complaints');
    } catch (err) {
      console.error('Error adding complaint:', err);
      setError('There was an error adding your complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div>
      <h1>Add Complaint</h1>
      <form onSubmit={handleSubmit} className="add-complaint-form">
        <div>
          <label>Username</label>
          <input 
            type="text" 
            value={username} 
            disabled // Prevent manual input
          />
        </div>

        <div>
          <label>Location</label>
          <select 
            value={location} 
            onChange={(e) => setLocation(e.target.value)} 
            required
          >
            <option value="">Select a location</option>
            {locations.map((loc, index) => (
              <option key={index} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Message</label>
          <textarea 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            required 
          />
        </div>

        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Complaint'}
        </button>
      </form>
    </div>
  );
}

export default ComplaintAdd;
