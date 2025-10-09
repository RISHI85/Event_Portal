import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import CertificateTemplate from '../components/CertificateTemplate';

const useQuery = () => new URLSearchParams(useLocation().search);

const empty = {
  name: '',
  description: '',
  date: '',
  time: '',
  location: '',
  imageUrl: '',
  isMainEvent: true,
  parentEvent: '',
  department: '',
  // New fields
  multiDay: false,
  numberOfDays: 1,
  schedule: [{ date: '', time: '' }], // per-day date/time
  hasMultipleRounds: false,
  numberOfRounds: 1,
  adminContacts: [{ name: '', email: '', phone: '' }],
  registrationDetails: {
    feePerHead: 0,
    teamParticipation: false,
    teamSize: { type: 'individual', value: 1, minValue: 1, maxValue: 1 },
  },
  // Certificate configuration (optional)
  certificateTemplateUrl: '',
  certificateOrganizer: '',
  certificateAwardText: 'Certificate of Participation',
};

const AdminEventForm = () => {
  const { id } = useParams();
  const query = useQuery();
  const parentFromQuery = query.get('parent') || '';
  const navigate = useNavigate();

  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [mainEvents, setMainEvents] = useState([]);
  const [basicRegistrationEnabled, setBasicRegistrationEnabled] = useState(false);
  const [basicRegistrationAmount, setBasicRegistrationAmount] = useState(0);

  // Load main events for parent selection when adding sub-event
  useEffect(() => {
    const loadParents = async () => {
      try {
        const { data } = await api.get('/api/events?isMainEvent=true');
        setMainEvents(data);
      } catch {}
    };
    loadParents();
  }, []);

  // If editing, load event
  useEffect(() => {
    const load = async () => {
      if (!id) {
        // creating
        if (parentFromQuery) setForm((f) => ({ ...f, isMainEvent: false, parentEvent: parentFromQuery }));
        return;
      }
      try {
        const { data } = await api.get(`/api/events/${id}`);
        setForm({
          name: data.name,
          description: data.description || '',
          date: data.date ? data.date.substring(0, 10) : '',
          time: data.time || '',
          location: data.location || '',
          imageUrl: data.imageUrl || '',
          isMainEvent: data.isMainEvent,
          parentEvent: data.parentEvent?._id || '',
          department: data.department || '',
          multiDay: !!data.multiDay,
          numberOfDays: data.numberOfDays || 1,
          schedule: Array.isArray(data.schedule) && data.schedule.length > 0 ? data.schedule.map(s=>({
            date: s.date ? String(s.date).slice(0,10) : '',
            time: s.time || ''
          })) : [{ date: data.date ? data.date.substring(0,10) : '', time: data.time || '' }],
          hasMultipleRounds: !!data.hasMultipleRounds,
          numberOfRounds: data.numberOfRounds || 1,
          adminContacts: Array.isArray(data.adminContacts) && data.adminContacts.length > 0
            ? data.adminContacts.map(c => ({ name: c.name || '', email: c.email || '', phone: c.phone || '' }))
            : [{ name: '', email: '', phone: '' }],
          registrationDetails: {
            feePerHead: data.registrationDetails?.feePerHead ?? 0,
            teamParticipation: !!data.registrationDetails?.teamParticipation,
            teamSize: data.registrationDetails?.teamSize || { type: 'individual', value: 1, minValue: 1, maxValue: 1 },
          },
          certificateTemplateUrl: data.certificateTemplateUrl || '',
          certificateOrganizer: data.certificateOrganizer || '',
          certificateAwardText: data.certificateAwardText || 'Certificate of Participation',
        });
        setBasicRegistrationEnabled(!!data.basicRegistrationEnabled);
        setBasicRegistrationAmount(Number(data.basicRegistrationAmount || 0));
      } catch (e) {
        toast.error('Failed to load event');
      }
    };
    load();
  }, [id, parentFromQuery]);

  const uploadImage = async (file) => {
    // Validate file type
    if (!file.type.match('image.*')) {
      throw new Error('Only image files are allowed');
    }
    
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Image size should be less than 5MB');
    }
    
    const fd = new FormData();
    fd.append('image', file);
    
    try {
      const { data } = await api.post('/api/upload/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.imageUrl;
    } catch (error) {
      console.error('Image upload failed:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload image. Please try again.';
      throw new Error(errorMessage);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      payload.registrationDetails = {
        ...payload.registrationDetails,
        feePerHead: Number(payload.registrationDetails.feePerHead || 0),
        teamParticipation: !!payload.registrationDetails.teamParticipation,
      };

      // Normalize team size object
      const ts = payload.registrationDetails.teamSize || { type: 'individual', value: 1, minValue: 1, maxValue: 1 };
      if (!payload.registrationDetails.teamParticipation) {
        payload.registrationDetails.teamSize = { type: 'individual', value: 1, minValue: 1, maxValue: 1 };
      } else {
        // Ensure numeric fields are numbers and sane
        const num = (v) => {
          const n = Number(v);
          return Number.isFinite(n) ? n : 1;
        };
        if (ts.type === 'fixed') {
          payload.registrationDetails.teamSize = { type: 'fixed', value: num(ts.value), minValue: num(ts.value), maxValue: num(ts.value) };
        } else if (ts.type === 'range') {
          payload.registrationDetails.teamSize = { type: 'range', minValue: num(ts.minValue), maxValue: num(ts.maxValue) };
        } else if (ts.type === 'at_most') {
          payload.registrationDetails.teamSize = { type: 'at_most', minValue: 1, maxValue: num(ts.maxValue) };
        } else if (ts.type === 'at_least') {
          payload.registrationDetails.teamSize = { type: 'at_least', minValue: num(ts.minValue), maxValue: num(ts.maxValue || ts.minValue) };
        } else {
          payload.registrationDetails.teamSize = { type: 'individual', value: 1, minValue: 1, maxValue: 1 };
        }
      }

      // sanitize parent on client too
      if (payload.isMainEvent) payload.parentEvent = '';

      // Ensure certificate fields are strings
      payload.certificateTemplateUrl = String(payload.certificateTemplateUrl || '');
      payload.certificateOrganizer = String(payload.certificateOrganizer || '');
      payload.certificateAwardText = String(payload.certificateAwardText || 'Certificate of Participation');

      // Basic registration fields (main events only)
      payload.basicRegistrationEnabled = !!basicRegistrationEnabled;
      payload.basicRegistrationAmount = Number(basicRegistrationAmount || 0);

      if (id) {
        await api.put(`/api/events/${id}`, payload);
        toast.success('Event updated');
      } else {
        await api.post('/api/events', payload);
        toast.success('Event created');
      }
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const eventType = useMemo(() => {
    if (form.isMainEvent) return 'main';
    if (form.parentEvent) return 'sub';
    return 'department';
  }, [form.isMainEvent, form.parentEvent]);

  return (
    <div className="container">
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>{id ? 'Edit Event' : 'Add Event'}</h2>
          <button className="nav-link" onClick={() => navigate('/admin')}>← Back</button>
        </div>

        <form className="form-grid" onSubmit={onSubmit}>
          <label>Event Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />

          <label>Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />

          <label>Date</label>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required={!form.isMainEvent} />

          <label>Time</label>
          <input placeholder="e.g., 10:00 AM - 12:00 PM" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required={!form.isMainEvent} />

          {/* Multi-day event controls */}
          <label style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input type="checkbox" checked={!!form.multiDay} onChange={(e)=>{
              const checked = e.target.checked;
              setForm((f)=>({
                ...f,
                multiDay: checked,
                numberOfDays: checked ? Math.max(1, Number(f.numberOfDays || 2)) : 1,
                schedule: checked ? (f.schedule && f.schedule.length>0 ? f.schedule : [{ date: f.date, time: f.time }]) : [{ date: f.date, time: f.time }]
              }));
            }} />
            Multi-day event?
          </label>
          {form.multiDay && (
            <>
              <label>Number of Days</label>
              <input type="number" min={1} value={form.numberOfDays}
                     onChange={(e)=>{
                       const n = Math.max(1, Number(e.target.value || 1));
                       setForm((f)=>{
                         const sched = Array.isArray(f.schedule) ? [...f.schedule] : [];
                         while (sched.length < n) sched.push({ date: '', time: '' });
                         if (sched.length > n) sched.length = n;
                         return { ...f, numberOfDays: n, schedule: sched };
                       });
                     }} />
              {Array.from({ length: Math.max(1, Number(form.numberOfDays || 1)) }).map((_, i) => (
                <div key={`day-${i}`} className="form-grid" style={{border:'1px solid #eee', padding:10, borderRadius:8}}>
                  <label>Day {i+1} Date
                    <input type="date" value={form.schedule?.[i]?.date || ''}
                           onChange={(e)=>{
                             const v = e.target.value;
                             setForm((f)=>{
                               const sched = Array.isArray(f.schedule) ? [...f.schedule] : [];
                               while (sched.length <= i) sched.push({ date:'', time:'' });
                               sched[i] = { ...sched[i], date: v };
                               return { ...f, schedule: sched };
                             });
                           }} />
                  </label>
                  <label>Day {i+1} Time
                    <input value={form.schedule?.[i]?.time || ''} placeholder="e.g., 10:00 AM - 12:00 PM"
                           onChange={(e)=>{
                             const v = e.target.value;
                             setForm((f)=>{
                               const sched = Array.isArray(f.schedule) ? [...f.schedule] : [];
                               while (sched.length <= i) sched.push({ date:'', time:'' });
                               sched[i] = { ...sched[i], time: v };
                               return { ...f, schedule: sched };
                             });
                           }} />
                  </label>
                </div>
              ))}
            </>
          )}

          <label>Location</label>
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required={!form.isMainEvent} />

          {/* Admin Contacts */}
          <fieldset style={{ border: '1px solid #eee', padding: 10, borderRadius: 8, marginTop: 10 }}>
            <legend>Admin Contacts (Total: {Array.isArray(form.adminContacts) ? form.adminContacts.length : 0})</legend>
            {(form.adminContacts || []).map((c, i) => (
              <div key={`adm-${i}`} className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr auto', alignItems: 'end' }}>
                <label>Name
                  <input value={c.name} onChange={(e)=>{
                    const v = e.target.value; setForm(f=>{ const arr=[...(f.adminContacts||[])]; arr[i]={...arr[i], name:v}; return {...f, adminContacts:arr}; });
                  }} />
                </label>
                <label>Email
                  <input type="email" value={c.email} onChange={(e)=>{
                    const v = e.target.value; setForm(f=>{ const arr=[...(f.adminContacts||[])]; arr[i]={...arr[i], email:v}; return {...f, adminContacts:arr}; });
                  }} />
                </label>
                <label>Phone
                  <input value={c.phone} onChange={(e)=>{
                    const v = e.target.value; setForm(f=>{ const arr=[...(f.adminContacts||[])]; arr[i]={...arr[i], phone:v}; return {...f, adminContacts:arr}; });
                  }} />
                </label>
                <button type="button" className="btn-secondary" onClick={()=>{
                  setForm(f=>{ const arr=[...(f.adminContacts||[])]; arr.splice(i,1); return {...f, adminContacts: arr.length?arr:[{name:'',email:'',phone:''}]}; });
                }}>Remove</button>
              </div>
            ))}
            <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
              <button type="button" className="btn-primary" onClick={()=>{
                setForm(f=>({ ...f, adminContacts: [...(f.adminContacts||[]), { name:'', email:'', phone:'' }] }));
              }}>Add Admin Contact</button>
            </div>
          </fieldset>

          <label>Event Image</label>
          <div>
            <input
              type="file"
              accept="image/*"
              disabled={uploadingImage}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                
                setUploadingImage(true);
                try {
                  const url = await uploadImage(file);
                  // Use functional setState to avoid overwriting concurrent form changes
                  setForm((prev) => ({ ...prev, imageUrl: url }));
                  toast.success('Image uploaded successfully');
                } catch (err) {
                  console.error('Upload error:', err);
                  toast.error(err.message || 'Failed to upload image');
                } finally {
                  setUploadingImage(false);
                  // Reset the input to allow selecting the same file again if needed
                  e.target.value = '';
                }
              }}
              className="file-input"
              id="event-image-upload"
              style={{ display: 'none' }}
            />
            <label 
              htmlFor="event-image-upload" 
              className={`btn ${uploadingImage ? 'btn-disabled' : 'btn-secondary'}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: uploadingImage ? 'not-allowed' : 'pointer',
                opacity: uploadingImage ? 0.7 : 1,
                marginBottom: '8px'
              }}
            >
              {uploadingImage ? (
                <>
                  <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
                  Uploading...
                </>
              ) : (
                'Choose Image'
              )}
            </label>
            <div className="muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              {form.imageUrl ? 'Image selected' : 'No image selected'}
              {form.imageUrl && (
                <button 
                  type="button" 
                  onClick={() => setForm({ ...form, imageUrl: '' })}
                  style={{ 
                    marginLeft: '8px',
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    padding: '2px 4px'
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          {form.imageUrl && (
            <div style={{ marginTop: '12px' }}>
              <img
                src={form.imageUrl}
                alt="preview"
                style={{ 
                  width: '100%', 
                  height: 180, 
                  objectFit: 'contain',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                  padding: '8px'
                }}
                onError={(e) => {
                  console.error('Error loading image:', form.imageUrl);
                  e.target.src = 'https://via.placeholder.com/400x180?text=Image+not+found';
                  e.target.style.objectFit = 'contain';
                  e.target.style.padding = '20px';
                }}
              />
              <div className="muted" style={{ fontSize: '0.8rem', marginTop: '4px', textAlign: 'center' }}>
                Image Preview
              </div>
            </div>
          )}

          {/* Certificate Template Settings */}
          <fieldset style={{ border: '1px solid #eee', padding: 10, borderRadius: 8, marginTop: 10 }}>
            <legend>Certificate Template</legend>
            <label>Template Background URL (optional)</label>
            <input
              placeholder="e.g., https://.../certificate-bg.png (or leave empty to use default)"
              value={form.certificateTemplateUrl}
              onChange={(e) => setForm({ ...form, certificateTemplateUrl: e.target.value })}
            />

            <label>Organizer / Signatory (optional)</label>
            <input
              placeholder="e.g., Event Coordinator"
              value={form.certificateOrganizer}
              onChange={(e) => setForm({ ...form, certificateOrganizer: e.target.value })}
            />

            <label>Award Title</label>
            <input
              placeholder="Certificate of Participation"
              value={form.certificateAwardText}
              onChange={(e) => setForm({ ...form, certificateAwardText: e.target.value })}
            />

            <div className="card" style={{ padding: 12, marginTop: 12 }}>
              <div className="muted" style={{ marginBottom: 8 }}>Template Preview</div>
              <CertificateTemplate
                participantName={'John Doe'}
                eventName={form.name || 'Event Name'}
                dateText={form.date ? new Date(form.date).toLocaleDateString() : ''}
                organizerText={form.certificateOrganizer || ''}
                awardText={form.certificateAwardText || 'Certificate of Participation'}
                accentColor={'#111827'}
                primaryColor={'#2563EB'}
                bgPattern={form.certificateTemplateUrl || ''}
                issuerName={'GMRIT'}
                logoUrl={form.imageUrl || ''}
                showSeal={true}
                sealSize={90}
                sealText={'Official'}
                downloadBaseName={'template-preview'}
                showActions={false}
              />
            </div>
          </fieldset>

          <label>Event Type</label>
          <select
            value={eventType}
            onChange={(e) => {
              const v = e.target.value;
              if (v === 'main') setForm({ ...form, isMainEvent: true, parentEvent: '' });
              if (v === 'sub') setForm({ ...form, isMainEvent: false });
              if (v === 'department') setForm({ ...form, isMainEvent: true });
            }}
          >
            <option value="main">Main Event</option>
            <option value="sub">Sub Event</option>
            <option value="department">Department Event</option>
          </select>

          {eventType === 'sub' && (
            <>
              <label>Parent Main Event</label>
              <select
                value={form.parentEvent}
                onChange={(e) => setForm({ ...form, parentEvent: e.target.value })}
                required
              >
                <option value="">Select main event</option>
                {mainEvents.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </>
          )}

          <label>Department (optional for department events)</label>
          <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />

          {/* Basic Registration (main events) */}
          {eventType === 'main' && (
            <fieldset style={{ border: '1px solid #eee', padding: 10, borderRadius: 8, marginTop: 10 }}>
              <legend>Basic Registration (Main Event)</legend>
              <label style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input
                  type="checkbox"
                  checked={basicRegistrationEnabled}
                  onChange={(e) => setBasicRegistrationEnabled(e.target.checked)}
                />
                Enable basic registration for this main event
              </label>
              {basicRegistrationEnabled && (
                <label>Basic Registration Amount (₹)
                  <input
                    type="number"
                    min={0}
                    value={basicRegistrationAmount}
                    onChange={(e) => setBasicRegistrationAmount(Number(e.target.value || 0))}
                  />
                </label>
              )}
              <small className="muted">When enabled, users can register for the main event. Sub-events continue to use their own fee.</small>
            </fieldset>
          )}

          <fieldset style={{ border: '1px solid #eee', padding: 10, borderRadius: 8, marginTop: 10 }}>
            <legend>Registration Details</legend>
            <label>Total Fee (per team / entry)</label>
            <input
              type="number"
              min={0}
              value={form.registrationDetails.feePerHead}
              onChange={(e) =>
                setForm({
                  ...form,
                  registrationDetails: {
                    ...form.registrationDetails,
                    feePerHead: e.target.value,
                  },
                })
              }
              placeholder="e.g., 300 (this is the full amount per team)"
            />

            <label>
              <input
                type="checkbox"
                checked={form.registrationDetails.teamParticipation}
                onChange={(e) =>
                  setForm({
                    ...form,
                    registrationDetails: {
                      ...form.registrationDetails,
                      teamParticipation: e.target.checked,
                    },
                  })
                }
              />{' '}
              Team Participation
            </label>
          </fieldset>

          {/* Multiple rounds */}
          <label style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input type="checkbox" checked={!!form.hasMultipleRounds} onChange={(e)=>{
              const c = e.target.checked;
              setForm((f)=>({ ...f, hasMultipleRounds: c, numberOfRounds: c ? Math.max(1, Number(f.numberOfRounds || 2)) : 1 }));
            }} />
            Has multiple rounds?
          </label>
          {form.hasMultipleRounds && (
            <>
              <label>Number of Rounds</label>
              <input type="number" min={1} value={form.numberOfRounds}
                     onChange={(e)=> setForm((f)=>({ ...f, numberOfRounds: Math.max(1, Number(e.target.value || 1)) }))} />
            </>
          )}

          {/* Team Size configuration when team participation is enabled */}
          {form.registrationDetails.teamParticipation && (
            <fieldset style={{ border: '1px solid #eee', padding: 10, borderRadius: 8, marginTop: 10 }}>
              <legend>Team Size</legend>
              <label>Type</label>
              <select
                value={form.registrationDetails.teamSize?.type || 'individual'}
                onChange={(e) => setForm({
                  ...form,
                  registrationDetails: {
                    ...form.registrationDetails,
                    teamSize: { ...form.registrationDetails.teamSize, type: e.target.value }
                  }
                })}
              >
                <option value="individual">Individual</option>
                <option value="fixed">Fixed</option>
                <option value="range">Range</option>
                <option value="at_most">At most</option>
                <option value="at_least">At least</option>
              </select>

              {form.registrationDetails.teamSize?.type === 'fixed' && (
                <label>Exact Team Size
                  <input type="number" min={1}
                         value={form.registrationDetails.teamSize?.value || 1}
                         onChange={(e) => setForm({
                           ...form,
                           registrationDetails: {
                             ...form.registrationDetails,
                             teamSize: { ...form.registrationDetails.teamSize, value: e.target.value }
                           }
                         })}
                  />
                </label>
              )}

              {form.registrationDetails.teamSize?.type === 'range' && (
                <div className="form-grid">
                  <label>Min Team Size
                    <input type="number" min={1}
                           value={form.registrationDetails.teamSize?.minValue || 1}
                           onChange={(e) => setForm({
                             ...form,
                             registrationDetails: {
                               ...form.registrationDetails,
                               teamSize: { ...form.registrationDetails.teamSize, minValue: e.target.value }
                             }
                           })}
                    />
                  </label>
                  <label>Max Team Size
                    <input type="number" min={1}
                           value={form.registrationDetails.teamSize?.maxValue || 1}
                           onChange={(e) => setForm({
                             ...form,
                             registrationDetails: {
                               ...form.registrationDetails,
                               teamSize: { ...form.registrationDetails.teamSize, maxValue: e.target.value }
                             }
                           })}
                    />
                  </label>
                </div>
              )}

              {form.registrationDetails.teamSize?.type === 'at_most' && (
                <label>Max Team Size
                  <input type="number" min={1}
                         value={form.registrationDetails.teamSize?.maxValue || 1}
                         onChange={(e) => setForm({
                           ...form,
                           registrationDetails: {
                             ...form.registrationDetails,
                             teamSize: { ...form.registrationDetails.teamSize, maxValue: e.target.value }
                           }
                         })}
                  />
                </label>
              )}

              {form.registrationDetails.teamSize?.type === 'at_least' && (
                <label>Min Team Size
                  <input type="number" min={1}
                         value={form.registrationDetails.teamSize?.minValue || 1}
                         onChange={(e) => setForm({
                           ...form,
                           registrationDetails: {
                             ...form.registrationDetails,
                             teamSize: { ...form.registrationDetails.teamSize, minValue: e.target.value }
                           }
                         })}
                  />
                </label>
              )}
            </fieldset>
          )}

          
        {/* Fixed bottom action bar (always visible) */}
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            background: '#ffffffcc',
            backdropFilter: 'saturate(180%) blur(6px)',
            padding: '10px 16px',
            borderTop: '1px solid #eee',
            display: 'flex',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div style={{ width: '100%', maxWidth: 1100, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn-secondary" type="button" onClick={() => navigate('/admin')}>
              Cancel
            </button>
            <button className="btn-primary" type="submit" disabled={saving}>
              {id ? 'Update Event' : 'Add Event'}
            </button>
          </div>
        </div>
        {/* Spacer so fixed bar doesn't cover inputs at the very bottom */}
        <div style={{ height: 72 }} />
      </form>
      </div>
    </div>
  );
};
export default AdminEventForm;
