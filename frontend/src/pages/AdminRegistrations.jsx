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

  // Totals: teams and members
  const totals = useMemo(() => {
    const teams = (registrations || []).length;
    let members = 0;
    for (const r of registrations || []) {
      const count = Array.isArray(r.teamResolved) && r.teamResolved.length > 0
        ? r.teamResolved.length
        : (Array.isArray(r.teamMembers) && r.teamMembers.length > 0 ? r.teamMembers.length : 1);
      members += count;
    }
    return { teams, members };
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

  // Derived filtered rows
  const filteredRegs = registrations; // no filters

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

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 12, gap: 10 }}>
        <button className="nav-link" onClick={() => navigate(-1)}>← Back</button>
        <h2 style={{ margin: 0 }}>{event?.name || 'Registrations'}</h2>
      </div>

      {/* Centered tab bar */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <div className="card" style={{ padding: 12, display: 'inline-flex', gap: 12, borderRadius: 9999, minWidth: 520 }}>
          <button className="btn-secondary" onClick={() => setTab('feedbacks')} style={{ background: tab === 'feedbacks' ? '#111827' : undefined, padding: '10px 18px', fontSize: 15 }}>
            Feedbacks
          </button>
          <button className="btn-secondary" onClick={() => setTab('list')} style={{ background: tab === 'list' ? '#111827' : undefined, padding: '10px 18px', fontSize: 15 }}>
            Registrations List
          </button>
          <button className="btn-secondary" onClick={() => setTab('viz')} style={{ background: tab === 'viz' ? '#111827' : undefined, padding: '10px 18px', fontSize: 15 }}>
            Data Visualization
          </button>
        </div>
      </div>

      {/* Totals summary */}
      {!loading && (
        <div className="card" style={{ padding: 12, marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div><strong>Teams:</strong> {totals.teams}</div>
          <div><strong>Members:</strong> {totals.members}</div>
          <div className="muted">Counts include all team members across registrations</div>
        </div>
      )}

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
        <div className="card" style={{ padding: 0, width: 'calc(100% + 48px)', margin: '0 -24px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', fontSize: 15 }}>
                  <th style={{ padding: 12, textAlign: 'left' }}>Participant</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Email</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Gender</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Year</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Department</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Team</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Members</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Fee</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Payment</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Registered At</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegs.map((r) => (
                  <tr key={r._id} style={{ borderTop: '1px solid #e5e7eb', fontSize: 15 }}>
                    <td style={{ padding: 12 }}>{r.userId?.email?.split('@')[0] || '—'}</td>
                    <td style={{ padding: 12 }}>{r.userId?.email || '—'}</td>
                    <td style={{ padding: 12 }}>{r.userId?.gender || '—'}</td>
                    <td style={{ padding: 12 }}>{r.year || r.userId?.year || '—'}</td>
                    <td style={{ padding: 12 }}>{r.department || '—'}</td>
                    <td style={{ padding: 12 }}>{r.teamName || '—'}</td>
                    <td style={{ padding: 12 }}>
                      {Array.isArray(r.teamResolved) && r.teamResolved.length > 0
                        ? r.teamResolved.map(m => m?.name || (m?.email ? m.email.split('@')[0] : 'Member')).join(', ')
                        : (Array.isArray(r.teamMembers) && r.teamMembers.length > 0
                            ? r.teamMembers.map(m => m?.name || (m?.email ? m.email.split('@')[0] : 'Member')).join(', ')
                            : '—')}
                    </td>
                    <td style={{ padding: 12 }}>₹{r.totalFee}</td>
                    <td style={{ padding: 12 }}>
                      <span className="badge" style={{ background: r.paymentStatus === 'completed' ? '#22c55e' : r.paymentStatus === 'failed' ? '#ef4444' : '#f59e0b', color: '#fff', padding: '4px 8px', borderRadius: 6 }}>
                        {r.paymentStatus}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>{new Date(r.registeredAt).toLocaleString()}</td>
                  </tr>
                ))}
                {filteredRegs.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ padding: 16, textAlign: 'center' }} className="muted">No registrations found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && tab === 'feedbacks' && (
        <div className="card" style={{ padding: 0, width: 'calc(100% + 48px)', margin: '0 -24px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', fontSize: 15 }}>
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
        <div className="card" style={{ padding: 16, width: 'calc(100% + 48px)', margin: '0 -24px' }}>
          <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <label>Dimension:</label>
            <select value={dimension} onChange={(e) => setDimension(e.target.value)}>
              <option value="department">Department</option>
              <option value="gender">Gender</option>
              <option value="year">Year</option>
              <option value="day">Date of Registration</option>
            </select>
          </div>
          <div style={{ marginBottom: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div><strong>Total teams:</strong> {totals.teams}</div>
            <div><strong>Total members:</strong> {totals.members}</div>
          </div>
          <div className="grid">
            <div className="card" style={{ padding: 12 }}>
              <h4 style={{ marginTop: 0, marginBottom: 8 }}>Bar Chart</h4>
              <BarChart data={vizData} />
            </div>
            <div className="card" style={{ padding: 12 }}>
              <h4 style={{ marginTop: 0, marginBottom: 8 }}>Pie Chart</h4>
              <PieChart data={vizData} />
            </div>
          </div>
        </div>
      )}
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
