import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ExploreEvents.css';

const ExploreEvents = () => {
  const navigate = useNavigate();

  const categories = [
    {
      id: 'stepcone',
      title: 'Stepcone',
      description: 'Technical symposium events across all departments',
      icon: '🎓',
      color: '#06b6d4',
      link: '/stepcone-events'
    },
    {
      id: 'chapters',
      title: 'Student Chapters',
      description: 'Events organized by CSI, EDC, ACM, and ISTE chapters',
      icon: '💻',
      color: '#8b5cf6',
      link: '/explore?category=chapters'
    },
    {
      id: 'others',
      title: 'Other Events',
      description: 'Explore other exciting events and activities',
      icon: '🎭',
      color: '#f59e0b',
      link: '/explore?category=others'
    }
  ];

  const handleCategoryClick = (link) => {
    navigate(link);
  };

  return (
    <div className="explore-events-container">
      {/* Hero Section */}
      <div className="explore-events-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>Discover Events</span>
          </div>
          <h1 className="hero-title">Explore All Events</h1>
          <p className="hero-subtitle">
            Browse through various event categories and find the perfect event for you
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="categories-section">
        <h2 className="section-title">Event Categories</h2>
        <div className="categories-grid">
          {categories.map((category) => (
            <div
              key={category.id}
              className="category-card"
              onClick={() => handleCategoryClick(category.link)}
              style={{ '--category-color': category.color }}
            >
              <div className="category-icon">{category.icon}</div>
              <h3 className="category-title">{category.title}</h3>
              <p className="category-description">{category.description}</p>
              <div className="category-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats Section */}
      <div className="quick-stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <div className="stat-number">500+</div>
              <div className="stat-label">Total Events</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <div className="stat-number">50+</div>
              <div className="stat-label">Active Events</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Participants</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <div className="stat-number">98%</div>
              <div className="stat-label">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExploreEvents;
