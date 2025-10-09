import React, { useEffect, useRef, useState } from 'react';
import useAuthStore from '../store/authStore';
import fetchWithLoading from '../utils/fetcher';
import SkeletonCard from './SkeletonCard/SkeletonCard';

const LiveEvents = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('upcoming');
  const [timeframe, setTimeframe] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const popRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('status', status);
    if (status === 'upcoming' && ['today', 'this_week', 'this_month'].includes(timeframe)) {
      params.set('timeframe', timeframe);
    }
    setLoading(true);
    fetchWithLoading(`/api/events?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [status, timeframe]);

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
        <h2>Live Events</h2>
        <div className="filters" style={{ position: 'relative' }} ref={popRef}>
          <button className="filter-btn" onClick={() => setFiltersOpen((v) => !v)} aria-haspopup="true" aria-expanded={filtersOpen} title="Filters">
            {/* Funnel icon (inline SVG) */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight:6}}>
              <path d="M3 5h18l-7 8v5l-4 2v-7L3 5z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
            Filter
          </button>
          {filtersOpen && (
            <div className="filter-popover">
              <div className="filter-group">
                <div className="filter-title">Status</div>
                <label><input type="radio" name="status" value="upcoming" checked={status==='upcoming'} onChange={(e)=>setStatus(e.target.value)} /> Upcoming</label>
                <label><input type="radio" name="status" value="live" checked={status==='live'} onChange={(e)=>setStatus(e.target.value)} /> Live</label>
                <label><input type="radio" name="status" value="ended" checked={status==='ended'} onChange={(e)=>setStatus(e.target.value)} /> Ended</label>
              </div>
              {status !== 'live' && (
                <div className="filter-group">
                  <div className="filter-title">Timeframe</div>
                  <label><input type="radio" name="timeframe" value="all" checked={timeframe==='all'} onChange={(e)=>setTimeframe(e.target.value)} /> All</label>
                  <label><input type="radio" name="timeframe" value="today" checked={timeframe==='today'} onChange={(e)=>setTimeframe(e.target.value)} /> Today</label>
                  <label><input type="radio" name="timeframe" value="this_week" checked={timeframe==='this_week'} onChange={(e)=>setTimeframe(e.target.value)} /> This Week</label>
                  <label><input type="radio" name="timeframe" value="this_month" checked={timeframe==='this_month'} onChange={(e)=>setTimeframe(e.target.value)} /> This Month</label>
                </div>
              )}
              <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:8}}>
                <button className="btn-secondary" onClick={() => setFiltersOpen(false)}>Done</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="grid">
        {loading && (
          <>
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={`sk-live-${i}`} />)}
          </>
        )}
        {!loading && events.map((ev) => (
          <div className="card" key={ev._id}>
            <img src={ev.imageUrl || 'https://via.placeholder.com/400x250?text=Event'} alt={ev.name} />
            <div className="card-body">
              <h3>{ev.name}</h3>
              <p>{new Date(ev.date).toLocaleDateString()} • {ev.time}</p>
              <p>{ev.location}</p>
              {new Date(ev.date) >= new Date() && !(isAuthenticated && user?.role === 'admin') && (
                <a className="btn-primary" href={`/events/${ev._id}/register`}>Register</a>
              )}
            </div>
          </div>
        ))}
        {!loading && events.length === 0 && <p>No events found.</p>}
      </div>
    </section>
  );
};

export default LiveEvents;



