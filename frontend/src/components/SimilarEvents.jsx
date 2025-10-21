import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import fetchWithLoading from '../utils/fetcher';
import './SimilarEvents.css';

const SimilarEvents = ({ currentEventId, department, category }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSimilarEvents = async () => {
      try {
        let url = '/api/events?';
        if (department) {
          url += `department=${encodeURIComponent(department)}&`;
        }
        url += 'limit=4';

        const response = await fetchWithLoading(url);
        const data = await response.json();
        
        // Filter out current event and limit to 3
        const filtered = data
          .filter(event => event._id !== currentEventId)
          .slice(0, 3);
        
        setEvents(filtered);
      } catch (error) {
        console.error('Error fetching similar events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarEvents();
  }, [currentEventId, department, category]);

  const handleEventClick = (eventId) => {
    navigate(`/events/${eventId}`);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <section className="similar-events-section">
        <h3 className="similar-events-title">Similar Events</h3>
        <div className="similar-events-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="similar-event-card skeleton">
              <div className="skeleton-image"></div>
              <div className="skeleton-content">
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (events.length === 0) return null;

  return (
    <section className="similar-events-section">
      <h3 className="similar-events-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
        You Might Also Like
      </h3>
      <div className="similar-events-grid">
        {events.map((event) => (
          <div
            key={event._id}
            className="similar-event-card"
            onClick={() => handleEventClick(event._id)}
          >
            <div className="similar-event-image">
              {event.imageUrl ? (
                <img src={event.imageUrl} alt={event.name} />
              ) : (
                <div className="similar-event-placeholder">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
              )}
              {event.department && (
                <span className="similar-event-badge">{event.department}</span>
              )}
            </div>
            <div className="similar-event-content">
              <h4 className="similar-event-name">{event.name}</h4>
              {event.date && (
                <div className="similar-event-date">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  {new Date(event.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              )}
              {event.location && (
                <div className="similar-event-location">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  {event.location}
                </div>
              )}
              <button className="similar-event-btn">
                View Details
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SimilarEvents;
