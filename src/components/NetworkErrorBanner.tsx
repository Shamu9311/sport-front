import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  subscribeToNetworkError,
  clearNetworkError,
  getCurrentError,
} from '../services/errorService';
import { colors, fontFamily } from '../theme';

const NetworkErrorBanner: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const showMessage = errorMessage || (offline ? 'Sin conexión a internet' : null);

  useEffect(() => {
    const unsubscribe = subscribeToNetworkError((message) => {
      setErrorMessage(message);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const isOffline = state.isConnected === false || state.isInternetReachable === false;
      setOffline(isOffline);
      if (!isOffline && !getCurrentError()) {
        setErrorMessage(null);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (showMessage) {
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
  }, [showMessage, fadeAnim]);

  const handleRetry = useCallback(() => {
    clearNetworkError();
    setErrorMessage(null);
    NetInfo.fetch().then((state) => {
      if (state.isConnected) {
        setOffline(false);
      }
    });
  }, []);

  const handleDismiss = () => {
    clearNetworkError();
    setErrorMessage(null);
  };

  if (!showMessage) return null;

  return (
    <Animated.View
      style={[styles.banner, { opacity: fadeAnim, paddingTop: insets.top + 8 }]}
    >
      <Ionicons name="cloud-offline" size={22} color={colors.textOnPrimary} />
      <Text style={styles.text}>{showMessage}</Text>
      <TouchableOpacity
        onPress={handleRetry}
        style={styles.retryButton}
        accessibilityRole="button"
        accessibilityLabel="Reintentar conexión"
      >
        <Text style={styles.retryText}>Reintentar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleDismiss}
        style={styles.dismissButton}
        accessibilityRole="button"
        accessibilityLabel="Cerrar aviso"
      >
        <Ionicons name="close" size={22} color={colors.textOnPrimary} />
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
    backgroundColor: colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 9999,
    elevation: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  text: {
    flex: 1,
    color: colors.textOnPrimary,
    fontSize: 14,
    fontFamily: fontFamily.semibold,
    marginLeft: 10,
  },
  retryButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
  },
  retryText: {
    color: colors.textOnPrimary,
    fontFamily: fontFamily.bold,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  dismissButton: {
    padding: 4,
  },
});

export default NetworkErrorBanner;
