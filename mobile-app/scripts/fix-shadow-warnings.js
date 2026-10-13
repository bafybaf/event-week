/**
 * Shadow uyarılarını düzeltmek için script
 * Web'de boxShadow, Native'de shadow* props kullanır
 */

const fs = require('fs');
const path = require('path');

// Düzeltilecek dosyalar
const filesToFix = [
  'app/gallery.tsx',
  'app/appointments.tsx',
  'app/accommodations.tsx',
  'app/activities.tsx',
  'app/documents.tsx',
  'app/flights.tsx',
  'app/notes.tsx',
  'app/reports.tsx',
  'app/settings.tsx',
  'app/speakers.tsx',
  'app/surveys.tsx',
  'app/transfers.tsx',
  'app/voting.tsx',
  'app/announcements.tsx',
  'app/(tabs)/profile.tsx',
  'app/(tabs)/program.tsx',
  'app/(tabs)/qr-code.tsx',
];

const appDir = __dirname.replace(/[\\/]scripts$/, '');

function fixShadowStyles(filePath) {
  const fullPath = path.join(appDir, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Dosya bulunamadı: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Platform import kontrolü
  if (!content.includes("Platform") && content.includes('shadowColor')) {
    // React Native import'una Platform ekle
    const reactNativeImport = content.match(/import\s+{([^}]+)}\s+from\s+['"]react-native['"]/);
    if (reactNativeImport && !reactNativeImport[1].includes('Platform')) {
      content = content.replace(
        /import\s+{([^}]+)}\s+from\s+['"]react-native['"]/,
        `import { $1, Platform } from 'react-native'`
      );
      modified = true;
    }
  }

  // Shadow stillerini düzelt
  const shadowPattern = /(\s+)(shadowColor:\s*['"#][^'",]+['"],?\s*shadowOffset:\s*\{[^}]+\},?\s*shadowOpacity:\s*[\d.]+,\s*shadowRadius:\s*[\d.]+,\s*elevation:\s*\d+,?)/g;
  
  content = content.replace(shadowPattern, (match, indent) => {
    // Shadow değerlerini çıkar
    const shadowColor = match.match(/shadowColor:\s*['"#]([^'"]+)['"]/)?.[1] || '#000';
    const shadowOffsetMatch = match.match(/shadowOffset:\s*\{[^}]+\}/);
    const width = shadowOffsetMatch?.[0].match(/width:\s*([-\d]+)/)?.[1] || '0';
    const height = shadowOffsetMatch?.[0].match(/height:\s*([-\d]+)/)?.[1] || '2';
    const shadowOpacity = match.match(/shadowOpacity:\s*([\d.]+)/)?.[1] || '0.1';
    const shadowRadius = match.match(/shadowRadius:\s*([\d.]+)/)?.[1] || '3.84';
    const elevation = match.match(/elevation:\s*(\d+)/)?.[1] || '5';

    const opacityHex = Math.round(parseFloat(shadowOpacity) * 255).toString(16).padStart(2, '0');
    const boxShadow = `${width}px ${height}px ${shadowRadius}px ${shadowColor}${opacityHex}`;

    return `${indent}...(Platform.OS === 'web' ? {
${indent}  boxShadow: '${boxShadow}',
${indent}} : {
${indent}  shadowColor: '${shadowColor}',
${indent}  shadowOffset: { width: ${width}, height: ${height} },
${indent}  shadowOpacity: ${shadowOpacity},
${indent}  shadowRadius: ${shadowRadius},
${indent}  elevation: ${elevation},
${indent}}),`;
  });

  if (modified || content !== fs.readFileSync(fullPath, 'utf8')) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Düzeltildi: ${filePath}`);
    return true;
  }

  return false;
}

console.log('🔄 Shadow uyarıları düzeltiliyor...\n');

let fixedCount = 0;
filesToFix.forEach(file => {
  if (fixShadowStyles(file)) {
    fixedCount++;
  }
});

console.log(`\n✅ Toplam ${fixedCount} dosya düzeltildi.`);

