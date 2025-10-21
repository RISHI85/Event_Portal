import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import fetchWithLoading from '../utils/fetcher';
import './EventHighlights.css';

const EventHighlights = () => {
  const [events, setEvents] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHighlightedEvents = async () => {
      try {
        const response = await fetchWithLoading('/api/events?limit=6');
        const data = await response.json();
        // Filter for upcoming events or recent events
        const upcomingEvents = data.filter(event => {
          if (!event.date) return false;
          const eventDate = new Date(event.date);
          const now = new Date();
          // Show events from 30 days ago to future
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return eventDate >= thirtyDaysAgo;
        }).slice(0, 6);
        
        setEvents(upcomingEvents.length > 0 ? upcomingEvents : data.slice(0, 6));
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHighlightedEvents();
  }, []);

  useEffect(() => {
    if (events.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [events.length]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const handleEventClick = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  if (loading) {
    return (
      <section className="event-highlights-section">
        <div className="container">
          <div className="highlights-skeleton">
            <div className="skeleton-box" style={{ height: '400px' }}></div>
          </div>
        </div>
      </section>
    );
  }

  if (events.length === 0) return null;

  const currentEvent = events[currentIndex];

  return (
    <section className="event-highlights-section" id="highlights">
      <div className="container">
        <div className="highlights-header">
          <span className="section-badge">Featured Events</span>
          <h2 className="section-title">Event Highlights</h2>
          <p className="section-subtitle">
            Discover the most exciting events happening now
          </p>
        </div>

        <div className="highlights-carousel">
          <div className="highlight-main">
            <div className="highlight-image">
              {currentEvent.imageUrl ? (
                <img src={currentEvent.imageUrl} alt={currentEvent.name} />
              ) : (
                <div className="highlight-placeholder">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
              )}
              <div className="highlight-overlay">
                <div className="highlight-content">
                  <div className="highlight-badges">
                    {currentEvent.department && (
                      <span className="highlight-badge dept">{currentEvent.department}</span>
                    )}
                    {currentEvent.date && new Date(currentEvent.date) > new Date() && (
                      <span className="highlight-badge upcoming">Upcoming</span>
                    )}
                  </div>
                  <h3 className="highlight-title">{currentEvent.name}</h3>
                  {currentEvent.description && (
                    <p className="highlight-description">
                      {currentEvent.description.substring(0, 150)}
                      {currentEvent.description.length > 150 ? '...' : ''}
                    </p>
                  )}
                  <div className="highlight-meta">
                    {currentEvent.date && (
                      <div className="meta-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        {new Date(currentEvent.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    )}
                    {currentEvent.location && (
                      <div className="meta-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        {currentEvent.location}
                      </div>
                    )}
                  </div>
                  <button 
                    className="highlight-cta"
                    onClick={() => handleEventClick(currentEvent._id)}
                  >
                    View Details
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="highlights-thumbnails">
            {events.map((event, index) => (
              <div
                key={event._id}
                className={`thumbnail ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
              >
                {event.imageUrl ? (
                  <img src={event.imageUrl} alt={event.name} />
                ) : (
                  <div className="thumbnail-placeholder">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                )}
                <div className="thumbnail-info">
                  <h4>{event.name}</h4>
                  {event.date && (
                    <span>
                      {new Date(event.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="highlights-dots">
          {events.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to event ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default EventHighlights;
