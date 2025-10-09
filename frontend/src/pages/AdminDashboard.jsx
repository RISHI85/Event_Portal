import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import '../components/SkeletonCard/SkeletonCard.css';

const emptyEvent = {
  name: '',
  description: '',
  date: '',
  time: '',
  location: '',
  imageUrl: '',
  isMainEvent: true,
  parentEvent: '',
  department: '',
  registrationDetails: {
    feePerHead: 0,
    teamParticipation: false,
    teamSize: { type: 'individual', value: 1, minValue: 1, maxValue: 1 },
  },
};

const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [subEventCounts, setSubEventCounts] = useState({});

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/events?isMainEvent=true');
      setEvents(data);
    } catch (e) {
      toast.error('Failed to load events');
    } finally { setLoading(false); }
  };

  // (Basic registration is configured in the Event form, not here)

  useEffect(() => { load(); }, []);

  // After events load, fetch sub-event counts so we can decide whether to show
  // the "View Sub Events" button. We only fetch for visible main events here.
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const ids = (events || []).map(e => e._id);
        await Promise.all(ids.map(async (id) => {
          if (subEventCounts[id] !== undefined) return; // already fetched
          try {
            const { data } = await api.get(`/api/events/${id}/sub-events`);
            setSubEventCounts((m) => ({ ...m, [id]: Array.isArray(data) ? data.length : 0 }));
          } catch (_) {
            setSubEventCounts((m) => ({ ...m, [id]: 0 }));
          }
        }));
      } catch (_) {}
    };
    if (events && events.length) fetchCounts();
  }, [events]);

  const filtered = useMemo(() => {
    if (!q) return events;
    const s = q.toLowerCase();
    return events.filter(ev => `${ev.name} ${ev.description} ${ev.location}`.toLowerCase().includes(s));
  }, [q, events]);

  const goNew = (parentId = null) => {
    if (parentId) navigate(`/admin/events/new?parent=${parentId}`);
    else navigate('/admin/events/new');
  };

  const goEdit = (id) => navigate(`/admin/events/${id}/edit`);

  // form/page handled in AdminEventForm.jsx

  const remove = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await api.delete(`/api/events/${id}`);
      toast.success('Event deleted');
      await load();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const loadStats = async (eventId) => {
    try {
      const { data } = await api.get('/api/registrations/stats', { params: { eventId } });
      setStats(data);
    } catch (e) {
      toast.error('Failed to load stats');
    }
  };

  const [subEventsMap, setSubEventsMap] = useState({});
  const [openSubs, setOpenSubs] = useState({}); // track which main event's sub-events are visible
  const loadSubEvents = async (id) => {
    try {
      const { data } = await api.get(`/api/events/${id}/sub-events`);
      setSubEventsMap(m => ({ ...m, [id]: data }));
    } catch {}
  };

  const onToggleSubEvents = (id) => {
    setOpenSubs((m) => {
      const next = { ...m, [id]: !m[id] };
      return next;
    });
    // if opening and not yet loaded, fetch once
    if (!openSubs[id] && !subEventsMap[id]) {
      loadSubEvents(id);
    }
  };

  return (
    <div className="container">
      <h2>Admin Dashboard</h2>
      <p>Manage main events and their sub-events. Create, edit, delete, and view registrations.</p>

      <div style={{display:'flex', gap:12, alignItems:'center', marginBottom:12}}>
        <button className="btn-secondary" onClick={() => goNew(null)}>Add New Main Event</button>
        <input placeholder="Search events by name, description, or location..." value={q} onChange={(e)=>setQ(e.target.value)} style={{flex:1, padding:10, border:'1px solid #e5e7eb', borderRadius:8}} />
      </div>

      {loading && (
        <div className="grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="card" key={`sk-admin-dash-${i}`} style={{ padding: 16 }}>
              <div className="skeleton-line skeleton-line-lg" style={{ width: '40%', height: 24 }} />
              <div className="skeleton-line" style={{ width: '90%', marginTop: 10 }} />
              <div className="skeleton-line" style={{ width: '85%' }} />
              <div className="skeleton-line" style={{ width: '80%' }} />
            </div>
          ))}
        </div>
      )}

      {filtered.map(ev => (
        <div className="card" key={ev._id} style={{ padding:16, marginBottom:28 }}>
          <div className="admin-card-grid">
            <img src={ev.imageUrl || 'https://via.placeholder.com/400x250?text=Event'} alt={ev.name} style={{width:'100%', height:160, objectFit:'cover', borderRadius:8}} />
            <div>
              <h3>{ev.name}</h3>
              {ev.department && <p>Department: {ev.department}</p>}
              {ev.date && <p>Date: {new Date(ev.date).toLocaleDateString()}</p>}
              {ev.time && <p>Time: {ev.time}</p>}
              {ev.location && <p>Location: {ev.location}</p>}
              <p className="muted">{ev.description?.slice(0,120)}{(ev.description||'').length>120?'…':''}</p>
              <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:8}}>
                {subEventCounts[ev._id] > 0 && (
                  <button className="btn-secondary" onClick={() => onToggleSubEvents(ev._id)}>
                    {openSubs[ev._id] ? 'Hide Sub Events ▴' : 'View Sub Events ▾'}
                  </button>
                )}
                <button className="btn-secondary" onClick={() => goNew(ev._id)}>Add Sub-Event</button>
                {/* For main events, show View Registrations only if basic registration is enabled */}
                {ev.isMainEvent ? (
                  ev.basicRegistrationEnabled ? (
                    <button className="btn-secondary" onClick={() => navigate(`/admin/events/${ev._id}/registrations`)}>View Registrations</button>
                  ) : null
                ) : (
                  <button className="btn-secondary" onClick={() => navigate(`/admin/events/${ev._id}/registrations`)}>View Registrations</button>
                )}
                <button className="btn-secondary" onClick={() => goEdit(ev._id)} style={{background:'#06b6d4'}}>Edit</button>
                <button className="btn-secondary" onClick={() => remove(ev._id)} style={{background:'#ef4444'}}>Delete</button>
              </div>
              {openSubs[ev._id] && subEventsMap[ev._id] && (
                <div style={{marginTop:12}}>
                  <h4>Sub Events</h4>
                  <div className="grid">
                    {subEventsMap[ev._id].map(se => (
                      <div key={se._id} className="card" style={{padding:12}}>
                        <strong>{se.name}</strong>
                        <div>{new Date(se.date).toLocaleDateString()} • {se.time}</div>
                        <div>{se.location}</div>
                        <div style={{display:'flex', gap:6, marginTop:8}}>
                          <button className="btn-secondary" onClick={() => navigate(`/admin/events/${se._id}/registrations`)}>View Registrations</button>
                          <button className="btn-secondary" onClick={() => goEdit(se._id)} style={{background:'#06b6d4'}}>Edit</button>
                          <button className="btn-secondary" onClick={() => remove(se._id)} style={{background:'#ef4444'}}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Add/Edit handled via dedicated pages */}

      {stats && (
        <div className="card" style={{padding:16, marginTop:16}}>
          <div style={{display:'flex', justifyContent:'space-between'}}>
            <h3>Registrations Overview</h3>
            <button className="nav-link" onClick={()=>setStats(null)}>✕</button>
          </div>
          <div className="grid">
            <div className="card" style={{padding:12}}>
              <h4>By Gender</h4>
              <ul>
                {stats.byGender.map((x)=> (<li key={x.label || 'unknown'}>{x.label || 'Unknown'}: {x.count}</li>))}
              </ul>
            </div>
            <div className="card" style={{padding:12}}>
              <h4>By Year</h4>
              <ul>
                {stats.byYear.map((x)=> (<li key={x.label || 'unknown'}>{x.label || 'Unknown'}: {x.count}</li>))}
              </ul>
            </div>
            <div className="card" style={{padding:12}}>
              <h4>By Department</h4>
              <ul>
                {stats.byDepartment.map((x)=> (<li key={x.label || 'unknown'}>{x.label || 'Unknown'}: {x.count}</li>))}
              </ul>
            </div>
            <div className="card" style={{padding:12}}>
              <h4>By Day</h4>
              <ul>
                {stats.byDay.map((x)=> (<li key={x.date}>{x.date}: {x.count}</li>))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
