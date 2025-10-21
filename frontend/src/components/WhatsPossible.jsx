import React from 'react';
import './WhatsPossible.css';

const items = [
  {
    title: 'Event Scheduling',
    desc: 'Plan and organize events with our intuitive calendar system and automated reminders.',
    icon: 'calendar',
  },
  {
    title: 'Automated E-Certificates',
    desc: 'Generate and distribute digital certificates automatically upon event completion.',
    icon: 'certificate',
  },
  {
    title: 'Analytics Dashboard',
    desc: 'Gain insights with real-time analytics and comprehensive event performance metrics.',
    icon: 'analytics',
  },
  {
    title: 'Email Campaigns',
    desc: 'Send personalized invitations and updates to keep your audience informed.',
    icon: 'email',
  },
  {
    title: 'Secure Platform',
    desc: 'Enterprise-grade security to protect your data and ensure privacy compliance.',
    icon: 'lock',
  },
  {
    title: 'Quick Setup',
    desc: 'Get started in minutes with our streamlined onboarding and setup process.',
    icon: 'setup',
  },
];

const Icon = ({ type }) => {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
  };
  switch (type) {
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" stroke="#14b8a6" strokeWidth="1.4"/>
          <path d="M8 3v4M16 3v4M3 10h18" stroke="#14b8a6" strokeWidth="1.4"/>
        </svg>
      );
    case 'certificate':
      return (
        <svg {...common}>
          <path d="M3 9.5 12 5l9 4.5-9 4.5L3 9.5Z" stroke="#fbbf24" strokeWidth="1.4"/>
          <path d="M7 12.5V16c1.5 1 3.2 1.5 5 1.5S15.5 17 17 16v-3.5" stroke="#fbbf24" strokeWidth="1.4"/>
        </svg>
      );
    case 'analytics':
      return (
        <svg {...common}>
          <path d="M3 17V21M9 13V21M15 9V21M21 5V21" stroke="#14b8a6" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      );
    case 'email':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="#fbbf24" strokeWidth="1.4"/>
          <path d="M3 7l9 6 9-6" stroke="#fbbf24" strokeWidth="1.4"/>
        </svg>
      );
    case 'lock':
      return (
        <svg {...common}>
          <rect x="5" y="10" width="14" height="10" rx="2" stroke="#14b8a6" strokeWidth="1.4"/>
          <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="#14b8a6" strokeWidth="1.4"/>
        </svg>
      );
    case 'setup':
      return (
        <svg {...common}>
          <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" fill="#fbbf24" stroke="#eab308" strokeWidth="1.2"/>
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="4" y="4" width="12" height="16" rx="2" stroke="#14b8a6" strokeWidth="1.4"/>
          <path d="M8 8h6M8 12h6M8 16h4" stroke="#14b8a6" strokeWidth="1.4"/>
        </svg>
      );
  }
};

const WhatsPossible = () => {
  return (
    <section className="whats-new-grid">
      {items.map((it) => (
        <article key={it.title} className={`wn-card ${it.featured ? 'wn-featured' : ''}`}>
          <div className="wn-icon">
            <div className="wn-blob" />
            <Icon type={it.icon} />
          </div>
          <h3 className="wn-title">{it.title}</h3>
          <p className="wn-desc">{it.desc}</p>
        </article>
      ))}
    </section>
  );
};

export default WhatsPossible;
