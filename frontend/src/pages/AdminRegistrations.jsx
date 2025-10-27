import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import '../components/SkeletonCard/SkeletonCard.css';

// Lightweight charts using SVG (no extra deps)
const groupBy = (rows, keyFn) => {
  const m = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    m.set(k, (m.get(k) || 0) + 1);
  }
  return Array.from(m.entries()).map(([label, count]) => ({ label, count }));
};

const BarChart = ({ data, height = 320, color = '#0ea5e9' }) => {
  if (!data || data.length === 0) return <div className="muted">No data</div>;
  const labels = data.map(d => String(d.label ?? 'Unknown'));
  const values = data.map(d => Number(d.count || 0));
  const max = Math.max(1, ...values);
  const width = Math.max(1200, labels.length * 120);
  const pad = 36;
  const chartH = height - pad * 1.5;
  const chartW = width - pad * 2;
  const barW = chartW / labels.length * 0.6;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={width} height={height}>
        <line x1={pad} y1={pad / 2} x2={pad} y2={height - pad} stroke="#e5e7eb" />
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#e5e7eb" />
        {values.map((v, i) => {
          const h = (v / max) * (chartH - 8);
          const x = pad + (i + 0.2) * (chartW / labels.length);
          const y = height - pad - h;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={h} fill={color} rx={6} />
              <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize="11" fill="#111827">{v}</text>
              <text x={x + barW / 2} y={height - pad + 14} textAnchor="middle" fontSize="10" fill="#6b7280">
                {labels[i].length > 12 ? labels[i].slice(0, 12) + '…' : labels[i]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const PieChart = ({ data, size = 300, colors }) => {
  if (!data || data.length === 0) return <div className="muted">No data</div>;
  const total = data.reduce((s, d) => s + Number(d.count || 0), 0) || 1;
  const cx = size / 2, cy = size / 2, r = size / 2 - 8;
  const palette = colors || ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#06b6d4'];

  // Build slices; handle single-slice full circle case using a circle element
  const normalized = data.map((d, i) => ({
    label: String(d.label ?? 'Unknown'),
    count: Number(d.count || 0),
    color: palette[i % palette.length],
  })).filter(s => s.count > 0);

  const single = normalized.length === 1 && normalized[0].count === total;
  let angle = -Math.PI / 2;
  const slices = single ? [] : normalized.map((d) => {
    const sweep = (d.count / total) * Math.PI * 2;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle + sweep);
    const y2 = cy + r * Math.sin(angle + sweep);
    const largeArc = sweep > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    angle += sweep;
    return { path, color: d.color, label: d.label, count: d.count };
  });

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <svg width={size} height={size}>
        {single ? (
          <circle cx={cx} cy={cy} r={r} fill={normalized[0].color} stroke="#fff" strokeWidth={1} />
        ) : (
          slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth={1} />)
        )}
      </svg>
      <div>
        {normalized.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <span style={{ width: 12, height: 12, background: s.color, display: 'inline-block', borderRadius: 2 }} />
            <span style={{ color: '#374151' }}>{s.label}: </span>
            <strong>{s.count}</strong>
          </div>
        ))}
        <div className="muted">Total: {total}</div>
      </div>
    </div>
  );
};

