import React, { useEffect } from 'react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import '../components/SkeletonCard/SkeletonCard.css';
import './ProfileNew.css';

const AVAILABLE_SKILLS = [
  'Project Management',
  'Event Planning',
  'Communication',
  'Leadership',
  'Problem Solving',
  'Team Coordination',
  'Public Speaking',
  'Marketing',
  'Design',
  'Photography',
  'Video Editing',
  'Content Writing',
  'Social Media',
  'Budgeting',
  'Negotiation'
];

const Profile = () => {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Prefer not to say',
    year: '',
    department: '',
    location: '',
    about: '',
    skills: [],
    currentPassword: '',
    newPassword: ''
  });
  const [isEditing, setIsEditing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({ attended: 0, won: 0 });

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
          phone: data.phone || '',
          gender: data.gender || 'Prefer not to say',
          year: data.year || '',
          department: data.department || '',
          location: data.location || '',
          about: data.about || '',
          skills: data.skills || []
        }));
        
        // Fetch stats
        try {
          const { data: regs } = await api.get('/api/registrations/my');
          console.log('Registrations data:', regs); // Debug log
          
          const registrations = Array.isArray(regs) ? regs : [];
          
          // Total registered events (with completed payment)
          const totalRegistered = registrations.filter(r => r.paymentStatus === 'completed').length;
          
          // Events that have already happened (past events)
          const completedEvents = registrations.filter(r => 
            r.paymentStatus === 'completed' && r.eventPast === true
          ).length;
          
          // Events Attended = Total Registered - Completed (past) Events
          const attended = totalRegistered - completedEvents;
          const won = 0; // Can be calculated from achievements
          
          console.log('Total Registered:', totalRegistered);
          console.log('Completed (Past):', completedEvents);
          console.log('Events Attended (Upcoming):', attended);
          
          setStats({ attended, won });
        } catch (err) {
          console.error('Failed to fetch stats:', err);
        }
      } catch {}
      finally {
        setLoading(false);
      }
    };
    load();
  }, [setUser]);

  // derived display helpers
  const initials = (user?.name || user?.email || '?')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const completion = (() => {
    const fields = ['name', 'email', 'gender', 'year', 'department'];
    const filled = fields.filter((k) => !!(user && String(user[k] || '').trim())).length;
    return Math.round((filled / fields.length) * 100);
  })();

  const toggleSkill = (skill) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  return (
    <div className="profile-page-new">
      {/* Header Banner */}
      <div className="profile-header-new">
        <div className="profile-avatar-new">
          {user?.avatarUrl || user?.photoUrl ? (
            <img src={user.avatarUrl || user.photoUrl} alt="Profile" />
          ) : (
            <div className="avatar-initials">{initials}</div>
          )}
          <div className="online-indicator"></div>
        </div>
        <div className="profile-header-info">
          <h1 className="profile-name">{user?.name || 'User'}</h1>
          <p className="profile-role">User | {user?.year || '4th Year'}</p>
        </div>
        <button 
          className="btn-edit-new" 
          onClick={async () => {
            try {
              const { data } = await api.get('/api/auth/me');
              setUser(data);
              setForm({
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                gender: data.gender || 'Prefer not to say',
                year: data.year || '',
                department: data.department || '',
                location: data.location || '',
                about: data.about || '',
                skills: data.skills || [],
                currentPassword: '',
                newPassword: ''
              });
              setIsEditing(true);
            } catch {
              toast.error('Failed to load details');
            }
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Edit Details
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon teal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="stat-value">{stats.attended}</div>
          <div className="stat-label">Events Attended</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </div>
          <div className="stat-value">{stats.won}</div>
          <div className="stat-label">Events Won</div>
        </div>
      </div>

      {/* Content Grid */}
      {!loading && !isEditing && (
        <div className="profile-content-grid">
          {/* Left Column */}
          <div className="profile-left-col">
            {/* About Section */}
            <div className="profile-section">
              <h3 className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                About
              </h3>
              <p className="about-text">
                {user?.about || 'Dedicated IT professional with expertise in software development and event management. Passionate about technology and continuous learning.'}
              </p>
            </div>

            {/* Professional Skills */}
            <div className="profile-section">
              <h3 className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polyline points="16 18 22 12 16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="8 6 2 12 8 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Professional Skills
              </h3>
              {user?.skills && user.skills.length > 0 ? (
                <div className="skills-grid">
                  {user.skills.map((skill, idx) => (
                    <div key={idx} className="skill-badge">{skill}</div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No skills added yet. Click "Edit Details" to add your professional skills.</p>
              )}
            </div>

            {/* Achievements */}
            <div className="profile-section">
              <h3 className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
                Achievements
              </h3>
              {user?.achievements && user.achievements.length > 0 ? (
                <div className="achievements-list">
                  {user.achievements.map((achievement, idx) => (
                    <div key={idx} className="achievement-item">
                      <div className="achievement-header">
                        <h4>{achievement.title}</h4>
                        <span className="achievement-date">{achievement.date}</span>
                      </div>
                      <p>{achievement.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No achievements yet. Win events to unlock achievements!</p>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="profile-right-col">
            <div className="profile-section">
              <div className="section-header">
                <h3 className="section-title">Profile Information</h3>
                <span className="last-updated">Last updated: {new Date().toLocaleDateString()}</span>
              </div>
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="info-content">
                    <div className="info-label">Name</div>
                    <div className="info-value">{user?.name || '-'}</div>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="info-content">
                    <div className="info-label">Email</div>
                    <div className="info-value">{user?.email || '-'}</div>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="info-content">
                    <div className="info-label">Phone</div>
                    <div className="info-value">{user?.phone || '+1 (555) 123-4567'}</div>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="info-content">
                    <div className="info-label">Gender</div>
                    <div className="info-value">{user?.gender || 'Female'}</div>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6 12v5c3 3 9 3 12 0v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="info-content">
                    <div className="info-label">Year</div>
                    <div className="info-value">{user?.year || '4th'}</div>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="info-content">
                    <div className="info-label">Department</div>
                    <div className="info-value">{user?.department || 'IT'}</div>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="info-content">
                    <div className="info-label">Location</div>
                    <div className="info-value">{user?.location || 'San Francisco, CA'}</div>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                      <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="info-content">
                    <div className="info-label">Member Since</div>
                    <div className="info-value">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'January 2024'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && user && isEditing && (
        <div className="edit-modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h2>Edit Profile</h2>
              <button className="close-btn" onClick={() => setIsEditing(false)}>✕</button>
            </div>
            <form className="edit-form" onSubmit={async (e)=>{
              e.preventDefault();
              try {
                const { data } = await api.put('/api/auth/me', {
                  name: form.name,
                  email: form.email,
                  phone: form.phone,
                  gender: form.gender,
                  year: form.year,
                  department: form.department,
                  location: form.location,
                  about: form.about,
                  skills: form.skills,
                  currentPassword: form.currentPassword || undefined,
                  newPassword: form.newPassword || undefined,
                });
                setUser(data.user);
                setForm((f)=>({ ...f, currentPassword:'', newPassword:'' }));
                toast.success('Profile updated successfully!');
                setIsEditing(false);
              } catch (err) {
                toast.error(err.response?.data?.msg || 'Update failed');
              }
            }}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Name</label>
                  <input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} placeholder="John Doe" />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} type="email" required />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} placeholder="+1 (555) 123-4567" />
                </div>

                <div className="form-group">
                  <label>Gender</label>
                  <select value={form.gender} onChange={(e)=>setForm({...form,gender:e.target.value})}>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                    <option>Prefer not to say</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Year</label>
                  <select value={form.year} onChange={(e)=>setForm({...form,year:e.target.value})}>
                    <option value="">Select Year</option>
                    <option value="1st">1st</option>
                    <option value="2nd">2nd</option>
                    <option value="3rd">3rd</option>
                    <option value="4th">4th</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Department</label>
                  <input value={form.department} onChange={(e)=>setForm({...form,department:e.target.value})} placeholder="IT" />
                </div>

                <div className="form-group full-width">
                  <label>Location</label>
                  <input value={form.location} onChange={(e)=>setForm({...form,location:e.target.value})} placeholder="San Francisco, CA" />
                </div>

                <div className="form-group full-width">
                  <label>About</label>
                  <textarea value={form.about} onChange={(e)=>setForm({...form,about:e.target.value})} rows={3} placeholder="Tell us about yourself..." />
                </div>

                <div className="form-group full-width">
                  <label>Professional Skills</label>
                  <div className="skills-selector">
                    {AVAILABLE_SKILLS.map(skill => (
                      <button
                        key={skill}
                        type="button"
                        className={`skill-option ${form.skills.includes(skill) ? 'selected' : ''}`}
                        onClick={() => toggleSkill(skill)}
                      >
                        {skill}
                        {form.skills.includes(skill) && <span className="check">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-divider full-width"></div>

                <div className="form-group">
                  <label>Current Password (optional)</label>
                  <input type="password" value={form.currentPassword} onChange={(e)=>setForm({...form,currentPassword:e.target.value})} placeholder="Enter current password" />
                </div>

                <div className="form-group">
                  <label>New Password (optional)</label>
                  <input type="password" value={form.newPassword} onChange={(e)=>setForm({...form,newPassword:e.target.value})} placeholder="Enter new password" />
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-save" type="submit">Save Changes</button>
                <button type="button" className="btn-cancel" onClick={()=>{
                  setIsEditing(false);
                  setForm((f)=>({ ...f, currentPassword:'', newPassword:'' }));
                }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
