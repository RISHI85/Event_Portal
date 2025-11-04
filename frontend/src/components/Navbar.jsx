
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import fetchWithLoading from '../utils/fetcher';
import SearchBar from './SearchBar';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [departments, setDepartments] = useState([]);
  const [chapters, setChapters] = useState([]); // [{ key:'ACM', id:'...' }, ...]
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState('root'); // 'root' | 'stepcone' | 'chapters' | 'others'
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  // For mega menu data
  const stepconeDepartments = ['CSE', 'IT', 'ECE', 'EEE', 'CIVIL', 'MECH'];
  const [stepconeParentId, setStepconeParentId] = useState('');
  const [otherMains, setOtherMains] = useState([]); // [{_id,name}]
  const navigate = useNavigate();
  const location = useLocation();
  // no timers/refs to keep navbar behavior unchanged

  useEffect(() => {
    fetchWithLoading(`${process.env.REACT_APP_API_URL}/api/events/departments/list`)
      .then((r) => r.json())
      .then(setDepartments)
      .catch(() => { });
  }, []);

  // Load main events and derive Student Chapters (ISTE, ACM, EDC)
  useEffect(() => {
    const loadChapters = async () => {
      try {
        const res = await fetchWithLoading(`${process.env.REACT_APP_API_URL}/api/events?isMainEvent=true`);
        const data = await res.json();
        const wanted = ['CSI', 'EDC', 'ACM', 'ISTE'];
        const complete = wanted.map((key) => {
          const match = (data || []).find((e) =>
            typeof e.name === 'string' && e.name.toLowerCase().includes(key.toLowerCase())
          );
          return { key, id: match?._id };
        });
        setChapters(complete);
        // Capture Stepcone parent and Others list for mega menu
        const lc = (s) => String(s || '').toLowerCase();
        const step = (data || []).find((e) => lc(e.name).includes('stepcone'));
        setStepconeParentId(step?._id || '');
        const chapterKeys = ['CSI', 'EDC', 'ACM', 'ISTE'];
        const others = (data || []).filter(
          (e) => !chapterKeys.some((k) => lc(e.name).includes(lc(k))) && !lc(e.name).includes('stepcone')
        );
        setOtherMains(others.map((e) => ({ _id: e._id, name: e.name })));
      } catch (_) {
        // fallback: still show all chapter names
        setChapters(['CSI', 'EDC', 'ACM', 'ISTE'].map((key) => ({ key, id: undefined })));
        setStepconeParentId('');
        setOtherMains([]);
      }
    };
    loadChapters();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // no outside-click; default hover behavior

  // Close mobile menu on route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  // Load current user if authenticated but user is not set (e.g., after page refresh)
  useEffect(() => {
    const loadMe = async () => {
      try {
        if (useAuthStore.getState().isAuthenticated && !useAuthStore.getState().user) {
          const { data } = await api.get(`${process.env.REACT_APP_API_URL}/api/auth/me`);
          useAuthStore.getState().setUser(data);
        }
      } catch { }
    };
    loadMe();
  }, []);

  // Close avatar dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (!e.target.closest('.avatar.dropdown')) setAvatarOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const initials = user?.email?.[0]?.toUpperCase() || '?';

  const handleNav = (id) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-left" onClick={() => navigate('/')}>
        <img alt="logo" src="/favicon.ico" className="logo" />
        <span className="brand">EventPortal</span>
      </div>
      <div className="nav-right">
        {/* Mobile menu toggle (visible on small screens via CSS) */}
        <button className="mobile-toggle" onClick={() => setMobileOpen(v => !v)}>Menu</button>
        <button className="nav-link" onClick={() => handleNav('top')}>Home</button>
        <button className="nav-link" onClick={() => handleNav('whats')}>Features</button>
        <button className="nav-link" onClick={() => handleNav('about')}>About</button>
        <button className="nav-link" onClick={() => handleNav('contact')}>Contact</button>
        {isAuthenticated && user?.role === 'admin' && (
          <Link className="nav-link" to="/admin">Admin</Link>
        )}
        {isAuthenticated && user?.role !== 'admin' && (
          <Link className="nav-link" to="/my-events">My Events</Link>
        )}
        <SearchBar />
        {!(isAuthenticated && user?.role === 'admin') && (
          <div
            className="dropdown events-dropdown"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => { setOpen(false); setPanel('root'); }}
          >
            <button className="nav-link">Events <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: 4 }}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
            {open && (
              <div className="mega-dropdown">
                <div className="mega-section">
                  <div className="mega-header">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="5" width="18" height="16" rx="2" stroke="#14b8a6" strokeWidth="2" />
                      <path d="M8 3v4M16 3v4M3 10h18" stroke="#14b8a6" strokeWidth="2" />
                    </svg>
                    <h4>Stepcone</h4>
                  </div>
                  <div className="mega-items">
                    {stepconeDepartments.map((d) => (
                      <a key={d} className="mega-item" onClick={() => {
                        if (stepconeParentId) navigate(`/explore/${encodeURIComponent(d)}?parent=${stepconeParentId}`);
                        else navigate('/explore?category=stepcone');
                        setOpen(false);
                      }}>
                        <span className="item-dot"></span>
                        {d}
                      </a>
                    ))}
                  </div>
                </div>

                <div className="mega-section">
                  <div className="mega-header">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <h4>Student Chapters</h4>
                  </div>
                  <div className="mega-items">
                    {chapters.length === 0 && <span className="mega-item-empty">Coming soon</span>}
                    {chapters.map((c) => (
                      <a key={c.key} className="mega-item" onClick={() => { if (c.id) { navigate(`/explore?parent=${c.id}`); setOpen(false); } }}>
                        <span className="item-dot"></span>
                        {c.key}
                      </a>
                    ))}
                  </div>
                </div>

                <div className="mega-section">
                  <div className="mega-header">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#14b8a6" strokeWidth="2" fill="none" />
                    </svg>
                    <h4>Others</h4>
                  </div>
                  <div className="mega-items">
                    <a className="mega-item" onClick={() => { navigate('/explore'); setOpen(false); }}>
                      <span className="item-dot"></span>
                      All Events
                    </a>
                    {otherMains.length === 0 && <span className="mega-item-empty">More coming soon</span>}
                    {otherMains.map((o) => (
                      <a key={o._id} className="mega-item" onClick={() => { navigate(`/explore?parent=${o._id}`); setOpen(false); }}>
                        <span className="item-dot"></span>
                        {o.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {isAuthenticated ? (
          <div className={`avatar dropdown ${avatarOpen ? 'open' : ''}`} title={user?.email}>
            <div className="avatar-circle" onClick={() => setAvatarOpen((v) => !v)}>
              {user?.avatarUrl || user?.photoUrl ? (
                <img src={user.avatarUrl || user.photoUrl} alt="User avatar" />
              ) : (
                initials
              )}
            </div>
            <div className="dropdown-menu" style={{ right: 0, display: avatarOpen ? 'grid' : undefined }}>
              <button className="nav-link" onClick={() => navigate('/profile')}>Profile</button>
              <button className="nav-link" onClick={logout}>Logout</button>
            </div>
          </div>
        ) : (
          <Link to="/auth" className="btn-primary">Login / Signup</Link>
        )}
      </div>
      {/* Mobile full-width menu */}
      <div className="mobile-menu" style={{ display: mobileOpen ? 'block' : undefined }}>
        <button className="nav-link" onClick={() => { setMobileOpen(false); handleNav('top'); }}>Home</button>
        <button className="nav-link" onClick={() => { setMobileOpen(false); handleNav('about'); }}>About</button>
        <button className="nav-link" onClick={() => { setMobileOpen(false); handleNav('contact'); }}>Contact Us</button>
        {!(isAuthenticated && user?.role === 'admin') && (
          <Link className="nav-link" to="/my-events" onClick={() => setMobileOpen(false)}>My Events</Link>
        )}
        {isAuthenticated && user?.role === 'admin' && (
          <Link className="nav-link" to="/admin" onClick={() => setMobileOpen(false)}>Admin</Link>
        )}
        {!(isAuthenticated && user?.role === 'admin') && (
          <>
            <div style={{ borderTop: '1px solid #eee', margin: '6px 0' }} />
            <div style={{ padding: '4px 2px', fontWeight: 700, opacity: 0.8 }}>Explore</div>
            <Link className="nav-link" to="/explore?category=stepcone" onClick={() => setMobileOpen(false)}>Stepcone</Link>
            <Link className="nav-link" to="/explore?category=chapters" onClick={() => setMobileOpen(false)}>Student Chapters</Link>
            <Link className="nav-link" to="/explore?category=others" onClick={() => setMobileOpen(false)}>Others</Link>
          </>
        )}
        <div style={{ borderTop: '1px solid #eee', margin: '6px 0' }} />
        {isAuthenticated ? (
          <>
            <button className="nav-link" onClick={() => { setMobileOpen(false); navigate('/profile'); }}>Profile</button>
            <button className="nav-link" onClick={() => { setMobileOpen(false); logout(); }}>Logout</button>
          </>
        ) : (
          <Link className="nav-link" to="/auth" onClick={() => setMobileOpen(false)}>Login / Signup</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
