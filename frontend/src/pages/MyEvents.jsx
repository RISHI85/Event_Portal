import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import SkeletonCard from '../components/SkeletonCard/SkeletonCard';
import '../components/SkeletonCard/SkeletonCard.css';
import CertificateTemplate from '../components/CertificateTemplate';
import './MyEvents.css';

const MyEvents = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myFeedbackEventIds, setMyFeedbackEventIds] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [activeEvent, setActiveEvent] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [certReg, setCertReg] = useState(null);
  const [certIndex, setCertIndex] = useState(0); // no longer used for navigation; kept for minimal change
  const [filter, setFilter] = useState('all'); // 'all', 'completed', 'upcoming'
  const winRefs = useRef({});
  const firedWinIdsRef = useRef(new Set());

  // Fetch registrations
  useEffect(() => {
    // Admins cannot register; skip loading
    if (isAuthenticated && user?.role === 'admin') { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/api/registrations/my-events');
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        setError('Failed to load your events.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated, user]);

  // Fetch user's submitted feedback to disable re-submission
  useEffect(() => {
    const loadMyFeedback = async () => {
      try {
        const { data } = await api.get('/api/feedback/my-feedback');
        const ids = new Set(
          (Array.isArray(data) ? data : [])
            .filter((fb) => fb?.eventId?._id)
            .map((fb) => fb.eventId._id)
        );
        setMyFeedbackEventIds(ids);
      } catch (e) {
        // Optional: silently ignore; this enrichment is not critical
      }
    };
    loadMyFeedback();
  }, []);

  // Helper: safe date format
  const formatDate = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '-';
    return dt.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Compute enriched view models
  const viewItems = useMemo(() => {
    const now = Date.now();
    const deriveParticipantName = (r) => {
      if (r.teamName) return r.teamName;
      const firstMember = Array.isArray(r.teamMembers) && r.teamMembers.find(m => m?.name);
      if (firstMember) return firstMember.name;
      if (user?.name && String(user.name).trim()) return user.name;
      const email = user?.email || '';
      if (email) return email.split('@')[0];
      return 'Participant';
    };
    // Filter out anything without a valid event and date
    const valid = items.filter((r) => {
      if (!r?.eventId) return false;
      const dt = new Date(r.eventId.date);
      return !Number.isNaN(dt.getTime());
    });

    return valid.map((r) => {
      const eventDate = new Date(r.eventId.date);
      const eventPast = eventDate.getTime() < now;
      const registeredAt = r?.registeredAt ? new Date(r.registeredAt) : null;
      // Remaining time hint for pending (client-only; backend enforces TTL)
      let pendingRemainingMin = null;
      if (r.paymentStatus === 'pending' && registeredAt) {
        const ttl = 5; // minutes; align with backend env
        const passed = (now - registeredAt.getTime()) / (1000 * 60);
        pendingRemainingMin = Math.max(0, Math.ceil(ttl - passed));
      }
      const teamSize = Array.isArray(r.teamMembers) && r.teamMembers.length > 0 ? r.teamMembers.length : 1;
      const hasFeedback = r?.eventId?._id ? myFeedbackEventIds.has(r.eventId._id) : false;
      // Build participant arrays from stored registration team members (includes leader)
      const membersArr = Array.isArray(r.teamMembers) ? r.teamMembers : [];
      const participantNames = membersArr.map(m => (m?.name && String(m.name).trim()) ? m.name : ((m?.email || '').split('@')[0] || 'Member'));
      const participantEmails = membersArr.map(m => (m?.email || '').toLowerCase());
      return { ...r, eventDate, eventPast, pendingRemainingMin, teamSize, hasFeedback, _derivedName: deriveParticipantName(r), _participantNames: participantNames, _participantEmails: participantEmails };
    });
  }, [items, myFeedbackEventIds, user]);

  // Confetti per winning card: fire when the card becomes visible
  useEffect(() => {
    const loadScript = (src) => new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.async = true; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
    const ensureConfetti = async () => {
      if (window.confetti) return window.confetti;
      const cdns = [
        'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js',
        'https://unpkg.com/canvas-confetti@1.6.0/dist/confetti.browser.min.js',
      ];
      for (const url of cdns) {
        try { await loadScript(url); if (window.confetti) break; } catch (_) {}
      }
      return window.confetti || null;
    };
    const inViewport = (el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0 && r.left < window.innerWidth && r.right > 0;
    };
    const fireAtEl = async (el) => {
      const confetti = await ensureConfetti();
      if (!confetti || !el) return;
      const rect = el.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      const burst = (opts) => confetti({ particleCount: 100, spread: 80, origin: { x, y }, ...opts });
      burst();
      setTimeout(() => burst({ particleCount: 140, spread: 100 }), 300);
    };

    const checkAndFire = () => {
      (Array.isArray(items) ? items : [])
        .filter((r) => r?.winnerStatus && r.winnerStatus !== 'none')
        .forEach((r) => {
          const id = String(r._id || r.eventId?._id || Math.random());
          if (firedWinIdsRef.current.has(id)) return;
          let el = winRefs.current[id];
          if (!el) {
            el = document.querySelector(`[data-reg-id="${CSS.escape(id)}"][data-win="true"]`);
            if (el) winRefs.current[id] = el;
          }
          if (el && inViewport(el)) {
            firedWinIdsRef.current.add(id);
            fireAtEl(el);
          }
        });
    };

    // Run after paint so refs have a chance to attach
    setTimeout(checkAndFire, 0);
    const onScroll = () => checkAndFire();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [items]);

  const openFeedback = (reg) => {
    setActiveEvent(reg);
    setRating(0);
    setReview('');
    setShowModal(true);
  };

  const submitFeedback = async () => {
    if (!activeEvent?.eventId?._id || rating < 1) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post('/api/feedback', {
        eventId: activeEvent.eventId._id,
        rating,
        review,
      });
      setShowModal(false);
      // Mark this event as feedback-submitted to disable the button immediately
      setMyFeedbackEventIds((prev) => {
        const next = new Set(prev);
        next.add(activeEvent.eventId._id);
        return next;
      });
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate stats (MUST be before any conditional returns)
  const totalEvents = viewItems.length;
  const completedEvents = viewItems.filter(r => r.paymentStatus === 'completed' && r.eventPast).length;
  const upcomingEvents = viewItems.filter(r => !r.eventPast && r.paymentStatus === 'completed').length;
  const totalWon = useMemo(() => {
    try {
      const regs = Array.isArray(viewItems) ? viewItems : [];
      return regs.reduce((sum, r) => {
        const status = r?.winnerStatus || 'none';
        const ev = r?.eventId || {};
        if (status === 'winner') return sum + Number(ev.winnerPrize || 0);
        if (status === 'runner') return sum + Number(ev.runnerPrize || 0);
        return sum;
      }, 0);
    } catch { return 0; }
  }, [viewItems]);

  // Filter events based on selected filter (MUST be before any conditional returns)
  const filteredItems = useMemo(() => {
    if (filter === 'completed') {
      return viewItems.filter(r => r.eventPast);
    } else if (filter === 'upcoming') {
      return viewItems.filter(r => !r.eventPast);
    }
    return viewItems;
  }, [viewItems, filter]);

  // Access restriction for admins
  if (isAuthenticated && user?.role === 'admin') {
    return (
      <div className="container">
        <h2>My Events</h2>
        <p>Admin accounts do not have registrations. Use the Admin panel to manage events.</p>
      </div>
    );
  }

  return (
    <div className="my-events-page">
      {/* Hero Section */}
      <div className="my-events-hero">
        <div className="my-events-container">
          <div className="hero-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#14b8a6" stroke="#14b8a6" strokeWidth="1.5" />
            </svg>
            <span>Your Event Dashboard</span>
          </div>
          <h1 className="hero-title">Track, manage, and celebrate your event journey all in one place</h1>
        </div>
      </div>

      {/* Stats Section */}
      <div className="my-events-container">
        <div className="stats-grid">
          <div 
            className={`stat-card ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
            style={{ cursor: 'pointer', transition: 'all 0.3s' }}
          >
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">Total Events</div>
              <div className="stat-value">{totalEvents}</div>
            </div>
          </div>

          <div 
            className={`stat-card ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
            style={{ cursor: 'pointer', transition: 'all 0.3s' }}
          >
            <div className="stat-icon success">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">Completed</div>
              <div className="stat-value">{completedEvents}</div>
            </div>
          </div>

          <div 
            className={`stat-card ${filter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setFilter('upcoming')}
            style={{ cursor: 'pointer', transition: 'all 0.3s' }}
          >
            <div className="stat-icon warning">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">Upcoming</div>
              <div className="stat-value">{upcomingEvents}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon primary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">Total Won</div>
              <div className="stat-value">₹{totalWon}</div>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {loading && (
          <div className="events-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={`sk-my-${i}`} />
            ))}
          </div>
        )}

        {error && !loading && <p style={{ color: 'crimson', marginTop: 24 }}>{error}</p>}

        {!loading && viewItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <p>No registrations yet. Start exploring events!</p>
          </div>
        )}

        {!loading && viewItems.length > 0 && filteredItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <p>No {filter} events found.</p>
          </div>
        )}

        {!loading && filteredItems.length > 0 && (
          <div className="events-grid">
            {filteredItems.map((r) => (
              <div
                className="event-card"
                key={r._id}
                ref={(el) => {
                  // Track only winning/runner cards for confetti targeting
                  const isWin = r?.winnerStatus && r.winnerStatus !== 'none';
                  if (!isWin) return;
                  const id = String(r._id || r.eventId?._id || '');
                  if (id) winRefs.current[id] = el;
                }}
                data-reg-id={String(r._id || '')}
                data-win={r?.winnerStatus && r.winnerStatus !== 'none' ? 'true' : undefined}
              >
                <div className="event-card-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
                  <h3 className="event-title">{r.eventId?.name || '—'}</h3>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                    <span className={`status-badge ${r.paymentStatus === 'completed' ? 'completed' : r.paymentStatus === 'pending' ? 'pending' : ''}`}>
                      {r.paymentStatus === 'completed' ? 'Payment Completed' : r.paymentStatus === 'pending' ? 'Pending' : r.paymentStatus}
                    </span>
                    {r.winnerStatus && r.winnerStatus !== 'none' && (
                      <span
                        className="status-badge"
                        style={{
                          background: r.winnerStatus === 'winner' ? '#22c55e' : '#f59e0b',
                          color: '#fff'
                        }}
                        aria-label={r.winnerStatus === 'winner' ? 'Winner' : 'Runner-up'}
                        title={r.winnerStatus === 'winner' ? 'Winner' : 'Runner-up'}
                      >
                        {r.winnerStatus === 'winner' ? 'Winner' : 'Runner-up'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="event-details">
                  <div className="detail-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span>{formatDate(r.eventId?.date)} • {r.eventId?.time || '-'}</span>
                  </div>

                  <div className="detail-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span>{r.eventId?.location || '-'}</span>
                  </div>

                  <div className="detail-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span>Amount paid: ₹{r.totalFee ?? 0}</span>
                  </div>

                  {r.teamName && (
                    <div className="detail-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span>Team: {r.teamName} • Size: {r.teamSize}</span>
                    </div>
                  )}
                </div>

                {r.paymentStatus === 'completed' && r.eventPast && (
                  <div className="event-actions">
                    <button 
                      className="action-btn feedback-btn"
                      onClick={() => openFeedback(r)}
                      disabled={r.hasFeedback}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      {r.hasFeedback ? 'Feedback Submitted' : 'Feedback'}
                    </button>
                    <button 
                      className="action-btn certificate-btn"
                      onClick={() => {
                        // Open certificate in new tab
                        const storeUser = useAuthStore.getState().user;
                        const uEmail = (storeUser?.email || '').toLowerCase();
                        const names = Array.isArray(r._participantNames) ? r._participantNames : [];
                        const emails = Array.isArray(r._participantEmails) ? r._participantEmails : [];
                        let displayName = (storeUser?.name && String(storeUser.name).trim())
                          ? storeUser.name
                          : ((storeUser?.email || '').split('@')[0] || 'Participant');
                        if (uEmail) {
                          const idx = emails.findIndex((e) => (e || '').toLowerCase() === uEmail);
                          if (idx >= 0 && names[idx]) displayName = names[idx];
                        }
                        
                        // Create certificate data
                        const certData = {
                          participantName: displayName,
                          teamName: r.teamName || '',
                          eventName: r.eventId?.name || 'Event',
                          dateText: r.eventId?.date ? new Date(r.eventId.date).toLocaleDateString() : '',
                          organizerText: r.eventId?.certificateOrganizer || '',
                          awardText: r.eventId?.certificateAwardText || 'Certificate of Participation',
                          eventTimings: r.eventId?.timings || null,
                          certificateId: `CERT-${(r._id || '').slice(-6).toUpperCase() || 'XXXXXX'}`,
                          leftSigner: r.eventId?.certificateOrganizer || 'Organizer',
                          rightSigner: 'Registrar',
                        };
                        
                        // Store in sessionStorage and open new tab
                        sessionStorage.setItem('certificateData', JSON.stringify(certData));
                        window.open('/certificate-view', '_blank');
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                      </svg>
                      Certificate
                    </button>
                  </div>
                )}

                {r.paymentStatus === 'pending' && typeof r.pendingRemainingMin === 'number' && (
                  <div className="pending-warning">
                    ⚠️ Complete payment in ~{r.pendingRemainingMin} min
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>


      {/* Feedback Modal */}
      {showModal && (
        <div className="modal" onClick={() => !submitting && setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Rate the event</h3>
            <p style={{ marginTop: -8, color: '#666' }}>{activeEvent?.eventId?.name}</p>
            <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
              {[1,2,3,4,5].map((s) => (
                <span
                  key={s}
                  onClick={() => setRating(s)}
                  style={{
                    cursor: 'pointer',
                    fontSize: 24,
                    color: s <= rating ? '#f59e0b' : '#d1d5db',
                    userSelect: 'none'
                  }}
                >
                  ★
                </span>
              ))}
            </div>
            <textarea
              placeholder="Tell us about your experience (optional)"
              rows={4}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              style={{ width: '100%', padding: 8 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="btn btn-light" disabled={submitting} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn" disabled={submitting || rating < 1} onClick={submitFeedback}>
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyEvents;
