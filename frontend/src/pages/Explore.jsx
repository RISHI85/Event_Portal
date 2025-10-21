import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import fetchWithLoading from '../utils/fetcher';
import SkeletonCard from '../components/SkeletonCard/SkeletonCard';
import useAuthStore from '../store/authStore';
import '../components/LiveEvents.css';
import './Explore.css';

const Explore = () => {
  const { dept } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const category = (searchParams.get('category') || '').toLowerCase();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRegEventIds, setMyRegEventIds] = useState(new Set());
  const { isAuthenticated, user } = useAuthStore();
  const [openDetails, setOpenDetails] = useState({}); // id -> boolean
  const [detailsMap, setDetailsMap] = useState({}); // id -> { loading, data }
  // Filter mode: by default, non-admin users see upcoming; button toggles to ended
  const [mode, setMode] = useState('upcoming'); // 'upcoming' | 'ended'

  // Data for category views
  const [departments, setDepartments] = useState([]);
  const [stepconeParentId, setStepconeParentId] = useState('');
  const [stepconeTiles, setStepconeTiles] = useState([]); // [{name,count}]
  const [chapterEvents, setChapterEvents] = useState([]); // [{_id,name,imageUrl,count}]
  const [otherMainEvents, setOtherMainEvents] = useState([]); // [{_id,name,imageUrl,count}]
  const [parentEventName, setParentEventName] = useState(''); // For sub-events view

  // Default mode: admins see ended by default; users see upcoming by default
  useEffect(() => {
    if (user?.role === 'admin') setMode('ended');
    else setMode('upcoming');
  }, [user]);

  // Load lists for category screens
  useEffect(() => {
    const builtInChapters = ['CSI', 'EDC', 'ACM', 'ISTE'];
    const isStepcone = (name) => String(name || '').toLowerCase().includes('stepcone');
    if (category === 'stepcone') {
      // Always show built-in departments; still fetch Stepcone parent ID for links
      const builtInStepconeDepts = ['CSE', 'IT', 'ECE', 'EEE', 'CIVIL', 'MECH'];
      setDepartments(builtInStepconeDepts);
      (async () => {
        try {
          const res = await fetchWithLoading('/api/events?isMainEvent=true');
          const mains = await res.json();
          const match = (mains || []).find((e) => String(e.name || '').toLowerCase().includes('stepcone'));
          const parentId = match?._id || '';
          setStepconeParentId(parentId);
          // fetch counts per department
          const tiles = await Promise.all(builtInStepconeDepts.map(async (d) => {
            try {
              const q = new URLSearchParams({ parentEvent: parentId, department: d });
              const r = await fetchWithLoading(`/api/events?${q.toString()}`);
              const arr = await r.json();
              return { name: d, count: Array.isArray(arr) ? arr.length : 0 };
            } catch { return { name: d, count: 0 }; }
          }));
          setStepconeTiles(tiles);
        } catch (_) {
          setStepconeParentId('');
          setStepconeTiles(builtInStepconeDepts.map((d)=>({ name: d, count: 0 })));
        }
      })();
    } else if (category === 'chapters') {
      // Build chapters list in fixed order; map to existing mains when available
      fetchWithLoading('/api/events?isMainEvent=true')
        .then((r) => r.json())
        .then(async (data) => {
          const mains = Array.isArray(data) ? data : [];
          const lower = (s) => String(s || '').toLowerCase();
          const chapters = builtInChapters.map((key) => {
            const found = mains.find((e) => lower(e.name).includes(lower(key)));
            return {
              _id: found?._id,
              name: found?.name || `${key} Student Chapter`,
              imageUrl: found?.imageUrl,
              count: 0,
            };
          });
          // fetch sub-event counts for each chapter that exists
          const withCounts = await Promise.all(chapters.map(async (c) => {
            if (!c._id) return c;
            try {
              const r = await fetchWithLoading(`/api/events?parentEvent=${c._id}`);
              const arr = await r.json();
              return { ...c, count: Array.isArray(arr) ? arr.length : 0 };
            } catch { return c; }
          }));
          setChapterEvents(withCounts);
        })
        .catch(() => {
          const chapters = builtInChapters.map((key) => ({ _id: undefined, name: `${key} Student Chapter`, imageUrl: undefined, count: 0 }));
          setChapterEvents(chapters);
        });
    } else if (category === 'others') {
      fetchWithLoading('/api/events?isMainEvent=true')
        .then((r) => r.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : [];
          const others = list.filter((e) => !builtInChapters.some((w) => String(e.name || '').toLowerCase().includes(w.toLowerCase())) && !isStepcone(e.name));
          // fetch sub-event counts for each other main
          Promise.all(others.map(async (ev) => {
            try {
              const r2 = await fetchWithLoading(`/api/events?parentEvent=${ev._id}`);
              const arr = await r2.json();
              return { ...ev, count: Array.isArray(arr) ? arr.length : 0 };
            } catch { return { ...ev, count: 0 }; }
          })).then(setOtherMainEvents);
        })
        .catch(() => { setOtherMainEvents([]); });
    }
  }, [category]);

  useEffect(() => {
    const params = new URLSearchParams();
    const parent = searchParams.get('parent');
    
    // Fetch parent event name if viewing sub-events
    if (parent) {
      fetchWithLoading(`/api/events/${parent}`)
        .then((r) => r.json())
        .then((data) => setParentEventName(data?.name || ''))
        .catch(() => setParentEventName(''));
    } else {
      setParentEventName('');
    }
    
    // Only run the normal events fetch when NOT in category splash mode
    if (category && !parent && !dept) {
      return; // category views will render their own lists
    }
    if (parent && dept) {
      params.set('parentEvent', parent);
      params.set('department', dept.toLowerCase() === 'common' ? 'Common' : dept);
    } else if (parent) {
      params.set('parentEvent', parent);
    } else if (dept) {
      // Respect explicit department in URL, mapping 'common' to canonical 'Common'
      params.set('department', dept.toLowerCase() === 'common' ? 'Common' : dept);
      if (dept.toLowerCase() === 'common') params.set('isMainEvent', 'true');
    } else {
      // Default view should be Common main events only
      params.set('department', 'Common');
      params.set('isMainEvent', 'true');
    }
    // Ask backend to include hasSubEvents flag for main events
    if (!searchParams.get('parent')) {
      params.set('includeSubCount', 'true');
    }

    setLoading(true);
    fetchWithLoading(`/api/events?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [dept, searchParams, category]);
  // Load my registrations to determine which events are already registered
  useEffect(() => {
    // Skip loading registrations for admins since they cannot register
    if (isAuthenticated && user?.role === 'admin') return;
    const loadMyRegs = async () => {
      try {
        const { data } = await api.get('/api/registrations/my-events');
        const ids = new Set(
          (Array.isArray(data) ? data : [])
            .filter((r) => r?.eventId?._id)
            .map((r) => r.eventId._id)
        );
        setMyRegEventIds(ids);
      } catch (e) {
        // ignore; not critical for page load
      }
    };
    loadMyRegs();
  }, [isAuthenticated, user]);

  // Derived list based on mode (upcoming vs ended)
  const visibleEvents = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    return (events || []).filter((ev) => {
      const d = getEventDateTime(ev);
      // If date/time is missing, keep in upcoming by default
      if (!d) return mode !== 'ended';
      const dd = new Date(d); dd.setHours(0,0,0,0);
      const isPast = dd < today;
      return mode === 'ended' ? isPast : !isPast;
    });
  }, [events, mode]);

  // Fee shown equals the total fee entered in the form (per team/entry), no per-head math

  const renderDescriptionList = (desc) => {
    if (!desc) return null;
    // Normalize line breaks and bullets
    const normalized = String(desc)
      .replace(/\r\n/g, '\n')
      .replace(/\u2022/g, '•'); // ensure bullet symbol is consistent
    // Split by newlines or bullet separators. Keep items non-empty and trimmed
    const parts = normalized
      .split(/\n|\s*•\s*|\s*-\s*|\s*\*\s*/g)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return <p>{desc}</p>;
    return (
      <ul>
        {parts.map((p, i) => (
          <li key={`d-li-${i}`}>{p}</li>
        ))}
      </ul>
    );
  };
  const toggleDetails = async (id) => {
    const isOpen = !!openDetails[id];
    // If opening and not yet loaded, fetch details
    if (!isOpen && !detailsMap[id]) {
      setDetailsMap((m) => ({ ...m, [id]: { loading: true, data: null } }));
      try {
        const { data } = await api.get(`/api/events/${id}`);
        setDetailsMap((m) => ({ ...m, [id]: { loading: false, data } }));
      } catch (e) {
        setDetailsMap((m) => ({ ...m, [id]: { loading: false, data: null } }));
      }
    }
    setOpenDetails((m) => ({ ...m, [id]: !isOpen }));
  };

  // Helper to parse combined Date & Time and return Date object
  function getEventDateTime(ev) {
    try {
      const dateStr = ev?.date || ev?.startDate || ev?.eventDate;
      const timeStr = (ev?.time || ev?.startTime || '').trim();
      if (!dateStr) return null;
      let d = new Date(dateStr);
      if (timeStr) {
        const m = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (m) {
          let h = parseInt(m[1], 10);
          const min = parseInt(m[2], 10);
          const ap = (m[3] || '').toUpperCase();
          if (ap === 'PM' && h < 12) h += 12;
          if (ap === 'AM' && h === 12) h = 0;
          d = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, min, 0, 0);
        }
      }
      return isNaN(d.getTime()) ? null : d;
    } catch { return null; }
  }

  return (
    <div className="container explore">
      {/* Hero Header Section */}
      <div className="explore-hero">
        {category ? (
          <>
            <div className="hero-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span>Explore Events</span>
            </div>
            <h2>
              {category === 'stepcone' && 'Stepcone'}
              {category === 'chapters' && 'Student Chapters'}
              {category === 'others' && 'Other Main'} Events
            </h2>
          </>
        ) : searchParams.get('parent') ? (
          <>
            <div className="hero-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <span>{parentEventName || 'Sub Events'}</span>
            </div>
            <h2>Discover Amazing Events</h2>
          </>
        ) : (
          <>
            <div className="hero-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span>{dept ? decodeURIComponent(dept) : 'Common'}</span>
            </div>
            <h2>
              {dept
                ? decodeURIComponent(dept) + ' Events'
                : 'Common Events'}
            </h2>
          </>
        )}
      </div>
      {/* Toggle between upcoming and ended events (hidden for Stepcone and Chapters landing) */}
      {!(category === 'stepcone' || category === 'chapters') && (
        <div style={{ display:'flex', justifyContent:'center', margin:'8px 0 16px' }}>
          <button
            className="btn-secondary"
            onClick={() => setMode((m) => (m === 'ended' ? 'upcoming' : 'ended'))}
            title={mode === 'ended' ? 'Show Upcoming Events' : 'Show Ended Events'}
            style={{ background: '#06b6d4' }}
          >
            {mode === 'ended' ? 'Show Upcoming Events' : 'Show Ended Events'}
          </button>
        </div>
      )}
      {/* Category landing screens */}
      {category === 'stepcone' && (
        <>
          <div className="xp-breadcrumb"><a href="/explore">Explore Events</a> &nbsp;›&nbsp; Stepcone Departments</div>
          <h3 className="xp-title">Stepcone Departments</h3>
          <p className="xp-subtitle">Select a department to view events</p>
          <div className="xp-tiles">
            {(stepconeTiles.length ? stepconeTiles : departments.map((d)=>({name:d,count:0}))).map((t) => {
              const canOpen = !!stepconeParentId;
              const icon = ({
                CSE: '🖥️',
                IT: '💻',
                ECE: '📡',
                EEE: '⚡',
                CIVIL: '🏗️',
                MECH: '⚙️',
              })[t.name] || '🎓';
              const prettyName = t.name; // Keep short codes consistent
              const countNode = t.count && t.count > 0 ? `${t.count} Events` : 'Coming soon!';
              return (
                <div
                  key={t.name}
                  className="xp-tile"
                  style={{ cursor: canOpen ? 'pointer' : 'not-allowed', opacity: canOpen ? 1 : 0.85 }}
                  onClick={() => { if (canOpen) navigate(`/explore/${encodeURIComponent(t.name)}?parent=${stepconeParentId}`); }}
                  title={canOpen ? `Open ${prettyName} Stepcone events` : 'Stepcone event not found yet'}
                  aria-label={`${prettyName} ${typeof countNode === 'string' ? countNode : ''}`}
                >
                  <div className="xp-icon" role="img" aria-hidden>{icon}</div>
                  <div className="xp-name">{prettyName}</div>
                  <div className="xp-count">{countNode}</div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {category === 'chapters' && (
        <>
          <div className="xp-breadcrumb"><a href="/explore">Explore Events</a> &nbsp;›&nbsp; Student Chapters</div>
          <h3 className="xp-title">Student Chapters</h3>
          <div className="xp-tiles">
            {chapterEvents.map((ev, idx) => (
              <div key={ev._id || `ch-${idx}`} className="xp-tile" onClick={() => ev._id && navigate(`/explore?parent=${ev._id}`)} style={{cursor: ev._id ? 'pointer' : 'not-allowed', opacity: ev._id ? 1 : .85}}>
                <div className="xp-icon">💻</div>
                <div className="xp-name">{ev.name?.replace(/\s*Student Chapter\s*$/i,'')}</div>
                <div className="xp-count">{ev.count && ev.count > 0 ? `${ev.count} Events` : 'Coming soon!'}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {category === 'others' && (
        <>
          <div className="xp-breadcrumb"><a href="/explore">Explore Events</a> &nbsp;›&nbsp; Other Events</div>
          <h3 className="xp-title">Other Events</h3>
          <div className="xp-tiles">
            {otherMainEvents.map((ev) => (
              <div key={ev._id} className="xp-tile" onClick={() => navigate(`/explore?parent=${ev._id}`)}>
                <div className="xp-icon">🎭</div>
                <div className="xp-name">{ev.name}</div>
                <div className="xp-count">{ev.count && ev.count > 0 ? `${ev.count} Events` : 'Coming soon!'}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Explore listings */}
      {!category && (
        searchParams.get('parent')
          ? (
            // Sub Events view: list with expandable rows
            <div className="events-list">
              {loading && (
                <div className="skeleton-list">
                  {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`sk-sub-${i}`} />)}
                </div>
              )}
              {!loading && visibleEvents.length > 0 && (
                <div className="events-table" role="list">
                  <div className="events-header">
                    <div className="col name">Event</div>
                    <div className="col dept">Department</div>
                    <div className="col dt">Date & Time</div>
                    <div className="col action">Action</div>
                  </div>
                  {visibleEvents.slice().sort((a,b)=>{
                    const da = getEventDateTime(a)?.getTime() ?? 0;
                    const db = getEventDateTime(b)?.getTime() ?? 0;
                    return da - db; // ascending
                  }).map((ev) => {
                    const dt = getEventDateTime(ev);
                    const isPast = dt ? dt.getTime() < Date.now() : false;
                    const registered = myRegEventIds.has(ev._id);
                    return (
                      <div className="events-row" key={ev._id} role="listitem">
                        <div className="row-main">
                          <button className="col name name-btn" aria-expanded={!!openDetails[ev._id]} onClick={() => toggleDetails(ev._id)}>
                            <span className="caret" aria-hidden>▸</span>
                            {ev.name}
                          </button>
                          <div className="col dept">{ev.department || '—'}</div>
                          <div className="col dt">{dt ? dt.toLocaleString() : (ev.date ? `${new Date(ev.date).toLocaleDateString()} ${ev.time || ''}` : 'TBD')}</div>
                          <div className="col action">
                            {registered ? (
                              <span className="badge success">Registered</span>
                            ) : isPast ? (
                              <button className="btn btn-closed" disabled>Registration Closed</button>
                            ) : (
                              <a className="btn btn-primary" href={`/events/${ev._id}/register`}>Register</a>
                            )}
                          </div>
                        </div>
                        <div className={`row-details ${openDetails[ev._id] ? 'open' : ''}`}>
                          <div className="details-inner">
                            <div className="details-media">
                              <img src={ev.imageUrl || 'https://via.placeholder.com/480x320?text=Event'} alt={ev.name} />
                            </div>
                            <div className="details-content">
                              <h4>{ev.name}</h4>
                              {ev.description && <div className="desc">{renderDescriptionList(ev.description)}</div>}
                              <div className="meta">
                                <div><strong>Department:</strong> {ev.department || '—'}</div>
                                <div><strong>Date & Time:</strong> {dt ? dt.toLocaleString() : `${new Date(ev.date).toLocaleDateString()} ${ev.time || ''}`}</div>
                                {ev.location && <div><strong>Venue:</strong> {ev.location}</div>}
                                {ev.registrationDetails?.feePerHead != null && (
                                  <div><strong>Fee (team total):</strong> ₹{Number(ev.registrationDetails.feePerHead)}</div>
                                )}
                              </div>
                              {/* Action button intentionally omitted here to avoid duplication; shown in the row header */}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {!loading && visibleEvents.length === 0 && <p>No sub events found.</p>}
            </div>
          )
          : (
            // Non-parent view: original grid cards
            <div className="grid">
              {loading && (
                <>
                  {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`sk-${i}`} />)}
                </>
              )}
              {!loading && visibleEvents.map((ev) => (
                <div className="card" key={ev._id}>
                  <img
                    src={ev.imageUrl || 'https://via.placeholder.com/400x250?text=Event'}
                    alt={ev.name}
                    onError={(e) => {
                      const ph = 'https://via.placeholder.com/400x250?text=Event';
                      if (e.currentTarget.src !== ph) e.currentTarget.src = ph;
                    }}
                  />
                  <div className="card-body">
                    <h3>{ev.name}</h3>
                    <p><strong>Department:</strong> {ev.department || '—'}</p>
                    <p><strong>Date & Time:</strong> {new Date(ev.date).toLocaleDateString()} • {ev.time}</p>
                    <p><strong>Venue:</strong> {ev.location}</p>
                    <p>Fee (team total): ₹{Number(ev.registrationDetails?.feePerHead || 0)}</p>
                    {ev.isMainEvent && !searchParams.get('parent') && ev.hasSubEvents && (
                      <a className="btn-secondary" href={`/explore?parent=${ev._id}`}>View Sub Events</a>
                    )}
                    <button className="btn-secondary" style={{ marginLeft: 8 }} onClick={() => toggleDetails(ev._id)}>
                      {openDetails[ev._id] ? 'View Less' : 'View Details'}
                    </button>
                    {/* Registration status / action (hidden for admins) */}
                    {!(isAuthenticated && user?.role === 'admin') && (() => {
                      const registered = myRegEventIds.has(ev._id);
                      const today = new Date(); today.setHours(0,0,0,0);
                      const evDate = new Date(ev.date); evDate.setHours(0,0,0,0);
                      const isPast = evDate < today;
                      if (registered) {
                        return <span className="badge success" style={{ marginLeft: 8 }}>Registered</span>;
                      }
                      if (isPast) {
                        return <span className="badge" style={{ marginLeft: 8, background:'#e53935', color:'#fff' }}>Registration Closed</span>;
                      }
                      return <a className="btn-primary" href={`/events/${ev._id}/register`} style={{ marginLeft: 8 }}>Register</a>;
                    })()}

                    {/* Collapsible details section */}
                    <div className={`collapse ${openDetails[ev._id] ? 'open' : ''}`} style={{ marginTop: 10 }}>
                      <div style={{ paddingTop: 8 }}>
                        {detailsMap[ev._id]?.loading && <p>Loading…</p>}
                        {(!detailsMap[ev._id] || detailsMap[ev._id]?.data) && (
                          (() => {
                            const d = detailsMap[ev._id]?.data || ev; // fallback to basic card data
                            return (
                              <div className="details-grid" style={{ display: 'grid', gap: 8 }}>
                                <div>
                                  <strong>Description:</strong>
                                  {renderDescriptionList(d.description)}
                                </div>
                                <div><strong>Department:</strong> {d.department || 'Common'}</div>
                                {Array.isArray(d.schedule) && d.schedule.length > 0 ? (
                                  <div>
                                    <strong>Schedule</strong>
                                    <ul>
                                      {d.schedule.map((x, i) => (
                                        <li key={`s-${i}`}>{x.date ? new Date(x.date).toLocaleDateString() : '-'} • {x.time || '-'}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : (
                                  <div><strong>Date & Time:</strong> {d.date ? new Date(d.date).toLocaleDateString() : 'TBD'} • {d.time || ''}</div>
                                )}
                                {Array.isArray(d.adminContacts) && d.adminContacts.length > 0 && (
                                  <div>
                                    <strong>Admin Contacts</strong>
                                    <ul>
                                      {d.adminContacts.map((c, i) => (
                                        <li key={`ac-${i}`}>{c.name || 'Admin'} — {c.email || '—'} {c.phone ? `• ${c.phone}` : ''}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            );
                          })()
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {!loading && visibleEvents.length === 0 && <p>No events found.</p>}
            </div>
          )
      )}
    </div>
  );
}
;

export default Explore;

