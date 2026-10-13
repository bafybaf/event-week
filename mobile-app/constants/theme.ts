/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';
import { Fonts as Poppins } from './fonts';

const tintColorLight = '#2BB6E8';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: Poppins.regular,
    serif: 'ui-serif',
    rounded: Poppins.regular,
    mono: 'ui-monospace',
  },
  default: {
    sans: Poppins.regular,
    serif: 'serif',
    rounded: Poppins.regular,
    mono: 'monospace',
  },
  web: {
    sans: `${Poppins.regular}, Poppins, sans-serif`,
    serif: "Georgia, 'Times New Roman', serif",
    rounded: `${Poppins.regular}, Poppins, sans-serif`,
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
