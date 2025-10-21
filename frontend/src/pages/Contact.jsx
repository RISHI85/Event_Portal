import React, { useState } from 'react';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return alert('Please fill in all fields.');
    setSubmitting(true);
    try {
      // Placeholder submit – integrates easily with a backend endpoint later.
      // For now, open mail client as a fallback.
      const subject = encodeURIComponent(`Contact from ${form.name}`);
      const body = encodeURIComponent(`${form.message}\n\nFrom: ${form.name} <${form.email}>`);
      window.location.href = `mailto:contact@eventportal.com?subject=${subject}&body=${body}`;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="contact-page" style={{ padding: '2rem 0' }}>
      <div className="container" style={{ maxWidth: 1000, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>Get in touch</h1>
        <p style={{ color: '#64748b', marginBottom: 24 }}>Have a question or need help? Our team is here for you.</p>

        <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
          <form onSubmit={handleSubmit} className="contact-form" style={{ background: '#fff', borderRadius: 12, boxShadow: '0 10px 24px rgba(0,0,0,0.06)', padding: 20 }}>
            <div style={{ display: 'grid', gap: 14 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontWeight: 600 }}>Name</span>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Your name" className="input" required />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontWeight: 600 }}>Email</span>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className="input" required />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontWeight: 600 }}>Message</span>
                <textarea name="message" rows={5} value={form.message} onChange={handleChange} placeholder="How can we help?" className="textarea" required />
              </label>
              <button type="submit" disabled={submitting} className="btn-view" style={{ alignSelf: 'start' }}>
                {submitting ? 'Sending…' : 'Submit'}
              </button>
            </div>
          </form>

          <aside className="contact-info" style={{ background: '#0f172a', color: '#e5e7eb', borderRadius: 12, padding: 20 }}>
            <h3 style={{ marginTop: 0 }}>Contact</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 5h4l2 4-3 2a12 12 0 0 0 6 6l2-3 4 2v4c0 1.1-.9 2-2 2A16 16 0 0 1 2 6c0-1.1.9-2 2-2z" stroke="#a8b820" strokeWidth="1.5"/></svg>
                <span>+91 1234567890</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16v12H4z" stroke="#a8b820" strokeWidth="1.5"/><path d="m4 6 8 6 8-6" stroke="#a8b820" strokeWidth="1.5"/></svg>
                <span>contact@eventportal.com</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" stroke="#a8b820" strokeWidth="1.5"/><circle cx="12" cy="10" r="2.5" stroke="#a8b820" strokeWidth="1.5"/></svg>
                <span>Campus, City</span>
              </li>
            </ul>
          </aside>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .contact-grid { grid-template-columns: 1fr; }
        }
        .input, .textarea {
          border: 1px solid rgba(0,0,0,0.12);
          border-radius: 10px;
          padding: 10px 12px;
          outline: none;
        }
        .input:focus, .textarea:focus { border-color: #94a3b8; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
      `}</style>
    </section>
  );
};

export default Contact;
