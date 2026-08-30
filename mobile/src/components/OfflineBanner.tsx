import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

interface OfflineBannerProps {
  visible: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        ⚠️ You're offline — showing the last updated menu
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.warningBg,
    borderColor: COLORS.warningBorder,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: COLORS.warningText,
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
  },
});
