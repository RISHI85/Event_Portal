import React, { useEffect } from 'react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import '../components/SkeletonCard/SkeletonCard.css';

const Profile = () => {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    gender: 'Prefer not to say',
    year: '',
    currentPassword: '',
    newPassword: ''
  });
  const [isEditing, setIsEditing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/api/auth/me');
        setUser(data);
        setForm((f) => ({
          ...f,
          name: data.name || '',
          email: data.email || '',
          gender: data.gender || 'Prefer not to say',
          year: data.year || ''
        }));
      } catch {}
      finally {
        setLoading(false);
      }
    };
    load();
  }, [setUser]);

  return (
    <div className="container">
      <h2>Profile</h2>
      {loading && (
        <div className="card" style={{ padding: 16 }}>
          <div className="skeleton-line skeleton-line-lg" style={{ width: '30%', height: 24 }} />
          <div className="skeleton-line" style={{ width: '70%', marginTop: 12 }} />
          <div className="skeleton-line" style={{ width: '60%' }} />
          <div className="skeleton-line" style={{ width: '50%' }} />
          <div className="skeleton-line" style={{ width: '40%' }} />
        </div>
      )}
      {!loading && user && !isEditing && (
        <div className="card" style={{display:'grid',gap:12,padding:16}}>
          <div><strong>Name:</strong> {user.name || '-'}</div>
          <div><strong>Email:</strong> {user.email}</div>
          <div><strong>Gender:</strong> {user.gender || 'Prefer not to say'}</div>
          <div><strong>Year:</strong> {user.year || '-'}</div>
          <div style={{display:'flex',gap:12,marginTop:8}}>
            <button className="btn-primary" onClick={async ()=>{
              try {
                // Refresh latest details before editing
                const { data } = await api.get('/api/auth/me');
                setUser(data);
                setForm({
                  name: data.name || '',
                  email: data.email || '',
                  gender: data.gender || 'Prefer not to say',
                  year: data.year || '',
                  currentPassword: '',
                  newPassword: ''
                });
                setIsEditing(true);
              } catch {
                toast.error('Failed to load latest details');
              }
            }}>Edit Details</button>
          </div>
        </div>
      )}

      {!loading && user && isEditing && (
        <form className="card" style={{display:'grid',gap:12,padding:16}} onSubmit={async (e)=>{
          e.preventDefault();
          try {
            const { data } = await api.put('/api/auth/me', {
              name: form.name,
              email: form.email,
              gender: form.gender,
              year: form.year,
              currentPassword: form.currentPassword || undefined,
              newPassword: form.newPassword || undefined,
            });
            setUser(data.user);
            setForm((f)=>({ ...f, currentPassword:'', newPassword:'' }));
            toast.success('Profile updated');
            setIsEditing(false);
          } catch (err) {
            toast.error(err.response?.data?.msg || 'Update failed');
          }
        }}>
          <label>Name</label>
          <input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} placeholder="e.g., John Doe" />

          <label>Email</label>
          <input value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} type="email" required />

          <label>Gender</label>
          <select value={form.gender} onChange={(e)=>setForm({...form,gender:e.target.value})}>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
            <option>Prefer not to say</option>
          </select>

          <label>Year</label>
          <input value={form.year} onChange={(e)=>setForm({...form,year:e.target.value})} placeholder="e.g., Second Year" />

          <div style={{borderTop:'1px solid #eee', marginTop:8, paddingTop:8}}>
            <strong>Change Password (optional)</strong>
          </div>
          <label>Current Password</label>
          <input type="password" value={form.currentPassword} onChange={(e)=>setForm({...form,currentPassword:e.target.value})} />
          <label>New Password</label>
          <input type="password" value={form.newPassword} onChange={(e)=>setForm({...form,newPassword:e.target.value})} />

          <div style={{display:'flex',gap:12,marginTop:8}}>
            <button className="btn-primary" type="submit">Save Changes</button>
            <button type="button" className="btn-secondary" onClick={()=>{
              setIsEditing(false);
              setForm((f)=>({ ...f, currentPassword:'', newPassword:'' }));
            }}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Profile;
