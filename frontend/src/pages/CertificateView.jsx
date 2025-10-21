import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CertificateTemplate from '../components/CertificateTemplate';
import './CertificateView.css';

const CertificateView = () => {
  const navigate = useNavigate();
  const [certData, setCertData] = useState(null);

  useEffect(() => {
    // Get certificate data from sessionStorage
    const data = sessionStorage.getItem('certificateData');
    if (data) {
      try {
        setCertData(JSON.parse(data));
      } catch (e) {
        console.error('Failed to parse certificate data', e);
        navigate('/my-events');
      }
    } else {
      navigate('/my-events');
    }
  }, [navigate]);

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
          showActions={true}
        />
      </div>
    </div>
  );
};

export default CertificateView;
