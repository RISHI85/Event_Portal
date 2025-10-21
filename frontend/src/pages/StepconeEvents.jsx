import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import fetchWithLoading from '../utils/fetcher';
import './StepconeEvents.css';

const StepconeEvents = () => {
  const navigate = useNavigate();
  const [stepconeParentId, setStepconeParentId] = useState('');
  const [stepconeImage, setStepconeImage] = useState('');
  const [centralEvents, setCentralEvents] = useState([]);
  const [allStepconeEvents, setAllStepconeEvents] = useState([]); // All events under Stepcone for category filtering
  const [departmentTiles, setDepartmentTiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('central'); // 'central' or 'departmental'
  const [selectedCategory, setSelectedCategory] = useState('All Events');
  const [expandedCategories, setExpandedCategories] = useState(new Set()); // Track which categories are expanded

  const departments = ['CSE', 'IT', 'ECE', 'EEE', 'CIVIL', 'MECH'];

  useEffect(() => {
    const loadStepconeData = async () => {
      try {
        setLoading(true);
        // Fetch main events to find Stepcone parent
        const res = await fetchWithLoading('/api/events?isMainEvent=true');
        const mains = await res.json();
        const stepconeMain = (mains || []).find((e) => 
          String(e.name || '').toLowerCase().includes('stepcone')
        );
        
        if (stepconeMain) {
          setStepconeParentId(stepconeMain._id);
          setStepconeImage(stepconeMain.imageUrl || '');

          // Fetch ALL events under Stepcone (for category filtering)
          try {
            const allEventsRes = await fetchWithLoading(
              `/api/events?parentEvent=${stepconeMain._id}`
            );
            const allEventsData = await allEventsRes.json();
            
            // Ensure categories is always an array
            const processedAllEvents = (Array.isArray(allEventsData) ? allEventsData : []).map(event => ({
              ...event,
              categories: Array.isArray(event.categories) ? event.categories : []
            }));
            
            setAllStepconeEvents(processedAllEvents);
            console.log('All Stepcone Events:', processedAllEvents);
            console.log('Category counts:', {
              'All Events': processedAllEvents.length,
              'Technical': processedAllEvents.filter(e => e.categories.includes('Technical')).length,
              'Coding': processedAllEvents.filter(e => e.categories.includes('Coding')).length,
              'Robotics': processedAllEvents.filter(e => e.categories.includes('Robotics')).length,
              'Innovation': processedAllEvents.filter(e => e.categories.includes('Innovation')).length,
              'Group Events': processedAllEvents.filter(e => e.categories.includes('Group Events')).length,
            });
          } catch (err) {
            console.error('Error loading all Stepcone events:', err);
            setAllStepconeEvents([]);
          }

          // Fetch central events (Common department under Stepcone)
          try {
            const centralRes = await fetchWithLoading(
              `/api/events?parentEvent=${stepconeMain._id}&department=Common`
            );
            const centralData = await centralRes.json();
            
            // Ensure categories is always an array
            const processedCentralData = (Array.isArray(centralData) ? centralData : []).map(event => ({
              ...event,
              categories: Array.isArray(event.categories) ? event.categories : []
            }));
            
            setCentralEvents(processedCentralData);
            console.log('Central Events (Common dept):', processedCentralData);
          } catch (err) {
            console.error('Error loading central events:', err);
            setCentralEvents([]);
          }

          // Fetch department-wise event counts
          const tiles = await Promise.all(
            departments.map(async (dept) => {
              try {
                const deptRes = await fetchWithLoading(
                  `/api/events?parentEvent=${stepconeMain._id}&department=${dept}`
                );
                const deptData = await deptRes.json();
                return {
                  name: dept,
                  count: Array.isArray(deptData) ? deptData.length : 0,
                };
              } catch {
                return { name: dept, count: 0 };
              }
            })
          );
          setDepartmentTiles(tiles);
        }
      } catch (error) {
        console.error('Error loading Stepcone data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStepconeData();
  }, []);

  const departmentIcons = {
    CSE: '🖥️',
    IT: '💻',
    ECE: '📡',
    EEE: '⚡',
    CIVIL: '🏗️',
    MECH: '⚙️',
  };

  const handleDepartmentClick = (dept) => {
    if (stepconeParentId) {
      navigate(`/explore/${encodeURIComponent(dept)}?parent=${stepconeParentId}`);
    }
  };

  const handleCentralEventClick = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const getCategoryEvents = (category) => {
    if (category === 'All Events') {
      return allStepconeEvents;
    }
    return allStepconeEvents.filter(event => 
      Array.isArray(event.categories) && event.categories.includes(category)
    );
  };

  // Filter events by selected category (use allStepconeEvents for category filtering)
  const filteredEventsByCategory = selectedCategory === 'All Events'
    ? allStepconeEvents
    : allStepconeEvents.filter(event => 
        Array.isArray(event.categories) && event.categories.includes(selectedCategory)
      );

  // Further filter by active tab (central vs departmental)
  const filteredCentralEvents = activeTab === 'central'
    ? filteredEventsByCategory.filter(event => event.department === 'Common' || !event.department)
    : filteredEventsByCategory.filter(event => event.department && event.department !== 'Common');

  // Count events by category (across ALL Stepcone events)
  const categoryCounts = {
    'All Events': allStepconeEvents.length,
    'Technical': allStepconeEvents.filter(e => Array.isArray(e.categories) && e.categories.includes('Technical')).length,
    'Coding': allStepconeEvents.filter(e => Array.isArray(e.categories) && e.categories.includes('Coding')).length,
    'Robotics': allStepconeEvents.filter(e => Array.isArray(e.categories) && e.categories.includes('Robotics')).length,
    'Innovation': allStepconeEvents.filter(e => Array.isArray(e.categories) && e.categories.includes('Innovation')).length,
    'Group Events': allStepconeEvents.filter(e => Array.isArray(e.categories) && e.categories.includes('Group Events')).length,
  };

  return (
    <div className="stepcone-events-page">
      {/* Hero Section with Stepcone Image */}
      <div 
        className="stepcone-hero"
        style={{
          backgroundImage: stepconeImage 
            ? `url(${stepconeImage})`
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <div className="stepcone-hero-left">
          <div className="hero-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>Technical Symposium</span>
          </div>
          <h1 className="hero-main-title">STEPCONE 2025</h1>
          <p className="hero-tagline">Unleash the Unreal - Beyond Reality</p>
          <p className="hero-description">
            Explore our flagship technical symposium featuring events across all departments. Join us for the 17th edition on February 27-28, 2025.
          </p>
          <div className="hero-stats">
            <div className="hero-stat-item">
              <div className="hero-stat-number">50+</div>
              <div className="hero-stat-label">Events</div>
            </div>
            <div className="hero-stat-item">
              <div className="hero-stat-number">₹2L</div>
              <div className="hero-stat-label">Prize Pool</div>
            </div>
            <div className="hero-stat-item">
              <div className="hero-stat-number">1000+</div>
              <div className="hero-stat-label">Participants</div>
            </div>
          </div>
        </div>
        
        <div className="stepcone-hero-content">
          <div className="hero-badge">
            <span>🏆 National Level</span>
          </div>
          <h2 className="stepcone-title">Stepcone Events</h2>
          <p className="stepcone-subtitle">
            Explore our flagship technical symposium featuring events across all departments
          </p>
          <div className="hero-info-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>February 27-28, 2025</span>
          </div>
          <div className="hero-info-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>GMR Institute of Technology</span>
          </div>
          <div className="hero-info-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
            <span>Total Prizes Worth ₹2,00,000</span>
          </div>
          <button className="hero-cta-button" onClick={() => navigate('/explore')}>
            Explore Events
          </button>
        </div>
      </div>

      <div className="stepcone-content">
        {/* Browse by Category Section */}
        <section className="browse-category-section">
          <div className="section-header">
            <h2 className="section-title">Browse by Category</h2>
            <p className="section-description">Click on a category to view events</p>
          </div>
          <div className="category-filters">
            {[
              { name: 'All Events', icon: '⭐', count: categoryCounts['All Events'] },
              { name: 'Technical', icon: '💻', count: categoryCounts['Technical'] },
              { name: 'Coding', icon: '💡', count: categoryCounts['Coding'] },
              { name: 'Robotics', icon: '🤖', count: categoryCounts['Robotics'] },
              { name: 'Innovation', icon: '🚀', count: categoryCounts['Innovation'] },
              { name: 'Group Events', icon: '👥', count: categoryCounts['Group Events'] },
            ].map((category) => {
              const isExpanded = expandedCategories.has(category.name);
              
              return (
                <button 
                  key={category.name}
                  className={`category-filter-btn ${isExpanded ? 'active' : ''}`}
                  onClick={() => toggleCategory(category.name)}
                  disabled={category.count === 0}
                >
                  <span>{category.icon} {category.name}</span>
                  <span className="count-badge">{category.count}</span>
                </button>
              );
            })}
          </div>
          
          {/* Dropdown content for expanded categories */}
          {Array.from(expandedCategories).map((categoryName) => {
            const categoryEvents = getCategoryEvents(categoryName);
            
            return (
              <div key={categoryName} className="category-dropdown">
                <div className="category-dropdown-header">
                  <h3>{categoryName} Events</h3>
                  <button 
                    className="close-dropdown-btn"
                    onClick={() => toggleCategory(categoryName)}
                  >
                    ×
                  </button>
                </div>
                {categoryEvents.length > 0 ? (
                  <div className="category-events-grid">
                    {categoryEvents.map((event) => {
                      const eventDate = event.date ? new Date(event.date) : null;
                      const isUpcoming = eventDate && eventDate > new Date();
                      const isPast = eventDate && eventDate < new Date();
                      
                      return (
                        <div 
                          key={event._id} 
                          className="live-event-card"
                        >
                          {/* Status Badges */}
                          <div className="event-status-badges">
                            {isPast && <span className="status-badge not-eligible">Ended</span>}
                            {isUpcoming && <span className="status-badge upcoming">Upcoming</span>}
                          </div>

                          {/* Event Title */}
                          <h3 className="live-event-title">{event.name}</h3>

                          {/* Event Date and Time */}
                          <div className="live-event-info">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                              <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                            <span>
                              {eventDate ? eventDate.toLocaleDateString('en-US', { 
                                month: '2-digit', 
                                day: '2-digit', 
                                year: 'numeric' 
                              }) : 'TBD'}
                              {event.time && ` • ${event.time}`}
                            </span>
                          </div>

                          {/* Time Range */}
                          {event.time && (
                            <div className="live-event-info">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                              <span>{event.time}</span>
                            </div>
                          )}

                          {/* Location */}
                          {event.location && (
                            <div className="live-event-info">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/>
                                <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                              <span>{event.location}</span>
                            </div>
                          )}

                          {/* Department */}
                          {event.department && (
                            <div className="live-event-info">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                              <span>{event.department} Department</span>
                            </div>
                          )}

                          {/* Registration Count */}
                          <div className="live-event-info">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                            <span>0 registered</span>
                          </div>

                          {/* View Details Button */}
                          <button 
                            className="view-details-button"
                            onClick={() => handleCentralEventClick(event._id)}
                          >
                            View Details
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="category-empty-state">
                    <p>No events in this category</p>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* Explore Events Tabs Section */}
        <section className="explore-events-section">
          <div className="section-header">
            <h2 className="section-title">Explore Events</h2>
            <p className="section-description">Choose from a wide range of technical events and competitions designed to challenge and inspire</p>
          </div>
          <div className="event-tabs">
            <button 
              className={`event-tab ${activeTab === 'central' ? 'active' : ''}`}
              onClick={() => setActiveTab('central')}
            >
              Central Events
            </button>
            <button 
              className={`event-tab ${activeTab === 'departmental' ? 'active' : ''}`}
              onClick={() => setActiveTab('departmental')}
            >
              Departmental
            </button>
          </div>
        </section>

        {/* Central Events Section - Only show when activeTab is 'central' */}
        {activeTab === 'central' && (
          <section className="events-section">
            <div className="section-header">
              <h2 className="section-title">Central Events</h2>
              <p className="section-description">Events open to all departments</p>
            </div>
          
          {loading ? (
            <div className="loading-message">Loading events...</div>
          ) : filteredCentralEvents.length > 0 ? (
            <div className="events-grid">
              {filteredCentralEvents.map((event) => (
                <div 
                  key={event._id} 
                  className="event-card"
                  onClick={() => handleCentralEventClick(event._id)}
                >
                  <div className="event-card-image">
                    <img 
                      src={event.imageUrl || 'https://via.placeholder.com/400x250?text=Event'} 
                      alt={event.name}
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/400x250?text=Event';
                      }}
                    />
                  </div>
                  <div className="event-card-content">
                    <h3 className="event-card-title">{event.name}</h3>
                    <div className="event-card-meta">
                      <div className="meta-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <span>{event.date ? new Date(event.date).toLocaleDateString() : 'TBD'}</span>
                      </div>
                      {event.location && (
                        <div className="meta-item">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/>
                            <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                    <div className="event-card-footer">
                      <span className="event-badge">
                        {event.department && event.department !== 'Common' ? `${event.department} Event` : 'Central Event'}
                      </span>
                      <button className="view-details-btn">View Details →</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>{selectedCategory === 'All Events' 
                ? 'No central events available at the moment' 
                : `No events found in the ${selectedCategory} category`}</p>
            </div>
          )}
          </section>
        )}

        {/* Department-wise Events Section - Only show when activeTab is 'departmental' */}
        {activeTab === 'departmental' && (
          <section className="events-section">
            <div className="section-header">
              <h2 className="section-title">Department-wise Events</h2>
              <p className="section-description">
                {selectedCategory === 'All Events' 
                  ? 'Browse events by department or view all departmental events below'
                  : `Departmental events in the ${selectedCategory} category`}
              </p>
            </div>
          
          {/* Show department tiles only when 'All Events' is selected */}
          {selectedCategory === 'All Events' && (
            <div className="department-grid">
              {(departmentTiles.length ? departmentTiles : departments.map(d => ({ name: d, count: 0 }))).map((dept) => {
                const canOpen = !!stepconeParentId;
                const icon = departmentIcons[dept.name] || '🎓';
                const countText = dept.count > 0 ? `${dept.count} Events` : 'Coming soon!';
                
                return (
                  <div
                    key={dept.name}
                    className={`department-card ${!canOpen ? 'disabled' : ''}`}
                    onClick={() => canOpen && handleDepartmentClick(dept.name)}
                    style={{ cursor: canOpen ? 'pointer' : 'not-allowed' }}
                  >
                    <div className="department-icon">{icon}</div>
                    <h3 className="department-name">{dept.name}</h3>
                    <p className="department-count">{countText}</p>
                    <div className="department-arrow">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Show filtered departmental events when a category is selected */}
          {selectedCategory !== 'All Events' && (
            loading ? (
              <div className="loading-message">Loading events...</div>
            ) : filteredCentralEvents.length > 0 ? (
              <div className="events-grid">
                {filteredCentralEvents.map((event) => (
                  <div 
                    key={event._id} 
                    className="event-card"
                    onClick={() => handleCentralEventClick(event._id)}
                  >
                    <div className="event-card-image">
                      <img 
                        src={event.imageUrl || 'https://via.placeholder.com/400x250?text=Event'} 
                        alt={event.name}
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/400x250?text=Event';
                        }}
                      />
                    </div>
                    <div className="event-card-content">
                      <h3 className="event-card-title">{event.name}</h3>
                      <div className="event-card-meta">
                        <div className="meta-item">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                            <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <span>{event.date ? new Date(event.date).toLocaleDateString() : 'TBD'}</span>
                        </div>
                        {event.location && (
                          <div className="meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/>
                              <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                      <div className="event-card-footer">
                        <span className="event-badge">
                          {event.department && event.department !== 'Common' ? `${event.department} Event` : 'Central Event'}
                        </span>
                        <button className="view-details-btn">View Details →</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No departmental events found in the {selectedCategory} category</p>
              </div>
            )
          )}
          </section>
        )}

        {/* Why Join STEPCONE Section */}
        <section className="why-join-section">
          <div className="section-header">
            <h2 className="section-title">Why Join STEPCONE?</h2>
            <p className="section-description">Experience the ultimate technical symposium with cutting-edge events, amazing prizes, and unforgettable memories</p>
          </div>
          <div className="why-join-grid">
            <div className="why-join-card">
              <div className="why-join-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#14b8a6" stroke="#14b8a6" strokeWidth="2"/>
                </svg>
              </div>
              <h3 className="why-join-title">Exciting Prizes</h3>
              <p className="why-join-description">Win from a total prize pool of ₹2,00,000 across all events</p>
            </div>
            
            <div className="why-join-card">
              <div className="why-join-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="why-join-title">Network & Collaborate</h3>
              <p className="why-join-description">Connect with 1000+ talented participants from across the country</p>
            </div>
            
            <div className="why-join-card">
              <div className="why-join-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="5" width="18" height="16" rx="2" stroke="#06b6d4" strokeWidth="2"/>
                  <path d="M8 3v4M16 3v4M3 10h18" stroke="#06b6d4" strokeWidth="2"/>
                </svg>
              </div>
              <h3 className="why-join-title">50+ Events</h3>
              <p className="why-join-description">Choose from diverse technical, coding, and innovation challenges</p>
            </div>
            
            <div className="why-join-card">
              <div className="why-join-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="why-join-title">Expert Mentorship</h3>
              <p className="why-join-description">Learn from industry experts and experienced professionals</p>
            </div>
            
            <div className="why-join-card">
              <div className="why-join-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="2"/>
                  <path d="M12 6v6l4 2" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="why-join-title">Innovation Hub</h3>
              <p className="why-join-description">Showcase your innovative ideas and creative solutions</p>
            </div>
            
            <div className="why-join-card">
              <div className="why-join-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M22 4L12 14.01l-3-3" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="why-join-title">Skill Development</h3>
              <p className="why-join-description">Enhance your technical skills through workshops and competitions</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default StepconeEvents;
