import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  SafeAreaView,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { getUserTrainingSessions } from '../../src/services/api';
import AnimatedNumber from '../../src/components/AnimatedNumber';
import SkeletonLoader from '../../src/components/SkeletonLoader';
import { colors, shadows, spacing, radius } from '../../src/theme';

const { width, height } = Dimensions.get('window');

const logoPath = require('../../assets/images/login.png');

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

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

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
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const features = [
    {
      icon: 'sparkles',
      title: 'IA Personalizada',
      description: 'Recomendaciones inteligentes basadas en tu perfil y entrenamientos',
      color: colors.accent1,
    },
    {
      icon: 'time',
      title: 'Timing de Consumo',
      description: 'Sabe exactamente cuándo y cómo consumir cada producto',
      color: colors.accent2,
    },
    {
      icon: 'analytics',
      title: 'Tracking Completo',
      description: 'Registra tus entrenamientos y monitorea tu progreso',
      color: colors.accent3,
    },
    {
      icon: 'shield-checkmark',
      title: 'Restricciones Dietéticas',
      description: 'Respetamos tus preferencias y restricciones alimenticias',
      color: colors.warning,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 4);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.Image
          source={logoPath}
          style={[styles.logo, { opacity: fadeAnim }]}
          resizeMode="contain"
        />

        <Text style={styles.greeting}>
          ¡Hola{user?.username ? `, ${user.username}` : ''}! 👋
        </Text>
        <Text style={styles.subGreeting}>Listo para optimizar tu rendimiento</Text>

        {user && (
          <>
            {statsLoading ? (
              <SkeletonLoader type="stats" />
            ) : (
              <View style={styles.statsCard}>
                <View style={styles.statsHeader}>
                  <Ionicons name="analytics" size={24} color={colors.primary} />
                  <Text style={styles.statsTitle}>Tu Actividad</Text>
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Ionicons name="barbell" size={30} color={colors.accent1} />
                    <AnimatedNumber value={stats.thisWeek} style={styles.statValue} />
                    <Text style={styles.statLabel}>Esta semana</Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statItem}>
                    <Ionicons name="time" size={30} color={colors.accent2} />
                    <Text style={styles.statValue}>{formatTime(stats.totalMinutes)}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statItem}>
                    <Ionicons name="trophy" size={30} color={colors.warning} />
                    <AnimatedNumber value={stats.trainings} style={styles.statValue} />
                    <Text style={styles.statLabel}>Entrenamientos</Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}

        <View style={styles.featuresSection}>
          <View style={styles.carouselContainer}>
            <View style={styles.featureCard}>
              <View style={styles.featuresTitleContainer}>
                <Text style={styles.featuresTitle}>¿Por qué SIS?</Text>
              </View>

              <View
                style={[
                  styles.featureIconContainer,
                  { backgroundColor: features[currentFeature].color + '33' },
                ]}
              >
                <Ionicons
                  name={features[currentFeature].icon as any}
                  size={48}
                  color={features[currentFeature].color}
                />
              </View>
              <Text style={styles.featureTitle}>{features[currentFeature].title}</Text>
              <Text style={styles.featureDescription}>{features[currentFeature].description}</Text>
              <View style={styles.indicators}>
                {features.map((_, index) => (
                  <TouchableOpacity
                    key={`indicator-${index}`}
                    onPress={() => setCurrentFeature(index)}
                    style={[styles.indicator, currentFeature === index && styles.indicatorActive]}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.howItWorksCard}>
          <View style={styles.howItWorksHeader}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <Text style={styles.howItWorksTitle}>Cómo Funciona</Text>
          </View>

          <Text style={styles.howItWorksText}>
            Analizamos la información de tu <Text style={styles.highlight}>Perfil</Text> y las
            características de nuestros productos para recomendarte la combinación ideal de
            suplementos.
          </Text>

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="flash" size={20} color={colors.accent1} />
              <Text style={styles.benefitText}>Optimiza tu energía</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="water" size={20} color={colors.accent2} />
              <Text style={styles.benefitText}>Mejora tu hidratación</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="fitness" size={20} color={colors.accent3} />
              <Text style={styles.benefitText}>Acelera tu recuperación</Text>
            </View>
          </View>

          <View style={styles.tipContainer}>
            <Ionicons name="bulb" size={18} color={colors.primary} />
            <Text style={styles.tipText}>
              Completa tu perfil para obtener las mejores recomendaciones
            </Text>
          </View>
        </View>

        <View style={styles.quickAccessSection}>
          <Text style={styles.quickAccessTitle}>Acceso Rápido</Text>

          <View style={styles.quickAccessGrid}>
            <TouchableOpacity
              style={styles.quickAccessCard}
              onPress={() => router.push('/(tabs)/products')}
            >
              <Ionicons name="cube" size={36} color={colors.accent1} />
              <Text style={styles.quickAccessText}>Productos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAccessCard}
              onPress={() => router.push('/(tabs)/training')}
            >
              <Ionicons name="barbell" size={36} color={colors.accent2} />
              <Text style={styles.quickAccessText}>Entrenar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAccessCard}
              onPress={() => router.push('/(tabs)/recommendations')}
            >
              <Ionicons name="star" size={36} color={colors.warning} />
              <Text style={styles.quickAccessText}>Para Ti</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAccessCard}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Ionicons name="person" size={36} color={colors.accent3} />
              <Text style={styles.quickAccessText}>Perfil</Text>
            </TouchableOpacity>
          </View>
        </View>

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
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  logo: {
    width: width * 0.5,
    height: height * 0.12,
    marginBottom: spacing.xl,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subGreeting: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  statsCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.cardElevated,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: spacing.md,
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
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  featuresSection: {
    width: '100%',
    marginBottom: spacing.xxl,
  },
  featuresTitleContainer: {
    marginBottom: spacing.xl,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    width: '100%',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  carouselContainer: {
    width: '100%',
  },
  featureCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 30,
    alignItems: 'center',
    minHeight: 220,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  featureIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  featureTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 15,
    color: colors.textPrimary,
    opacity: 0.92,
    textAlign: 'center',
    lineHeight: 22,
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
    width: 24,
  },
  howItWorksCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  howItWorksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  howItWorksTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: spacing.md,
  },
  howItWorksText: {
    fontSize: 15,
    color: colors.textPrimary,
    opacity: 0.92,
    lineHeight: 24,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  highlight: {
    color: colors.primary,
    fontWeight: '700',
  },
  benefitsList: {
    marginBottom: spacing.lg,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingLeft: 10,
  },
  benefitText: {
    fontSize: 15,
    color: colors.textPrimary,
    marginLeft: spacing.md,
    fontWeight: '500',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  tipText: {
    fontSize: 13,
    color: colors.textPrimary,
    opacity: 0.9,
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  quickAccessSection: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  quickAccessTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
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
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  quickAccessText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    opacity: 0.9,
    marginTop: spacing.md,
  },
});

export default HomeScreen;
