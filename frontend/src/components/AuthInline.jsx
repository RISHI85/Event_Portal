import React, { useState } from 'react';
import useAuthStore from '../store/authStore';

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
    <div className="container" style={{marginTop: -30}}>
      <div className="card" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, padding:16}}>
        <div className="auth-image" style={{ backgroundImage: "url('/images/login.jpg')" }} />
        <form className="auth-form" onSubmit={onSubmit}>
          <div className="tabs">
            <button type="button" className={mode==='login'?'active':''} onClick={() => {setMode('login'); setOtpSent(false);}}>Login</button>
            <button type="button" className={mode==='signup'?'active':''} onClick={() => {setMode('signup'); setOtpSent(false);}}>Signup</button>
          </div>

          <label>Email</label>
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />

          {!otpSent && (
            <>
              <label>Password</label>
              <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
            </>
          )}

          {mode === 'signup' && !otpSent && (
            <>
              <label>Gender</label>
              <select value={gender} onChange={(e)=>setGender(e.target.value)}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
                <option>Prefer not to say</option>
              </select>
              <label>Year</label>
              <select value={year} onChange={(e)=>setYear(e.target.value)} required>
                <option value="">Select Year</option>
                <option value="First Year">First Year</option>
                <option value="Second Year">Second Year</option>
                <option value="Third Year">Third Year</option>
                <option value="Fourth Year">Fourth Year</option>
              </select>
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
            </>
          )}

          {otpSent && (
            <>
              <div className="muted">We sent a 6-digit OTP to your email.</div>
              <label>OTP</label>
              <input value={otp} onChange={(e)=>setOtp(e.target.value)} required />
            </>
          )}

          <button className="btn-primary" type="submit" disabled={loading}>
            {otpSent ? 'Verify OTP' : mode==='signup' ? 'Signup' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthInline;
