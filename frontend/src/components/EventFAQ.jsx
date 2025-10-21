import React, { useState } from 'react';
import './EventFAQ.css';

const EventFAQ = ({ event }) => {
  const [openIndex, setOpenIndex] = useState(null);

  // Generate FAQs based on event details
  const generateFAQs = () => {
    const faqs = [];

    // Registration FAQ
    if (event.registrationDetails) {
      if (event.registrationDetails.teamParticipation) {
        faqs.push({
          question: 'Is this a team event?',
          answer: `Yes, this is a team event. ${
            event.registrationDetails.minTeamSize && event.registrationDetails.maxTeamSize
              ? `Team size should be between ${event.registrationDetails.minTeamSize} and ${event.registrationDetails.maxTeamSize} members.`
              : 'Please check the registration details for team size requirements.'
          }`
        });
      } else {
        faqs.push({
          question: 'Is this an individual or team event?',
          answer: 'This is an individual event. You can register on your own.'
        });
      }
    }

    // Fee FAQ
    if (event.registrationDetails?.fee) {
      faqs.push({
        question: 'What is the registration fee?',
        answer: `The registration fee is ₹${event.registrationDetails.fee}. Payment can be made securely through our payment gateway after registration.`
      });
    }

    // Date FAQ
    if (event.date) {
      faqs.push({
        question: 'When is the event?',
        answer: `The event is scheduled for ${new Date(event.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}${event.time ? ` at ${event.time}` : ''}.`
      });
    }

    // Location FAQ
    if (event.location) {
      faqs.push({
        question: 'Where will the event take place?',
        answer: `The event will be held at ${event.location}. Please arrive 15 minutes early for check-in.`
      });
    }

    // Eligibility FAQ
    if (event.eligibleDepartments && event.eligibleDepartments.length > 0) {
      faqs.push({
        question: 'Who can participate?',
        answer: `This event is open to students from ${event.eligibleDepartments.join(', ')} departments.`
      });
    } else {
      faqs.push({
        question: 'Who can participate?',
        answer: 'This event is open to all students from all departments.'
      });
    }

    // General FAQs
    faqs.push({
      question: 'How do I register?',
      answer: 'Click the "Register Now" button on this page. You\'ll need to fill in your details and complete the payment if applicable. You\'ll receive a confirmation email once registration is complete.'
    });

    faqs.push({
      question: 'Can I cancel my registration?',
      answer: 'Please contact the event organizers for cancellation and refund policies. Contact details are available on this page.'
    });

    faqs.push({
      question: 'Will I receive a certificate?',
      answer: 'Yes, all participants will receive a certificate of participation after the event concludes.'
    });

    return faqs;
  };

  const faqs = generateFAQs();

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (faqs.length === 0) return null;

  return (
    <section className="event-faq-section">
      <h3 className="faq-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Frequently Asked Questions
      </h3>
      <div className="faq-list">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className={`faq-item ${openIndex === index ? 'open' : ''}`}
          >
            <button
              className="faq-question"
              onClick={() => toggleFAQ(index)}
            >
              <span>{faq.question}</span>
              <svg
                className="faq-icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className="faq-answer">
              <p>{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default EventFAQ;
