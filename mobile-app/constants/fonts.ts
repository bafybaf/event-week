import { Platform, Text, TextInput } from 'react-native';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

export const poppinsAssets = {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
};

export const Fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

export const poppins = (weight: 'regular' | 'medium' | 'semiBold' | 'bold' = 'regular') => ({
  fontFamily: Fonts[weight],
  ...(Platform.OS === 'ios' ? { fontWeight: 'normal' as const } : {}),
});

let installed = false;

export function installPoppinsDefaults() {
  if (installed) return;
  installed = true;

  const TextAny = Text as any;
  const InputAny = TextInput as any;
  const base = { fontFamily: Fonts.regular };
  TextAny.defaultProps = {
    ...(TextAny.defaultProps || {}),
    style: [base, TextAny.defaultProps?.style],
  };
  InputAny.defaultProps = {
    ...(InputAny.defaultProps || {}),
    style: [base, InputAny.defaultProps?.style],
    placeholderTextColor: InputAny.defaultProps?.placeholderTextColor,
  };

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const id = 'event-week-poppins';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = `
        html, body, #root, input, textarea, button, select {
          font-family: ${Fonts.regular}, Poppins, sans-serif !important;
        }
        code, pre, .monospace {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
        }
      `;
      document.head.appendChild(style);
    }
  }
}
