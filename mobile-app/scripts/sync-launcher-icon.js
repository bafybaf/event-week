const fs = require('fs');
const path = require('path');

const DEFAULT_API = 'http://xcnmst8cowlxzcnc24jgwofs.76.13.14.253.sslip.io/api';

function resolveOrigin() {
  const fromEnv = String(process.env.EXPO_PUBLIC_API_URL || '').trim();
  const raw = fromEnv || DEFAULT_API;
  return raw.replace(/\/api\/?$/, '').replace(/\/$/, '');
}

function toAbsolute(url, origin) {
  const value = String(url || '');
  if (!value) return '';
  const uploadsIndex = value.indexOf('/uploads/');
  if (uploadsIndex !== -1) {
    return `${origin}${value.slice(uploadsIndex)}`;
  }
  if (/^https?:\/\//i.test(value)) return value;
  return `${origin}/${value.replace(/^\//, '')}`;
}

async function main() {
  const origin = resolveOrigin();
  const assetsDir = path.join(__dirname, '..', 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });

  try {
    const response = await fetch(`${origin}/api/settings/public/app-icon`);
    const data = await response.json();
    const remoteUrl = toAbsolute(data.appIcon, origin);
    if (!remoteUrl) {
      console.log('Launcher icon: panelde ikon yok, mevcut assets kullanılacak.');
      return;
    }

    const imageResponse = await fetch(remoteUrl);
    if (!imageResponse.ok) {
      throw new Error(`İkon indirilemedi: ${imageResponse.status}`);
    }
    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    if (buffer.length < 32) {
      throw new Error('İndirilen ikon boş.');
    }

    fs.writeFileSync(path.join(assetsDir, 'icon.png'), buffer);
    fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), buffer);
    console.log(`Launcher icon güncellendi: ${remoteUrl}`);
  } catch (error) {
    console.warn('Launcher icon senkronu atlandı:', error.message);
  }
}

main();
