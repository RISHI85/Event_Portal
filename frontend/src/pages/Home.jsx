import React, { useEffect, useRef } from 'react';
import Hero from '../components/Hero';
import LiveEvents from '../components/LiveEvents';
import WhatsPossible from '../components/WhatsPossible';
import About from '../components/About';
import SectionCard from '../components/SectionCard';
import useAuthStore from '../store/authStore';
import AuthInline from '../components/AuthInline';

const Home = () => {
  const { isAuthenticated } = useAuthStore();

  // Add scroll direction classes on body for scroll animations
  const lastYRef = useRef(0);
  const stopTimerRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      const body = document.body;
      const goingDown = y > lastYRef.current;
      body.classList.toggle('scrolling-down', goingDown);
      body.classList.toggle('scrolling-up', !goingDown);
      lastYRef.current = y;

      // Clear classes shortly after scrolling stops to reveal content fully
      if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = window.setTimeout(() => {
        body.classList.remove('scrolling-down', 'scrolling-up');
      }, 180);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
      document.body.classList.remove('scrolling-down', 'scrolling-up');
    };
  }, []);

  const getSectionOrder = () => {
    const ids = ['top'];
    if (!isAuthenticated) ids.push('auth');
    if (isAuthenticated) ids.push('live');
    ids.push('whats');
    ids.push('about');
    ids.push('contact');
    return ids;
  };

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const goNext = () => {
    const order = getSectionOrder();
    const y = window.scrollY + 100; // offset buffer
    const currentIndex = order.findIndex((id) => {
      const el = document.getElementById(id);
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const bottom = rect.bottom + window.scrollY;
      return y >= top && y < bottom;
    });
    const nextIndex = Math.min(order.length - 1, (currentIndex === -1 ? 0 : currentIndex + 1));
    scrollToId(order[nextIndex]);
  };

  const goPrev = () => {
    const order = getSectionOrder();
    const y = window.scrollY + 100;
    const currentIndex = order.findIndex((id) => {
      const el = document.getElementById(id);
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const bottom = rect.bottom + window.scrollY;
      return y >= top && y < bottom;
    });
    const prevIndex = Math.max(0, (currentIndex === -1 ? 0 : currentIndex - 1));
    scrollToId(order[prevIndex]);
  };

  return (
    <div>
      <Hero />
      {!isAuthenticated && (
        <div id="auth" className="fade-in-on-load scroll-anim">
          <SectionCard title="Get Started" subtitle="Create an account or sign in to register for events.">
            <AuthInline />
          </SectionCard>
        </div>
      )}
      {isAuthenticated && (
        <div id="live" className="fade-in-on-load scroll-anim">
          <SectionCard title="Live Events" subtitle="Register now for ongoing and upcoming events.">
            <LiveEvents />
          </SectionCard>
        </div>
      )}
      <div id="whats" className="fade-in-on-load scroll-anim">
        <SectionCard title="What’s possible with EventPortal" subtitle="A quick overview of features you'll love.">
          <WhatsPossible />
        </SectionCard>
      </div>
      <div id="about" className="fade-in-on-load scroll-anim">
        <SectionCard title="About Us">
          <About />
        </SectionCard>
      </div>

      {/* Floating section navigation arrows */}
      <div className="section-nav" aria-label="Section navigation">
        <button className="arrow-btn" onClick={goPrev} title="Previous section" aria-label="Previous section">▲</button>
        <button className="arrow-btn" onClick={goNext} title="Next section" aria-label="Next section">▼</button>
      </div>
    </div>
  );
};

export default Home;
