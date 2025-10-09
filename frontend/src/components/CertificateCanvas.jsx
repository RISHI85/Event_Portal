import React, { useEffect, useRef, useState } from 'react';

// A lightweight, dependency-free certificate renderer using Canvas
// Props:
// - width, height: canvas size (defaults 1600x1131 ~ A3 landscape-ish)
// - backgroundUrl: background image URL (use public/images/certificate.jpg by default)
// - participantName, eventName, dateText, organizerText, awardText
// - accentColor, fontFamily
// - onReady(dataUrl) optional callback when canvas rendered
// - downloadFileName optional filename
const CertificateCanvas = ({
  width = 1600,
  height = 1131,
  backgroundUrl = '/images/certificate.jpg',
  participantName = 'Participant Name',
  eventName = 'Event Name',
  dateText = '',
  organizerText = '',
  awardText = 'Certificate of Participation',
  accentColor = '#0F172A',
  fontFamily = 'serif',
  onReady,
  downloadFileName = 'certificate.png',
}) => {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const draw = async () => {
    setLoading(true);
    setErr('');
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // Draw background
      const bg = await loadImage(backgroundUrl);
      ctx.drawImage(bg, 0, 0, width, height);

      // Shadow config for nicer text
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 4;

      // Award Title
      ctx.fillStyle = accentColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Title
      ctx.font = `700 ${Math.floor(width * 0.045)}px ${fontFamily}`;
      ctx.fillText(awardText, width / 2, height * 0.28);

      // Participant Name
      ctx.font = `700 ${Math.floor(width * 0.06)}px ${fontFamily}`;
      ctx.fillStyle = '#111827';
      wrapCenterText(ctx, participantName, width / 2, height * 0.42, Math.floor(width * 0.8));

      // Subtitle line
      ctx.font = `400 ${Math.floor(width * 0.025)}px ${fontFamily}`;
      ctx.fillStyle = '#374151';
      const sub = `for successfully participating in ${eventName}`;
      wrapCenterText(ctx, sub, width / 2, height * 0.50, Math.floor(width * 0.8));

      // Footer row: date and organizer/signature lines
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#1F2937';
      ctx.strokeStyle = '#9CA3AF';
      ctx.lineWidth = 2;

      const marginX = width * 0.12;
      const baseY = height * 0.78;
      const lineW = width * 0.28;

      // Left line (Date)
      ctx.beginPath();
      ctx.moveTo(marginX, baseY);
      ctx.lineTo(marginX + lineW, baseY);
      ctx.stroke();

      // Right line (Organizer)
      ctx.beginPath();
      ctx.moveTo(width - marginX - lineW, baseY);
      ctx.lineTo(width - marginX, baseY);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#374151';
      ctx.font = `500 ${Math.floor(width * 0.023)}px ${fontFamily}`;
      ctx.fillText('Date', marginX + lineW / 2, baseY + height * 0.03);
      ctx.fillText('Organizer / Signature', width - marginX - lineW / 2, baseY + height * 0.03);

      // Values below lines
      ctx.fillStyle = '#111827';
      ctx.font = `600 ${Math.floor(width * 0.026)}px ${fontFamily}`;
      if (dateText) ctx.fillText(dateText, marginX + lineW / 2, baseY - height * 0.03);
      if (organizerText) ctx.fillText(organizerText, width - marginX - lineW / 2, baseY - height * 0.03);

      const url = canvas.toDataURL('image/png');
      if (onReady) onReady(url);
    } catch (e) {
      setErr('Failed to render certificate');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backgroundUrl, participantName, eventName, dateText, organizerText, awardText, accentColor, fontFamily, width, height]);

  const onDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = downloadFileName;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div>
      <div style={{ position: 'relative', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
        {loading && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'#fff8', zIndex:1 }}>Rendering…</div>
        )}
        {err && <div className="muted" style={{ padding: 8, color:'#ef4444' }}>{err}</div>}
        <canvas ref={canvasRef} style={{ display:'block', width: '100%', height: 'auto' }} />
      </div>
      <div className="form-actions" style={{ marginTop: 8 }}>
        <button className="btn-primary" type="button" onClick={onDownload}>Download Certificate</button>
      </div>
    </div>
  );
};

export default CertificateCanvas;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapCenterText(ctx, text, cx, cy, maxWidth) {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let current = '';
  for (const w of words) {
    const test = current ? current + ' ' + w : w;
    const m = ctx.measureText(test);
    if (m.width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);

  const totalHeight = lines.length * lineHeight(ctx);
  let y = cy - totalHeight / 2 + lineHeight(ctx) / 2;
  for (const line of lines) {
    ctx.fillText(line, cx, y);
    y += lineHeight(ctx);
  }
}

function lineHeight(ctx) {
  // Approximate line height from current font size
  const sizeMatch = /\s(\d+)px\s/.exec(ctx.font);
  const size = sizeMatch ? Number(sizeMatch[1]) : 24;
  return Math.round(size * 1.3);
}
