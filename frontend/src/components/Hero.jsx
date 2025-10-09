import React from 'react';

const Hero = () => {
  return (
    <section id="top" className="hero fade-in-on-load scroll-anim">
      <img src="/images/hero.jpg" alt="hero" className="hero-img" />
      <div className="hero-overlay">
        <h1>Welcome to EventPortal</h1>
        <p>Discover, manage, and elevate your events seamlessly.</p>
      </div>
    </section>
  );
};

export default Hero;
