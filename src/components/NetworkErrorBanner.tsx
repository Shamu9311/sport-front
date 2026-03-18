import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  subscribeToNetworkError,
  clearNetworkError,
} from '../services/errorService';

const NetworkErrorBanner: React.FC = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = subscribeToNetworkError((message) => {
      setErrorMessage(message);
      if (message) {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    });
    return unsubscribe;
  }, [fadeAnim]);

  const handleDismiss = () => {
    clearNetworkError();
  };

  if (!errorMessage) return null;

  return (
    <Animated.View style={[styles.banner, { opacity: fadeAnim }]}>
      <Ionicons name="cloud-offline" size={22} color="#fff" />
      <Text style={styles.text}>{errorMessage}</Text>
      <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
        <Ionicons name="close" size={22} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#c62828',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  text: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  dismissButton: {
    padding: 4,
  },
});

export default NetworkErrorBanner;
