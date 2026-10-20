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

async function writeIcon(buffer, filePath) {
  const sharpPath = path.join(__dirname, '..', '..', 'backend', 'node_modules', 'sharp');
  const sharp = require(sharpPath);
  const size = 1024;
  // Android yuvarlak ve adaptive maskesi dış yüzde 18'i keser. Görsel ortaya sığsın.
  const inner = Math.round(size * 0.62);
  const pad = Math.floor((size - inner) / 2);
  const extra = size - inner - pad * 2;
  await sharp(buffer)
    .resize(inner, inner, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: pad,
      bottom: pad + extra,
      left: pad,
      right: pad + extra,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(filePath);
}

async function main() {
  const origin = resolveOrigin();
  const assetsDir = path.join(__dirname, '..', 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });

  try {
    const iconResponse = await fetch(`${origin}/api/settings/public/app-icon`);
    const iconData = await iconResponse.json();
    const remoteUrl = toAbsolute(iconData.appIcon, origin);
    if (!remoteUrl) {
      console.log('Launcher icon: Ayarlar > Uygulama simgesi boş. Geniş logo simge olarak kullanılmaz.');
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

    await writeIcon(buffer, path.join(assetsDir, 'icon.png'));
    await writeIcon(buffer, path.join(assetsDir, 'adaptive-icon.png'));
    console.log(`Launcher icon güncellendi: ${remoteUrl}`);
  } catch (error) {
    console.warn('Launcher icon senkronu atlandı:', error.message);
  }
}

main();
