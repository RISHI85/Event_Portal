import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CertificateTemplate from '../components/CertificateTemplate';
import './CertificateView.css';

const CertificateView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [certData, setCertData] = useState(null);

  useEffect(() => {
    // 1) Try URL query param `data` (base64-encoded JSON)
    try {
      const params = new URLSearchParams(location.search);
      const b64 = params.get('data');
      if (b64) {
        const json = atob(b64);
        const parsed = JSON.parse(json);
        setCertData({ ...parsed, __fromQuery: true });
        return;
      }
    } catch (e) {
      // fall back to sessionStorage
    }

    // 2) Fallback: sessionStorage
    try {
      const data = sessionStorage.getItem('certificateData');
      if (data) {
        setCertData(JSON.parse(data));
        return;
      }
    } catch (e) {
      // ignore and navigate
    }
    navigate('/my-events');
  }, [navigate, location.search]);

  if (!certData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p>Loading certificate...</p>
      </div>
    );
  }

  return (
    <div className="certificate-view-page">
      <div className="certificate-view-container">
        <CertificateTemplate
          participantName={certData.participantName}
          teamName={certData.teamName}
          eventName={certData.eventName}
          dateText={certData.dateText}
          organizerText={certData.organizerText}
          awardText={certData.awardText}
          accentColor={'#111827'}
          primaryColor={'#2563EB'}
          bgPattern={''}
          issuerName={'GMRIT'}
          logoUrl={''}
          headerLogoUrl={'/images/gmrit_logo.png'}
          showSeal={true}
          sealSize={84}
          sealText={'Official'}
          downloadBaseName={`${certData.eventName.replace(/\s+/g,'_')}_${certData.participantName.replace(/\s+/g,'_')}`}
          certificateId={certData.certificateId}
          verifyUrl={''}
          eventTimings={certData.eventTimings}
          courseMeta={{ level: '' }}
          leftSigner={{ name: certData.leftSigner, title: 'Instructor / Director' }}
          rightSigner={{ name: certData.rightSigner, title: 'Registrar / Authorized Signatory' }}
          showQR={false}
          showActions={!certData.__fromQuery}
        />
      </div>
    </div>
  );
};

export default CertificateView;
