import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import './Register.css';

const Register = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const [teamName, setTeamName] = useState('');
  // teamSize represents TOTAL team size including the registering user
  const [teamSize, setTeamSize] = useState(1);
  const [year, setYear] = useState('');
  const [department, setDepartment] = useState('');
  const [members, setMembers] = useState([{ name: '', email: '', phone: '' }]);

  useEffect(() => {
    // Prevent admins from loading registration details
    if (isAuthenticated && user?.role === 'admin') {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const { data } = await api.get(`/api/events/${id}`);
        setEvent(data);
        // Initialize team size constraints from registrationDetails
        const rd = data?.registrationDetails || {};
        const team = rd?.teamSize || { type: 'individual', value: 1, minValue: 1, maxValue: 1 };
        const teamAllowed = !!rd.teamParticipation && team.type !== 'individual';
        if (!teamAllowed) {
          setTeamSize(1);
          setMembers([{ name: (user?.name || ((user?.email || '').split('@')[0]) || ''), email: user?.email || '', phone: '' }]);
        } else if (team.type === 'fixed') {
          const exact = team.value || 1;
          setTeamSize(exact);
          setMembers(Array.from({ length: Math.max(1, exact) }, (_, i) => ({ name: i === 0 ? (user?.name || ((user?.email || '').split('@')[0]) || '') : '', email: i === 0 ? (user?.email || '') : '', phone: '' })));
        } else if (team.type === 'range' || team.type === 'at_most' || team.type === 'at_least') {
          const min = Math.max(1, team.minValue || team.value || 1);
          setTeamSize(min);
          setMembers(Array.from({ length: Math.max(1, min) }, (_, i) => ({ name: i === 0 ? (user?.name || ((user?.email || '').split('@')[0]) || '') : '', email: i === 0 ? (user?.email || '') : '', phone: '' })));
        } else {
          setTeamSize(1);
          setMembers([{ name: (user?.name || ((user?.email || '').split('@')[0]) || ''), email: user?.email || '', phone: '' }]);
        }
      } catch (e) {
        const msg = e.response?.data?.message || e.message || 'Failed to load event';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isAuthenticated, user]);

  const constraints = useMemo(() => {
    const rd = event?.registrationDetails || {};
    const team = rd?.teamSize || { type: 'individual', value: 1, minValue: 1, maxValue: 1 };
    const teamAllowed = !!rd.teamParticipation && team.type !== 'individual';
    if (!teamAllowed) return { mode: 'individual' };
    if (team.type === 'fixed') return { mode: 'exact', exact: team.value || 1 };
    if (team.type === 'at_most') return { mode: 'range', min: 1, max: team.maxValue || team.value || 1 };
    if (team.type === 'at_least') return { mode: 'range', min: team.minValue || team.value || 1, max: 50 };
    // range
    return { mode: 'range', min: team.minValue || 1, max: team.maxValue || 50 };
  }, [event]);

  const isPast = useMemo(() => {
    if (!event) return false;
    return new Date(event.date) < new Date();
  }, [event]);

  useEffect(() => {
    // Keep members array length in sync with total team size (INCLUDING the registering user)
    const desired = Math.max(1, teamSize);
    setMembers((prev) => {
      const next = [...prev];
      if (desired > next.length) {
        while (next.length < desired) next.push({ name: '', email: '', phone: '' });
      } else if (desired < next.length) {
        next.length = desired;
      }
      return next;
    });
  }, [teamSize]);

  const validate = () => {
    if (!teamName.trim()) return 'Please enter a team name';
    if (!department.trim()) return 'Please enter a department';
    if (!year.trim()) return 'Please enter a year';
    // Require name, email, phone for ALL team members, including the registering user
    for (let i = 0; i < Math.max(1, teamSize); i++) {
      const m = members[i] || {};
      if (!m.name || !m.name.trim()) return `Please enter name for member ${i + 1}`;
      if (!m.email || !m.email.trim()) return `Please enter email for member ${i + 1}`;
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m.email)) return `Please enter a valid email for member ${i + 1}`;
      if (!m.phone || !m.phone.trim()) return `Please enter phone for member ${i + 1}`;
    }
    if (constraints.mode === 'exact' && teamSize !== constraints.exact) {
      return `Team size must be exactly ${constraints.exact}`;
    }
    if (constraints.mode === 'range') {
      if (teamSize < constraints.min || teamSize > constraints.max) {
        return `Team size must be between ${constraints.min} and ${constraints.max}`;
      }
    }
    if (isPast) return 'Registration is closed for this event';
    return '';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) { setFormError(v); return; }
    try {
      const payload = {
        eventId: id,
        department,
        year,
        teamName,
        // Send EXACT details for members (including registering user as first entry)
        teamMembers: members.map((m) => ({ name: m.name, email: m.email, phone: m.phone })),
      };
      const { data } = await api.post('/api/registrations/register', payload);
      const registrationId = data?.registration?._id || data?.registrationId || 'pending';
      navigate(`/payment/${registrationId}`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      setFormError(msg);
    }
  };

  if (loading) return <div className="container"><p>Loading event…</p></div>;
  if (error) return <div className="container"><p>{error}</p></div>;
  if (isAuthenticated && user?.role === 'admin') {
    return (
      <div className="container">
        <h2>Registration not allowed</h2>
        <p>Admin accounts cannot register for events. You can add, edit, or delete events from the Admin panel.</p>
        <div className="form-actions">
          <button className="btn-primary" onClick={() => navigate('/admin')}>Go to Admin</button>
          <button className="btn-secondary" onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>
    );
  }
  if (!event) return null;

  // Price calculation
  // - For main events: use basicRegistrationAmount
  // - For others: feePerHead (treated as total per team)
  const teamTotalFee = event?.isMainEvent
    ? Number(event?.basicRegistrationAmount || 0)
    : Number(event?.registrationDetails?.feePerHead || 0);

  // If main event does not have basic registration enabled, block UI
  if (event.isMainEvent && !event.basicRegistrationEnabled) {
    return (
      <div className="container">
        <h2>Registration Closed</h2>
        <p>Basic registration is not enabled for this main event.</p>
        <div className="form-actions">
          <button className="btn-secondary" onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>
    );
  }

  const eventDateStr = event?.date ? new Date(event.date).toLocaleDateString() : '';

  return (
    <div className="container register-page">
      <div className="register-split">
        {/* Left hero panel */}
        <div className="register-left">
          <div className="illustration" aria-hidden>
            <div className="calendar-art" />
          </div>
          <div className="event-chip card">
            <div className="event-title">{event.name}</div>
            <div className="event-meta">{eventDateStr}{event?.location ? ` • ${event.location}` : ''}</div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="register-right">
          <div className="form-header">
            <img className="brand" src="/logo192.png" alt="EventPortal" />
            <h2>Registration Form</h2>
          </div>

          {isPast && <p className="alert-warn">This event date has passed. Registration closed.</p>}
          {formError && <div className="alert-error">{formError}</div>}

          <form className="rg-form" onSubmit={onSubmit}>
            <div className="rg-grid">
              <label>Team Name
                <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Team Phoenix" />
              </label>

              {constraints.mode === 'individual' ? (
                <label>Team Size
                  <input value={1} readOnly />
                  <small>(including you)</small>
                </label>
              ) : constraints.mode === 'exact' ? (
                <label>Team Size (exact)
                  <input value={teamSize} readOnly />
                  <small>(must be exactly {constraints.exact}, including you)</small>
                </label>
              ) : (
                <label>Team Size
                  <input type="number" min={constraints.min} max={constraints.max} value={teamSize}
                         onChange={(e) => setTeamSize(parseInt(e.target.value || '0', 10))} />
                  <small>(min {constraints.min}, max {constraints.max}, including you)</small>
                </label>
              )}

              <label>Year
                <select value={year} onChange={(e) => setYear(e.target.value)}>
                  <option value="">Please select</option>
                  <option>1st</option>
                  <option>2nd</option>
                  <option>3rd</option>
                  <option>4th</option>
                </select>
              </label>

              <label>Department
                <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                  <option value="">Please select</option>
                  <option>CSE</option>
                  <option>IT</option>
                  <option>ECE</option>
                  <option>EEE</option>
                  <option>CIVIL</option>
                  <option>MECH</option>
                </select>
              </label>
            </div>

            <div className="members-block">
              <div className="block-title">Team Members (including you)</div>
              {members.map((m, idx) => (
                <div key={idx} className="member-card card">
                  <div className="member-title">Team Member {idx + 1} Details</div>
                  <div className="member-grid">
                    <label>Name
                      <input value={m.name} placeholder={`Member ${idx + 1} Name`}
                             onChange={(e) => { const arr = [...members]; arr[idx] = { ...arr[idx], name: e.target.value }; setMembers(arr); }} />
                    </label>
                    <label>Email
                      <input value={m.email} placeholder={`Member ${idx + 1} Email`}
                             onChange={(e) => { const arr = [...members]; arr[idx] = { ...arr[idx], email: e.target.value }; setMembers(arr); }} />
                    </label>
                    <label>Mobile No.
                      <input value={m.phone} placeholder={`Member ${idx + 1} Phone`}
                             onChange={(e) => { const arr = [...members]; arr[idx] = { ...arr[idx], phone: e.target.value }; setMembers(arr); }} />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="amount-row">
              <div className="amount">Amount: ₹{teamTotalFee} <span>(team total)</span></div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={isPast}>Proceed to Payment</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
