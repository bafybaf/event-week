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

function loadSharp() {
  try {
    return require('sharp');
  } catch (error) {
    return require(path.join(__dirname, '..', '..', 'backend', 'node_modules', 'sharp'));
  }
}

async function writeIcon(buffer, filePath) {
  const sharp = loadSharp();
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

async function syncAppName(origin) {
  const response = await fetch(`${origin}/api/settings/public/app-name`);
  if (!response.ok) {
    console.log('Uygulama başlığı uç noktası yok, app.json adı korunuyor.');
    return;
  }
  const data = await response.json();
  const name = String(data.appName || '').trim().slice(0, 30);
  if (!name) return;
  const appJsonPath = path.join(__dirname, '..', 'app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  appJson.expo.name = name;
  fs.writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`);
  console.log(`Uygulama başlığı derlemeye yazıldı: ${name}`);
}

async function main() {
  const origin = resolveOrigin();
  const assetsDir = path.join(__dirname, '..', 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });

  try {
    await syncAppName(origin);
  } catch (error) {
    console.warn('Uygulama başlığı senkronu atlandı:', error.message);
  }

  try {
    const iconResponse = await fetch(`${origin}/api/settings/public/app-icon`);
    const iconData = await iconResponse.json();
    const remoteUrl = toAbsolute(iconData.appIcon, origin);
    if (!remoteUrl) {
      console.log('Uygulama simgesi boş. Logo kullanılmadı, mevcut simge korunuyor.');
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
