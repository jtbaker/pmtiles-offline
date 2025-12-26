# PWA Icons

To complete the PWA setup, you need to generate PNG icons:

## Quick Method - Use the Icon Generator

1. Open `icon-generator.html` in your browser
2. Click the "Generate 192x192 Icon" button and save as `icon-192.png`
3. Click the "Generate 512x512 Icon" button and save as `icon-512.png`
4. Place both files in the `/docs` folder

## Alternative Method - Use ImageMagick or similar tool

Convert the SVG files to PNG:

```bash
# If you have ImageMagick installed
convert icon-192.svg icon-192.png
convert icon-512.svg icon-512.png
```

## Alternative Method - Use an online tool

1. Upload `icon-192.svg` and `icon-512.svg` to an SVG to PNG converter
2. Download as `icon-192.png` and `icon-512.png`
3. Place in the `/docs` folder

The PWA will work without icons, but having them provides a better user experience when installing the app.
