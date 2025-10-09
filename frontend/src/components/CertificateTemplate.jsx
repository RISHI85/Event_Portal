import React, { useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// A clean, responsive HTML certificate template rendered to PNG/PDF via html2canvas + jsPDF
// Props
// - participantName, eventName, dateText, organizerText, awardText
// - accentColor, primaryColor, bgPattern (optional url), sealText
// - downloadBaseName
const CertificateTemplate = ({
  participantName = 'Participant Name',
  teamName = '',
  eventName = 'Event Name',
  dateText = '',
  organizerText = '',
  awardText = 'Certificate of Participation',
  accentColor = '#0F172A',
  primaryColor = '#2563EB',
  bgPattern = '',
  sealText = 'Official',
  issuerName = 'GMRIT',
  logoUrl = '',
  headerLogoUrl = '',
  showSeal = true,
  sealSize = 110,
  downloadBaseName = 'certificate',
  showActions = true,
}) => {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);

  const styles = useMemo(() => ({
    wrapper: {
      position: 'relative',
      width: '1400px',
      maxWidth: '100%',
      aspectRatio: '1400 / 900',
      background: '#0b1b2b',
      borderRadius: '16px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
      overflow: 'hidden',
      border: '8px solid #0b1b2b',
    },
    rightBand: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: '16%',
      height: '100%',
      background: accentColor,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: '48px'
    },
    bandLogo: {
      width: '120px',
      height: '36px',
      objectFit: 'contain',
      filter: 'brightness(0) invert(1)'
    },
    bandLogoPlaceholder: {
      width: '120px',
      height: '36px',
      borderRadius: '6px',
      border: '1px dashed rgba(255,255,255,0.6)',
      color: 'rgba(255,255,255,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '12px'
    },
    panel: {
      position: 'absolute',
      inset: '24px 24px 24px 24px',
      background: '#fff',
      borderRadius: '16px',
      padding: '64px 80px 84px 80px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      columnGap: '46px',
      backgroundImage: bgPattern ? `url(${bgPattern})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
    title: {
      gridColumn: '1 / span 2',
      fontFamily: 'Georgia, Times, serif',
      fontWeight: 800,
      fontSize: '42px',
      color: '#111827',
      marginBottom: '24px'
    },
    name: {
      gridColumn: '1 / span 1',
      fontFamily: 'Georgia, Times, serif',
      fontWeight: 800,
      fontSize: '60px',
      color: '#111827',
      lineHeight: 1.1,
      wordBreak: 'break-word'
    },
    team: {
      gridColumn: '1 / span 1',
      marginTop: '8px',
      fontWeight: 700,
      fontSize: '22px',
      color: '#374151'
    },
    rightCol: {
      gridColumn: '2 / span 1',
      alignSelf: 'start',
      justifySelf: 'end',
      color: '#111827',
      textAlign: 'left'
    },
    headerLogoRow: {
      gridColumn: '1 / span 2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      marginBottom: '12px'
    },
    headerLogo: {
      height: '64px',
      maxWidth: '520px',
      objectFit: 'contain'
    },
    subtitle: {
      gridColumn: '1 / span 2',
      marginTop: '18px',
      fontSize: '20px',
      color: '#374151',
    },
    issuer: {
      gridColumn: '1 / span 2',
      marginTop: '8px',
      fontSize: '14px',
      color: '#6B7280',
    },
    issuedInline: {
      gridColumn: '1 / span 2',
      marginTop: '6px',
      fontSize: '14px',
      color: '#6B7280',
    },
    footerRow: {
      gridColumn: '1 / span 2',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      width: '100%',
      alignItems: 'end',
      gap: '24px',
      marginTop: '48px',
    },
    line: { height: '2px', background: '#9CA3AF', marginTop: '12px' },
    label: { color: '#6B7280', marginTop: '6px', fontSize: '14px' },
    seal: {
      position: 'absolute',
      right: 'calc(16% + 40px)',
      bottom: '154px',
      width: `${sealSize}px`,
      height: `${sealSize}px`,
      borderRadius: '50%',
      border: `4px solid ${primaryColor}`,
      color: primaryColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 800,
      fontSize: '16px',
      background: 'rgba(37, 99, 235, 0.06)'
    },
  }), [primaryColor, accentColor, bgPattern, sealSize]);

  const exportPNG = async () => {
    if (!ref.current) return;
    setBusy(true);
    try {
      const canvas = await html2canvas(ref.current, {
        backgroundColor: '#ffffff',
        scale: Math.min(2, window.devicePixelRatio || 1.5),
      });
      const link = document.createElement('a');
      link.download = `${downloadBaseName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally { setBusy(false); }
  };

  const exportPDF = async () => {
    if (!ref.current) return;
    setBusy(true);
    try {
      const canvas = await html2canvas(ref.current, {
        backgroundColor: '#ffffff',
        scale: Math.min(2, window.devicePixelRatio || 1.5),
      });
      const imgData = canvas.toDataURL('image/png');
      // Create landscape A4 PDF
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      // Fit image inside page with margin
      const margin = 24;
      const availableW = pageW - margin * 2;
      const availableH = pageH - margin * 2;
      const imgW = canvas.width;
      const imgH = canvas.height;
      const ratio = Math.min(availableW / imgW, availableH / imgH);
      const w = imgW * ratio;
      const h = imgH * ratio;
      const x = (pageW - w) / 2;
      const y = (pageH - h) / 2;
      pdf.addImage(imgData, 'PNG', x, y, w, h);
      pdf.save(`${downloadBaseName}.pdf`);
    } finally { setBusy(false); }
  };

  return (
    <div>
      <div ref={ref} style={styles.wrapper}>
        {/* Right brand band */}
        <div style={styles.rightBand}>
          {logoUrl ? (
            <img src={logoUrl} alt="logo" style={styles.bandLogo} />
          ) : (
            <div style={styles.bandLogoPlaceholder}>LOGO</div>
          )}
        </div>
        {/* White certificate panel */}
        <div style={styles.panel}>
          <div style={styles.headerLogoRow}>
            {headerLogoUrl ? (
              <img src={headerLogoUrl} alt="institution" style={styles.headerLogo} />
            ) : (
              <div style={{ height: 38 }} />
            )}
            <div />
          </div>
          <div style={styles.title}>{awardText}</div>
          <div style={styles.name}>{participantName}</div>
          {teamName && <div style={styles.team}>Team: {teamName}</div>}
          <div style={styles.rightCol}>
            {/* empty right column for visual balance / future content */}
          </div>
          <div style={styles.subtitle}>for successfully participating in {eventName}</div>
          <div style={styles.issuer}>Issued by {issuerName}</div>
          {dateText && <div style={styles.issuedInline}>Issued: {dateText}</div>}
          <div style={styles.footerRow}>
            <div>
              <div style={{ fontSize: 18, color: '#111827' }}>{dateText || '—'}</div>
              <div style={styles.line} />
              <div style={styles.label}>Date</div>
            </div>
            <div>
              <div style={{ fontSize: 18, color: '#111827' }}>{organizerText || '—'}</div>
              <div style={styles.line} />
              <div style={styles.label}>Organizer / Signature</div>
            </div>
          </div>
        </div>
        {showSeal && <div style={styles.seal}>{sealText}</div>}
      </div>
      {showActions !== false && (
        <div className="form-actions" style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button className="btn-primary" type="button" onClick={exportPNG} disabled={busy}>
            {busy ? 'Rendering…' : 'Download PNG'}
          </button>
          <button className="btn-secondary" type="button" onClick={exportPDF} disabled={busy}>
            {busy ? 'Rendering…' : 'Download PDF'}
          </button>
        </div>
      )}
    </div>
  );
}
;

export default CertificateTemplate;
