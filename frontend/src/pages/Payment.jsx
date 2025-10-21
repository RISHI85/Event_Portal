import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './Payment.css';

// Defer creating the Stripe instance until we have a valid publishable key
const getStripePromise = (pk) => (pk ? loadStripe(pk) : null);

const CheckoutForm = ({ registration, clientSecret }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!stripe || !elements) return;
    setSubmitting(true);
    
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/my-events'
        },
        redirect: 'if_required',
      });
      
      if (error) {
        setMessage(error.message || 'Payment failed');
        setSubmitting(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setMessage('Payment successful! Updating registration...');
        toast.success('Payment successful!');
        
        // Update payment status in backend
        try {
          await api.post(`/api/registrations/${registration._id}/confirm-payment`, {
            paymentIntentId: paymentIntent.id
          });
          
          toast.success('Registration confirmed! Redirecting...');
          setTimeout(() => {
            navigate('/my-events');
          }, 1500);
        } catch (err) {
          console.error('Failed to update payment status:', err);
          toast.error('Payment successful but failed to update status. Please refresh.');
          // Still navigate even if update fails
          setTimeout(() => {
            navigate('/my-events');
          }, 2000);
        }
      } else {
        setMessage('Payment processing');
        setSubmitting(false);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setMessage('Payment failed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="payment-form-section">
        <h3 className="payment-form-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M2 10h20" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Select Payment Method
        </h3>
        <PaymentElement options={{ 
          layout: 'tabs',
          paymentMethodOrder: ['card', 'upi', 'netbanking']
        }} />
      </div>
      
      {message && (
        <div className={`payment-message ${message.includes('successful') ? 'success' : 'error'}`}>
          {message.includes('successful') ? '✓' : '⚠'}
          {message}
        </div>
      )}
      
      <div className="payment-actions">
        <button 
          type="button" 
          className="payment-btn payment-btn-secondary" 
          onClick={() => navigate('/my-events')}
          disabled={submitting}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="payment-btn payment-btn-primary" 
          disabled={!stripe || submitting}
        >
          {submitting ? 'Processing…' : `Pay ₹${registration?.totalFee ?? ''}`}
        </button>
      </div>
      
      <div className="payment-security-info">
        <p>🔒 Secure payment powered by Stripe • Your payment information is encrypted</p>
      </div>
    </form>
  );
};

const Payment = () => {
  const { registrationId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registration, setRegistration] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
  const stripePromise = useMemo(() => getStripePromise(publishableKey), [publishableKey]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/api/registrations/${registrationId}`);
        setRegistration(data.registration);
        setClientSecret(data.clientSecret);
      } catch (e) {
        setError(e.response?.data?.message || e.message || 'Failed to load payment');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [registrationId]);

  if (loading) return <div className="container"><p>Loading payment…</p></div>;
  if (error) return <div className="container"><p>{error}</p></div>;
  if (!registration) return null;

  // No payment required (free or below threshold)
  if (!clientSecret) {
    return (
      <div className="container">
        <h2>Payment</h2>
        <p>Registration ID: <strong>{registrationId}</strong></p>
        <p>No payment required for this registration.</p>
        <div className="form-actions">
          <button className="btn-primary" onClick={() => navigate('/my-events')}>Done</button>
        </div>
      </div>
    );
  }

  // If Stripe publishable key is missing, show a helpful message instead of crashing
  if (!publishableKey) {
    return (
      <div className="container">
        <h2>Payment</h2>
        <p>Registration ID: <strong>{registrationId}</strong></p>
        <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', color:'#9a3412', padding:12, borderRadius:8, margin:'12px 0' }}>
          Missing Stripe publishable key. Please set <code>REACT_APP_STRIPE_PUBLISHABLE_KEY</code> in your frontend <code>.env</code> file and restart the dev server.
        </div>
        <div className="form-actions">
          <button className="btn-secondary" onClick={() => navigate('/my-events')}>Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-header">
          <h1>Complete Payment</h1>
          <p>Secure checkout for your event registration</p>
          <div className="payment-secure-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Powered by Stripe
          </div>
        </div>

        <div className="payment-grid">
          <div>
            <Elements stripe={stripePromise} options={{ 
              clientSecret, 
              appearance: { 
                theme: 'stripe',
                variables: {
                  colorPrimary: '#14b8a6',
                  colorBackground: '#ffffff',
                  colorText: '#1f2937',
                  colorDanger: '#ef4444',
                  fontFamily: 'system-ui, sans-serif',
                  borderRadius: '10px',
                  spacingUnit: '4px'
                }
              } 
            }}>
              <CheckoutForm registration={registration} clientSecret={clientSecret} />
            </Elements>
          </div>

          <div className="payment-summary-card">
            <h3 className="payment-summary-title">Order Summary</h3>
            
            <div className="payment-summary-item">
              <div className="payment-summary-label">Event</div>
              <div className="payment-summary-value event-name">
                {registration?.eventId?.name || 'Event Registration'}
              </div>
            </div>

            <div className="payment-summary-item">
              <div className="payment-summary-label">Registration ID</div>
              <div className="payment-summary-value registration-id">
                {registrationId?.slice(0, 8)}...
              </div>
            </div>

            {registration?.teamName && (
              <div className="payment-summary-item">
                <div className="payment-summary-label">Team Name</div>
                <div className="payment-summary-value">{registration.teamName}</div>
              </div>
            )}

            {registration?.eventId?.date && (
              <div className="payment-summary-item">
                <div className="payment-summary-label">Event Date</div>
                <div className="payment-summary-value">
                  {new Date(registration.eventId.date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
            )}

            <div className="payment-total">
              <div className="payment-total-label">Total Amount</div>
              <div className="payment-total-amount">₹{registration?.totalFee}</div>
            </div>
          </div>
        </div>

        <div className="payment-features">
          <div className="payment-feature">
            <div className="payment-feature-icon">🔒</div>
            <div className="payment-feature-text">Secure Payment</div>
          </div>
          <div className="payment-feature">
            <div className="payment-feature-icon">⚡</div>
            <div className="payment-feature-text">Instant Confirmation</div>
          </div>
          <div className="payment-feature">
            <div className="payment-feature-icon">📧</div>
            <div className="payment-feature-text">Email Receipt</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
