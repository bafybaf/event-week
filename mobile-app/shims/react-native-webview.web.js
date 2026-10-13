import React from 'react';
import { View, Text } from 'react-native';

export function WebView({ source }) {
  const uri = source?.uri || source?.html;
  if (source?.uri) {
    return React.createElement('iframe', {
      src: source.uri,
      title: 'webview',
      style: { flex: 1, width: '100%', height: '100%', border: 0 },
    });
  }
  return React.createElement(View, { style: { flex: 1 } },
    React.createElement(Text, null, typeof uri === 'string' ? 'PDF görüntüleyici' : '')
  );
}

export default WebView;
