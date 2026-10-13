module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // react-native-reanimated plugin'ini en sona eklemek kritik
      'react-native-reanimated/plugin',
    ],
  };
};

