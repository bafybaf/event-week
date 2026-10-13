import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '../hooks/use-theme-color';

type PdfToolbarProps = {
  title: string;
  page: number;
  pages: number;
  scale: number;
  enabled: boolean;
  busy?: boolean;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onFit: () => void;
  onDownload?: () => void;
};

export function PdfToolbar({
  title,
  page,
  pages,
  scale,
  enabled,
  busy = false,
  onBack,
  onPrev,
  onNext,
  onZoomOut,
  onZoomIn,
  onFit,
  onDownload,
}: PdfToolbarProps) {
  const backgroundColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const muted = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');
  const toolsBg = useThemeColor({}, 'backgroundTertiary');
  const iconColor = enabled ? textColor : muted;
  const zoomLabel = `${Math.round(scale * 100)}%`;

  return (
    <View style={[styles.wrap, { backgroundColor, borderBottomColor: borderColor }]}>
      <View style={styles.navRow}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.iconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Geri"
        >
          <Ionicons name="arrow-back" size={22} color={textColor} />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {title || 'Program'}
          </Text>
          <Text style={[styles.subtitle, { color: muted }]} numberOfLines={1}>
            PDF görüntüleyici
          </Text>
        </View>
        {onDownload ? (
          <TouchableOpacity
            onPress={onDownload}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="PDF indir"
          >
            <Ionicons name="download-outline" size={22} color={primaryColor} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>

      <View style={[styles.toolsRow, { backgroundColor: toolsBg, borderColor }]}>
        <View style={styles.group}>
          <TouchableOpacity
            disabled={!enabled || page <= 1}
            onPress={onPrev}
            style={styles.toolBtn}
            accessibilityRole="button"
            accessibilityLabel="Önceki sayfa"
          >
            <Ionicons name="chevron-back" size={18} color={page <= 1 ? '#94a3b8' : iconColor} />
          </TouchableOpacity>
          <Text style={[styles.toolLabel, { color: textColor }]} accessibilityLabel={`Sayfa ${page} / ${pages}`}>
            {page} / {pages}
          </Text>
          <TouchableOpacity
            disabled={!enabled || page >= pages}
            onPress={onNext}
            style={styles.toolBtn}
            accessibilityRole="button"
            accessibilityLabel="Sonraki sayfa"
          >
            <Ionicons name="chevron-forward" size={18} color={page >= pages ? '#94a3b8' : iconColor} />
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: borderColor }]} />

        <View style={styles.group}>
          <TouchableOpacity
            disabled={!enabled || busy}
            onPress={onZoomOut}
            style={styles.toolBtn}
            accessibilityRole="button"
            accessibilityLabel="Uzaklaştır"
          >
            <Ionicons name="remove" size={18} color={iconColor} />
          </TouchableOpacity>
          <View style={styles.zoomBox}>
            {busy ? (
              <ActivityIndicator size="small" color={primaryColor} />
            ) : (
              <Text style={[styles.toolLabel, { color: textColor }]}>{zoomLabel}</Text>
            )}
          </View>
          <TouchableOpacity
            disabled={!enabled || busy}
            onPress={onZoomIn}
            style={styles.toolBtn}
            accessibilityRole="button"
            accessibilityLabel="Yakınlaştır"
          >
            <Ionicons name="add" size={18} color={iconColor} />
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: borderColor }]} />

        <TouchableOpacity
          disabled={!enabled || busy}
          onPress={onFit}
          style={styles.fitBtn}
          accessibilityRole="button"
          accessibilityLabel="Sayfayı sığdır"
        >
          <Ionicons name="scan-outline" size={16} color={primaryColor} />
          <Text style={[styles.fitText, { color: primaryColor }]}>Sığdır</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingTop: 4,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    marginHorizontal: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  toolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
    marginBottom: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    flexWrap: 'wrap',
    gap: 4,
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolLabel: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 52,
    textAlign: 'center',
  },
  zoomBox: {
    minWidth: 52,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 6,
  },
  fitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 8,
  },
  fitText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
