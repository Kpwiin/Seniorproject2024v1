import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit, startAfter, deleteDoc, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { formatDistanceToNow, format } from 'date-fns';
import { useNavigate } from 'react-router-dom'; 
import { db } from '../firebase'; 
import './Complaint.css';
import { onAuthStateChanged } from 'firebase/auth'; 
import { auth } from '../firebase';

function Complaint() {
  const [complaints, setComplaints] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [newComment, setNewComment] = useState('');
  const complaintsPerPage = 3;
  const commentsPerComplaint = 2; 
  const commentsToLoadOnClick = 5; 
  const navigate = useNavigate(); 
  const [username, setUsername] = useState('');
  const [commentsState, setCommentsState] = useState({});


  useEffect(() => {
    fetchComplaints();
  }, []);


  const fetchComplaints = async (isLoadMore = false) => {
    setLoading(true);
    setError(null);
    try {
      const complaintsData = [];
      
      // If loading more complaints, use the last document fetched
      const complaintsQuery = query(
        collection(db, 'complaints'),
        orderBy('timestamp', 'desc'),
        isLoadMore && lastDoc ? startAfter(lastDoc) : limit(complaintsPerPage)
      );
    
      const querySnapshot = await getDocs(complaintsQuery);
    
      // Handle complaints data
      for (const docSnapshot of querySnapshot.docs) {
        const complaintData = {
          id: docSnapshot.id,
          ...docSnapshot.data(),
          timestamp: docSnapshot.data().timestamp.toDate(),
          status: docSnapshot.data().status || false,
        };
  
        // Fetch comments as usual
        const commentsQuery = query(
          collection(db, 'complaints', docSnapshot.id, 'comments'),
          orderBy('timestamp', 'asc'),
          limit(commentsPerComplaint)
        );
        const commentsSnapshot = await getDocs(commentsQuery);
    
        const commentsData = commentsSnapshot.docs.map(commentDoc => ({
          id: commentDoc.id,
          ...commentDoc.data(),
          timestamp: commentDoc.data().timestamp.toDate(),
        }));
    
        complaintData.comments = commentsData;
    
        // Store the last document of comments for pagination
        const lastCommentDoc = commentsSnapshot.docs[commentsSnapshot.docs.length - 1];
        setCommentsState(prevState => ({
          ...prevState,
          [docSnapshot.id]: { lastDoc: lastCommentDoc, comments: commentsData },
        }));
    
        complaintsData.push(complaintData);
      }
    
      // Update complaints state and the lastDoc state for pagination
      setComplaints(prevComplaints => isLoadMore ? [...prevComplaints, ...complaintsData] : complaintsData);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
  
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setError('Failed to load complaints. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  
  const loadMoreComments = async (complaintId) => {
    try {
      const { lastDoc, comments } = commentsState[complaintId];
  
      if (!lastDoc) return; // No more comments to load
  
      const commentsQuery = query(
        collection(db, 'complaints', complaintId, 'comments'),
        orderBy('timestamp', 'asc'),
        startAfter(lastDoc),
        limit(commentsToLoadOnClick) // Load more comments (5 comments)
      );
  
      const commentsSnapshot = await getDocs(commentsQuery);
      const newComments = commentsSnapshot.docs.map(commentDoc => ({
        id: commentDoc.id,
        ...commentDoc.data(),
        timestamp: commentDoc.data().timestamp.toDate(),
      }));
  
      // Update state with new comments
      setCommentsState(prevState => {
        const newCommentsState = { ...prevState };
        newCommentsState[complaintId] = {
          lastDoc: commentsSnapshot.docs[commentsSnapshot.docs.length - 1],
          comments: [...comments, ...newComments],
        };
        return newCommentsState;
      });
  
      // Update complaint comments list
      setComplaints(prevComplaints =>
        prevComplaints.map(comp =>
          comp.id === complaintId ? { ...comp, comments: [...comp.comments, ...newComments] } : comp
        )
      );
    } catch (error) {
      console.error('Error loading more comments:', error);
    }
  };

  const deleteComplaint = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this complaint?'); // Confirmation alert
    if (confirmed) {
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
    }
  };  

  const toggleStatus = async (id, currentStatus) => {
    const confirmed = window.confirm(`Are you sure you want to mark this complaint as ${currentStatus ? 'Unverified' : 'Verified'}?`); // Confirmation alert
    if (confirmed) {
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
    }
  };
  
  const handleAddComment = async (complaintId) => {
    if (newComment.trim()) {
      const confirmed = window.confirm('Are you sure you want to add this comment?'); // Confirmation alert
      if (confirmed) {
        try {
          if (!username) {
            alert('You must be logged in to comment!');
            return;
          }
  
          const commentRef = collection(db, 'complaints', complaintId, 'comments');
          await addDoc(commentRef, {
            username: username, // Use the username from the state
            message: newComment,
            timestamp: serverTimestamp(),
          });
          setNewComment('');
          fetchComplaints(); // Refetch complaints to update comments
        } catch (error) {
          console.error('Error adding comment:', error);
        }
      }
    }
  };
  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUsername(user.displayName); // Set the authenticated user's display name
      } else {
        setUsername(''); // Reset if no user is logged in
      }
    });
    return () => unsubscribe(); // Cleanup the listener on component unmount
  }, []);

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
                <p className="com-status">
                  <strong>Status: 
                    {complaint.status ? 
                     <span className="verified"> Verified</span> : 
                     <span className="unverified"> Unverified</span>
                    }
                  </strong>
                </p>
                <p className="message">{complaint.message}</p>

                {/* Comments section */}
                <div className="comments-section">
                  <h4>Comments:</h4>
                  <div className="comments-list">
                    {/* Fetch and display comments for each complaint */}
                    {complaint.comments && complaint.comments.map(comment => (
                      <div key={comment.id} className="comment-item">
                        <p><strong>{comment.username}</strong>: {comment.message}</p>
                        <p>{format(comment.timestamp, 'd MMMM yyyy, HH:mm')}</p>
                      </div>
                    ))}
                  </div>
                  {/* Load More Comments button */}  
                 <button 
                  onClick={() => loadMoreComments(complaint.id)}
                  className="load-more-comments"
                  >
                  Load More Comments
                  </button>

                  {/* Add a new comment */}
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment"
                    className="new-comment-textarea"
                  ></textarea>
                  <button
                    onClick={() => handleAddComment(complaint.id)}
                    className="add-comment-button"
                  >
                    Add Comment
                  </button>
                </div>
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
    <button 
      onClick={() => fetchComplaints(true)} 
      disabled={loading || !lastDoc} 
      className="more-button"
    >
      View More
    </button>
  </div>
        )}
      </main>
    </div>
  );
}

export default Complaint;
