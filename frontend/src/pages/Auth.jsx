import React, { useState } from 'react';
import useAuthStore from '../store/authStore';

const Auth = () => {
  const { register, login, verifyOtp, loading } = useAuthStore();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState('Prefer not to say');
  const [year, setYear] = useState('');
  const [department, setDepartment] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'signup' && !otpSent && password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    try {
      if (otpSent) {
        await verifyOtp({ email, otp });
      } else if (mode === 'signup') {
        await register({ name, email, password, gender, year, department });
        setOtpSent(true);
      } else {
        await login({ email, password });
        setOtpSent(true);
      }
    } catch {}
  };

  return (
    <div className="auth-fullscreen">
      <div className="auth-container-centered">
        <div className="auth-welcome-panel">
          <h2>Welcome Back!</h2>
          <p>Provide your personal details to use all features</p>
          <button type="button" className="btn-signin" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? 'SIGN UP' : 'SIGN IN'}
          </button>
        </div>
        <form className="auth-form-centered" onSubmit={onSubmit}>
          <h2>{otpSent ? 'Verify OTP' : mode === 'signup' ? 'Register' : 'Login'}</h2>
          <p className="auth-subtitle">{otpSent ? 'Enter the OTP sent to your email' : 'Fill Out The Following Info For Registration'}</p>

          {mode === 'signup' && !otpSent && (
            <>
              <label>Full Name</label>
              <input type="text" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Enter your full name" required />
            </>
          )}

          <label>Email</label>
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Enter your email" required />

          {!otpSent && (
            <>
              <label>Password</label>
              <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Enter your password" required />
            </>
          )}

          {mode === 'signup' && !otpSent && (
            <>
              <label>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} placeholder="Re-enter your password" required />
              
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
                <option value="1st">1st</option>
                <option value="2nd">2nd</option>
                <option value="3rd">3rd</option>
                <option value="4th">4th</option>
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
              <label>OTP</label>
              <input value={otp} onChange={(e)=>setOtp(e.target.value)} placeholder="Enter 6-digit OTP" maxLength={6} required />
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

export default Auth;
