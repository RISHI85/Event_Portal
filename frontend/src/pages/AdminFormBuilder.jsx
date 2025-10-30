import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

const emptyField = () => ({ key: '', label: '', type: 'text', required: false, options: [], inputType: '', bindTo: '', order: 0 });

const typeOptions = ['text','number','date','radio','checkbox','select'];
const bindOptions = [
  { value: '', label: '— Not bound (stored in customFields) —' },
  { value: 'name', label: 'Event Name' },
  { value: 'description', label: 'Description' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'location', label: 'Location' },
  { value: 'department', label: 'Department' },
  { value: 'registrationDetails.feePerHead', label: 'Registration Fee' },
  { value: 'registrationDetails.teamParticipation', label: 'Team Participation' },
];

const defaultCoreFields = [
  { key: 'name', label: 'Event Name', type: 'text', required: true, inputType: 'text', bindTo: 'name' },
  { key: 'description', label: 'Description', type: 'text', required: false, inputType: 'text', bindTo: 'description' },
  { key: 'date', label: 'Date', type: 'date', required: false, bindTo: 'date' },
  { key: 'time', label: 'Time', type: 'text', required: false, inputType: 'text', bindTo: 'time' },
  { key: 'location', label: 'Location', type: 'text', required: false, inputType: 'text', bindTo: 'location' },
  { key: 'department', label: 'Department', type: 'text', required: false, inputType: 'text', bindTo: 'department' },
  { key: 'fee', label: 'Registration Fee', type: 'number', required: false, bindTo: 'registrationDetails.feePerHead' },
  { key: 'team', label: 'Team Participation', type: 'checkbox', required: false, bindTo: 'registrationDetails.teamParticipation' },
].map((f, i) => ({ ...emptyField(), ...f, order: i }));

const AdminFormBuilder = () => {
  const [fields, setFields] = useState([]);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/api/form-schema');
        const existing = Array.isArray(data?.fields) ? data.fields : [];
        if (existing.length > 0) setFields(existing);
        else setFields(defaultCoreFields);
      } catch {
        setFields([]);
      }
    };
    load();
  }, []);

  const addField = () => setFields((f) => [...f, { ...emptyField(), order: f.length }]);
  const removeField = (i) => setFields((f) => f.filter((_, idx) => idx !== i).map((x, idx) => ({ ...x, order: idx })));
  const move = (i, dir) => setFields((f) => {
    const arr = [...f];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return arr;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    return arr.map((x, idx) => ({ ...x, order: idx }));
  });

  const onSave = async () => {
    try {
      setSaving(true);
      // basic validation
      const keys = new Set();
      for (const fld of fields) {
        if (!fld.key || !fld.label) return toast.error('Every field needs key and label');
        if (keys.has(fld.key)) return toast.error(`Duplicate key: ${fld.key}`);
        keys.add(fld.key);
      }
      const payload = { fields: fields.map((f, i) => ({ ...f, order: i, options: Array.isArray(f.options) ? f.options : String(f.options||'').split(',').map(s=>s.trim()).filter(Boolean) })) };
      await api.post('/api/form-schema', payload);
      toast.success('Form schema saved');
      navigate('/admin');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container">
      <h2>Edit Event Addition Form</h2>
      <p style={{ color: '#6b7280', marginBottom: 16 }}>Add, remove, and reorder all fields shown in the event creation form. Bind a field to an existing event property or keep it unbound to store as a custom field.</p>
      <div style={{ display: 'flex', gap: 16, flexDirection: 'column' }}>
        {fields.map((f, i) => (
          <div key={i} className="card" style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12, alignItems: 'end' }}>
              <label style={{ display: 'flex', flexDirection: 'column' }}>Key
                <input value={f.key} onChange={(e)=> setFields(arr=>{ const a=[...arr]; a[i]={...a[i], key:e.target.value.trim()}; return a; })} placeholder="unique_key" />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column' }}>Label
                <input value={f.label} onChange={(e)=> setFields(arr=>{ const a=[...arr]; a[i]={...a[i], label:e.target.value}; return a; })} placeholder="Label" />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column' }}>Type
                <select value={f.type} onChange={(e)=> setFields(arr=>{ const a=[...arr]; a[i]={...a[i], type:e.target.value}; return a; })}>
                  {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column' }}>Input Type
                <input value={f.inputType || ''} onChange={(e)=> setFields(arr=>{ const a=[...arr]; a[i]={...a[i], inputType:e.target.value}; return a; })} placeholder="e.g., email, tel (for text)" />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column' }}>Bind To
                <select value={f.bindTo || ''} onChange={(e)=> setFields(arr=>{ const a=[...arr]; a[i]={...a[i], bindTo:e.target.value}; return a; })}>
                  {bindOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="checkbox" checked={!!f.required} onChange={(e)=> setFields(arr=>{ const a=[...arr]; a[i]={...a[i], required:e.target.checked}; return a; })} /> Required
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secondary" type="button" onClick={()=> move(i, -1)} disabled={i===0}>↑</button>
                <button className="btn-secondary" type="button" onClick={()=> move(i, 1)} disabled={i===fields.length-1}>↓</button>
                <button className="btn-secondary" type="button" onClick={()=> removeField(i)}>Remove</button>
              </div>
            </div>
            {(f.type === 'radio' || f.type === 'select') && (
              <label style={{ display: 'block', marginTop: 10 }}>Options (comma separated)
                <input value={Array.isArray(f.options) ? f.options.join(', ') : (f.options || '')} onChange={(e)=> setFields(arr=>{ const a=[...arr]; a[i]={...a[i], options:e.target.value}; return a; })} placeholder="Option1, Option2" />
              </label>
            )}
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap: 12, marginTop: 16 }}>
        <button className="btn-secondary" type="button" onClick={addField}>+ Add Field</button>
        <button className="btn-primary" type="button" onClick={onSave} disabled={saving}>Save</button>
        <button className="btn-secondary" type="button" onClick={()=> navigate('/admin')}>Cancel</button>
      </div>
    </div>
  );
};

export default AdminFormBuilder;
