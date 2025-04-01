const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
    { size: 16, name: 'favicon-16x16.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 192, name: 'android-chrome-192x192.png' },
    { size: 512, name: 'android-chrome-512x512.png' }
];

async function generateFavicons() {
    try {
        // Read the SVG file
        const svgBuffer = fs.readFileSync('favicon.svg');

        // Generate each size
        for (const { size, name } of sizes) {
            await sharp(svgBuffer)
                .resize(size, size)
                .png()
                .toFile(name);
            console.log(`Generated ${name}`);
        }

        console.log('All favicons generated successfully!');
    } catch (error) {
        console.error('Error generating favicons:', error);
    }
}

generateFavicons(); 