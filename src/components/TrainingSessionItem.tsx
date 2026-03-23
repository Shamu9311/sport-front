import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '../theme';

interface TrainingSessionItemProps {
  session: {
    session_id: number;
    session_date: string;
    duration_min: number;
    intensity: string;
    type: string;
    sport_type?: string;
    weather?: string;
    notes?: string;
  };
  onPress: (session: any) => void;
  onDelete?: (session: any) => void;
}

const getIntensityColor = (intensity: string) => {
  switch (intensity) {
    case 'bajo':
      return colors.success;
    case 'medio':
      return colors.warning;
    case 'alto':
      return colors.warning;
    case 'muy alto':
      return colors.error;
    default:
      return colors.textMuted;
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

const getSportTypeIcon = (sportType: string) => {
  const normalized = sportType?.toLowerCase() || '';
  switch (normalized) {
    case '10k':
    case '15k':
      return 'run-fast';
    case 'media marathon':
      return 'run-fast';
    case 'marathon':
      return 'run-fast';
    case 'trail':
      return 'terrain';
    case 'ciclismo de ruta':
      return 'bike';
    case 'ciclismo de montaña':
      return 'bike-fast';
    case 'triathlon':
      return 'run-fast';
    case 'natacion':
      return 'swim';
    default:
      return 'run';
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
          <MaterialCommunityIcons name='delete' size={28} color={colors.textPrimary} />
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
          <MaterialCommunityIcons
            name={
              session.sport_type ? getSportTypeIcon(session.sport_type) : getTypeIcon(session.type)
            }
            size={32}
            color={colors.primary}
          />
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.date}>{formatDate(session.session_date)}</Text>
          <View style={styles.detailsRow}>
            <View style={styles.detail}>
              <MaterialCommunityIcons name='clock-outline' size={16} color={colors.textSecondary} />
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
            {session.sport_type && (
              <View style={styles.detail}>
                <MaterialCommunityIcons
                  name={getSportTypeIcon(session.sport_type)}
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.detailText}>
                  {session.sport_type.charAt(0).toUpperCase() + session.sport_type.slice(1)}
                </Text>
              </View>
            )}
          </View>
        </View>
        <MaterialCommunityIcons name='chevron-right' size={24} color={colors.primary} />
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 5,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${colors.primary}26`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: `${colors.primary}4D`,
  },
  contentContainer: {
    flex: 1,
  },
  date: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
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
    color: colors.textPrimary,
    opacity: 0.88,
    fontSize: 13,
    marginLeft: 4,
  },
  typeText: {
    color: colors.textPrimary,
    opacity: 0.88,
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    marginBottom: 12,
    borderRadius: 16,
    marginLeft: 8,
  },
  deleteText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
});

export default TrainingSessionItem;
