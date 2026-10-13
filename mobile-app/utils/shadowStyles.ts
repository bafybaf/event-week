import { Platform, StyleSheet, ViewStyle } from 'react-native';

/**
 * Platform-agnostic shadow styles
 * Web'de boxShadow, Native'de shadow* props kullanır
 */
export const createShadowStyle = (
  shadowColor: string = '#000',
  shadowOffset: { width: number; height: number } = { width: 0, height: 2 },
  shadowOpacity: number = 0.1,
  shadowRadius: number = 3.84,
  elevation: number = 5
): ViewStyle => {
  if (Platform.OS === 'web') {
    // Web için boxShadow kullan
    const boxShadow = `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px ${shadowColor}${Math.round(shadowOpacity * 255).toString(16).padStart(2, '0')}`;
    return {
      boxShadow,
    };
  } else {
    // Native için shadow props kullan
    return {
      shadowColor,
      shadowOffset,
      shadowOpacity,
      shadowRadius,
      elevation,
    };
  }
};

/**
 * Predefined shadow styles
 */
export const shadowStyles = {
  small: createShadowStyle('#000', { width: 0, height: 1 }, 0.05, 1.41, 2),
  medium: createShadowStyle('#000', { width: 0, height: 2 }, 0.1, 3.84, 5),
  large: createShadowStyle('#000', { width: 0, height: 4 }, 0.15, 8, 10),
};

