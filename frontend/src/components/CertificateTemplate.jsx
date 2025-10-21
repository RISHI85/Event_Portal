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
  // New professional elements
  certificateId = '',
  verifyUrl = '',
  orgName = '',
  orgTagline = '',
  courseMeta = { duration: '4 Hours', level: 'Advanced', credits: '' },
  eventTimings = null,
  leftSigner = { name: 'Organizer', title: 'Organizer / Signature' },
  rightSigner = { name: 'Registrar', title: 'Registrar / Authorized Signatory' },
  qrImageUrl, // if provided, overrides generated QR url
  showQR = false,
}) => {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);

  // Calculate duration from event timings
  const calculatedDuration = useMemo(() => {
    if (!eventTimings || !eventTimings.length) return courseMeta?.duration || '—';
    
    let totalMinutes = 0;
    eventTimings.forEach(timing => {
      if (timing.startTime && timing.endTime) {
        const start = parseTime(timing.startTime);
        const end = parseTime(timing.endTime);
        if (start && end) {
          const diff = (end - start) / (1000 * 60); // minutes
          totalMinutes += diff > 0 ? diff : 0;
        }
      }
    });

    if (totalMinutes === 0) return courseMeta?.duration || '—';
    
    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.round(totalMinutes % 60);
    
    if (hours > 0 && mins > 0) return `${hours} Hour${hours > 1 ? 's' : ''} ${mins} Min${mins > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} Hour${hours > 1 ? 's' : ''}`;
    return `${mins} Minute${mins > 1 ? 's' : ''}`;
  }, [eventTimings, courseMeta]);

  // Helper to parse time strings like "10:00 AM" or "14:30"
  const parseTime = (timeStr) => {
    if (!timeStr) return null;
    try {
      const today = new Date();
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      
      if (period) {
        // 12-hour format
        if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
        if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
      }
      
      return new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes || 0);
    } catch {
      return null;
    }
  };

  const styles = useMemo(() => ({
    wrapper: {
      position: 'relative',
      width: '1200px',
      maxWidth: '100%',
      height: '700px',
      margin: '0 auto',
      background: '#1e293b',
      borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      overflow: 'visible',
      padding: '24px',
    },
    panel: {
      position: 'relative',
      width: '100%',
      height: '100%',
      background: '#fff',
      borderRadius: '16px',
      padding: '40px 50px',
      display: 'flex',
      flexDirection: 'column',
      backgroundImage: bgPattern ? `url(${bgPattern})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      border: '3px solid #d4af37',
    },
    headerRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '20px',
    },
    leftHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    gmLogo: {
      width: '80px',
      height: '80px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      overflow: 'hidden',
    },
    gmLogoImg: {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
    },
    orgBlock: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
    orgName: {
      fontWeight: 800,
      fontSize: '18px',
      color: '#111827',
      letterSpacing: '0.5px',
    },
    orgTagline: {
      fontSize: '13px',
      color: '#6B7280',
    },
    certId: {
      fontSize: '12px',
      color: '#9CA3AF',
      textAlign: 'right',
    },
    title: {
      fontFamily: 'Georgia, Times, serif',
      fontWeight: 700,
      fontSize: '36px',
      color: '#111827',
      textAlign: 'center',
      marginBottom: '16px',
      letterSpacing: '-0.5px',
    },
    certifyText: {
      fontSize: '14px',
      color: '#6B7280',
      textAlign: 'center',
      marginBottom: '12px',
    },
    name: {
      fontFamily: 'Georgia, Times, serif',
      fontWeight: 800,
      fontSize: '56px',
      color: '#111827',
      textAlign: 'center',
      lineHeight: 1.1,
      marginBottom: '4px',
      borderBottom: '3px solid #eab308',
      paddingBottom: '6px',
      display: 'inline-block',
      margin: '0 auto 12px',
    },
    team: {
      fontWeight: 700,
      fontSize: '18px',
      color: '#374151',
      textAlign: 'center',
      marginBottom: '16px',
    },
    subtitle: {
      fontSize: '15px',
      color: '#374151',
      textAlign: 'center',
      lineHeight: 1.5,
      marginBottom: '20px',
      maxWidth: '750px',
      margin: '0 auto 20px',
    },
    metaBlock: {
      display: 'flex',
      justifyContent: 'center',
      gap: '60px',
      marginBottom: '24px',
      paddingTop: '12px',
      borderTop: '1px solid #e5e7eb',
    },
    metaItem: {
      textAlign: 'center',
    },
    metaLabel: {
      fontSize: '13px',
      color: '#6B7280',
      marginBottom: '4px',
      fontWeight: 500,
    },
    metaValue: {
      fontSize: '18px',
      color: '#111827',
      fontWeight: 700,
    },
    footerRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '24px',
      marginTop: 'auto',
      paddingTop: '16px',
      alignItems: 'end',
    },
    footerItem: {
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
    },
    footerItemWithSeal: {
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-end',
      position: 'relative',
    },
    footerName: {
      fontSize: '16px',
      color: '#111827',
      fontWeight: 600,
      marginBottom: '8px',
    },
    line: {
      height: '2px',
      background: '#9CA3AF',
      marginBottom: '8px',
      width: '100%',
    },
    label: {
      color: '#6B7280',
      fontSize: '13px',
      fontWeight: 500,
    },
    seal: {
      width: `${sealSize}px`,
      height: `${sealSize}px`,
      borderRadius: '50%',
      border: `4px solid ${primaryColor}`,
      color: primaryColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 800,
      fontSize: '14px',
      background: 'rgba(37, 99, 235, 0.06)',
      textTransform: 'uppercase',
      position: 'absolute',
      top: '-100px',
      left: '50%',
      transform: 'translateX(-50%)',
    },
    issuerFooter: {
      position: 'absolute',
      bottom: '16px',
      right: '50px',
      fontSize: '10px',
      color: '#9CA3AF',
    },
  }), [primaryColor, bgPattern, sealSize]);

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
        <div style={styles.panel}>
          {/* Header */}
          <div style={styles.headerRow}>
            <div style={styles.leftHeader}>
              <div style={styles.gmLogo}>
                <img 
                  src={headerLogoUrl || '/images/gmrit_logo.png'} 
                  alt="GMRIT Logo" 
                  style={styles.gmLogoImg}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement.innerHTML = '<div style="width:100%;height:100%;background:linear-gradient(135deg,#eab308 0%,#f59e0b 100%);border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:32px;color:#fff;">GM</div>';
                  }}
                />
              </div>
              <div style={styles.orgBlock}>
                <div style={styles.orgName}>GMRIT</div>
                <div style={styles.orgTagline}>Training Tomorrow's Engineers Today</div>
              </div>
            </div>
            {certificateId && <div style={styles.certId}>ID: {certificateId}</div>}
          </div>

          {/* Title */}
          <div style={styles.title}>{awardText}</div>

          {/* Certify text */}
          <div style={styles.certifyText}>This is to certify that</div>

          {/* Name */}
          <div style={{ textAlign: 'center' }}>
            <div style={styles.name}>{participantName}</div>
          </div>

          {/* Team */}
          {teamName && <div style={styles.team}>Team: {teamName}</div>}

          {/* Subtitle */}
          <div style={styles.subtitle}>
            has successfully participated in <strong>{eventName}</strong> and demonstrated exceptional commitment and teamwork throughout the event.
          </div>

          {/* Meta info */}
          <div style={styles.metaBlock}>
            {calculatedDuration && (
              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Duration</div>
                <div style={styles.metaValue}>{calculatedDuration}</div>
              </div>
            )}
            {courseMeta?.level && (
              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Level</div>
                <div style={styles.metaValue}>{courseMeta.level}</div>
              </div>
            )}
          </div>

          {/* Footer signatures */}
          <div style={styles.footerRow}>
            <div style={styles.footerItem}>
              <div style={styles.footerName}>{leftSigner?.name || organizerText || 'Organizer'}</div>
              <div style={styles.line} />
              <div style={styles.label}>{leftSigner?.title || 'Instructor / Director'}</div>
            </div>
            <div style={styles.footerItem}>
              <div style={styles.footerName}>{rightSigner?.name || 'Registrar'}</div>
              <div style={styles.line} />
              <div style={styles.label}>{rightSigner?.title || 'Registrar / Authorized Signatory'}</div>
            </div>
            <div style={styles.footerItemWithSeal}>
              {/* Seal positioned above date */}
              {showSeal && <div style={styles.seal}>{sealText}</div>}
              <div style={styles.footerName}>{dateText || '—'}</div>
              <div style={styles.line} />
              <div style={styles.label}>Date</div>
            </div>
          </div>

          {/* Issuer footer */}
          <div style={styles.issuerFooter}>Issued by {issuerName}</div>
        </div>
      </div>
      {showActions !== false && (
        <div className="form-actions" style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button className="btn-primary" type="button" onClick={exportPDF} disabled={busy} style={{ display: 'none' }}>
            {busy ? 'Rendering…' : 'Official PDF (verifiable)'}
          </button>
          <button className="btn-secondary" type="button" onClick={exportPNG} disabled={busy} style={{ display: 'none' }}>
            {busy ? 'Rendering…' : 'Download PNG'}
          </button>
        </div>
      )}
    </div>
  );
}
;

export default CertificateTemplate;
