import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PaymentCancel = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const registrationId = searchParams.get('registration_id');

  return (
    <div className="container" style={{ 
      padding: '100px 20px', 
      textAlign: 'center',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>❌</div>
      <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>Payment Cancelled</h2>
      <p style={{ fontSize: '18px', color: '#374151', marginBottom: '32px' }}>
        Your payment was cancelled. Your registration is still pending.
      </p>
      <div style={{
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '32px'
      }}>
        <p style={{ color: '#991b1b', margin: 0 }}>
          You can complete the payment anytime from "My Events" page.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button 
          className="btn-secondary" 
          onClick={() => navigate('/events')}
        >
          Browse Events
        </button>
        <button 
          className="btn-primary" 
          onClick={() => navigate('/my-events')}
        >
          Go to My Events
        </button>
      </div>
    </div>
  );
};

export default PaymentCancel;
