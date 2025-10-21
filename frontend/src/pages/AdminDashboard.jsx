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
  const [subEventsMap, setSubEventsMap] = useState({});
  const [openSubs, setOpenSubs] = useState({}); // track which main event's sub-events are visible

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
      } catch (_) { }
    };
    if (events && events.length) fetchCounts();
  }, [events]);

  const filtered = useMemo(() => {
    if (!q) return events;
    const s = q.toLowerCase();
    return events.filter(ev => {
      // Check if main event matches
      const mainMatch = `${ev.name} ${ev.description} ${ev.location}`.toLowerCase().includes(s);
      // Check if any sub-event matches
      const subEvents = subEventsMap[ev._id] || [];
      const subMatch = subEvents.some(se =>
        `${se.name} ${se.description} ${se.location}`.toLowerCase().includes(s)
      );
      return mainMatch || subMatch;
    });
  }, [q, events, subEventsMap]);

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
  const loadSubEvents = async (id) => {
    try {
      const { data } = await api.get(`/api/events/${id}/sub-events`);
      setSubEventsMap(m => ({ ...m, [id]: data }));
    } catch { }
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

  // Auto-expand sub-events when searching and a sub-event matches
  useEffect(() => {
    if (q && q.trim()) {
      const s = q.toLowerCase();
      const toExpand = {};
      
      // First, load all sub-events if not already loaded
      const loadPromises = events.map(async (ev) => {
        if (!subEventsMap[ev._id]) {
          await loadSubEvents(ev._id);
        }
      });
      
      Promise.all(loadPromises).then(() => {
        events.forEach(ev => {
          const subEvents = subEventsMap[ev._id] || [];
          const hasMatchingSubEvent = subEvents.some(se =>
            `${se.name} ${se.description} ${se.location}`.toLowerCase().includes(s)
          );
          if (hasMatchingSubEvent) {
            toExpand[ev._id] = true;
          }
        });
        setOpenSubs(prev => ({ ...prev, ...toExpand }));
      });
    }
  }, [q, events, subEventsMap]);

  // Helper to check if a sub-event matches the search
  const subEventMatchesSearch = (subEvent) => {
    if (!q || !q.trim()) return false;
    const s = q.toLowerCase();
    return `${subEvent.name} ${subEvent.description} ${subEvent.location}`.toLowerCase().includes(s);
  };

  return (
    <div className="container">
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.2);
          }
        }
        
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
      `}</style>
      <h2>Admin Dashboard</h2>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <button className="btn-secondary" onClick={() => goNew(null)}>Add New Main Event</button>
        <input placeholder="Search events by name, description, or location..." value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1, padding: 10, border: '1px solid #e5e7eb', borderRadius: 8 }} />
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
        <div className="card" key={ev._id} style={{
          padding: 24,
          marginBottom: 24,
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
            <img
              src={ev.imageUrl || 'https://via.placeholder.com/400x250?text=Event'}
              alt={ev.name}
              style={{
                width: 180,
                height: 180,
                objectFit: 'cover',
                borderRadius: 12,
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            />
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontSize: '1.5rem',
                marginBottom: 12,
                color: '#1f2937',
                fontWeight: 600
              }}>{ev.name}</h3>

              <div style={{ marginBottom: 12, color: '#6b7280', lineHeight: 1.8 }}>
                {ev.date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.95rem' }}>📅</span>
                    <span><strong>Date:</strong> {new Date(ev.date).toLocaleDateString()}</span>
                  </div>
                )}
                {ev.time && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.95rem' }}>🕐</span>
                    <span><strong>Time:</strong> {ev.time}</span>
                  </div>
                )}
                {ev.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.95rem' }}>📍</span>
                    <span><strong>Location:</strong> {ev.location}</span>
                  </div>
                )}
              </div>

              <p style={{
                color: '#4b5563',
                marginBottom: 16,
                lineHeight: 1.6,
                fontSize: '0.95rem'
              }}>{ev.description?.slice(0, 150)}{(ev.description || '').length > 150 ? '…' : ''}</p>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {subEventCounts[ev._id] > 0 && (
                  <button
                    onClick={() => onToggleSubEvents(ev._id)}
                    style={{
                      background: openSubs[ev._id] ? '#1e40af' : '#1e3a8a',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: 6,
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#1e40af'}
                    onMouseLeave={(e) => e.currentTarget.style.background = openSubs[ev._id] ? '#1e40af' : '#1e3a8a'}
                  >
                    {openSubs[ev._id] ? 'Hide Sub Events ▴' : 'View Sub Events ▾'}
                  </button>
                )}
                <button
                  onClick={() => goNew(ev._id)}
                  style={{
                    background: '#1e3a8a',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 6,
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#1e40af'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#1e3a8a'}
                >
                  Add Sub-Event
                </button>
                {ev.isMainEvent ? (
                  ev.basicRegistrationEnabled ? (
                    <button
                      onClick={() => navigate(`/admin/events/${ev._id}/registrations`)}
                      style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: 6,
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                    >
                      View Registrations
                    </button>
                  ) : null
                ) : (
                  <button
                    onClick={() => navigate(`/admin/events/${ev._id}/registrations`)}
                    style={{
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: 6,
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                  >
                    View Registrations
                  </button>
                )}
                <button
                  onClick={() => goEdit(ev._id)}
                  style={{
                    background: '#06b6d4',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 6,
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#0891b2'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#06b6d4'}
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(ev._id)}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 6,
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
          {openSubs[ev._id] && subEventsMap[ev._id] && (
            <div style={{
              marginTop: 20,
              paddingTop: 20,
              borderTop: '2px solid #e5e7eb',
              animation: 'slideDown 0.4s ease-out',
              transformOrigin: 'top'
            }}>
              <h4 style={{
                color: '#1e3a8a',
                fontSize: '1.15rem',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 600
              }}>
                <span style={{ fontSize: '1.3rem' }}>✨</span>
                Sub Events
                <span style={{
                  background: '#1e3a8a',
                  color: 'white',
                  padding: '3px 10px',
                  borderRadius: 12,
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>{subEventsMap[ev._id].length}</span>
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16
              }}>
                {subEventsMap[ev._id].map((se, idx) => {
                  const isHighlighted = subEventMatchesSearch(se);
                  return (
                    <div
                      key={se._id}
                      style={{
                        padding: 16,
                        background: isHighlighted
                          ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                          : 'white',
                        border: isHighlighted
                          ? '2px solid #3b82f6'
                          : '1px solid #e5e7eb',
                        borderRadius: 10,
                        boxShadow: isHighlighted
                          ? '0 4px 12px rgba(59, 130, 246, 0.25)'
                          : '0 2px 6px rgba(0,0,0,0.08)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        animation: `fadeInUp 0.4s ease-out ${idx * 0.08}s both`,
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = isHighlighted
                          ? '0 8px 20px rgba(59, 130, 246, 0.3)'
                          : '0 6px 16px rgba(0,0,0,0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = isHighlighted
                          ? '0 4px 12px rgba(59, 130, 246, 0.25)'
                          : '0 2px 6px rgba(0,0,0,0.08)';
                      }}
                    >
                      {isHighlighted && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          background: '#3b82f6',
                          color: 'white',
                          padding: '4px 10px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          borderBottomLeftRadius: 8,
                          boxShadow: '0 2px 6px rgba(59, 130, 246, 0.4)'
                        }}>
                          🎯 MATCH
                        </div>
                      )}

                      <div style={{ marginBottom: 12 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 6,
                          marginBottom: 10
                        }}>
                          <span style={{ fontSize: '1rem', marginTop: 2 }}>●</span>
                          <strong style={{
                            fontSize: '1.05rem',
                            color: isHighlighted ? '#1e40af' : '#1f2937',
                            fontWeight: 600,
                            lineHeight: 1.4,
                            flex: 1
                          }}>{se.name}</strong>
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          color: '#6b7280',
                          fontSize: '0.85rem',
                          marginBottom: 6
                        }}>
                          <span>📅</span>
                          <span>{new Date(se.date).toLocaleDateString()}</span>
                          <span style={{ margin: '0 2px' }}>•</span>
                          <span>🕐</span>
                          <span>{se.time}</span>
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          color: '#6b7280',
                          fontSize: '0.85rem',
                          marginBottom: 12
                        }}>
                          <span>📍</span>
                          <span style={{ lineHeight: 1.4 }}>{se.location}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => navigate(`/admin/events/${se._id}/registrations`)}
                          style={{
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            padding: '7px 12px',
                            borderRadius: 6,
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            flex: 1
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#059669';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#10b981';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          Registrations
                        </button>
                        <button
                          onClick={() => goEdit(se._id)}
                          style={{
                            background: '#06b6d4',
                            color: 'white',
                            border: 'none',
                            padding: '7px 12px',
                            borderRadius: 6,
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#0891b2';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#06b6d4';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => remove(se._id)}
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            padding: '7px 12px',
                            borderRadius: 6,
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#dc2626';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ef4444';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add/Edit handled via dedicated pages */}

      {stats && (
        <div className="card" style={{ padding: 16, marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3>Registrations Overview</h3>
            <button className="nav-link" onClick={() => setStats(null)}>✕</button>
          </div>
          <div className="grid">
            <div className="card" style={{ padding: 12 }}>
              <h4>By Gender</h4>
              <ul>
                {stats.byGender.map((x) => (<li key={x.label || 'unknown'}>{x.label || 'Unknown'}: {x.count}</li>))}
              </ul>
            </div>
            <div className="card" style={{ padding: 12 }}>
              <h4>By Year</h4>
              <ul>
                {stats.byYear.map((x) => (<li key={x.label || 'unknown'}>{x.label || 'Unknown'}: {x.count}</li>))}
              </ul>
            </div>
            <div className="card" style={{ padding: 12 }}>
              <h4>By Department</h4>
              <ul>
                {stats.byDepartment.map((x) => (<li key={x.label || 'unknown'}>{x.label || 'Unknown'}: {x.count}</li>))}
              </ul>
            </div>
            <div className="card" style={{ padding: 12 }}>
              <h4>By Day</h4>
              <ul>
                {stats.byDay.map((x) => (<li key={x.date}>{x.date}: {x.count}</li>))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
