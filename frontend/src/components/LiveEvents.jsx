import React, { useEffect, useRef, useState } from 'react';
import useAuthStore from '../store/authStore';
import fetchWithLoading from '../utils/fetcher';
import SkeletonCard from './SkeletonCard/SkeletonCard';
import './LiveEvents.css';

const LiveEvents = () => {
  const { isAuthenticated, user, token } = useAuthStore();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeredIds, setRegisteredIds] = useState(new Set());
  const [status, setStatus] = useState('upcoming');
  const [timeframe, setTimeframe] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const popRef = useRef(null);

  // Determine visual status for a card
  const getEventStatus = (ev) => {
    const now = new Date();
    const evDate = ev?.date ? new Date(ev.date) : null;
    if (!evDate) return 'upcoming';
    // If date is the same day and time not tracked as live on backend, we still label upcoming vs ended
    if (evDate.toDateString() === now.toDateString()) return 'live';
    return evDate < now ? 'ended' : 'upcoming';
  };

  const formatDate = (ev) => {
    try {
      const d = ev?.date ? new Date(ev.date) : null;
      if (!d) return '';
      const dateStr = d.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
      const timeStr = (ev?.time || '').trim();
      return timeStr ? `${dateStr} • ${timeStr}` : dateStr;
    } catch {
      return '';
    }
  };

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('status', status);
    params.set('isMainEvent', 'false'); // show only sub-events
    params.set('includeRegCount', 'true');
    if (status === 'upcoming' && ['today', 'this_week', 'this_month'].includes(timeframe)) {
      params.set('timeframe', timeframe);
    }
    setLoading(true);
    fetchWithLoading(`${process.env.REACT_APP_API_URL}/api/events?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [status, timeframe]);

  // Fetch user's registered events (completed or valid pending) and cache their event IDs
  useEffect(() => {
    if (!isAuthenticated) { setRegisteredIds(new Set()); return; }
    let mounted = true;
    const headers = { 'accept': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    fetchWithLoading(`${process.env.REACT_APP_API_URL}/api/registrations/my-events`, { headers })
      .then((r) => r.ok ? r.json() : [])
      .then((regs) => {
        if (!mounted) return;
        const ids = new Set();
        if (Array.isArray(regs)) {
          regs.forEach((r) => {
            const evId = r?.eventId?._id || r?.eventId; // eventId may be populated or raw id
            if (evId) ids.add(String(evId));
          });
        }
        setRegisteredIds(ids);
      })
      .catch(() => setRegisteredIds(new Set()));
    return () => { mounted = false; };
  }, [isAuthenticated, user?._id, token]);

  // Close filters popover on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (!popRef.current) return;
      if (!popRef.current.contains(e.target)) setFiltersOpen(false);
    };
    if (filtersOpen) document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [filtersOpen]);

  if (!isAuthenticated) return null;

  return (
    <section className="live-events">
      <div className="section-header">
        <div className="filters" style={{ position: 'relative' }} ref={popRef}>
          <button className="filter-btn" onClick={() => setFiltersOpen((v) => !v)} aria-haspopup="true" aria-expanded={filtersOpen} title="Filters">
            {/* Funnel icon (inline SVG) */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 6 }}>
              <path d="M3 5h18l-7 8v5l-4 2v-7L3 5z" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
            Filter
          </button>
          {filtersOpen && (
            <div className="filter-popover">
              <div className="filter-group">
                <div className="filter-title">Status</div>
                <label><input type="radio" name="status" value="upcoming" checked={status === 'upcoming'} onChange={(e) => setStatus(e.target.value)} /> Upcoming</label>
                <label><input type="radio" name="status" value="live" checked={status === 'live'} onChange={(e) => setStatus(e.target.value)} /> Live</label>
                <label><input type="radio" name="status" value="ended" checked={status === 'ended'} onChange={(e) => setStatus(e.target.value)} /> Ended</label>
              </div>
              {status !== 'live' && (
                <div className="filter-group">
                  <div className="filter-title">Timeframe</div>
                  <label><input type="radio" name="timeframe" value="all" checked={timeframe === 'all'} onChange={(e) => setTimeframe(e.target.value)} /> All</label>
                  <label><input type="radio" name="timeframe" value="today" checked={timeframe === 'today'} onChange={(e) => setTimeframe(e.target.value)} /> Today</label>
                  <label><input type="radio" name="timeframe" value="this_week" checked={timeframe === 'this_week'} onChange={(e) => setTimeframe(e.target.value)} /> This Week</label>
                  <label><input type="radio" name="timeframe" value="this_month" checked={timeframe === 'this_month'} onChange={(e) => setTimeframe(e.target.value)} /> This Month</label>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button className="btn-secondary" onClick={() => setFiltersOpen(false)}>Done</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="events-card-grid">
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={`sk-live-${i}`} />
        ))}

        {!loading && events.map((ev) => {
          const evStatus = getEventStatus(ev);
          const dateText = formatDate(ev);
          const isRegistered = registeredIds.has(String(ev._id));

          // Check eligibility based on department (case-insensitive)
          const eligibleDepts = ev.eligibleDepartments || [];
          const userDept = user?.department;
          const isEligible = eligibleDepts.length === 0 || (userDept && eligibleDepts.some(dept =>
            dept.trim().toLowerCase() === userDept.trim().toLowerCase()
          ));

          return (
            <div
              className="event-card-clean"
              key={ev._id}
            >
              <div className="event-card-header">
                <div className="event-badges">
                  {!isEligible && (
                    <span className="badge-not-eligible">Not Eligible</span>
                  )}
                  {isRegistered ? (
                    <span className="badge-registered">Registered</span>
                  ) : (
                    <span className={`badge-status badge-${evStatus}`}>
                      {evStatus === 'live' ? 'Live' : evStatus === 'upcoming' ? 'Upcoming' : 'Ended'}
                    </span>
                  )}
                </div>
              </div>

              <div className="event-card-content">
                <h3 className="event-card-title">{ev.name}</h3>

                <div className="event-details-list">
                  <div className="detail-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="5" width="18" height="16" rx="2" stroke="#14b8a6" strokeWidth="1.5" />
                      <path d="M8 3v4M16 3v4M3 10h18" stroke="#14b8a6" strokeWidth="1.5" />
                    </svg>
                    <span>{dateText}</span>
                  </div>

                  <div className="detail-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="9" stroke="#14b8a6" strokeWidth="1.5" />
                      <path d="M12 6v6l4 2" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span>{ev.time || 'TBA'}</span>
                  </div>

                  <div className="detail-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" stroke="#14b8a6" strokeWidth="1.5" fill="none" />
                      <circle cx="12" cy="10" r="2.5" stroke="#14b8a6" strokeWidth="1.5" />
                    </svg>
                    <span>{ev.location || 'TBA'}</span>
                  </div>

                  <div className="detail-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span>{ev.registrationCount || 0} registered</span>
                  </div>
                </div>

                {!isEligible && eligibleDepts.length > 0 && (
                  <div className="eligible-info">
                    Eligible: {eligibleDepts.join(', ')}
                  </div>
                )}

                <a
                  className="btn-view-details"
                  href={`/events/${ev._id}`}
                >
                  View Details
                </a>
              </div>
            </div>
          );
        })}

        {!loading && events.length === 0 && (
          <p>No events found.</p>
        )}
      </div>
    </section>
  );
};

export default LiveEvents;



