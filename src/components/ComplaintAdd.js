import React, { useState} from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; 
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import {db} from '../firebase'; // Make sure to import your Firebase configuration
import './ComplaintAdd.css'; // Import the CSS file

function ComplaintAdd() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate(); // Initialize the navigate hook

 
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !message || !location) {
      setError('All fields are required.');
      return;
    }
    setLoading(true);
    try {
      // Add complaint to Firebase Firestore
      await addDoc(collection(db, 'complaints'), {
        username,
        message,
        location,
        timestamp: serverTimestamp(), // Automatically sets the timestamp when the complaint is added
      });
      setUsername('');
      setMessage('');
      setLocation('');
      setError('');
      alert('Complaint added successfully!');
    } catch (err) {
      console.error('Error adding complaint:', err);
      setError('There was an error adding your complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Navigate to the previous page
  const handleBack = () => {
    navigate(-1); // Go back to the previous page
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
            onChange={(e) => setUsername(e.target.value)} 
            required 
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
            <option value="ICT Mahidol">ICT Mahidol</option>
            <option value="7-11">7-11</option>
            <option value="ATM">ATM</option>
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

      {/* <button onClick={handleBack} className="back-button"> Back </button> */}

    </div>
  );
}

export default ComplaintAdd;
