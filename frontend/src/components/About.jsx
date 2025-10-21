import React from 'react';

const About = () => (
  <section id="about" className="about">
    <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#374151', marginBottom: '20px' }}>
      <strong>EventPortal</strong> is your comprehensive solution for managing and organizing events efficiently. 
      Whether you're hosting technical workshops, cultural festivals, or competitive challenges, our platform 
      streamlines the entire event lifecycle from registration to feedback collection.
    </p>
    
    <div style={{ display: 'grid', gap: '16px', marginTop: '24px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
        <span style={{ fontSize: '24px' }}>🎯</span>
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#14b8a6' }}>Seamless Registration</h3>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
            Easy-to-use registration forms with support for individual and team participation, 
            flexible payment options, and instant confirmation emails.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
        <span style={{ fontSize: '24px' }}>🔒</span>
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#14b8a6' }}>Secure Access Control</h3>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
            Role-based authentication system ensuring secure access for participants, organizers, 
            and administrators with dedicated dashboards for each role.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
        <span style={{ fontSize: '24px' }}>📊</span>
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#14b8a6' }}>Insightful Analytics</h3>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
            Real-time registration tracking, payment status monitoring, feedback collection, 
            and comprehensive reporting tools to measure event success.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
        <span style={{ fontSize: '24px' }}>💳</span>
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#14b8a6' }}>Integrated Payments</h3>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
            Secure payment processing powered by Stripe with support for multiple payment methods 
            including cards, UPI, and net banking in test mode.
          </p>
        </div>
      </div>
    </div>

    <div style={{ 
      marginTop: '32px', 
      padding: '20px', 
      background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', 
      borderRadius: '12px',
      color: 'white'
    }}>
      <p style={{ margin: 0, fontSize: '15px', textAlign: 'center' }}>
        <strong>Join thousands of event organizers</strong> who trust EventPortal to deliver 
        exceptional event experiences. Start organizing your next event today!
      </p>
    </div>
  </section>
);

export default About;
