import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

interface TrainingSessionItemProps {
  session: {
    session_id: number;
    session_date: string;
    duration_min: number;
    intensity: string;
    type: string;
    weather?: string;
    notes?: string;
  };
  onPress: (session: any) => void;
  onDelete?: (session: any) => void;
}

const getIntensityColor = (intensity: string) => {
  switch (intensity) {
    case 'bajo':
      return '#4CAF50'; // Verde
    case 'medio':
      return '#FFC107'; // Amarillo
    case 'alto':
      return '#FF9800'; // Naranja
    case 'muy alto':
      return '#F44336'; // Rojo
    default:
      return '#9E9E9E'; // Gris
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'cardio':
      return 'run';
    case 'fuerza':
      return 'weight-lifter';
    case 'hiit':
      return 'lightning-bolt';
    case 'resistencia':
      return 'clock-time-eight';
    case 'mixed':
      return 'dumbbell';
    default:
      return 'dumbbell';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const TrainingSessionItem: React.FC<TrainingSessionItemProps> = ({
  session,
  onPress,
  onDelete,
}) => {
  // Renderizar el botón de eliminar que aparece al deslizar
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete && onDelete(session)}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <MaterialCommunityIcons name='delete' size={28} color='#fff' />
          <Text style={styles.deleteText}>Eliminar</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      renderRightActions={onDelete ? renderRightActions : undefined}
      overshootRight={false}
      friction={2}
    >
    <TouchableOpacity 
      style={styles.container}
      onPress={() => onPress(session)}
        activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
          <MaterialCommunityIcons name={getTypeIcon(session.type)} size={32} color='#D4AF37' />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.date}>{formatDate(session.session_date)}</Text>
        <View style={styles.detailsRow}>
          <View style={styles.detail}>
              <MaterialCommunityIcons name='clock-outline' size={16} color='#999' />
            <Text style={styles.detailText}>{session.duration_min} min</Text>
          </View>
          <View style={styles.detail}>
              <View
                style={[
                  styles.intensityDot,
                  { backgroundColor: getIntensityColor(session.intensity) },
                ]}
              />
              <Text style={styles.detailText}>
                {session.intensity.charAt(0).toUpperCase() + session.intensity.slice(1)}
              </Text>
          </View>
          <View style={styles.detail}>
              <Text style={styles.typeText}>
                {session.type.charAt(0).toUpperCase() + session.type.slice(1)}
              </Text>
            </View>
          </View>
        </View>
        <MaterialCommunityIcons name='chevron-right' size={24} color='#D4AF37' />
    </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(248, 217, 48, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(248, 217, 48, 0.3)',
  },
  contentContainer: {
    flex: 1,
  },
  date: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  intensityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  detailText: {
    color: '#ccc',
    fontSize: 13,
    marginLeft: 4,
  },
  typeText: {
    color: '#ccc',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    marginBottom: 12,
    borderRadius: 16,
    marginLeft: 8,
  },
  deleteText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 4,
  },
});

export default TrainingSessionItem;
