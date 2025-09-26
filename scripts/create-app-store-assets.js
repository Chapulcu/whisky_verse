#!/usr/bin/env node

/**
 * WhiskyVerse App Store Assets Creator
 * Creates marketing materials and screenshots for app store submission
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// App Store screenshot specifications
const screenshotSpecs = {
  iphone: [
    { name: 'iPhone 6.7"', width: 1290, height: 2796, devices: ['iPhone 14 Pro Max', 'iPhone 15 Pro Max'] },
    { name: 'iPhone 6.1"', width: 1179, height: 2556, devices: ['iPhone 14', 'iPhone 15'] },
    { name: 'iPhone 5.5"', width: 1242, height: 2208, devices: ['iPhone 8 Plus'] }
  ],
  ipad: [
    { name: 'iPad Pro 12.9"', width: 2048, height: 2732, devices: ['iPad Pro 12.9"'] },
    { name: 'iPad Pro 11"', width: 1668, height: 2388, devices: ['iPad Pro 11"'] }
  ],
  android: [
    { name: 'Phone', width: 1080, height: 1920, devices: ['Most Android phones'] },
    { name: 'Tablet', width: 1200, height: 1920, devices: ['Android tablets'] }
  ]
};

// Marketing copy for different languages
const marketingCopy = {
  tr: {
    title: "WhiskyVerse",
    subtitle: "Viski Severler Topluluğu",
    tagline: "Viskiler keşfedin, koleksiyonunuzu oluşturun, toplulukla bağlantı kurun",
    features: [
      "📚 Kişisel viski koleksiyonunuzu oluşturun",
      "🔍 Binlerce viski çeşidini keşfedin",
      "📷 Fotoğraf çekerek viskilerinizi kaydedin",
      "🏆 Başarımları kazanın ve rozetler toplayın",
      "📱 QR kod ile koleksiyonunuzu paylaşın",
      "🌍 Yakınınızdaki viski mekanlarını bulun"
    ],
    screenshots: [
      "Ana Sayfa - Viski keşfetmeye başlayın",
      "Koleksiyon - Kişisel viski arşiviniz",
      "Kamera - Fotoğraf çekerek kaydedin",
      "Keşfet - Yeni viskiler keşfedin",
      "Profil - Başarımlarınızı görüntüleyin"
    ]
  },
  en: {
    title: "WhiskyVerse",
    subtitle: "Whisky Lovers Community",
    tagline: "Discover whiskies, build your collection, connect with community",
    features: [
      "📚 Build your personal whisky collection",
      "🔍 Discover thousands of whisky varieties",
      "📷 Capture photos to save your whiskies",
      "🏆 Earn achievements and collect badges",
      "📱 Share your collection with QR codes",
      "🌍 Find nearby whisky locations"
    ],
    screenshots: [
      "Home - Start discovering whiskies",
      "Collection - Your personal whisky archive",
      "Camera - Capture and save with photos",
      "Discover - Find new whiskies",
      "Profile - View your achievements"
    ]
  }
};

// Create marketing HTML templates
function createMarketingTemplate(lang = 'tr') {
  const copy = marketingCopy[lang];

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${copy.title} - ${copy.subtitle}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #020617 0%, #1e293b 50%, #334155 100%);
            color: white;
            min-height: 100vh;
            overflow-x: hidden;
        }

        .hero {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 2rem;
            position: relative;
        }

        .hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image:
                radial-gradient(circle at 25% 25%, rgba(245, 158, 11, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 75% 75%, rgba(217, 119, 6, 0.1) 0%, transparent 50%);
            pointer-events: none;
        }

        .app-icon {
            width: 120px;
            height: 120px;
            margin-bottom: 2rem;
            border-radius: 24px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }

        .title {
            font-size: 4rem;
            font-weight: 700;
            background: linear-gradient(135deg, #f59e0b, #d97706, #f59e0b);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 1rem;
            text-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }

        .subtitle {
            font-size: 1.5rem;
            font-weight: 500;
            margin-bottom: 1rem;
            opacity: 0.9;
        }

        .tagline {
            font-size: 1.2rem;
            font-weight: 400;
            opacity: 0.8;
            margin-bottom: 3rem;
            max-width: 600px;
            line-height: 1.6;
        }

        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            max-width: 1200px;
            margin: 4rem 0;
        }

        .feature {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 2rem;
            text-align: left;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .feature:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(245, 158, 11, 0.1);
        }

        .feature-text {
            font-size: 1.1rem;
            line-height: 1.6;
        }

        .download-buttons {
            display: flex;
            gap: 1rem;
            margin-top: 3rem;
            flex-wrap: wrap;
            justify-content: center;
        }

        .download-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(245, 158, 11, 0.2);
            border: 1px solid #f59e0b;
            color: white;
            text-decoration: none;
            padding: 1rem 2rem;
            border-radius: 12px;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .download-btn:hover {
            background: #f59e0b;
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(245, 158, 11, 0.3);
        }

        .screenshots {
            margin-top: 6rem;
            text-align: center;
        }

        .screenshots h2 {
            font-size: 2.5rem;
            margin-bottom: 3rem;
            color: #f59e0b;
        }

        .screenshot-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            max-width: 1400px;
            margin: 0 auto;
        }

        .screenshot {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            padding: 2rem;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .screenshot-placeholder {
            width: 100%;
            height: 300px;
            background: linear-gradient(135deg, #1e293b, #334155);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            margin-bottom: 1rem;
        }

        .screenshot-title {
            font-size: 1.1rem;
            font-weight: 600;
            opacity: 0.9;
        }

        @media (max-width: 768px) {
            .title { font-size: 2.5rem; }
            .hero { padding: 1rem; }
            .features { grid-template-columns: 1fr; }
            .download-buttons { flex-direction: column; align-items: center; }
        }
    </style>
</head>
<body>
    <div class="hero">
        <svg class="app-icon" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#f59e0b;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#d97706;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="120" height="120" rx="24" fill="url(#icon-gradient)"/>
            <text x="60" y="75" font-size="48" text-anchor="middle" dominant-baseline="middle" font-family="Apple Color Emoji, Segoe UI Emoji, sans-serif">🥃</text>
        </svg>

        <h1 class="title">${copy.title}</h1>
        <h2 class="subtitle">${copy.subtitle}</h2>
        <p class="tagline">${copy.tagline}</p>

        <div class="features">
            ${copy.features.map(feature => `
                <div class="feature">
                    <div class="feature-text">${feature}</div>
                </div>
            `).join('')}
        </div>

        <div class="download-buttons">
            <a href="#" class="download-btn">
                <span>📱</span> PWA ${lang === 'tr' ? 'Olarak Yükle' : 'Install'}
            </a>
            <a href="#" class="download-btn">
                <span>🔗</span> ${lang === 'tr' ? 'Tarayıcıda Aç' : 'Open in Browser'}
            </a>
        </div>

        <div class="screenshots">
            <h2>${lang === 'tr' ? 'Ekran Görüntüleri' : 'Screenshots'}</h2>
            <div class="screenshot-grid">
                ${copy.screenshots.map((title, index) => `
                    <div class="screenshot">
                        <div class="screenshot-placeholder">📱</div>
                        <div class="screenshot-title">${title}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
</body>
</html>`;
}

// Create app store listing content
function createAppStoreListingContent() {
  return {
    tr: {
      name: "WhiskyVerse - Viski Severler Topluluğu",
      subtitle: "Viski Keşif ve Koleksiyon Platformu",
      description: `WhiskyVerse, viski severler için tasarlanmış kapsamlı bir platform. Viskiler keşfedin, kişisel koleksiyonunuzu oluşturun ve küresel toplulukla bağlantı kurun.

🥃 TEMEL ÖZELLİKLER:
• Kişisel viski koleksiyonunuzu dijital olarak kaydedin
• Binlerce viski çeşidini keşfedin ve inceleyin
• Fotoğraf çekerek viskilerinizi görsel olarak arşivleyin
• Başarımları kazanın ve özel rozetler toplayın
• QR kod teknolojisi ile koleksiyonunuzu paylaşın
• Yakınınızdaki viski barları ve mağazaları bulun

📱 MOBİL DENEYIM:
• PWA (Progressive Web App) teknolojisi
• Offline çalışabilme özelliği
• Kamera entegrasyonu
• Push bildirimleri
• Touch-friendly arayüz

🏆 GAMİFİKASYON:
• Koleksiyon başarımları
• Sosyal etkileşim rozetleri
• Fotoğraf çekme ödülleri
• Keşif milestone'ları

WhiskyVerse ile viski dünyasına adım atın ve global topluluğun bir parçası olun!`,

      keywords: "viski, whisky, koleksiyon, topluluk, fotoğraf, keşfet, başarım, QR kod, PWA",

      category: "Yaşam Tarzı",

      whatsNew: `🎉 Yeni Sürüm Özellikleri:
• Gelişmiş kamera deneyimi
• QR kod paylaşım sistemi
• Başarım sistemi
• Pull-to-refresh desteği
• Haptic feedback
• Push bildirimler
• Konum tabanlı mekan bulma`
    },

    en: {
      name: "WhiskyVerse - Whisky Community",
      subtitle: "Whisky Discovery & Collection Platform",
      description: `WhiskyVerse is a comprehensive platform designed for whisky enthusiasts. Discover whiskies, build your personal collection, and connect with a global community.

🥃 KEY FEATURES:
• Digitally record your personal whisky collection
• Discover and explore thousands of whisky varieties
• Visually archive your whiskies with photos
• Earn achievements and collect special badges
• Share your collection using QR code technology
• Find nearby whisky bars and stores

📱 MOBILE EXPERIENCE:
• PWA (Progressive Web App) technology
• Offline functionality
• Camera integration
• Push notifications
• Touch-friendly interface

🏆 GAMIFICATION:
• Collection achievements
• Social interaction badges
• Photography rewards
• Discovery milestones

Step into the whisky world with WhiskyVerse and become part of a global community!`,

      keywords: "whisky, whiskey, collection, community, photography, discover, achievement, QR code, PWA",

      category: "Lifestyle",

      whatsNew: `🎉 New Version Features:
• Enhanced camera experience
• QR code sharing system
• Achievement system
• Pull-to-refresh support
• Haptic feedback
• Push notifications
• Location-based venue finding`
    }
  };
}

// Create directories
const assetsDir = path.join(__dirname, '../assets');
const marketingDir = path.join(assetsDir, 'marketing');
const screenshotsDir = path.join(assetsDir, 'screenshots');

[assetsDir, marketingDir, screenshotsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

console.log('🎨 Creating WhiskyVerse App Store Assets...\n');

// Generate marketing pages
console.log('📄 Creating marketing pages...');
['tr', 'en'].forEach(lang => {
  const html = createMarketingTemplate(lang);
  const filename = `marketing-page-${lang}.html`;
  fs.writeFileSync(path.join(marketingDir, filename), html);
  console.log(`  ✅ Created ${filename}`);
});

// Generate app store listing content
console.log('\n📝 Creating app store listing content...');
const listingContent = createAppStoreListingContent();
fs.writeFileSync(path.join(marketingDir, 'app-store-listings.json'), JSON.stringify(listingContent, null, 2));
console.log('  ✅ Created app-store-listings.json');

// Create screenshot specifications document
console.log('\n📱 Creating screenshot specifications...');
const screenshotGuide = `# WhiskyVerse App Store Screenshots Guide

## Required Screenshot Sizes

### iOS App Store
${screenshotSpecs.iphone.map(spec => `
**${spec.name}**
- Size: ${spec.width}x${spec.height}px
- Devices: ${spec.devices.join(', ')}
`).join('')}

${screenshotSpecs.ipad.map(spec => `
**${spec.name}**
- Size: ${spec.width}x${spec.height}px
- Devices: ${spec.devices.join(', ')}
`).join('')}

### Google Play Store
${screenshotSpecs.android.map(spec => `
**${spec.name}**
- Size: ${spec.width}x${spec.height}px
- Devices: ${spec.devices.join(', ')}
`).join('')}

## Screenshot Content Suggestions

1. **Home Page** - Show main navigation and whisky discovery
2. **Collection View** - Display personal whisky collection grid
3. **Camera Feature** - Demonstrate photo capture functionality
4. **Whisky Details** - Show detailed whisky information page
5. **Profile & Achievements** - Display user profile with badges

## Tips for Screenshots

- Use high-quality device mockups
- Show actual content, not placeholder text
- Ensure good lighting and contrast
- Include diverse whisky collection examples
- Demonstrate key features clearly
- Use consistent branding colors (#f59e0b, #d97706)

## Tools Recommended

- **Figma** - For creating mockups
- **Screenshot Generator** - For device frames
- **Canva** - For marketing graphics
- **Browser Dev Tools** - For responsive testing
`;

fs.writeFileSync(path.join(screenshotsDir, 'screenshot-guide.md'), screenshotGuide);
console.log('  ✅ Created screenshot-guide.md');

// Create feature graphics specifications
const featureGraphicsSpecs = `# WhiskyVerse Feature Graphics Specifications

## Google Play Store Feature Graphic
- Size: 1024x500px
- Format: PNG or JPEG
- Must not contain device frames
- Should highlight key app features

## iOS App Store Preview
- Size: varies by device
- Video format: MOV, MP4, or M4V
- Duration: 15-30 seconds
- Show actual app usage

## Marketing Assets Needed

### Social Media
- **Instagram Post**: 1080x1080px
- **Instagram Story**: 1080x1920px
- **Twitter Header**: 1500x500px
- **Facebook Cover**: 1200x630px

### Website
- **Hero Image**: 1920x1080px
- **Feature Cards**: 400x300px
- **App Preview**: 375x812px (iPhone mockup)

### Press Kit
- **App Icon**: 1024x1024px (PNG)
- **Logo**: Vector format (SVG)
- **Screenshots**: Various sizes
- **Feature Graphics**: 1024x500px
`;

fs.writeFileSync(path.join(marketingDir, 'graphics-specifications.md'), featureGraphicsSpecs);
console.log('  ✅ Created graphics-specifications.md');

// Create a simple CSS file for screenshot styling
const screenshotStyles = `/* WhiskyVerse Screenshot Styles */
.screenshot-frame {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  background: linear-gradient(135deg, #020617, #1e293b);
}

.feature-highlight {
  background: rgba(245, 158, 11, 0.1);
  border: 2px solid #f59e0b;
  border-radius: 8px;
  padding: 4px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { border-color: #f59e0b; }
  50% { border-color: #d97706; }
}

.whisky-card-demo {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  color: white;
}
`;

fs.writeFileSync(path.join(screenshotsDir, 'screenshot-styles.css'), screenshotStyles);
console.log('  ✅ Created screenshot-styles.css');

console.log('\n🎉 App Store assets creation completed!');
console.log('\n📋 Generated files:');
console.log('  📁 Marketing materials: 4 files');
console.log('  📁 Screenshot guides: 3 files');
console.log('  🌐 Preview: Open assets/marketing/marketing-page-tr.html in browser');
console.log('\n💡 Next steps:');
console.log('  1. Take actual app screenshots using the guide');
console.log('  2. Create feature graphics for stores');
console.log('  3. Record app preview videos');
console.log('  4. Submit to PWABuilder for APK generation');