import React, { useEffect, useState } from 'react';
import './CountdownTimer.css';

const CountdownTimer = ({ targetDate, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = new Date(targetDate) - new Date();
    
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      expired: false
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft.expired && onComplete) {
        onComplete();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  if (timeLeft.expired) {
    return (
      <div className="countdown-timer expired">
        <div className="countdown-message">Event has started!</div>
      </div>
    );
  }

  return (
    <div className="countdown-timer">
      <div className="countdown-label">Event starts in:</div>
      <div className="countdown-units">
        <div className="countdown-unit">
          <div className="countdown-value">{String(timeLeft.days).padStart(2, '0')}</div>
          <div className="countdown-unit-label">Days</div>
        </div>
        <div className="countdown-separator">:</div>
        <div className="countdown-unit">
          <div className="countdown-value">{String(timeLeft.hours).padStart(2, '0')}</div>
          <div className="countdown-unit-label">Hours</div>
        </div>
        <div className="countdown-separator">:</div>
        <div className="countdown-unit">
          <div className="countdown-value">{String(timeLeft.minutes).padStart(2, '0')}</div>
          <div className="countdown-unit-label">Minutes</div>
        </div>
        <div className="countdown-separator">:</div>
        <div className="countdown-unit">
          <div className="countdown-value">{String(timeLeft.seconds).padStart(2, '0')}</div>
          <div className="countdown-unit-label">Seconds</div>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
