import React from 'react';
import './Footer.css';

const Footer = () => (
  <footer className="site-footer">
    <div className="footer-inner">
      <div className="footer-grid">
        <div className="footer-col">
          <h4 className="footer-title">Event Portal</h4>
          <p className="footer-text">Your comprehensive solution for managing and organizing events efficiently.</p>
        </div>

        <div className="footer-col">
          <h4 className="footer-title">Quick Links</h4>
          <ul className="footer-links">
            <li><a href="/">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
            <li><a href="/admin">Admin</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-title">Contact</h4>
          <ul className="footer-contact">
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16v12H4z" stroke="#a8b820" strokeWidth="1.5"/><path d="m4 6 8 6 8-6" stroke="#a8b820" strokeWidth="1.5"/></svg>
              <span>contact@eventportal.com</span>
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 5h4l2 4-3 2a12 12 0 0 0 6 6l2-3 4 2v4c0 1.1-.9 2-2 2A16 16 0 0 1 2 6c0-1.1.9-2 2-2z" stroke="#f472b6" strokeWidth="1.5"/></svg>
              <span>+91 1234567890</span>
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" stroke="#ef5da8" strokeWidth="1.5"/><circle cx="12" cy="10" r="2.5" stroke="#ef5da8" strokeWidth="1.5"/></svg>
              <span>Campus, City</span>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-title">Follow Us</h4>
          <ul className="footer-links">
            <li><a href="#">Facebook</a></li>
            <li><a href="#">Twitter</a></li>
            <li><a href="#">Instagram</a></li>
            <li><a href="#">LinkedIn</a></li>
          </ul>
        </div>
      </div>

      <div id="contact" className="footer-copy">© 2025 EventPortal. All rights reserved.</div>
    </div>
  </footer>
);

export default Footer;
