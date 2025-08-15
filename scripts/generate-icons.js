// Script to generate PWA icons placeholder
// In production, you would use a tool like sharp or canvas to generate actual images

const fs = require('fs');
const path = require('path');

// SVG template for the icon
const createSVGIcon = (size) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#636B56;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#864936;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="url(#bgGradient)"/>
  
  <!-- VoiCRM Text -->
  <text x="50%" y="45%" 
        dominant-baseline="middle" 
        text-anchor="middle" 
        fill="white" 
        font-family="Forum, serif" 
        font-size="${size * 0.18}px" 
        font-weight="bold">
    VoiCRM
  </text>
  
  <!-- Tagline -->
  <text x="50%" y="62%" 
        dominant-baseline="middle" 
        text-anchor="middle" 
        fill="white" 
        font-family="Avenir, sans-serif" 
        font-size="${size * 0.06}px" 
        opacity="0.9">
    Every Second Counts
  </text>
  
  <!-- Phone Icon -->
  <g transform="translate(${size/2}, ${size * 0.75}) scale(${size/500})">
    <path d="M -30 -10 C -30 -20, -20 -30, -10 -30 L 10 -30 C 20 -30, 30 -20, 30 -10 L 30 10 C 30 20, 20 30, 10 30 L -10 30 C -20 30, -30 20, -30 10 Z" 
          fill="rgba(255,255,255,0.2)"/>
    <path d="M -15 -5 C -15 -10, -10 -15, -5 -15 L 5 -15 C 10 -15, 15 -10, 15 -5 L 15 5 C 15 10, 10 15, 5 15 L -5 15 C -10 15, -15 10, -15 5 Z" 
          fill="white"/>
  </g>
</svg>`;
};

// Generate icons
const sizes = [192, 512];
const publicDir = path.join(__dirname, '..', 'public');

sizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const fileName = `icon-${size}.svg`;
  const filePath = path.join(publicDir, fileName);
  
  fs.writeFileSync(filePath, svgContent, 'utf8');
  console.log(`Generated ${fileName}`);
});

// Also create a favicon.svg
const faviconSVG = createSVGIcon(32);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSVG, 'utf8');
console.log('Generated favicon.svg');

console.log('\nIcon generation complete!');
console.log('Note: For production, convert these SVGs to PNG format using a tool like:');
console.log('- ImageMagick: convert icon-192.svg icon-192.png');
console.log('- Online converter: https://svgtopng.com/');
console.log('- Or use a build tool like sharp in your build process');