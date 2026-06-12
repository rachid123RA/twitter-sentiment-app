import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { H_PADDING } from '../../theme/layout';

export default function ScreenContainer({
  children,
  scroll = true,
  style,
  contentStyle,
  noBottomPad = false,
}) {
  const insets = useSafeAreaInsets();
  const pad = { paddingHorizontal: H_PADDING };
  const bottom = noBottomPad ? 0 : Math.max(insets.bottom, 8);

  if (!scroll) {
    return (
      <View style={[styles.root, { paddingBottom: bottom }, style]}>
        <View style={[pad, contentStyle, { flex: 1 }]}>{children}</View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.root, style]}
      contentContainerStyle={[pad, contentStyle, { paddingBottom: bottom + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F8FA' },
});
