import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors } from '../theme';

const { width } = Dimensions.get('window');

interface SkeletonLoaderProps {
  type?: 'stats' | 'productList' | 'productCard';
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type = 'stats' }) => {
  const pulseAnim = useRef(new Animated.Value(0.35)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.65,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    shimmer.start();

    return () => {
      pulse.stop();
      shimmer.stop();
    };
  }, [pulseAnim, shimmerAnim]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.4, width],
  });

  const SkeletonBox = ({ style }: { style?: object }) => (
    <Animated.View style={[styles.skeletonBox, style, { opacity: pulseAnim }]} />
  );

  const ShimmerOverlay = () => (
    <View style={styles.shimmerWrap}>
      <Animated.View
        style={[
          styles.shimmerBar,
          {
            transform: [{ translateX: shimmerTranslate }],
          },
        ]}
      />
    </View>
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
        <ShimmerOverlay />
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
    backgroundColor: colors.borderStrong,
    borderRadius: 4,
  },
  statsCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  shimmerWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  shimmerBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: width * 0.35,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
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
    backgroundColor: colors.border,
  },
  productListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  productImageSkeleton: {
    width: 120,
    height: 120,
    backgroundColor: colors.borderStrong,
  },
  productInfoSkeleton: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
});

export default SkeletonLoader;
