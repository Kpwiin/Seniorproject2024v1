import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit, startAfter, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { formatDistanceToNow, format } from 'date-fns';
import { useNavigate } from 'react-router-dom'; 
import {db} from '../firebase'; 
import './Complaint.css';

function Complaint() {
  const [complaints, setComplaints] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const complaintsPerPage = 3;
  const navigate = useNavigate(); 

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async (isNext = false) => {
    setLoading(true);
    setError(null);
    try {
      let q = query(
        collection(db, 'complaints'),
        orderBy('timestamp', 'desc'),
        limit(complaintsPerPage)
      );

      if (isNext && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const complaintsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
        status: doc.data().status || false,
      }));

      setComplaints(isNext ? [...complaints, ...complaintsData] : complaintsData);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setError('Failed to load complaints. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const deleteComplaint = async (id) => {
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'complaints', id));
      setComplaints(prevComplaints => prevComplaints.filter(complaint => complaint.id !== id));
      console.log(`Complaint ${id} deleted successfully.`);
    } catch (error) {
      console.error('Error deleting complaint:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const docRef = doc(db, 'complaints', id);
      await updateDoc(docRef, {
        status: !currentStatus
      });
      setComplaints(prevComplaints =>
        prevComplaints.map(complaint =>
          complaint.id === id ? { ...complaint, status: !currentStatus } : complaint
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleNavigation = (path) => {
    navigate(path); 
  };

  return (
    <div className="Complaint">
      <header className="Complaint-header">
        <h1>Complaints</h1>
       
      </header>

      <main className="Complaint-main">
        
        <div className="add-complaint"> 
          <button onClick={() => handleNavigation('/complaints/add')} className="add-complaint-button">Add Complaint</button>
        </div>
        <div className="complaint-list">
          {complaints.map(complaint => (
            <div key={complaint.id} className="complaint-card">
              <div className="complaint-content">
                <p>
                  <strong>{complaint.username}</strong>
                  <span className="added"> added a complaint {formatDistanceToNow(complaint.timestamp)} ago</span>
                  <span className="added-date-time"> ({format(complaint.timestamp, 'd MMMM yyyy, HH:mm')})</span>
                </p>
                <p><strong>Location: <span className="location">{complaint.location}</span></strong></p>
                <p className="status">
                  <strong>Status: 
                    {complaint.status ? 
                     <span className="verified"> Verified</span> : 
                     <span className="unverified"> Unverified</span>
                    }
                  </strong>
                </p>
                <p className="message">{complaint.message}</p>
              </div>
              <div className="button-container">
                <button 
                  onClick={() => deleteComplaint(complaint.id)} 
                  className="remove-button"
                  disabled={deletingId === complaint.id}
                >
                  {deletingId === complaint.id ? 'Removing...' : 'Remove'}
                </button>
                <button 
                  onClick={() => toggleStatus(complaint.id, complaint.status)} 
                  className="status-toggle-button"
                >
                  {complaint.status ? 
                   <span className="status-toggle-button-ver">Mark as Unverified</span> : 
                   <span className="status-toggle-button-unver">Mark as Verified</span>
                  }
                </button>
              </div>
            </div>
          ))}
        </div>

        {error && <p className="error-message">{error}</p>}

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="pagination-controls">
            <button onClick={() => fetchComplaints(true)} disabled={loading || !lastDoc} className="more-button">View More</button>
          </div>
        )}
      </main>
    </div>
  );
}

export default Complaint;
