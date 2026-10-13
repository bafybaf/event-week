import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

type ScreenProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: Edge[];
};

export function Screen({ children, style, edges = ['bottom'] }: ScreenProps) {
  return (
    <SafeAreaView style={[styles.root, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
