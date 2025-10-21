import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import fetchWithLoading from '../utils/fetcher';
import useAuthStore from '../store/authStore';
import Breadcrumb from '../components/Breadcrumb';
import ShareButtons from '../components/ShareButtons';
import CountdownTimer from '../components/CountdownTimer';
import AddToCalendar from '../components/AddToCalendar';
// import SimilarEvents from '../components/SimilarEvents'; // TODO: Uncomment to enable similar events
import EventFAQ from '../components/EventFAQ';
import './EventDetails.css';

const statusFromDate = (date) => {
  const now = new Date();
  const d = date ? new Date(date) : null;
  if (!d) return 'Open';
  if (d < now) return 'Ended';
  if (d.toDateString() === now.toDateString()) return 'Live';
  return 'Open';
};

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, token, user } = useAuthStore();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasBasicRegistration, setHasBasicRegistration] = useState(true);
  const [parentEventName, setParentEventName] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchWithLoading(`/api/events/${id}`)
      .then((r) => r.json())
      .then((data) => { if (mounted) setEvent(data); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [id]);

  // Determine if the current user has registered for this event
  useEffect(() => {
    if (!isAuthenticated) { 
      setIsRegistered(false);
      setHasBasicRegistration(true);
      return;
    }
    let mounted = true;
    const headers = { accept: 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    fetchWithLoading('/api/registrations/my-events', { headers })
      .then(r => r.ok ? r.json() : [])
      .then(list => {
        if (!mounted) return;
        const setIds = new Set();
        if (Array.isArray(list)) {
          list.forEach(r => {
            const evId = r?.eventId?._id || r?.eventId;
            if (evId && r?.paymentStatus === 'completed') setIds.add(String(evId));
          });
        }
        setIsRegistered(setIds.has(String(id)));
        
        // Check if this is a Stepcone sub-event and if user has basic registration
        // Only Stepcone events require basic registration, not student chapter events
        if (event && !event.isMainEvent && event.parentEvent) {
          // Fetch parent event to check if it's Stepcone
          fetchWithLoading(`/api/events/${event.parentEvent}`)
            .then(r => r.json())
            .then(parentData => {
              if (!mounted) return;
              
              // Check if parent event name contains "stepcone" (case-insensitive)
              const isStepconeEvent = parentData.name && 
                parentData.name.toLowerCase().includes('stepcone');
              
              if (isStepconeEvent) {
                // Only check basic registration for Stepcone events
                const hasBasic = setIds.has(String(event.parentEvent));
                setHasBasicRegistration(hasBasic);
                if (!hasBasic) {
                  setParentEventName(parentData.name || 'Main Event');
                }
              } else {
                // Student chapter events don't need basic registration
                setHasBasicRegistration(true);
              }
            })
            .catch(() => {
              // On error, assume no basic registration needed
              setHasBasicRegistration(true);
            });
        }
      })
      .catch(() => {
        setIsRegistered(false);
        setHasBasicRegistration(true);
      });
    return () => { mounted = false; };
  }, [id, isAuthenticated, token, user?._id, event]);

  if (loading) {
    return (
      <section className="event-details container">
        <div className="ed-grid">
          <div className="ed-media skeleton" />
          <div className="ed-panel skeleton" />
        </div>
      </section>
    );
  }

  if (!event) return <section className="event-details container"><p>Event not found.</p></section>;

  const dateStr = event?.date ? new Date(event.date).toLocaleDateString() : 'TBA';
  const timeStr = event?.time || '';
  const location = event?.location || 'TBA';
  const status = statusFromDate(event?.date);
  const dept = event?.department || '—';
  const faculty = event?.adminContacts?.[0]?.name || '—';
  const student = event?.adminContacts?.[1]?.name || '—';
  const type = event?.registrationDetails?.teamParticipation ? 'Team Event' : 'Individual Event';
  
  // Check eligibility based on department (case-insensitive)
  const eligibleDepts = event?.eligibleDepartments || [];
  const userDept = user?.department;
  const isEligible = eligibleDepts.length === 0 || (userDept && eligibleDepts.some(dept => 
    dept.trim().toLowerCase() === userDept.trim().toLowerCase()
  ));
  const isAdmin = user?.role === 'admin';

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Events', path: '/explore-events' },
    { label: event.name, path: `/events/${id}` }
  ];

  return (
    <section className="event-details container">
      <Breadcrumb items={breadcrumbItems} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div></div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <AddToCalendar event={event} />
          <ShareButtons 
            url={window.location.href}
            title={event.name}
            description={event.description}
          />
        </div>
      </div>

      {/* Countdown Timer for upcoming events */}
      {event.date && new Date(event.date) > new Date() && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <CountdownTimer targetDate={event.date} />
        </div>
      )}

      <div className="ed-grid">
        <div className="ed-media">
          {event?.imageUrl ? (
            <img className="ed-img" src={event.imageUrl} alt={event.name} />
          ) : (
            <div className="ed-placeholder">
              <span className="emoji">🎯</span>
            </div>
          )}
        </div>

        <div 
          className="ed-panel"
        >
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
            <h1 className="ed-title" style={{marginBottom:0}}>{event.name}</h1>
            {!isEligible && (
              <span 
                className="status-pill" 
                style={{
                  background:'#6b7280',
                  color:'white',
                  fontWeight:'bold'
                }}
              >
                Not Eligible
              </span>
            )}
            {isRegistered && (
              <span className="status-pill" style={{background:'#e0f2fe',color:'#0284c7'}}>Registered</span>
            )}
          </div>

          <div className="ed-meta">
            <span className="meta-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span>{dateStr}</span>
            </span>
            {timeStr && (
              <span className="meta-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <span>{timeStr}</span>
              </span>
            )}
          </div>

          <div className="ed-sub">
            <span className="meta-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span>{location}</span>
            </span>
            <span className={`status-pill status-${status.toLowerCase()}`}>{status}</span>
          </div>

          <hr className="ed-sep" />

          <div className="ed-block">
            <h3 className="ed-subtitle">About This Event</h3>
            <ul className="ed-desc-list">
              {event.description && String(event.description).split(/[.!?]\s+/).filter(s => s.trim()).map((point, idx) => (
                <li key={idx}>{point.trim()}</li>
              ))}
            </ul>
          </div>

          <div className="ed-info">
            <div className="row"><span className="key">Department</span><span className="val">{dept}</span></div>
            <div className="row"><span className="key">Faculty Coordinator</span><span className="val">{faculty}</span></div>
            <div className="row"><span className="key">Student Coordinator</span><span className="val">{student}</span></div>
            <div className="row"><span className="key">Event Type</span><span className="val">{type}</span></div>
            {eligibleDepts.length > 0 && (
              <div className="row">
                <span className="key">Eligible Departments</span>
                <span className="val" style={{color: !isEligible ? '#4b5563' : undefined, fontWeight: !isEligible ? 'bold' : undefined}}>
                  {eligibleDepts.join(', ')}
                </span>
              </div>
            )}
          </div>

          {!isEligible && eligibleDepts.length > 0 && (
            <div style={{
              background: '#f3f4f6',
              border: '2px solid #d1d5db',
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
              color: '#4b5563',
              fontWeight: 500,
              fontSize: '0.9rem'
            }}>
              ⚠️ You are not eligible for this event. Your department ({userDept || 'Not set'}) is not in the eligible departments list.
            </div>
          )}

          {!hasBasicRegistration && !event.isMainEvent && (
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              border: '2px solid #f59e0b',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: 12 }}>
                <span style={{ fontSize: 28 }}>⚠️</span>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', color: '#92400e', fontSize: 16, fontWeight: 700 }}>
                    Basic Registration Required
                  </h3>
                  <p style={{ margin: '0 0 10px 0', color: '#78350f', fontSize: 14, lineHeight: 1.5 }}>
                    You must complete basic registration for <strong>"{parentEventName}"</strong> before registering for this sub-event.
                  </p>
                  <button
                    onClick={() => {
                      // Navigate to parent event registration with return URL
                      if (event.parentEvent) {
                        navigate(`/events/${event.parentEvent}/register?returnTo=${encodeURIComponent(`/events/${event._id}/register`)}`);
                      } else {
                        navigate('/events');
                      }
                    }}
                    style={{
                      background: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)'
                    }}
                  >
                    Register for {parentEventName}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="ed-actions">
            {!isAdmin && !isRegistered && !isEligible && (
              <button 
                className="btn-primary-grad" 
                disabled 
                style={{
                  background: '#6b7280',
                  opacity: 0.6,
                  cursor: 'not-allowed'
                }}
                title="You are not eligible for this event"
              >
                Not Eligible to Register
              </button>
            )}
            {!isAdmin && !isRegistered && isEligible && hasBasicRegistration && (
              <a className="btn-primary-grad" href={`/events/${event._id}/register`}>Register Now</a>
            )}
            {!isAdmin && !isRegistered && isEligible && !hasBasicRegistration && (
              <button 
                className="btn-primary-grad" 
                disabled 
                style={{
                  background: '#f59e0b',
                  opacity: 0.6,
                  cursor: 'not-allowed'
                }}
                title="Complete basic registration first"
              >
                Basic Registration Required
              </button>
            )}
            {!isAdmin && isRegistered && (
              <button className="btn-outline" disabled style={{opacity:.8, cursor:'default'}}>Registered</button>
            )}
            <button className="btn-outline" onClick={() => navigate(-1)}>Go Back</button>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container" style={{ marginTop: '40px', marginBottom: '60px' }}>
        <EventFAQ event={event} />
      </div>

      {/* Similar Events Section - COMMENTED OUT */}
      {/* TODO: Uncomment to enable similar events */}
      {/* <div className="container" style={{ marginTop: '40px', marginBottom: '60px' }}>
        <SimilarEvents 
          currentEventId={event._id} 
          department={event.department}
          category={event.category}
        />
      </div> */}
    </section>
  );
}
