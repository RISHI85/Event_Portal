import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import SkeletonCard from '../components/SkeletonCard/SkeletonCard';
import '../components/SkeletonCard/SkeletonCard.css';
import CertificateTemplate from '../components/CertificateTemplate';

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
    <div className="container">
      <h2>My Events</h2>
      {loading && (
        <div className="grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={`sk-my-${i}`} />
          ))}
        </div>
      )}

      {/* Certificate Modal */}
      {certReg && (
        <div className="modal" onClick={() => setCertReg(null)}>
          <div className="modal-card" style={{ maxWidth: 1200 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>Your Certificate</h3>
                <div className="muted" style={{ marginTop: 4 }}>{certReg.eventId?.name}</div>
              </div>
              <button className="nav-link" onClick={() => setCertReg(null)}>✕</button>
            </div>
            <div style={{ marginTop: 12 }}>
              {/* Intentionally do not expose prev/next or other members */}
              {(() => {
                const storeUser = useAuthStore.getState().user;
                const uEmail = (storeUser?.email || '').toLowerCase();
                const names = Array.isArray(certReg._participantNames) ? certReg._participantNames : [];
                const emails = Array.isArray(certReg._participantEmails) ? certReg._participantEmails : [];
                let displayName = (storeUser?.name && String(storeUser.name).trim())
                  ? storeUser.name
                  : ((storeUser?.email || '').split('@')[0] || 'Participant');
                if (uEmail) {
                  const idx = emails.findIndex((e) => (e || '').toLowerCase() === uEmail);
                  if (idx >= 0 && names[idx]) displayName = names[idx];
                }
                const downloadName = `${(certReg.eventId?.name || 'event').replace(/\s+/g,'_')}_${(displayName || 'participant').replace(/\s+/g,'_')}`;
                return (
                  <CertificateTemplate
                    participantName={displayName}
                    teamName={certReg.teamName || ''}
                    eventName={certReg.eventId?.name || 'Event'}
                    dateText={certReg.eventId?.date ? new Date(certReg.eventId.date).toLocaleDateString() : ''}
                    organizerText={certReg.eventId?.certificateOrganizer || ''}
                    awardText={certReg.eventId?.certificateAwardText || 'Certificate of Participation'}
                    accentColor={'#111827'}
                    primaryColor={'#2563EB'}
                    bgPattern={certReg.eventId?.certificateTemplateUrl || ''}
                    issuerName={'GMRIT'}
                    logoUrl={certReg.eventId?.imageUrl || ''}
                    headerLogoUrl={'/images/gmrit_logo.png'}
                    showSeal={true}
                    sealSize={84}
                    sealText={'Official'}
                    downloadBaseName={downloadName}
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}
      {error && !loading && <p style={{ color: 'crimson' }}>{error}</p>}
      {!loading && (
        <div className="grid">
          {viewItems.map((r) => (
            <div className="card" key={r._id}>
              <div className="card-body">
                <h3>{r.eventId?.name || '—'}</h3>
                <p>{formatDate(r.eventId?.date)} • {r.eventId?.time || '-'}</p>
                <p>{r.eventId?.location || '-'}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                  <span className={`badge ${r.paymentStatus === 'completed' ? 'success' : r.paymentStatus === 'pending' ? 'warning' : 'info'}`}>
                    {r.paymentStatus || 'unknown'}
                  </span>
                  <small>Payment status</small>
                  {r.paymentStatus === 'pending' && typeof r.pendingRemainingMin === 'number' && (
                    <small style={{ color: '#8a6d3b' }}>
                      Complete in ~{r.pendingRemainingMin} min
                    </small>
                  )}
                </div>

                {/* Registration details */}
                <div style={{ marginTop: 8, color: '#374151' }}>
                  <p style={{ margin: '2px 0' }}>Amount paid: ₹{r.totalFee ?? 0}</p>
                  {r.teamName && <p style={{ margin: '2px 0' }}>Team: {r.teamName}</p>}
                  <p style={{ margin: '2px 0' }}>Team size: {r.teamSize}</p>
                </div>

                {/* Feedback button for past events with completed payment */}
                {r.paymentStatus === 'completed' && r.eventPast && (
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {r.hasFeedback ? (
                      <span className="badge success">Feedback done</span>
                    ) : (
                      <button className="btn" onClick={() => openFeedback(r)}>
                        Give Feedback
                      </button>
                    )}
                    <button
                      className="btn btn-light"
                      onClick={() => {
                        // Only show the currently logged-in user's certificate
                        setCertIndex(0);
                        setCertReg(r);
                      }}
                    >
                      Certificate
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {viewItems.length === 0 && !loading && <p>No registrations yet.</p>}
        </div>
      )}

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
