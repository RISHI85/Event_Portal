import React, { useState, useEffect } from 'react';
import './Testimonials.css';

const testimonialsData = [
  {
    id: 1,
    name: 'Priya Sharma',
    role: 'CSE Student',
    image: null,
    rating: 5,
    text: 'The event management system made registration so easy! I participated in Stepcone and the entire process was seamless. Highly recommend!',
    event: 'Stepcone 2024'
  },
  {
    id: 2,
    name: 'Rahul Verma',
    role: 'ECE Student',
    image: null,
    rating: 5,
    text: 'Amazing platform! The payment process was secure and I received instant confirmation. The countdown timer helped me stay prepared for the event.',
    event: 'Tech Symposium'
  },
  {
    id: 3,
    name: 'Ananya Reddy',
    role: 'IT Student',
    image: null,
    rating: 5,
    text: 'Best event portal I have used. The search feature is super helpful and I love how I can add events directly to my calendar. Great work!',
    event: 'ACM Workshop'
  },
  {
    id: 4,
    name: 'Karthik Kumar',
    role: 'MECH Student',
    image: null,
    rating: 5,
    text: 'The team registration feature is fantastic! We registered our entire team in minutes. The interface is clean and user-friendly.',
    event: 'Innovation Challenge'
  },
  {
    id: 5,
    name: 'Sneha Patel',
    role: 'EEE Student',
    image: null,
    rating: 5,
    text: 'I appreciate how organized everything is. From browsing events to payment, everything works smoothly. The social sharing feature is a nice touch!',
    event: 'ISTE Conference'
  },
  {
    id: 6,
    name: 'Aditya Singh',
    role: 'CIVIL Student',
    image: null,
    rating: 5,
    text: 'The breadcrumb navigation and event details page are very well designed. I could easily find all the information I needed about the event.',
    event: 'Design Expo'
  }
];

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonialsData.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonialsData.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonialsData.length) % testimonialsData.length);
    setIsAutoPlaying(false);
  };

  const getVisibleTestimonials = () => {
    const testimonials = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentIndex + i) % testimonialsData.length;
      testimonials.push(testimonialsData[index]);
    }
    return testimonials;
  };

  const visibleTestimonials = getVisibleTestimonials();

  return (
    <section className="testimonials-section" id="testimonials">
      <div className="container">
        <div className="testimonials-header">
          <span className="section-badge">Testimonials</span>
          <h2 className="section-title">What Students Say</h2>
          <p className="section-subtitle">
            Hear from students who have experienced our events
          </p>
        </div>

        <div className="testimonials-carousel">
          <button className="carousel-btn prev" onClick={prevSlide} aria-label="Previous testimonial">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="testimonials-grid">
            {visibleTestimonials.map((testimonial, idx) => (
              <div 
                key={testimonial.id} 
                className={`testimonial-card ${idx === 0 ? 'active' : ''}`}
              >
                <div className="testimonial-header">
                  <div className="testimonial-avatar">
                    {testimonial.image ? (
                      <img src={testimonial.image} alt={testimonial.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {testimonial.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="testimonial-info">
                    <h4 className="testimonial-name">{testimonial.name}</h4>
                    <p className="testimonial-role">{testimonial.role}</p>
                  </div>
                </div>

                <div className="testimonial-rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                  ))}
                </div>

                <p className="testimonial-text">"{testimonial.text}"</p>

                <div className="testimonial-event">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  {testimonial.event}
                </div>
              </div>
            ))}
          </div>

          <button className="carousel-btn next" onClick={nextSlide} aria-label="Next testimonial">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="carousel-dots">
          {testimonialsData.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
