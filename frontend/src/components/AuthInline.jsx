import React, { useState } from 'react';
import useAuthStore from '../store/authStore';
import './AuthInline.css';

const AuthInline = () => {
  const { register, login, verifyOtp, loading } = useAuthStore();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('Prefer not to say');
  const [year, setYear] = useState('');
  const [department, setDepartment] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (otpSent) {
        await verifyOtp({ email, otp });
      } else if (mode === 'signup') {
        await register({ email, password, gender, year, department });
        setOtpSent(true);
      } else {
        await login({ email, password });
        setOtpSent(true);
      }
    } catch {}
  };

  return (
    <div className="auth-inline-container">
      <div className="auth-inline-card">
        <div className="auth-inline-left">
          <div className="auth-inline-image">
            <div className="auth-overlay">
              <h2>Welcome to EventPortal</h2>
              <p>Join us to discover and register for amazing events</p>
              <div className="auth-features">
                <div className="auth-feature">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Easy Registration</span>
                </div>
                <div className="auth-feature">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Secure Payments</span>
                </div>
                <div className="auth-feature">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Track Your Events</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="auth-inline-right">
          <form className="auth-inline-form" onSubmit={onSubmit}>
            <div className="auth-tabs">
              <button 
                type="button" 
                className={`auth-tab ${mode==='login'?'active':''}`} 
                onClick={() => {setMode('login'); setOtpSent(false);}}
              >
                Login
              </button>
              <button 
                type="button" 
                className={`auth-tab ${mode==='signup'?'active':''}`} 
                onClick={() => {setMode('signup'); setOtpSent(false);}}
              >
                Signup
              </button>
            </div>

            <div className="auth-form-content">
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required placeholder="your.email@example.com" />
              </div>

              {!otpSent && (
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required placeholder="Enter your password" />
                </div>
              )}

              {mode === 'signup' && !otpSent && (
                <>
                  <div className="form-group">
                    <label>Gender</label>
                    <select value={gender} onChange={(e)=>setGender(e.target.value)}>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                      <option>Prefer not to say</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Year</label>
                    <select value={year} onChange={(e)=>setYear(e.target.value)} required>
                      <option value="">Select Year</option>
                      <option value="First Year">First Year</option>
                      <option value="Second Year">Second Year</option>
                      <option value="Third Year">Third Year</option>
                      <option value="Fourth Year">Fourth Year</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <select value={department} onChange={(e)=>setDepartment(e.target.value)} required>
                      <option value="">Select Department</option>
                      <option value="CSE">CSE</option>
                      <option value="IT">IT</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="CIVIL">CIVIL</option>
                      <option value="MECH">MECH</option>
                    </select>
                  </div>
                </>
              )}

              {otpSent && (
                <>
                  <div className="otp-notice">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span>We sent a 6-digit OTP to your email.</span>
                  </div>
                  <div className="form-group">
                    <label>OTP</label>
                    <input value={otp} onChange={(e)=>setOtp(e.target.value)} required placeholder="Enter 6-digit OTP" maxLength="6" />
                  </div>
                </>
              )}

              <button className="auth-submit-btn" type="submit" disabled={loading}>
                {loading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  otpSent ? 'Verify OTP' : mode==='signup' ? 'Create Account' : 'Sign In'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthInline;
