import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';

const LoadingProfileScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Analizando tu perfil...');
  const progressAnim = useRef(new Animated.Value(0)).current;
  const navigationComplete = useRef(false);
  const fromProfileCreation = params?.fromProfileCreation === 'true';

  // Textos de carga que se mostrarán secuencialmente
  const loadingTexts = [
    'Analizando tu perfil...',
    'Buscando productos compatibles...',
    'Aplicando algoritmo de recomendación...',
    'Optimizando resultados para ti...',
    'Finalizando personalización...'
  ];

  useEffect(() => {
    const totalDuration = 3000; // 3 segundos de pantalla de carga
    const interval = 100;
    const steps = totalDuration / interval;
    const incrementPerStep = 1 / steps;
    
    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(prev + incrementPerStep, 1);
        
        if (newProgress >= 1 && !navigationComplete.current) {
          navigationComplete.current = true;
          clearInterval(timer);
          // Navegar a productos cuando esté completo
          router.replace('/(tabs)/products');
        }
        
        progressAnim.setValue(newProgress);
        return newProgress;
      });
    }, interval);

    // Change loading text periodically
    let textIndex = 0;
    const textTimer = setInterval(() => {
      textIndex = (textIndex + 1) % loadingTexts.length;
      setLoadingText(loadingTexts[textIndex]);
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(textTimer);
    };
  }, [fromProfileCreation]);

  // Mapear el valor de progreso a un ancho de la barra
  const width = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Preparando tu experiencia personalizada</Text>
      
      <Text style={styles.loadingText}>{loadingText}</Text>
      
      <View style={styles.progressContainer}>
        <Animated.View style={[styles.progressBar, { width }]} />
      </View>
      
      <ActivityIndicator size="large" color="#F8D930" style={styles.spinner} />
      
      <Text style={styles.percentText}>{Math.round(progress * 100)}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1919',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8D930',
    marginBottom: 40,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  progressContainer: {
    height: 20,
    width: '80%',
    backgroundColor: '#333',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#F8D930',
  },
  spinner: {
    marginVertical: 20,
  },
  percentText: {
    fontSize: 16,
    color: '#F8D930',
    fontWeight: 'bold',
  }
});

export default LoadingProfileScreen;
