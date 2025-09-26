# WhiskyVerse PWA Deployment Guide

## 🚀 PWABuilder Android APK Generation

### Step 1: Validate PWA
Visit: https://www.pwabuilder.com
Enter your PWA URL: https://your-domain.com

### Step 2: Required PWA Checklist
- ✅ Web App Manifest (manifest.json)
- ✅ Service Worker (sw.js)
- ✅ HTTPS enabled
- ✅ App icons (multiple sizes)
- ✅ Start URL accessible
- ✅ Responsive design

### Step 3: Android Configuration
```json
{
  "packageId": "com.whiskyverse.app",
  "name": "WhiskyVerse",
  "launcherName": "WhiskyVerse",
  "themeColor": "#f58a3a",
  "backgroundColor": "#020617",
  "startUrl": "/",
  "iconUrl": "/icons/icon-512x512.svg",
  "maskableIconUrl": "/icons/icon-512x512-maskable.svg"
}
```

### Step 4: Download APK
1. Generate APK from PWABuilder
2. Sign with your keystore (or use PWABuilder's)
3. Test on Android device
4. Upload to Google Play Console

## 🍎 iOS Safari PWA Installation

### Required Meta Tags
Add these to your HTML head:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="WhiskyVerse">
<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.svg">
<link rel="apple-touch-startup-image" href="/icons/icon-512x512.svg">
<meta name="apple-touch-fullscreen" content="yes">
<link rel="mask-icon" href="/icons/icon-512x512.svg" color="#f58a3a">
<meta name="msapplication-TileColor" content="#f58a3a">
<meta name="msapplication-TileImage" content="/icons/icon-144x144.svg">
<meta name="msapplication-config" content="/browserconfig.xml">
```

### Installation Instructions for Users
1. Open Safari on iOS
2. Navigate to your PWA URL
3. Tap the Share button
4. Select "Add to Home Screen"
5. Confirm installation

## 📱 Testing Checklist

### PWA Functionality
- [ ] Offline functionality works
- [ ] Service Worker caches assets
- [ ] App installs correctly
- [ ] Icons display properly
- [ ] Push notifications work
- [ ] Camera access functions
- [ ] Geolocation works

### Android APK Testing
- [ ] APK installs without errors
- [ ] All features work in APK
- [ ] Camera permissions granted
- [ ] Location permissions work
- [ ] No JavaScript errors
- [ ] Performance acceptable

### iOS Testing
- [ ] Installs from Safari
- [ ] Full-screen mode works
- [ ] Status bar styling correct
- [ ] Touch targets appropriate size
- [ ] No horizontal scrolling
- [ ] Safe area respected

## 🔧 Troubleshooting

### Common Issues
1. **Manifest not found**: Ensure manifest.json is in public folder
2. **Icons not loading**: Check icon paths and sizes
3. **Service Worker errors**: Verify SW registration
4. **HTTPS required**: Deploy to HTTPS-enabled hosting
5. **Camera not working**: Check permissions in manifest

### Debug Tools
- Chrome DevTools > Application > Manifest
- Chrome DevTools > Application > Service Workers
- PWABuilder validation tool
- Lighthouse PWA audit

## 🏪 App Store Submission

### Google Play Store
1. Create Google Play Console account
2. Upload signed APK/AAB
3. Complete store listing
4. Add screenshots and descriptions
5. Set pricing and distribution
6. Submit for review

### Apple App Store (PWA)
- PWAs can be submitted as iOS apps using tools like:
  - PWABuilder iOS package
  - Capacitor by Ionic
  - Cordova/PhoneGap

### Alternative: Web App Directory
- Submit to PWA directories
- List on web app stores
- Promote as "installable web app"
