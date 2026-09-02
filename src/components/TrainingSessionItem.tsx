import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors, fontFamily, radius, shadows, spacing } from '../theme';

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
  switch (intensity?.toLowerCase()) {
    case 'baja':
    case 'bajo':
      return colors.categorySupplement;
    case 'media':
    case 'medio':
      return colors.categoryHydration;
    case 'alta':
    case 'alto':
      return colors.categoryEnergy;
    case 'muy alta':
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
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete && onDelete(session)}
        accessibilityRole='button'
        accessibilityLabel='Eliminar entrenamiento'
      >
        <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
          <MaterialCommunityIcons name='delete-outline' size={26} color={colors.textOnPrimary} />
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
            size={22}
            color={colors.primary}
          />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.date} numberOfLines={1}>
              {formatDate(session.session_date)}
            </Text>
            <View
              style={[
                styles.intensityBadge,
                { backgroundColor: `${getIntensityColor(session.intensity)}1A` },
              ]}
            >
              <Text
                style={[styles.intensityText, { color: getIntensityColor(session.intensity) }]}
              >
                {session.intensity.charAt(0).toUpperCase() + session.intensity.slice(1)}
              </Text>
            </View>
          </View>
          <View style={styles.detailsRow}>
            <View style={styles.detail}>
              <MaterialCommunityIcons name='clock-outline' size={14} color={colors.textSecondary} />
              <Text style={styles.detailText}>{session.duration_min} min</Text>
            </View>
            <View style={styles.detail}>
              <MaterialCommunityIcons name='tag-outline' size={14} color={colors.textSecondary} />
              <Text style={styles.detailText}>
                {session.type.charAt(0).toUpperCase() + session.type.slice(1)}
              </Text>
            </View>
            {session.sport_type && (
              <View style={styles.detail}>
                <MaterialCommunityIcons
                  name={getSportTypeIcon(session.sport_type)}
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.detailText}>
                  {session.sport_type.charAt(0).toUpperCase() + session.sport_type.slice(1)}
                </Text>
              </View>
            )}
          </View>
        </View>
        <MaterialCommunityIcons name='chevron-right' size={22} color={colors.textMuted} />
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: spacing.sm,
  },
  date: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: fontFamily.bold,
  },
  intensityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  intensityText: {
    fontSize: 11,
    fontFamily: fontFamily.semibold,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
    marginBottom: 2,
  },
  detailText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 96,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    marginLeft: spacing.sm,
  },
  deleteText: {
    color: colors.textOnPrimary,
    fontSize: 12,
    fontFamily: fontFamily.semibold,
    marginTop: 2,
  },
});

export default TrainingSessionItem;
