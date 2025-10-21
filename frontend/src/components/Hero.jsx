import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import AnimatedCounter from './AnimatedCounter';

const Hero = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const handleExploreClick = (e) => {
    e.preventDefault();
    if (isAuthenticated && user?.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/explore-events');
    }
  };
  return (
    <section id="top" className="hero-modern fade-in-on-load scroll-anim">
      {/* Decorative background elements */}
      <div className="hero-bg-decoration">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

      <div className="hero-container">
        <div className="hero-content">
          {/* Badge */}
          <div className="hero-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#fbbf24" stroke="#eab308" strokeWidth="1.5" />
            </svg>
            <span>Centralized Event Management</span>
          </div>

          {/* Main Heading */}
          <h1 className="hero-title">
            Welcome to <span className="hero-highlight">EventPortal</span>
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle">
            Discover, manage, and elevate your events seamlessly with our powerful platform.
          </p>

          {/* CTA Buttons */}
          <div className="hero-cta">
            <a href="/explore-events" onClick={handleExploreClick} className="btn-hero-primary">
              Explore Events
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a href="#about" className="btn-hero-secondary">Learn More</a>
          </div>

          {/* Stats */}
          <div className="hero-stats">
            <div className="stat-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2" />
              </svg>
              <div>
                <div className="stat-number">
                  <AnimatedCounter end={500} suffix="+" duration={2000} />
                </div>
                <div className="stat-label">Active Events</div>
              </div>
            </div>

            <div className="stat-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div>
                <div className="stat-number">
                  <AnimatedCounter end={10} suffix="K+" duration={2000} />
                </div>
                <div className="stat-label">Attendees</div>
              </div>
            </div>

            <div className="stat-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
              <div>
                <div className="stat-number">
                  <AnimatedCounter end={98} suffix="%" duration={2000} />
                </div>
                <div className="stat-label">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Illustration */}
        <div className="hero-sidebar">
          <div className="hero-illustration">
            <img
              src="/images/heroooo.gif"
              alt="Team collaboration illustration"
              className="illustration-img"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
