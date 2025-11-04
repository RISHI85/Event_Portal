import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './PaymentCheckout.css';

const PaymentCheckout = () => {
  const { registrationId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registration, setRegistration] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/registrations/${registrationId}`);
        setRegistration(data.registration);
      } catch (e) {
        setError(e.response?.data?.message || e.message || 'Failed to load payment');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [registrationId]);

  const handlePayment = async () => {
    try {
      setProcessing(true);
      
      // Get checkout URL
      const { data } = await api.post('/registrations/register', {
        eventId: registration.eventId._id,
        department: registration.department,
        year: registration.year,
        teamName: registration.teamName,
        teamMembers: registration.teamMembers
      });

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error('Failed to create payment session');
        setProcessing(false);
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="payment-checkout-container">
        <div className="payment-loading">
          <div className="spinner"></div>
          <p>Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-checkout-container">
        <div className="payment-error">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Payment</h2>
          <p>{error}</p>
          <button className="btn-secondary" onClick={() => navigate('/my-events')}>
            Back to My Events
          </button>
        </div>
      </div>
    );
  }

  if (!registration) return null;

  // Check if already paid
  if (registration.paymentStatus === 'completed') {
    return (
      <div className="payment-checkout-container">
        <div className="payment-success-state">
          <div className="success-icon">✓</div>
          <h2>Payment Already Completed</h2>
          <p>This registration has already been paid for.</p>
          <button className="btn-primary" onClick={() => navigate('/my-events')}>
            Go to My Events
          </button>
        </div>
      </div>
    );
  }

  // Free registration
  if (registration.totalFee === 0) {
    return (
      <div className="payment-checkout-container">
        <div className="payment-success-state">
          <div className="success-icon">✓</div>
          <h2>Registration Confirmed</h2>
          <p>No payment required for this event.</p>
          <button className="btn-primary" onClick={() => navigate('/my-events')}>
            Go to My Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-checkout-container">
      <div className="payment-header">
        <h1>Complete Payment</h1>
        <p className="payment-subtitle">Secure checkout powered by Stripe</p>
      </div>

      <div className="payment-content">
        {/* Event Details Card */}
        <div className="payment-card event-details-card">
          <div className="card-header">
            <h2>Event Details</h2>
          </div>
          <div className="card-body">
            <div className="detail-row">
              <span className="detail-label">Event Name</span>
              <span className="detail-value">{registration.eventId?.name || 'Event'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Registration ID</span>
              <span className="detail-value registration-id">{registrationId}</span>
            </div>
            {registration.teamName && (
              <div className="detail-row">
                <span className="detail-label">Team Name</span>
                <span className="detail-value">{registration.teamName}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">Department</span>
              <span className="detail-value">{registration.department || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Year</span>
              <span className="detail-value">{registration.year || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Team Members Card */}
        {registration.teamMembers && registration.teamMembers.length > 0 && (
          <div className="payment-card team-members-card">
            <div className="card-header">
              <h2>Team Members</h2>
              <span className="member-count">{registration.teamMembers.length} members</span>
            </div>
            <div className="card-body">
              <div className="members-table">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registration.teamMembers.map((member, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{member.name}</td>
                        <td>{member.email || '-'}</td>
                        <td>{member.phone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Payment Summary Card */}
        <div className="payment-card payment-summary-card">
          <div className="card-header">
            <h2>Payment Summary</h2>
          </div>
          <div className="card-body">
            <div className="summary-row">
              <span className="summary-label">Registration Fee</span>
              <span className="summary-value">₹{registration.totalFee}</span>
            </div>
            <div className="summary-row total-row">
              <span className="summary-label">Total Amount</span>
              <span className="summary-value total-amount">₹{registration.totalFee}</span>
            </div>
          </div>
        </div>

        {/* Payment Actions */}
        <div className="payment-actions">
          <button 
            className="btn-cancel" 
            onClick={() => navigate('/my-events')}
            disabled={processing}
          >
            Cancel
          </button>
          <button 
            className="btn-pay" 
            onClick={handlePayment}
            disabled={processing}
          >
            {processing ? (
              <>
                <span className="spinner-small"></span>
                Processing...
              </>
            ) : (
              <>
                <span className="lock-icon">🔒</span>
                Proceed to Secure Payment
              </>
            )}
          </button>
        </div>

        <div className="payment-security-badge">
          <span className="badge-icon">🔒</span>
          <span className="badge-text">Secure payment powered by Stripe</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentCheckout;
