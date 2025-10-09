import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import api from '../utils/api';

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
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/my-events'
      },
      redirect: 'if_required',
    });
    if (error) {
      setMessage(error.message || 'Payment failed');
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setMessage('Payment successful');
      navigate('/my-events');
    } else {
      setMessage('Payment processing');
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 520 }}>
      <div style={{ marginBottom: 12 }}>
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      {message && (
        <div style={{ background: '#fee2e2', color: '#7f1d1d', padding: '10px 12px', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 10 }}>{message}</div>
      )}
      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={!stripe || submitting}>
          {submitting ? 'Processing…' : `Pay ₹${registration?.totalFee ?? ''}`}
        </button>
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
    <div className="container">
      <h2>Complete Payment</h2>
      <p>Registration ID: <strong>{registrationId}</strong></p>
      <p>Amount: <strong>₹{registration?.totalFee}</strong></p>
      <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'flat' } }}>
        <CheckoutForm registration={registration} clientSecret={clientSecret} />
      </Elements>
    </div>
  );
};

export default Payment;
