import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import '../components/SkeletonCard/SkeletonCard.css';

const AdminDepartmentRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [selectedDepartments, setSelectedDepartments] = useState({});

  const loadRequests = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/auth/department-change-requests');
      setRequests(data);
    } catch (err) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (requestId, userId) => {
    const newDepartment = selectedDepartments[requestId];
    
    if (!newDepartment) {
      toast.error('Please select a department');
      return;
    }
    
    if (!window.confirm(`Approve department change to ${newDepartment}?`)) return;
    
    try {
      setProcessing(prev => ({ ...prev, [requestId]: true }));
      await api.post(`/api/auth/department-change-requests/${requestId}/approve`, {
        userId,
        newDepartment
      });
      toast.success('Request approved successfully');
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to approve request');
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleReject = async (requestId) => {
    if (!window.confirm('Reject this department change request?')) return;
    
    try {
      setProcessing(prev => ({ ...prev, [requestId]: true }));
      await api.post(`/api/auth/department-change-requests/${requestId}/reject`);
      toast.success('Request rejected');
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to reject request');
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { background: '#fef3c7', color: '#92400e', border: '1px solid #f59e0b' },
      approved: { background: '#d1fae5', color: '#065f46', border: '1px solid #10b981' },
      rejected: { background: '#fee2e2', color: '#991b1b', border: '1px solid #ef4444' }
    };

    return (
      <span style={{
        ...styles[status],
        padding: '4px 12px',
        borderRadius: 12,
        fontSize: '0.8rem',
        fontWeight: 600,
        textTransform: 'uppercase'
      }}>
        {status}
      </span>
    );
  };

  return (
    <div className="container">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 8 }}>Department Change Requests</h2>
        <p style={{ color: '#6b7280' }}>Review and manage user department change requests</p>
      </div>

      {loading && (
        <div style={{ display: 'grid', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="card" key={`sk-${i}`} style={{ padding: 20 }}>
              <div className="skeleton-line skeleton-line-lg" style={{ width: '40%', height: 24 }} />
              <div className="skeleton-line" style={{ width: '90%', marginTop: 12 }} />
              <div className="skeleton-line" style={{ width: '70%' }} />
            </div>
          ))}
        </div>
      )}

      {!loading && requests.length === 0 && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>📋</div>
          <h3 style={{ color: '#6b7280', fontWeight: 500 }}>No pending requests</h3>
          <p style={{ color: '#9ca3af', marginTop: 8 }}>Department change requests will appear here</p>
        </div>
      )}

      {!loading && requests.map((req) => (
        <div 
          key={req._id} 
          className="card" 
          style={{ 
            padding: 24, 
            marginBottom: 16,
            border: req.status === 'pending' ? '2px solid #f59e0b' : '1px solid #e5e7eb',
            background: req.status === 'pending' ? '#fffbeb' : 'white'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{req.userId?.name || 'Unknown User'}</h3>
                {getStatusBadge(req.status)}
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                <div style={{ marginBottom: 4 }}>
                  <strong>Email:</strong> {req.userId?.email || 'N/A'}
                </div>
                <div style={{ marginBottom: 4 }}>
                  <strong>Current Department:</strong> {req.currentDepartment || 'Not set'}
                </div>
                <div>
                  <strong>Requested Department:</strong> {req.requestedDepartment || 'Not specified'}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#9ca3af' }}>
              {new Date(req.createdAt).toLocaleDateString()} {new Date(req.createdAt).toLocaleTimeString()}
            </div>
          </div>

          <div style={{ 
            background: 'white', 
            padding: 16, 
            borderRadius: 8, 
            border: '1px solid #e5e7eb',
            marginBottom: 16
          }}>
            <strong style={{ display: 'block', marginBottom: 8, color: '#374151' }}>Reason:</strong>
            <p style={{ margin: 0, color: '#4b5563', lineHeight: 1.6 }}>{req.reason}</p>
          </div>

          {req.status === 'pending' && (
            <div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151' }}>
                  Select New Department:
                </label>
                <select
                  value={selectedDepartments[req._id] || ''}
                  onChange={(e) => setSelectedDepartments(prev => ({ ...prev, [req._id]: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 8,
                    border: '2px solid #d1d5db',
                    fontSize: '0.95rem',
                    fontWeight: 500
                  }}
                >
                  <option value="">-- Select Department --</option>
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="CIVIL">CIVIL</option>
                  <option value="MECH">MECH</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => handleApprove(req._id, req.userId?._id)}
                  disabled={processing[req._id]}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: 8,
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: processing[req._id] ? 'not-allowed' : 'pointer',
                    opacity: processing[req._id] ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  {processing[req._id] ? 'Processing...' : '✓ Approve'}
                </button>
                <button
                  onClick={() => handleReject(req._id)}
                  disabled={processing[req._id]}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: 8,
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: processing[req._id] ? 'not-allowed' : 'pointer',
                    opacity: processing[req._id] ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  {processing[req._id] ? 'Processing...' : '✕ Reject'}
                </button>
              </div>
            </div>
          )}

          {req.status === 'approved' && (
            <div style={{ 
              background: '#d1fae5', 
              color: '#065f46', 
              padding: 12, 
              borderRadius: 8,
              fontWeight: 500
            }}>
              ✓ Approved by admin on {new Date(req.updatedAt).toLocaleDateString()}
            </div>
          )}

          {req.status === 'rejected' && (
            <div style={{ 
              background: '#fee2e2', 
              color: '#991b1b', 
              padding: 12, 
              borderRadius: 8,
              fontWeight: 500
            }}>
              ✕ Rejected by admin on {new Date(req.updatedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminDepartmentRequests;
