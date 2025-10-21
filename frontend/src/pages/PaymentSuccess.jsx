import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState('Redirecting to My Events in 2 seconds...');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        const registrationId = searchParams.get('registration_id');

        if (!sessionId || !registrationId) {
          toast.error('Invalid payment session');
          navigate('/my-events');
          return;
        }

        // Verify payment with backend
        await api.post(`/api/registrations/${registrationId}/verify-checkout`, {
          sessionId
        });

        setVerified(true);
        toast.success('Payment successful!');
        
        // Check if there's a return URL stored
        const returnUrl = localStorage.getItem('payment-return-url');
        
        if (returnUrl) {
          setRedirectMessage('Redirecting to complete your sub-event registration in 2 seconds...');
        }
        
        setTimeout(() => {
          if (returnUrl) {
            localStorage.removeItem('payment-return-url');
            navigate(returnUrl);
          } else {
            navigate('/my-events');
          }
        }, 2000);
      } catch (err) {
        console.error('Payment verification error:', err);
        toast.error('Payment verification failed');
        setTimeout(() => {
          navigate('/my-events');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="container" style={{ 
        padding: '100px 20px', 
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
        <h2>Verifying Payment...</h2>
        <p style={{ color: '#6b7280' }}>Please wait while we confirm your payment</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ 
      padding: '100px 20px', 
      textAlign: 'center',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
      <h2 style={{ color: '#10b981', marginBottom: '16px' }}>Payment Successful!</h2>
      <p style={{ fontSize: '18px', color: '#374151', marginBottom: '32px' }}>
        Your registration has been confirmed. You will receive a confirmation email shortly.
      </p>
      <div style={{
        background: '#f0fdf4',
        border: '1px solid #86efac',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '32px'
      }}>
        <p style={{ color: '#166534', margin: 0 }}>
          {redirectMessage}
        </p>
      </div>
      <button 
        className="btn-primary" 
        onClick={() => navigate('/my-events')}
      >
        Go to My Events Now
      </button>
    </div>
  );
};

export default PaymentSuccess;
