 
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import fetchWithLoading from '../utils/fetcher';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [departments, setDepartments] = useState([]);
  const [chapters, setChapters] = useState([]); // [{ key:'ACM', id:'...' }, ...]
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchWithLoading('/api/events/departments/list')
      .then((r) => r.json())
      .then(setDepartments)
      .catch(() => {});
  }, []);

  // Load main events and derive Student Chapters (ISTE, ACM, EDC)
  useEffect(() => {
    const loadChapters = async () => {
      try {
        const res = await fetchWithLoading('/api/events?isMainEvent=true');
        const data = await res.json();
        const wanted = ['ISTE', 'ACM', 'EDC'];
        const found = [];
        for (const key of wanted) {
          const match = (data || []).find((e) =>
            typeof e.name === 'string' && e.name.toLowerCase().includes(key.toLowerCase())
          );
          if (match) found.push({ key, id: match._id });
        }
        setChapters(found);
      } catch (_) {
        setChapters([]);
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

  // Close mobile menu on route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  // Load current user if authenticated but user is not set (e.g., after page refresh)
  useEffect(() => {
    const loadMe = async () => {
      try {
        if (useAuthStore.getState().isAuthenticated && !useAuthStore.getState().user) {
          const { data } = await api.get('/api/auth/me');
          useAuthStore.getState().setUser(data);
        }
      } catch {}
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
        <button className="nav-link" onClick={() => handleNav('about')}>About</button>
        <button className="nav-link" onClick={() => handleNav('contact')}>Contact Us</button>
        {/* Hide My Events for admins */}
        {!(isAuthenticated && user?.role === 'admin') && (
          <Link className="nav-link" to="/my-events">My Events</Link>
        )}
        {isAuthenticated && user?.role === 'admin' && (
          <Link className="nav-link" to="/admin">Admin</Link>
        )}
        <div className="dropdown" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
          <button className="nav-link">Explore Events ▾</button>
          {open && (
            <div className="dropdown-menu">
              <Link to="/explore?category=stepcone">Stepcone</Link>
              <Link to="/explore?category=chapters">Student Chapters</Link>
              <Link to="/explore?category=others">Others</Link>
            </div>
          )}
        </div>
        {isAuthenticated ? (
          <div className={`avatar dropdown ${avatarOpen ? 'open' : ''}`} title={user?.email}>
            <div className="avatar-circle" onClick={() => setAvatarOpen((v) => !v)}>{initials}</div>
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
        <div style={{ borderTop: '1px solid #eee', margin: '6px 0' }} />
        <div style={{ padding: '4px 2px', fontWeight: 700, opacity: 0.8 }}>Explore</div>
        <Link className="nav-link" to="/explore?category=stepcone" onClick={() => setMobileOpen(false)}>Stepcone</Link>
        <Link className="nav-link" to="/explore?category=chapters" onClick={() => setMobileOpen(false)}>Student Chapters</Link>
        <Link className="nav-link" to="/explore?category=others" onClick={() => setMobileOpen(false)}>Others</Link>
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
