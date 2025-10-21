import React, { useState } from 'react';
import toast from 'react-hot-toast';
import './AddToCalendar.css';

const AddToCalendar = ({ event }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const generateGoogleCalendarUrl = () => {
    const startDate = formatDate(event.date);
    const endDate = formatDate(new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000)); // +2 hours
    const title = encodeURIComponent(event.name);
    const details = encodeURIComponent(event.description || '');
    const location = encodeURIComponent(event.location || '');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
  };

  const generateOutlookCalendarUrl = () => {
    const startDate = new Date(event.date).toISOString();
    const endDate = new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000).toISOString();
    const title = encodeURIComponent(event.name);
    const details = encodeURIComponent(event.description || '');
    const location = encodeURIComponent(event.location || '');

    return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startDate}&enddt=${endDate}&body=${details}&location=${location}`;
  };

  const generateICSFile = () => {
    const startDate = formatDate(event.date);
    const endDate = formatDate(new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000));
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${event.name}`,
      `DESCRIPTION:${event.description || ''}`,
      `LOCATION:${event.location || ''}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.name}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Calendar file downloaded!');
    setShowDropdown(false);
  };

  const handleGoogleCalendar = () => {
    window.open(generateGoogleCalendarUrl(), '_blank');
    setShowDropdown(false);
  };

  const handleOutlookCalendar = () => {
    window.open(generateOutlookCalendarUrl(), '_blank');
    setShowDropdown(false);
  };

  const handleAppleCalendar = () => {
    generateICSFile();
  };

  if (!event.date) return null;

  return (
    <div className="add-to-calendar-container">
      <button 
        className="add-to-calendar-btn"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 3v4M16 3v4M3 10h18M12 14v4M10 16h4" stroke="currentColor" strokeWidth="2"/>
        </svg>
        Add to Calendar
      </button>

      {showDropdown && (
        <>
          <div className="calendar-dropdown-overlay" onClick={() => setShowDropdown(false)} />
          <div className="calendar-dropdown">
            <div className="calendar-dropdown-header">
              <h4>Add to Calendar</h4>
              <button 
                className="calendar-close-btn"
                onClick={() => setShowDropdown(false)}
              >
                ×
              </button>
            </div>
            
            <div className="calendar-options">
              <button className="calendar-option google" onClick={handleGoogleCalendar}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google Calendar
              </button>

              <button className="calendar-option outlook" onClick={handleOutlookCalendar}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V2.55q0-.44.3-.75.3-.3.75-.3h12.9q.44 0 .75.3.3.3.3.75V10.85l1.24.72h.01q.1.07.18.18.07.12.07.25zm-6-8.25v3h3v-3zm0 4.5v3h3v-3zm0 4.5v1.83l3.05-1.83zm-5.25-9v3h3.75v-3zm0 4.5v3h3.75v-3zm0 4.5v2.03l2.41 1.5 1.34-.8v-2.73zM9 3.75V6h2l.13.01.12.04v-2.3zM5.98 15.98q.9 0 1.6-.3.7-.32 1.19-.86.48-.55.73-1.28.25-.74.25-1.61 0-.83-.25-1.55-.24-.71-.71-1.24t-1.15-.83q-.68-.3-1.55-.3-.92 0-1.64.3-.71.3-1.2.85-.5.54-.75 1.3-.25.74-.25 1.63 0 .85.26 1.56.26.72.74 1.23.48.52 1.17.81.69.3 1.56.3zM7.5 21h12.39L12 16.08V17q0 .41-.3.7-.29.3-.7.3H7.5zm15-.13v-7.24l-5.9 3.54Z"/>
                </svg>
                Outlook Calendar
              </button>

              <button className="calendar-option apple" onClick={handleAppleCalendar}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Apple Calendar
              </button>

              <button className="calendar-option download" onClick={generateICSFile}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Download .ics
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AddToCalendar;
