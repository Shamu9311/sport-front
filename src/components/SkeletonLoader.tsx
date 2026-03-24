import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors } from '../theme';

const { width } = Dimensions.get('window');

interface SkeletonLoaderProps {
  type?:
    | 'stats'
    | 'productList'
    | 'productCard'
    | 'recommendationList'
    | 'trainingList'
    | 'profileCard';
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
              <SkeletonBox style={{ width: '60%', height: 14, marginBottom: 10 }} />
              <View style={styles.productFooterSkeleton}>
                <SkeletonBox style={{ width: 18, height: 18, borderRadius: 9 }} />
                <SkeletonBox style={{ width: 100, height: 14, marginLeft: 6 }} />
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (type === 'recommendationList') {
    return (
      <View style={styles.recommendationListOuter}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.recommendationCard}>
            <View style={styles.recommendationRow}>
              <SkeletonBox style={styles.recommendationImage} />
              <View style={styles.recommendationInfo}>
                <SkeletonBox style={{ width: '85%', height: 18, marginBottom: 10 }} />
                <SkeletonBox style={{ width: '100%', height: 14, marginBottom: 6 }} />
                <SkeletonBox style={{ width: '70%', height: 14 }} />
              </View>
            </View>
            <View style={styles.reasoningBlock}>
              <SkeletonBox style={{ width: '55%', height: 12, marginBottom: 8 }} />
              <SkeletonBox style={{ width: '100%', height: 12, marginBottom: 4 }} />
              <SkeletonBox style={{ width: '90%', height: 12 }} />
            </View>
            <View style={styles.recommendationFooter}>
              <SkeletonBox style={{ width: 18, height: 18, borderRadius: 9 }} />
              <SkeletonBox style={{ width: 90, height: 14, marginLeft: 4 }} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (type === 'trainingList') {
    return (
      <View style={styles.trainingListOuter}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.trainingItem}>
            <SkeletonBox style={styles.trainingIconCircle} />
            <View style={styles.trainingContent}>
              <SkeletonBox style={{ width: '90%', height: 16, marginBottom: 10 }} />
              <View style={styles.trainingChipsRow}>
                <SkeletonBox style={{ width: 56, height: 14, borderRadius: 4, marginRight: 12 }} />
                <SkeletonBox style={{ width: 72, height: 14, borderRadius: 4, marginRight: 12 }} />
                <SkeletonBox style={{ width: 64, height: 14, borderRadius: 4 }} />
              </View>
            </View>
            <SkeletonBox style={{ width: 24, height: 24, borderRadius: 4 }} />
          </View>
        ))}
      </View>
    );
  }

  if (type === 'profileCard') {
    return (
      <View style={styles.profileScroll}>
        <View style={styles.profileHeaderSkeleton}>
          <SkeletonBox style={styles.profileAvatar} />
          <SkeletonBox style={{ width: 160, height: 22, marginBottom: 8 }} />
          <SkeletonBox style={{ width: 220, height: 16 }} />
        </View>
        {[1, 2].map((card) => (
          <View key={card} style={styles.profileCardSkeleton}>
            <View style={styles.profileCardHeaderRow}>
              <SkeletonBox style={{ width: 24, height: 24, borderRadius: 4 }} />
              <SkeletonBox style={{ width: 140, height: 20, marginLeft: 12 }} />
            </View>
            {[1, 2, 3, 4].map((row) => (
              <View key={row} style={styles.profileInfoRow}>
                <SkeletonBox style={{ width: '45%', height: 14 }} />
                <SkeletonBox style={{ width: '35%', height: 14 }} />
              </View>
            ))}
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
  productFooterSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  recommendationListOuter: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  recommendationCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 0,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    paddingBottom: 12,
  },
  recommendationRow: {
    flexDirection: 'row',
  },
  recommendationImage: {
    width: 120,
    height: 120,
    margin: 12,
    borderRadius: 12,
    backgroundColor: colors.borderStrong,
  },
  recommendationInfo: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    justifyContent: 'center',
  },
  reasoningBlock: {
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 12,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.border,
  },
  recommendationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  trainingListOuter: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },
  trainingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trainingIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    backgroundColor: colors.borderStrong,
  },
  trainingContent: {
    flex: 1,
  },
  trainingChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  profileScroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileHeaderSkeleton: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    backgroundColor: colors.borderStrong,
  },
  profileCardSkeleton: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  profileInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
  },
});

export default SkeletonLoader;
