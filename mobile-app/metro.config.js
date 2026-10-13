// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure Metro uses mobile-app's node_modules first and ONLY
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

// Prevent Metro from resolving from parent directories
config.projectRoot = __dirname;
config.watchFolders = [__dirname];

// Block parent node_modules completely to prevent React 19 conflicts
const parentNodeModules = path.resolve(__dirname, '..', 'node_modules');
const escapedPath = parentNodeModules.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\/g, '/');
config.resolver.blockList = [
  new RegExp(`${escapedPath}/react/.*`),
  new RegExp(`${escapedPath}/react-dom/.*`),
];

// Web platformu için özel resolver ayarları
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Web için polyfill ve mock dosyalarını tanımla
if (!config.resolver.alias) {
  config.resolver.alias = {};
}

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && (
    moduleName === 'react-native-webview' ||
    moduleName.startsWith('react-native-webview/')
  )) {
    return {
      filePath: path.resolve(__dirname, 'shims/react-native-webview.web.js'),
      type: 'sourceFile',
    };
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

// Web platformu için react-native-worklets mock'u (otomatik algılanır .web.js ile)
// Metro otomatik olarak .web.js dosyalarını önceliklendirir

module.exports = config;
