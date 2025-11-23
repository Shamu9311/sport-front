import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  SafeAreaView,
  Dimensions,
  Platform,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { getUserTrainingSessions } from '../../src/services/api';

// Obtener dimensiones de la pantalla para hacer el diseño responsivo
const { width, height } = Dimensions.get('window');

// --- Asegúrate que la ruta a tu logo sea correcta desde este archivo ---
const logoPath = require('../../assets/images/login.png');

const HomeScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    trainings: 0,
    totalMinutes: 0,
    thisWeek: 0,
  });
  const [currentFeature, setCurrentFeature] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animación del logo al cargar
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Función para cargar estadísticas
  const loadStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const sessions = await getUserTrainingSessions(user.id);

      // Calcular estadísticas
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
    }
  }, [user?.id]);

  // Cargar estadísticas cuando se monta el componente
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Recargar estadísticas cada vez que la pantalla se enfoca
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  // Features para el carrusel
  const features = [
    {
      icon: 'sparkles',
      title: 'IA Personalizada',
      description: 'Recomendaciones inteligentes basadas en tu perfil y entrenamientos',
      color: '#D4AF37',
    },
    {
      icon: 'time',
      title: 'Timing de Consumo',
      description: 'Sabe exactamente cuándo y cómo consumir cada producto',
      color: '#4CAF50',
    },
    {
      icon: 'analytics',
      title: 'Tracking Completo',
      description: 'Registra tus entrenamientos y monitorea tu progreso',
      color: '#2196F3',
    },
    {
      icon: 'shield-checkmark',
      title: 'Restricciones Dietéticas',
      description: 'Respetamos tus preferencias y restricciones alimenticias',
      color: '#9C27B0',
    },
  ];

  // Auto-scroll del carrusel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000); // Cambia cada 4 segundos

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
        {/* Logo animado */}
        <Animated.Image
          source={logoPath}
          style={[styles.logo, { opacity: fadeAnim }]}
          resizeMode='contain'
        />

        {/* Saludo personalizado */}
        <Text style={styles.greeting}>¡Hola{user?.username ? `, ${user.username}` : ''}! 👋</Text>
        <Text style={styles.subGreeting}>Listo para optimizar tu rendimiento</Text>

        {/* OPCIÓN 2: Estadísticas del Usuario */}
        {user && (
          <View style={styles.statsCard}>
            <View style={styles.statsHeader}>
              <Ionicons name='analytics' size={24} color='#D4AF37' />
              <Text style={styles.statsTitle}>Tu Actividad</Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Ionicons name='barbell' size={30} color='#F8D930' />
                <Text style={styles.statValue}>{stats.thisWeek}</Text>
                <Text style={styles.statLabel}>Esta semana</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Ionicons name='time' size={30} color='#4CAF50' />
                <Text style={styles.statValue}>{formatTime(stats.totalMinutes)}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Ionicons name='trophy' size={30} color='#FF6B35' />
                <Text style={styles.statValue}>{stats.trainings}</Text>
                <Text style={styles.statLabel}>Entrenamientos</Text>
              </View>
            </View>
          </View>
        )}

        {/* OPCIÓN 3: Carrusel de Features */}
        <View style={styles.featuresSection}>
          <View style={styles.carouselContainer}>
            <View style={styles.featureCard}>
              <View style={styles.featuresTitleContainer}>
                <Text style={styles.featuresTitle}>¿Por qué SIS?</Text>
              </View>

              <View
                style={[
                  styles.featureIconContainer,
                  { backgroundColor: features[currentFeature].color + '20' },
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

            {/* Indicadores del carrusel */}
          </View>
        </View>

        {/* Sección Cómo Funciona */}
        <View style={styles.howItWorksCard}>
          <View style={styles.howItWorksHeader}>
            <Ionicons name='information-circle' size={24} color='#D4AF37' />
            <Text style={styles.howItWorksTitle}>Cómo Funciona</Text>
          </View>

          <Text style={styles.howItWorksText}>
            Analizamos la información de tu <Text style={styles.highlight}>Perfil</Text> y las
            características de nuestros productos para recomendarte la combinación ideal de
            suplementos.
          </Text>

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name='flash' size={20} color='#D4AF37' />
              <Text style={styles.benefitText}>Optimiza tu energía</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name='water' size={20} color='#4CAF50' />
              <Text style={styles.benefitText}>Mejora tu hidratación</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name='fitness' size={20} color='#2196F3' />
              <Text style={styles.benefitText}>Acelera tu recuperación</Text>
            </View>
          </View>

          <View style={styles.tipContainer}>
            <Ionicons name='bulb' size={18} color='#D4AF37' />
            <Text style={styles.tipText}>
              Completa tu perfil para obtener las mejores recomendaciones
            </Text>
          </View>
        </View>

        {/* Accesos rápidos */}
        <View style={styles.quickAccessSection}>
          <Text style={styles.quickAccessTitle}>Acceso Rápido</Text>

          <View style={styles.quickAccessGrid}>
            <TouchableOpacity
              style={styles.quickAccessCard}
              onPress={() => router.push('/(tabs)/products')}
            >
              <Ionicons name='cube' size={36} color='#D4AF37' />
              <Text style={styles.quickAccessText}>Productos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAccessCard}
              onPress={() => router.push('/(tabs)/training')}
            >
              <Ionicons name='barbell' size={36} color='#4CAF50' />
              <Text style={styles.quickAccessText}>Entrenar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAccessCard}
              onPress={() => router.push('/(tabs)/recommendations')}
            >
              <Ionicons name='star' size={36} color='#FF6B35' />
              <Text style={styles.quickAccessText}>Para Ti</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAccessCard}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Ionicons name='person' size={36} color='#2196F3' />
              <Text style={styles.quickAccessText}>Perfil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Espacio inferior */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1919',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  logo: {
    width: width * 0.5,
    height: height * 0.12,
    marginBottom: 20,
  },

  // Saludo
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 8,
  },
  subGreeting: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
  },

  // Estadísticas Card
  statsCard: {
    width: '100%',
    backgroundColor: '#252525',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginLeft: 12,
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
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    textTransform: 'uppercase',
  },

  // Carrusel de Features
  featuresSection: {
    width: '100%',
    marginBottom: 24,
  },
  featuresTitleContainer: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    width: '100%',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  carouselContainer: {
    width: '100%',
  },
  featureCard: {
    backgroundColor: '#252525',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    minHeight: 220,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  featureIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 12,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 15,
    color: '#ddd',
    textAlign: 'center',
    lineHeight: 22,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#444',
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: '#D4AF37',
    width: 24,
  },

  // Cómo Funciona Card
  howItWorksCard: {
    width: '100%',
    backgroundColor: '#252525',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  howItWorksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  howItWorksTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginLeft: 12,
  },
  howItWorksText: {
    fontSize: 15,
    color: '#ddd',
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  highlight: {
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  benefitsList: {
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 10,
  },
  benefitText: {
    fontSize: 15,
    color: '#fff',
    marginLeft: 12,
    fontWeight: '500',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f1f1f',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#D4AF37',
  },
  tipText: {
    fontSize: 13,
    color: '#ddd',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },

  // Acceso Rápido
  quickAccessSection: {
    width: '100%',
    marginBottom: 20,
  },
  quickAccessTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 16,
    textAlign: 'center',
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAccessCard: {
    width: '48%',
    backgroundColor: '#252525',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  quickAccessText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ddd',
    marginTop: 12,
  },
});

export default HomeScreen;
