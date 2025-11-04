const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateCertificate = async (event, registration, position = 'none') => {
  return new Promise((resolve) => {
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
    });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    // Use registration.certificateType if available, otherwise fall back to position
    const certificateType = registration.certificateType || 
                          (position !== 'none' ? 'achievement' : 'participation');
    const isAchievement = certificateType === 'achievement';
    
    const participantName = registration.teamName || 
                          (registration.teamMembers?.[0]?.name || 'Participant');
    const eventDate = event.date ? new Date(event.date).toLocaleDateString() : '';

    // Certificate design
    doc
      .fontSize(36)
      .font('Helvetica-Bold')
      .text(
        isAchievement 
          ? (position === 'winner' ? '🏆 CERTIFICATE OF WINNER 🏆' : '🥈 CERTIFICATE OF ACHIEVEMENT')
          : 'CERTIFICATE OF PARTICIPATION', 
        0, 100, { align: 'center' }
      )
      
      .fontSize(16)
      .font('Helvetica')
      .text('This is to certify that', 0, 180, { align: 'center' })
      
      .fontSize(28)
      .font('Helvetica-Bold')
      .text(participantName, 0, 220, { align: 'center' })
      
      .fontSize(16)
      .font('Helvetica')
      .text(
        isAchievement 
          ? (position === 'winner' 
              ? 'has won 1st place in' 
              : 'has achieved 2nd place in')
          : 'has successfully participated in', 
        0, 270, { align: 'center' }
      )
      
      .fontSize(24)
      .font('Helvetica-Bold')
      .text(event.name, 0, 310, { align: 'center' })
      
      .fontSize(14)
      .font('Helvetica-Oblique')
      .text(`Held on ${eventDate}`, 0, 350, { align: 'center' });

    if (isAchievement && event.winners) {
      const winnerInfo = event.winners.find(w => 
        w.registrationId.toString() === registration._id.toString()
      );
      
      if (winnerInfo?.prizeMoney) {
        doc
          .fontSize(16)
          .text(`Prize: $${winnerInfo.prizeMoney}`, 0, 380, { align: 'center' });
      }
    }

    // Add signature line
    doc
      .moveTo(100, 450)
      .lineTo(300, 450)
      .stroke()
      .fontSize(12)
      .text('Event Organizer', 100, 460);

    doc.end();
  });
};

const sendCertificateEmail = async (event, registration, position = 'none') => {
  const { sendEmail } = require('./sendEmail');
  const certificateBuffer = await generateCertificate(event, registration, position);
  
  const subject = `Your ${event.name} ${position === 'none' ? 'Participation' : position} Certificate`;
  
  let message = `
    <h2>${event.name} - ${position === 'none' ? 'Participation' : 'Congratulations!'}</h2>
    <p>Dear ${registration.teamName || registration.teamMembers?.[0]?.name || 'Participant'},</p>
    
    <p>Thank you for participating in <strong>${event.name}</strong>.
    ${position !== 'none' ? `We are pleased to inform you that your team has been declared as the <strong>${position}</strong>!` : ''}
    </p>
    
    <p>Please find your certificate attached to this email.</p>
  `;

  if (position !== 'none') {
    const winnerInfo = event.winners?.find(w => 
      w.registrationId.toString() === registration._id.toString()
    );
    
    if (winnerInfo?.prizeMoney) {
      message += `
        <p>🏆 <strong>Prize Money: $${winnerInfo.prizeMoney}</strong></p>
        <p>Please contact the event administrator to claim your prize.</p>
      `;
    }
    
    message += `
      <p>We would love to hear about your experience! Please take a moment to provide your feedback:</p>
      <p><a href="${process.env.FRONTEND_URL || 'https://youreventportal.com'}/feedback/${event._id}">
        Click here to submit feedback
      </a></p>
    `;
  }

  message += `
    <p>For any queries, please contact the event organizers.</p>
    <p>Best regards,<br>${event.certificateOrganizer || 'Event Organizing Team'}</p>
  `;

  return sendEmail({
    email: registration.email || registration.teamMembers?.[0]?.email,
    subject,
    html: message,
    attachments: [{
      filename: `${event.name.replace(/\s+/g, '_')}_${position === 'none' ? 'certificate' : position}.pdf`,
      content: certificateBuffer,
      contentType: 'application/pdf'
    }]
  });
};

module.exports = {
  generateCertificate,
  sendCertificateEmail
};
