import { useState } from 'react';
import { Dimensions, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { AppVideo } from './AppVideo';

export type FeedSlide = {
  url: string;
  type: 'image' | 'video';
};

type FeedCarouselProps = {
  media: FeedSlide[];
  width: number;
  onOpen: (index: number) => void;
};

export function FeedCarousel({ media, width, onOpen }: FeedCarouselProps) {
  const [page, setPage] = useState(0);
  const height = Math.min(width * 1.15, Dimensions.get('window').height * 0.65);

  if (!media.length) return null;

  return (
    <View>
      <FlatList
        data={media}
        horizontal
        pagingEnabled
        bounces={media.length > 1}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => String(index)}
        onMomentumScrollEnd={(event) => {
          const next = Math.round(event.nativeEvent.contentOffset.x / Math.max(width, 1));
          setPage(next);
        }}
        renderItem={({ item, index }) => (
          <TouchableOpacity activeOpacity={0.95} style={{ width, height }} onPress={() => onOpen(index)}>
            {item.type === 'video' ? (
              <View style={{ width, height }}>
                <AppVideo
                  uri={item.url}
                  style={{ width, height, backgroundColor: '#020617' }}
                  contentFit="contain"
                  shouldPlay={false}
                  nativeControls={false}
                />
                <View style={styles.playBadge} pointerEvents="none">
                  <Ionicons name="play" size={18} color="#fff" />
                </View>
              </View>
            ) : (
              <Image source={{ uri: item.url }} style={{ width, height, backgroundColor: '#020617' }} contentFit="contain" />
            )}
          </TouchableOpacity>
        )}
      />
      {media.length > 1 && (
        <View style={styles.dots} pointerEvents="none">
          <View style={styles.count}>
            {media.map((_, index) => (
              <View key={index} style={[styles.dot, index === page && styles.dotOn]} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  playBadge: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 10,
    alignItems: 'center',
  },
  count: {
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotOn: {
    backgroundColor: '#fff',
  },
});
