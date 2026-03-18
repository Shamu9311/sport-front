import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface SkeletonLoaderProps {
  type?: 'stats' | 'productList' | 'productCard';
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type = 'stats' }) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const SkeletonBox = ({ style }: { style?: object }) => (
    <Animated.View style={[styles.skeletonBox, style, { opacity: pulseAnim }]} />
  );

  if (type === 'stats') {
    return (
      <View style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <SkeletonBox style={{ width: 24, height: 24, borderRadius: 4 }} />
          <SkeletonBox style={{ width: 100, height: 20, marginLeft: 12 }} />
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <SkeletonBox style={{ width: 40, height: 40, borderRadius: 20 }} />
            <SkeletonBox style={{ width: 50, height: 24, marginTop: 12 }} />
            <SkeletonBox style={{ width: 70, height: 14, marginTop: 8 }} />
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <SkeletonBox style={{ width: 40, height: 40, borderRadius: 20 }} />
            <SkeletonBox style={{ width: 60, height: 24, marginTop: 12 }} />
            <SkeletonBox style={{ width: 40, height: 14, marginTop: 8 }} />
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <SkeletonBox style={{ width: 40, height: 40, borderRadius: 20 }} />
            <SkeletonBox style={{ width: 40, height: 24, marginTop: 12 }} />
            <SkeletonBox style={{ width: 90, height: 14, marginTop: 8 }} />
          </View>
        </View>
      </View>
    );
  }

  if (type === 'productList') {
    return (
      <View style={styles.productListContainer}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.productCard}>
            <SkeletonBox style={styles.productImageSkeleton} />
            <View style={styles.productInfoSkeleton}>
              <SkeletonBox style={{ width: '80%', height: 18, marginBottom: 10 }} />
              <SkeletonBox style={{ width: '100%', height: 14, marginBottom: 6 }} />
              <SkeletonBox style={{ width: '60%', height: 14 }} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  skeletonBox: {
    backgroundColor: '#333',
    borderRadius: 4,
  },
  statsCard: {
    width: '100%',
    backgroundColor: '#252525',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#333',
  },
  productListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#252525',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  productImageSkeleton: {
    width: 120,
    height: 120,
    backgroundColor: '#333',
  },
  productInfoSkeleton: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
});

export default SkeletonLoader;
