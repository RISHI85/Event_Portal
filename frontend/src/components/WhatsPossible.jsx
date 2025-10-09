import React from 'react';

const items = [
  {
    title: 'Online registration and management',
    img: '/images/registration.jpg',
  },
  {
    title: 'Dynamic event management',
    img: '/images/dynamic.jpg',
  },
  {
    title: 'Automated e-certificates',
    img: '/images/certificate.jpg',
  },
  {
    title: 'Secure role-based access',
    img: '/images/secure.jpg',
  },
];

const WhatsPossible = () => {
  return (
    <section className="whats-possible">
      <h2>What’s possible with EventPortal</h2>
      <div className="alternating">
        {items.map((it, idx) => (
          <div className={`alt-item ${idx % 2 ? 'reverse' : ''}`} key={it.title}>
            <img src={it.img} alt={it.title} />
            <div className="alt-text">
              <h3>{it.title}</h3>
              <p>Powerful tooling to streamline your event lifecycle from discovery to post-event engagement.</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhatsPossible;
