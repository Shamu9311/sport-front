import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { colors, fontFamily, radius, shadows, spacing } from '../theme';
import { formatDuration, formatRelativeDate } from '../utils/format';
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
  onEdit?: (session: any) => void;
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
    case 'media marathon':
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

function DeleteAction({
  translation,
  onPress,
}: {
  translation: SharedValue<number>;
  onPress: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(translation.value, [-120, 0], [1, 0.5], Extrapolation.CLAMP),
      },
    ],
  }));

  return (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Eliminar entrenamiento"
    >
      <Animated.View style={[{ alignItems: 'center' }, animatedStyle]}>
        <MaterialCommunityIcons name="delete-outline" size={26} color={colors.textOnPrimary} />
        <Text style={styles.actionText}>Eliminar</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const TrainingSessionItem: React.FC<TrainingSessionItemProps> = ({
  session,
  onPress,
  onDelete,
  onEdit,
}) => {
  const renderRightActions = (_progress: SharedValue<number>, translation: SharedValue<number>) =>
    onDelete ? (
      <DeleteAction translation={translation} onPress={() => onDelete(session)} />
    ) : null;

  const renderLeftActions = () =>
    onEdit ? (
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => onEdit(session)}
        accessibilityRole="button"
        accessibilityLabel="Editar entrenamiento"
      >
        <MaterialCommunityIcons name="pencil-outline" size={24} color={colors.textOnPrimary} />
        <Text style={styles.actionText}>Editar</Text>
      </TouchableOpacity>
    ) : null;

  return (
    <ReanimatedSwipeable
      renderRightActions={onDelete ? renderRightActions : undefined}
      renderLeftActions={onEdit ? renderLeftActions : undefined}
      overshootRight={false}
      overshootLeft={false}
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
              {formatRelativeDate(session.session_date)}
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
              <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.detailText}>{formatDuration(session.duration_min)}</Text>
            </View>
            <View style={styles.detail}>
              <MaterialCommunityIcons name="tag-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.detailText}>
                {session.type.charAt(0).toUpperCase() + session.type.slice(1)}
              </Text>
            </View>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
      </TouchableOpacity>
    </ReanimatedSwipeable>
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
  contentContainer: { flex: 1 },
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
  intensityText: { fontSize: 11, fontFamily: fontFamily.semibold },
  detailsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  detail: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.md },
  detailText: { color: colors.textSecondary, fontSize: 13, marginLeft: 4 },
  deleteButton: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 96,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    marginLeft: spacing.sm,
  },
  editButton: {
    backgroundColor: colors.info,
    justifyContent: 'center',
    alignItems: 'center',
    width: 96,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    marginRight: spacing.sm,
  },
  actionText: {
    color: colors.textOnPrimary,
    fontSize: 12,
    fontFamily: fontFamily.semibold,
    marginTop: 2,
  },
});

export default TrainingSessionItem;
