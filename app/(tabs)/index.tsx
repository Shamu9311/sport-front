import React, { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { getUserTrainingSessions } from '../../src/services/api';
import AnimatedNumber from '../../src/components/AnimatedNumber';
import SkeletonLoader from '../../src/components/SkeletonLoader';
import MetricCard from '../../src/components/ui/MetricCard';
import SectionHeader from '../../src/components/ui/SectionHeader';
import AppCard from '../../src/components/ui/AppCard';
import ScreenHero from '../../src/components/ui/ScreenHero';
import PressableScale from '../../src/components/ui/PressableScale';
import { colors, shadows, spacing, radius, fontFamily } from '../../src/theme';

const logoPath = require('../../assets/images/login.png');

const HOME_FEATURES = [
  {
    icon: 'sparkles' as const,
    title: 'IA Personalizada',
    description: 'Recomendaciones inteligentes basadas en tu perfil y entrenamientos',
    color: colors.accent1,
  },
  {
    icon: 'time' as const,
    title: 'Timing de Consumo',
    description: 'Sabe exactamente cuándo y cómo consumir cada producto',
    color: colors.accent2,
  },
  {
    icon: 'analytics' as const,
    title: 'Tracking Completo',
    description: 'Registra tus entrenamientos y monitorea tu progreso',
    color: colors.accent3,
  },
  {
    icon: 'shield-checkmark' as const,
    title: 'Restricciones Dietéticas',
    description: 'Respetamos tus preferencias y restricciones alimenticias',
    color: colors.warning,
  },
];

function QuickAccessCard({
  onPress,
  label,
  iconSoft,
  children,
}: {
  onPress: () => void;
  label: string;
  iconSoft: string;
  children: ReactNode;
}) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.96}
      haptic="light"
      style={styles.quickAccessCard}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.quickAccessIconWrap, { backgroundColor: iconSoft }]}>
        {children}
      </View>
      <Text style={styles.quickAccessText}>{label}</Text>
    </PressableScale>
  );
}

const HomeScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    trainings: 0,
    totalMinutes: 0,
    thisWeek: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [currentFeature, setCurrentFeature] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const featureContentOpacity = useRef(new Animated.Value(1)).current;
  const featureFadeSkipFirst = useRef(true);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (featureFadeSkipFirst.current) {
      featureFadeSkipFirst.current = false;
      return;
    }
    featureContentOpacity.setValue(0);
    Animated.timing(featureContentOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentFeature, featureContentOpacity]);

  const loadStats = useCallback(async () => {
    if (!user?.id) {
      setStatsLoading(false);
      return;
    }

    setStatsLoading(true);
    try {
      const sessions = await getUserTrainingSessions(user.id);

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const thisWeekSessions = sessions.filter((s: any) => {
        const sessionDate = new Date(s.session_date);
        return sessionDate >= weekAgo;
      });

      const totalMinutes = sessions.reduce(
        (sum: number, s: any) => sum + (s.duration_min || 0),
        0
      );

      setStats({
        trainings: sessions.length,
        totalMinutes: totalMinutes,
        thisWeek: thisWeekSessions.length,
      });
    } catch (error: any) {
      if (error?.status !== 401) {
        console.error('Error loading stats:', error);
      }
    } finally {
      setStatsLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % HOME_FEATURES.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Onboarding visible para usuarios sin entrenamientos; usuarios activos ven solo su actividad
  const showOnboarding = !user || (!statsLoading && stats.trainings === 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ScreenHero>
          <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
            <Image source={logoPath} style={styles.logo} resizeMode="contain" />
          </Animated.View>

          <Text style={styles.greeting} accessibilityRole="header">
            ¡Hola{user?.username ? `, ${user.username}` : ''}!
          </Text>
          <Text style={styles.subGreeting}>Listo para optimizar tu rendimiento</Text>
        </ScreenHero>

        {user && (
          <View style={styles.activitySection}>
            <SectionHeader title="Tu actividad" overline="Resumen de rendimiento" />
            {statsLoading ? (
              <SkeletonLoader type="stats" />
            ) : (
              <View style={styles.metricsRow}>
                <MetricCard
                  iconName="barbell-outline"
                  value={<AnimatedNumber value={stats.thisWeek} style={styles.metricValue} />}
                  label="Esta semana"
                />
                <MetricCard
                  iconName="time-outline"
                  value={formatTime(stats.totalMinutes)}
                  label="Tiempo total"
                />
                <MetricCard
                  iconName="trophy-outline"
                  value={<AnimatedNumber value={stats.trainings} style={styles.metricValue} />}
                  label="Entrenamientos"
                />
              </View>
            )}
          </View>
        )}

        <View style={styles.quickAccessSection}>
          <SectionHeader title="Acceso rápido" />
          <View style={styles.quickAccessGrid}>
            <QuickAccessCard
              label="Productos"
              iconSoft={colors.categoryEnergySoft}
              onPress={() => router.push('/(tabs)/products')}
            >
              <Ionicons name="cube-outline" size={28} color={colors.categoryEnergy} />
            </QuickAccessCard>

            <QuickAccessCard
              label="Entrenar"
              iconSoft={colors.categorySupplementSoft}
              onPress={() => router.push('/(tabs)/training')}
            >
              <Ionicons name="barbell-outline" size={28} color={colors.categorySupplement} />
            </QuickAccessCard>

            <QuickAccessCard
              label="Para Ti"
              iconSoft="rgba(224, 160, 62, 0.15)"
              onPress={() => router.push('/(tabs)/recommendations')}
            >
              <Ionicons name="star-outline" size={28} color={colors.warning} />
            </QuickAccessCard>

            <QuickAccessCard
              label="Perfil"
              iconSoft={colors.categoryHydrationSoft}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Ionicons name="person-outline" size={28} color={colors.categoryHydration} />
            </QuickAccessCard>
          </View>
        </View>

        {/* Secciones de onboarding: solo para usuarios sin entrenamientos registrados */}
        {showOnboarding && (
          <>
            <View style={styles.featuresSection}>
              <SectionHeader title="¿Por qué SIS?" />
              <AppCard highlight style={styles.featureCard}>
                <Animated.View
                  style={[styles.featureContentAnimated, { opacity: featureContentOpacity }]}
                >
                  <View
                    style={[
                      styles.featureIconContainer,
                      { backgroundColor: HOME_FEATURES[currentFeature].color + '1A' },
                    ]}
                  >
                    <Ionicons
                      name={HOME_FEATURES[currentFeature].icon as any}
                      size={36}
                      color={HOME_FEATURES[currentFeature].color}
                    />
                  </View>
                  <Text style={styles.featureTitle}>{HOME_FEATURES[currentFeature].title}</Text>
                  <Text style={styles.featureDescription}>
                    {HOME_FEATURES[currentFeature].description}
                  </Text>
                </Animated.View>
                <View style={styles.indicators}>
                  {HOME_FEATURES.map((_, index) => (
                    <TouchableOpacity
                      key={`indicator-${index}`}
                      onPress={() => setCurrentFeature(index)}
                      accessibilityRole="button"
                      accessibilityLabel={`Ver característica ${index + 1}`}
                      hitSlop={8}
                      style={[styles.indicator, currentFeature === index && styles.indicatorActive]}
                    />
                  ))}
                </View>
              </AppCard>
            </View>

            <View style={styles.howItWorksSection}>
              <SectionHeader title="Cómo funciona" />
              <AppCard>
                <Text style={styles.howItWorksText}>
                  Analizamos la información de tu <Text style={styles.highlight}>Perfil</Text> y las
                  características de nuestros productos para recomendarte la combinación ideal de
                  suplementos.
                </Text>

                <View style={styles.benefitsList}>
                  <View style={styles.benefitItem}>
                    <Ionicons name="flash-outline" size={18} color={colors.accent1} />
                    <Text style={styles.benefitText}>Optimiza tu energía</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Ionicons name="water-outline" size={18} color={colors.accent2} />
                    <Text style={styles.benefitText}>Mejora tu hidratación</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Ionicons name="fitness-outline" size={18} color={colors.accent3} />
                    <Text style={styles.benefitText}>Acelera tu recuperación</Text>
                  </View>
                </View>

                <View style={styles.tipContainer}>
                  <Ionicons name="bulb-outline" size={16} color={colors.primary} />
                  <Text style={styles.tipText}>
                    Completa tu perfil para obtener las mejores recomendaciones
                  </Text>
                </View>
              </AppCard>
            </View>
          </>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  logoContainer: {
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    width: 110,
    height: 34,
  },
  greeting: {
    fontSize: 28,
    fontFamily: fontFamily.extrabold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subGreeting: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },
  activitySection: {
    width: '100%',
    marginBottom: spacing.xxxl,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricValue: {
    fontSize: 26,
    fontFamily: fontFamily.extrabold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  featuresSection: {
    width: '100%',
    marginBottom: spacing.xxxl,
  },
  featureCard: {
    alignItems: 'center',
    minHeight: 190,
    justifyContent: 'center',
  },
  featureContentAnimated: {
    width: '100%',
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  featureTitle: {
    width: '100%',
    fontSize: 18,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  featureDescription: {
    width: '100%',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.indicatorInactive,
    marginHorizontal: spacing.xs,
  },
  indicatorActive: {
    backgroundColor: colors.primary,
    width: 22,
  },
  howItWorksSection: {
    width: '100%',
    marginBottom: spacing.xxxl,
  },
  howItWorksText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  highlight: {
    color: colors.primaryText,
    fontFamily: fontFamily.semibold,
  },
  benefitsList: {
    marginBottom: spacing.lg,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  benefitText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: spacing.md,
    fontFamily: fontFamily.medium,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  tipText: {
    fontSize: 13,
    color: colors.textPrimary,
    marginLeft: 10,
    flex: 1,
    lineHeight: 19,
  },
  quickAccessSection: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAccessCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  quickAccessIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAccessText: {
    fontSize: 14,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
});

export default HomeScreen;
