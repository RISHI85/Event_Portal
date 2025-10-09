import React from 'react';

const SectionCard = ({ title, subtitle, actions, children, style }) => {
  return (
    <section className="container fade-in-on-load" style={{ padding: 0 }}>
      <div
        className="section-card"
        style={{
          background: '#ffffff',
          border: '1px solid #eef2ff',
          borderRadius: 18,
          boxShadow: '0 12px 28px rgba(2, 6, 23, 0.10)',
          padding: 20,
          overflow: 'hidden',
          ...style,
        }}
      >
        {(title || actions) && (
          <div
            className="section-header"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}
          >
            <div>
              {title && <h2 style={{ margin: 0 }}>{title}</h2>}
              {subtitle && (
                <div className="muted" style={{ marginTop: 4, fontSize: 14 }}>{subtitle}</div>
              )}
            </div>
            {actions && <div>{actions}</div>}
          </div>
        )}
        <div>{children}</div>
      </div>
    </section>
  );
};

export default SectionCard;
