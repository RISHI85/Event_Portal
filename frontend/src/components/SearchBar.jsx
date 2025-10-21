import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import fetchWithLoading from '../utils/fetcher';
import './SearchBar.css';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchEvents = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetchWithLoading(`/api/events?search=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data.slice(0, 5)); // Show top 5 results
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchEvents, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleResultClick = (eventId) => {
    navigate(`/events/${eventId}`);
    setQuery('');
    setIsOpen(false);
    setResults([]);
  };

  const handleViewAll = () => {
    navigate(`/explore-events?search=${encodeURIComponent(query)}`);
    setQuery('');
    setIsOpen(false);
    setResults([]);
  };

  return (
    <div className="search-bar-container" ref={searchRef}>
      <div className="search-input-wrapper">
        <svg 
          className="search-icon" 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search events..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {query && (
          <button 
            className="search-clear"
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
          >
            ×
          </button>
        )}
      </div>

      {isOpen && query.trim().length >= 2 && (
        <div className="search-results-dropdown">
          {loading ? (
            <div className="search-loading">
              <div className="search-spinner"></div>
              Searching...
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="search-results-list">
                {results.map((event) => (
                  <div
                    key={event._id}
                    className="search-result-item"
                    onClick={() => handleResultClick(event._id)}
                  >
                    <div className="search-result-icon">
                      {event.imageUrl ? (
                        <img src={event.imageUrl} alt={event.name} />
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      )}
                    </div>
                    <div className="search-result-content">
                      <div className="search-result-title">{event.name}</div>
                      <div className="search-result-meta">
                        {event.department && <span>{event.department}</span>}
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
                  </div>
                ))}
              </div>
              <div className="search-view-all">
                <button onClick={handleViewAll}>
                  View all results for "{query}"
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="search-no-results">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p>No events found for "{query}"</p>
              <span>Try different keywords</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