const AdminRegistrations = () => {
  const { id } = useParams(); // eventId
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [tab, setTab] = useState('list'); // list | feedbacks | viz

  // Removed filters per request

  const [registrations, setRegistrations] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  // Certificate preview removed as per request

  // Totals: teams, members, internal, external
  const totals = useMemo(() => {
    const teams = (registrations || []).length;
    let members = 0;
    let internal = 0;
    let external = 0;
    
    for (const r of registrations || []) {
      const count = Array.isArray(r.teamResolved) && r.teamResolved.length > 0
        ? r.teamResolved.length
        : (Array.isArray(r.teamMembers) && r.teamMembers.length > 0 ? r.teamMembers.length : 1);
      members += count;
      
      // Count internal vs external
      // If registrationType is not set, determine from email
      let regType = r.registrationType;
      if (!regType && r.userId?.email) {
        regType = r.userId.email.toLowerCase().endsWith('@gmrit.edu.in') ? 'internal' : 'external';
      }
      
      if (regType === 'internal') {
        internal++;
      } else if (regType === 'external') {
        external++;
      }
    }
    return { teams, members, internal, external };
  }, [registrations]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [eventRes, regRes, fbRes] = await Promise.all([
          api.get(`/api/events/${id}`),
          api.get(`/api/registrations/event/${id}`),
          api.get(`/api/feedback/event/${id}`)
        ]);
        setEvent(eventRes.data);
        setRegistrations(regRes.data || []);
        setFeedback((fbRes.data && fbRes.data.feedback) || []);
      } catch (e) {
        toast.error('Failed to load registrations page');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Derived filtered rows - expand each registration to show individual team members
  const filteredRegs = useMemo(() => {
    const expanded = [];
    for (const r of registrations) {
      // Check if this is a team registration (has multiple members)
      const hasTeamMembers = (Array.isArray(r.teamResolved) && r.teamResolved.length > 1) || 
                             (Array.isArray(r.teamMembers) && r.teamMembers.length > 1);
      
      // If team has multiple members, create a row for each member
      if (Array.isArray(r.teamResolved) && r.teamResolved.length > 1) {
        for (const member of r.teamResolved) {
          expanded.push({
            ...r,
            _displayName: member?.name || (member?.email ? member.email.split('@')[0] : '—'),
            _displayEmail: member?.email || '—',
            _displayGender: member?.gender || '—',
            _displayYear: member?.year || r.year || '—',
            _displayTeam: r.teamName || '—',
            _displayMembers: r.teamResolved.map(m => m?.name || (m?.email ? m.email.split('@')[0] : 'Member')).join(', '),
            _isMemberRow: true
          });
        }
      } else if (Array.isArray(r.teamMembers) && r.teamMembers.length > 1) {
        for (const member of r.teamMembers) {
          expanded.push({
            ...r,
            _displayName: member?.name || (member?.email ? member.email.split('@')[0] : '—'),
            _displayEmail: member?.email || '—',
            _displayGender: '—',
            _displayYear: r.year || '—',
            _displayTeam: r.teamName || '—',
            _displayMembers: r.teamMembers.map(m => m?.name || (m?.email ? m.email.split('@')[0] : 'Member')).join(', '),
            _isMemberRow: true
          });
        }
      } else {
        // Individual registration - show the user who registered
        // For individual registrations, don't show team name even if it exists
        expanded.push({
          ...r,
          _displayName: r.userId?.email?.split('@')[0] || '—',
          _displayEmail: r.userId?.email || '—',
          _displayGender: r.userId?.gender || '—',
          _displayYear: r.year || r.userId?.year || '—',
          _displayTeam: '—', // Individual registration - no team
          _displayMembers: '—', // Individual registration - no members
          _isMemberRow: false
        });
      }
    }
    return expanded;
  }, [registrations]);

  // Options derived from data
  // Removed filter options

  // Visualization dimension
  const [dimension, setDimension] = useState('department'); // department | gender | year | day

  const vizData = useMemo(() => {
    // Build a flat list of values depending on dimension.
    // For gender/year, include team members BUT avoid double-counting the payer
    // when the payer is also present in team members list.
    const flat = [];
    if (dimension === 'gender' || dimension === 'year') {
      for (const r of filteredRegs) {
        // If backend provided teamResolved (which already includes leader when applicable),
        // use it exclusively to avoid counting leader twice. Otherwise, fallback to owner only.
        const members = (Array.isArray(r.teamResolved) && r.teamResolved.length > 0)
          ? r.teamResolved.map((m) => ({
              email: m?.email || '',
              name: m?.name || '',
              gender: m?.gender || 'unknown',
              year: String(m?.year || 'unknown'),
            }))
          : [{
              email: r.userId?.email || '',
              name: r.userId?.email?.split('@')[0] || 'owner',
              gender: r.userId?.gender || 'unknown',
              year: String(r.year || r.userId?.year || 'unknown'),
            }];
        // de-duplicate by email or name
        const seen = new Set();
        for (const m of members) {
          const key = (m.email || m.name || '').toLowerCase();
          if (!key || seen.has(key)) continue;
          seen.add(key);
          flat.push(dimension === 'gender' ? (m.gender || 'unknown') : (m.year || 'unknown'));
        }
      }
      return groupBy(flat.map((v) => ({ label: v })), (x) => x.label);
    }
    if (dimension === 'day') {
      return groupBy(filteredRegs, (r) => new Date(r.registeredAt).toISOString().slice(0, 10));
    }
    // department
    return groupBy(filteredRegs, (r) => r.department || 'unknown');
  }, [filteredRegs, dimension]);

  // No filters

  const downloadExcel = async () => {
    try {
      const response = await api.get(`/api/registrations/event/${id}/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${event?.name || 'event'}_registrations.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download Excel file');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', paddingBottom: 60, paddingTop: 0 }}>
      {/* Header Section */}
      <div style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', padding: '32px 20px 32px', marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div className="container" style={{ maxWidth: 1400 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <button 
                onClick={() => navigate(-1)} 
                style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  border: 'none', 
                  color: 'white', 
                  padding: '10px 20px', 
                  borderRadius: 8, 
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                ← Back to Events
              </button>
              <h1 style={{ color: 'white', fontSize: 32, fontWeight: 800, margin: '0 0 8px 0' }}>
                {event?.name || 'Event Registrations'}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: 16 }}>
                Manage registrations, view feedback, and analyze data
              </p>
            </div>
            <button 
              onClick={downloadExcel} 
              disabled={loading || registrations.length === 0}
              style={{
                background: 'white',
                color: '#14b8a6',
                border: 'none',
                padding: '14px 28px',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                cursor: registrations.length === 0 ? 'not-allowed' : 'pointer',
                opacity: registrations.length === 0 ? 0.6 : 1,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              📥 Download Excel Report
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 1400 }}>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <div style={{ 
          background: 'white', 
          padding: 8, 
          display: 'inline-flex', 
          gap: 8, 
          borderRadius: 12,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
        }}>
          <button 
            onClick={() => setTab('feedbacks')} 
            style={{ 
              background: tab === 'feedbacks' ? 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' : 'transparent',
              color: tab === 'feedbacks' ? 'white' : '#6b7280',
              border: 'none',
              padding: '12px 24px', 
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            💬 Feedbacks
          </button>
          <button 
            onClick={() => setTab('list')} 
            style={{ 
              background: tab === 'list' ? 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' : 'transparent',
              color: tab === 'list' ? 'white' : '#6b7280',
              border: 'none',
              padding: '12px 24px', 
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            📋 Registrations List
          </button>
          <button 
            onClick={() => setTab('viz')} 
            style={{ 
              background: tab === 'viz' ? 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' : 'transparent',
              color: tab === 'viz' ? 'white' : '#6b7280',
              border: 'none',
              padding: '12px 24px', 
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            📊 Data Visualization
          </button>
        </div>
      </div>


      {loading && (
        <div className="grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="card" key={`sk-admin-${i}`} style={{ padding: 0 }}>
              <div style={{ padding: 12 }}>
                <div className="skeleton-line skeleton-line-lg" style={{ width: '60%', height: '22px' }} />
                <div className="skeleton-line skeleton-line-md" style={{ width: '40%', marginTop: 10 }} />
                <div className="skeleton-line" style={{ width: '90%', marginTop: 16 }} />
                <div className="skeleton-line" style={{ width: '80%' }} />
                <div className="skeleton-line" style={{ width: '70%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'list' && (
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', padding: 20 }}>
            <h2 style={{ color: 'white', margin: 0, fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
              📋 Registrations List
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: 14 }}>
                {filteredRegs.length} {filteredRegs.length === 1 ? 'registration' : 'registrations'}
              </span>
            </h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', fontSize: 14, fontWeight: 600, color: '#374151' }}>
                  <th style={{ padding: 12, textAlign: 'left' }}>Participant</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Email</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Type</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Gender</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Year</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Department</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Team</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Members</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Fee</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Payment</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Winner Status</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Registered At</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegs.map((r, idx) => (
                  <tr key={`${r._id}-${idx}`} style={{ borderTop: '1px solid #e5e7eb', fontSize: 15 }}>
                    <td style={{ padding: 12 }}>{r._displayName}</td>
                    <td style={{ padding: 12 }}>{r._displayEmail}</td>
                    <td style={{ padding: 12 }}>
                      {(() => {
                        // Determine registration type - fallback to email check if not set
                        let regType = r.registrationType;
                        if (!regType && r.userId?.email) {
                          regType = r.userId.email.toLowerCase().endsWith('@gmrit.edu.in') ? 'internal' : 'external';
                        }
                        const isInternal = regType === 'internal';
                        return (
                          <span style={{ 
                            background: isInternal ? '#dcfce7' : '#fef3c7',
                            color: isInternal ? '#166534' : '#92400e',
                            padding: '4px 8px',
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 600
                          }}>
                            {isInternal ? 'Internal' : 'External'}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ padding: 12 }}>{r._displayGender}</td>
                    <td style={{ padding: 12 }}>{r._displayYear}</td>
                    <td style={{ padding: 12 }}>{r.department || '—'}</td>
                    <td style={{ padding: 12 }}>{r._displayTeam}</td>
                    <td style={{ padding: 12 }}>{r._displayMembers}</td>
                    <td style={{ padding: 12 }}>₹{r.totalFee}</td>
                    <td style={{ padding: 12 }}>
                      <span className="badge" style={{ background: r.paymentStatus === 'completed' ? '#22c55e' : r.paymentStatus === 'failed' ? '#ef4444' : '#f59e0b', color: '#fff', padding: '4px 8px', borderRadius: 6 }}>
                        {r.paymentStatus}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      {r.paymentStatus === 'completed' ? (
                        <select
                          value={r.winnerStatus || 'none'}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            try {
                              await api.post(`/api/registrations/${r._id}/set-winner-status`, { winnerStatus: newStatus });
                              toast.success(`Winner status updated to ${newStatus}`);
                              // Reload registrations
                              const { data } = await api.get(`/api/registrations/event/${id}`);
                              setRegistrations(data);
                            } catch (err) {
                              toast.error(err.response?.data?.message || 'Failed to update winner status');
                            }
                          }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 6,
                            border: '2px solid #e5e7eb',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: r.winnerStatus === 'winner' ? '#dcfce7' : r.winnerStatus === 'runner' ? '#fef3c7' : '#f9fafb',
                            color: r.winnerStatus === 'winner' ? '#166534' : r.winnerStatus === 'runner' ? '#92400e' : '#6b7280'
                          }}
                        >
                          <option value="none">None</option>
                          <option value="winner">Winner</option>
                          <option value="runner">Runner</option>
                        </select>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td style={{ padding: 12 }}>{new Date(r.registeredAt).toLocaleString()}</td>
                  </tr>
                ))}
                {filteredRegs.length === 0 && (
                  <tr>
                    <td colSpan={12} style={{ padding: 16, textAlign: 'center' }} className="muted">No registrations found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && tab === 'feedbacks' && (
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', padding: 20 }}>
            <h2 style={{ color: 'white', margin: 0, fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
              💬 Event Feedback
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: 14 }}>
                {feedback.length} {feedback.length === 1 ? 'response' : 'responses'}
              </span>
            </h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', fontSize: 14, fontWeight: 600, color: '#374151' }}>
                  <th style={{ padding: 12, textAlign: 'left' }}>Email (Team)</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Year</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Feedback</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Rating</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {feedback.map((f) => {
                  // Resolve registration for this feedback.
                  // 1) by owner id
                  // 2) by exact team member email
                  // 3) by local-part of feedback email vs team member name
                  let reg = registrations.find(r => (r.userId?._id || '') === (f.studentRegistrationId || ''));
                  const fbEmail = (f?.studentDetails?.email || '').toLowerCase();
                  const fbLocal = fbEmail.split('@')[0] || '';
                  if (!reg && fbEmail) {
                    reg = registrations.find(r => Array.isArray(r.teamMembers) && r.teamMembers.some(m => (m?.email || '').toLowerCase() === fbEmail));
                  }
                  if (!reg && fbLocal) {
                    reg = registrations.find(r => Array.isArray(r.teamMembers) && r.teamMembers.some(m => (m?.name || '').trim().toLowerCase() === fbLocal));
                  }
                  if (!reg && fbLocal) {
                    reg = registrations.find(r => Array.isArray(r.teamResolved) && r.teamResolved.some(m => (m?.name || '').trim().toLowerCase() === fbLocal));
                  }
                  const team = reg?.teamName || '—';
                  const yr = reg?.year || reg?.userId?.year || '—';
                  const email = f?.studentDetails?.email || (reg?.userId?.email || '—');
                  return (
                    <tr key={f._id} style={{ borderTop: '1px solid #e5e7eb', fontSize: 15 }}>
                      <td style={{ padding: 12 }}>{email}{team && team !== '—' ? ` (${team})` : ''}</td>
                      <td style={{ padding: 12 }}>{yr}</td>
                      <td style={{ padding: 12 }}>{f.review || '—'}</td>
                      <td style={{ padding: 12 }}>{f.rating || '—'}</td>
                      <td style={{ padding: 12 }}>{new Date(f.createdAt || Date.now()).toLocaleString()}</td>
                    </tr>
                  );
                })}
                {feedback.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 16, textAlign: 'center' }} className="muted">No feedback yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && tab === 'viz' && (
        <div style={{ width: 'calc(100% + 48px)', margin: '0 -24px' }}>
          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24, padding: '0 24px' }}>
            <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)', color: 'white', borderRadius: 12, boxShadow: '0 4px 12px rgba(142, 45, 226, 0.4)' }}>
              <div style={{ fontSize: 14, opacity: 0.95, marginBottom: 4, fontWeight: 600 }}>Total Teams</div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{totals.teams}</div>
            </div>
            <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)', color: 'white', borderRadius: 12, boxShadow: '0 4px 12px rgba(255, 107, 107, 0.4)' }}>
              <div style={{ fontSize: 14, opacity: 0.95, marginBottom: 4, fontWeight: 600 }}>Total Members</div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{totals.members}</div>
            </div>
            <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: 'white', borderRadius: 12, boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)' }}>
              <div style={{ fontSize: 14, opacity: 0.95, marginBottom: 4, fontWeight: 600 }}>Internal</div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{totals.internal}</div>
            </div>
            <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', borderRadius: 12, boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)' }}>
              <div style={{ fontSize: 14, opacity: 0.95, marginBottom: 4, fontWeight: 600 }}>External</div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{totals.external}</div>
            </div>
            <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, #06beb6 0%, #48b1bf 100%)', color: 'white', borderRadius: 12, boxShadow: '0 4px 12px rgba(6, 190, 182, 0.4)' }}>
              <div style={{ fontSize: 14, opacity: 0.95, marginBottom: 4, fontWeight: 600 }}>Avg Team Size</div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{totals.teams > 0 ? (totals.members / totals.teams).toFixed(1) : 0}</div>
            </div>
          </div>

          {/* Dimension Selector */}
          <div className="card" style={{ padding: 20, margin: '0 24px 24px', borderRadius: 12, background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <label style={{ fontWeight: 600, fontSize: 15, color: '#374151' }}>Analyze by:</label>
              <select 
                value={dimension} 
                onChange={(e) => setDimension(e.target.value)}
                style={{ 
                  padding: '10px 16px', 
                  borderRadius: 8, 
                  border: '2px solid #e5e7eb', 
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: 'white',
                  minWidth: 200,
                  transition: 'all 0.2s'
                }}
              >
                <option value="department">📊 Department</option>
                <option value="gender">👥 Gender</option>
                <option value="year">🎓 Year</option>
                <option value="day">📅 Registration Date</option>
              </select>
            </div>
          </div>

          {/* Charts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 24, padding: '0 24px' }}>
            <div className="card" style={{ padding: 24, borderRadius: 12, background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
              <h4 style={{ marginTop: 0, marginBottom: 16, fontSize: 18, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                📊 Bar Chart
              </h4>
              <BarChart data={vizData} />
            </div>
            <div className="card" style={{ padding: 24, borderRadius: 12, background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
              <h4 style={{ marginTop: 0, marginBottom: 16, fontSize: 18, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                🥧 Pie Chart
              </h4>
              <PieChart data={vizData} />
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminRegistrations;

// Helper to derive a display name for participant/team
function deriveParticipantName(r) {
  // If team has members, show team or first member
  if (r.teamName) return r.teamName;
  const firstMember = Array.isArray(r.teamMembers) && r.teamMembers.find(m => m?.name);
  if (firstMember) return firstMember.name;
  if (r.userId?.name && String(r.userId.name).trim()) return r.userId.name;
  const email = r.userId?.email || '';
  if (email) return email.split('@')[0];
  return 'Participant';
}
