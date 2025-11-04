// Convert SVG to PNG using sharp
// Usage: node backend/scripts/render_predictions_png.js
// Requires: npm i sharp

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

(async () => {
  try {
    const root = path.resolve(__dirname, '..', '..');
    const svgPath = path.join(root, 'assets', 'predictions', 'predicted_vs_actual.svg');
    const outDir = path.join(root, 'assets', 'predictions');
    const outPath = path.join(outDir, 'predicted_vs_actual.png');

    if (!fs.existsSync(svgPath)) {
      console.error('SVG not found at', svgPath);
      process.exit(1);
    }
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const svg = fs.readFileSync(svgPath);
    const png = await sharp(svg, { density: 300 }) // high density for crisp output
      .png({ quality: 90 })
      .toBuffer();

    fs.writeFileSync(outPath, png);
    console.log('Wrote', outPath);
  } catch (e) {
    console.error('Render failed:', e);
    process.exit(1);
  }
})();
