const puppeteer = require('puppeteer');

// Renders the front-end CertificateView to a PDF using Puppeteer so it matches exactly
// certData: object with the same shape used by CertificateView/sessionStorage
// options: { frontendUrl?: string, timeoutMs?: number }
// Returns: Buffer (PDF)
module.exports = async function renderCertificatePDF(certData = {}, options = {}) {
  const frontendUrl = options.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
  const timeoutMs = options.timeoutMs || 30000;

  // Encode cert data into base64 JSON for the CertificateView query param
  const payload = Buffer.from(JSON.stringify(certData), 'utf8').toString('base64');
  const url = `${frontendUrl.replace(/\/$/, '')}/certificate-view?data=${encodeURIComponent(payload)}`;

  // Launch Puppeteer (works locally and in most hosts)
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--font-render-hinting=medium'
    ]
  });

  try {
    const page = await browser.newPage();
    // Ensure a reasonable viewport to match layout
    await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 2 });

    // Navigate and wait for network idle to let fonts/images load
    await page.goto(url, { waitUntil: 'networkidle2', timeout: timeoutMs });

    // Wait for the certificate wrapper to be present (from CertificateTemplate)
    try {
      await page.waitForSelector('.certificate-view-container', { timeout: 8000 });
    } catch (_) {
      // Continue even if selector not found; PDF may still render
    }

    // Print to PDF
    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' }
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
};
