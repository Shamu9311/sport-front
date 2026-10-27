import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fontFamily, radius, spacing } from '../theme';
import { hapticSuccess } from '../utils/haptics';
import {
  formatTimeHHMM,
  intensityToUi,
  roundTimeTo5Min,
  sportTypeToDefaultTrainingType,
  toLocalDateString,
} from '../utils/format';
import { TrainingSession } from '../types/UserTypes';

const intensityOptions = ['baja', 'media', 'alta', 'muy alta'];
const typeOptions = ['cardio', 'fuerza', 'hiit', 'resistencia', 'mixed', 'otro'];
const sportTypeOptions = [
  '10K',
  '15K',
  'media marathon',
  'marathon',
  'trail',
  'Triathlon',
  'ciclismo de ruta',
  'ciclismo de montaña',
  'natacion',
];
const weatherOptions = ['soleado', 'nublado', 'lluvia', 'fresco', 'caluroso', 'húmedo'];
const DURATION_PRESETS = [
  { label: '30 min', min: 30 },
  { label: '45 min', min: 45 },
  { label: '1 h', min: 60 },
  { label: '1 h 30', min: 90 },
  { label: '2 h', min: 120 },
];

export interface AddTrainingModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (trainingData: Record<string, unknown>) => Promise<void>;
  mode?: 'create' | 'edit';
  initialSession?: TrainingSession | null;
}

const AddTrainingModal: React.FC<AddTrainingModalProps> = ({
  visible,
  onClose,
  onSave,
  mode = 'create',
  initialSession = null,
}) => {
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(roundTimeTo5Min(new Date()));
  const [durationMin, setDurationMin] = useState<number | null>(45);
  const [customDuration, setCustomDuration] = useState(false);
  const [customHours, setCustomHours] = useState(1);
  const [customMinutes, setCustomMinutes] = useState(0);
  const [intensity, setIntensity] = useState('media');
  const [type, setType] = useState('cardio');
  const [sportType, setSportType] = useState('10K');
  const [weather, setWeather] = useState('soleado');
  const [notes, setNotes] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [durationError, setDurationError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const isEdit = mode === 'edit';

  useEffect(() => {
    if (!visible) return;
    if (isEdit && initialSession) {
      setDate(new Date(`${initialSession.session_date.split('T')[0]}T12:00:00`));
      const [hh, mm] = (initialSession.start_time || '18:00:00').split(':').map(Number);
      const t = new Date();
      t.setHours(hh || 18, mm || 0, 0, 0);
      setStartTime(t);
      setDurationMin(initialSession.duration_min);
      setCustomDuration(false);
      setIntensity(intensityToUi(initialSession.intensity));
      setType(initialSession.type || 'cardio');
      setSportType(initialSession.sport_type || '10K');
      setWeather(initialSession.weather || 'soleado');
      setNotes(initialSession.notes || '');
    } else if (!isEdit) {
      setDate(new Date());
      setStartTime(roundTimeTo5Min(new Date()));
      setDurationMin(45);
      setIntensity('media');
      setType('cardio');
      setSportType('10K');
      setWeather('soleado');
      setNotes('');
      setShowMore(false);
    }
    setDurationError('');
    setSaving(false);
  }, [visible, isEdit, initialSession?.session_id]);

  const datePreset = useMemo(() => {
    const today = toLocalDateString(new Date());
    const yesterday = toLocalDateString(new Date(Date.now() - 86400000));
    const current = toLocalDateString(date);
    if (current === today) return 'today';
    if (current === yesterday) return 'yesterday';
    return 'custom';
  }, [date]);

  const resolvedDuration = customDuration
    ? customHours * 60 + customMinutes
    : durationMin ?? 0;

  const handleSave = async () => {
    if (!resolvedDuration || resolvedDuration <= 0) {
      setDurationError('Selecciona una duración válida');
      return;
    }
    setDurationError('');
    const trainingData = {
      session_date: toLocalDateString(date),
      start_time: `${formatTimeHHMM(startTime)}:00`,
      duration_min: resolvedDuration,
      intensity,
      type,
      sport_type: sportType,
      weather,
      notes,
    };
    setSaving(true);
    try {
      await onSave(trainingData);
      await hapticSuccess();
      onClose();
    } catch {
      /* parent handles notify */
    } finally {
      setSaving(false);
    }
  };

  const renderChips = (
    options: string[],
    value: string,
    onSelect: (v: string) => void
  ) => (
    <View style={styles.optionsContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[styles.optionButton, value === option && styles.selectedOption]}
          onPress={() => onSelect(option)}
          activeOpacity={0.7}
        >
          <Text style={[styles.optionText, value === option && styles.selectedOptionText]}>
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={saving ? undefined : onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}
        >
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={styles.title}>
                {isEdit ? 'Editar entrenamiento' : 'Nuevo entrenamiento'}
              </Text>
              <TouchableOpacity onPress={onClose} disabled={saving} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Deporte</Text>
              {renderChips(sportTypeOptions, sportType, (v) => {
                setSportType(v);
                setType(sportTypeToDefaultTrainingType(v));
              })}

              <Text style={styles.label}>Fecha</Text>
              <View style={styles.rowChips}>
                {[
                  { id: 'today', label: 'Hoy' },
                  { id: 'yesterday', label: 'Ayer' },
                  { id: 'custom', label: 'Elegir…' },
                ].map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.presetChip,
                      datePreset === p.id && styles.presetChipActive,
                    ]}
                    onPress={() => {
                      if (p.id === 'today') setDate(new Date());
                      else if (p.id === 'yesterday') {
                        const d = new Date();
                        d.setDate(d.getDate() - 1);
                        setDate(d);
                      } else setShowDatePicker(true);
                    }}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        datePreset === p.id && styles.presetChipTextActive,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Hora de inicio</Text>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTimePicker(true)}>
                <MaterialCommunityIcons name="clock-outline" size={20} color={colors.primary} />
                <Text style={styles.pickerBtnText}>{formatTimeHHMM(startTime)}</Text>
              </TouchableOpacity>

              <Text style={styles.label}>Duración</Text>
              <View style={styles.rowChips}>
                {DURATION_PRESETS.map((p) => (
                  <TouchableOpacity
                    key={p.min}
                    style={[
                      styles.presetChip,
                      !customDuration && durationMin === p.min && styles.presetChipActive,
                    ]}
                    onPress={() => {
                      setCustomDuration(false);
                      setDurationMin(p.min);
                      setDurationError('');
                    }}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        !customDuration && durationMin === p.min && styles.presetChipTextActive,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.presetChip, customDuration && styles.presetChipActive]}
                  onPress={() => setCustomDuration(true)}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      customDuration && styles.presetChipTextActive,
                    ]}
                  >
                    Otra
                  </Text>
                </TouchableOpacity>
              </View>
              {customDuration && (
                <View style={styles.durationCustomRow}>
                  <View style={styles.stepper}>
                    <Text style={styles.stepperLabel}>Horas</Text>
                    <View style={styles.stepperControls}>
                      <TouchableOpacity
                        onPress={() => setCustomHours((h) => Math.max(0, h - 1))}
                        style={styles.stepperBtn}
                      >
                        <Text style={styles.stepperBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepperValue}>{customHours}</Text>
                      <TouchableOpacity
                        onPress={() => setCustomHours((h) => Math.min(12, h + 1))}
                        style={styles.stepperBtn}
                      >
                        <Text style={styles.stepperBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.stepper}>
                    <Text style={styles.stepperLabel}>Min</Text>
                    <View style={styles.stepperControls}>
                      <TouchableOpacity
                        onPress={() =>
                          setCustomMinutes((m) => (m <= 0 ? 55 : m - 5))
                        }
                        style={styles.stepperBtn}
                      >
                        <Text style={styles.stepperBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepperValue}>{customMinutes}</Text>
                      <TouchableOpacity
                        onPress={() =>
                          setCustomMinutes((m) => (m >= 55 ? 0 : m + 5))
                        }
                        style={styles.stepperBtn}
                      >
                        <Text style={styles.stepperBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
              {durationError ? <Text style={styles.errorText}>{durationError}</Text> : null}

              <Text style={styles.label}>Intensidad</Text>
              {renderChips(intensityOptions, intensity, setIntensity)}

              <TouchableOpacity
                style={styles.moreToggle}
                onPress={() => setShowMore((v) => !v)}
              >
                <Text style={styles.moreToggleText}>
                  {showMore ? 'Ocultar detalles' : 'Más detalles (tipo, clima, notas)'}
                </Text>
                <MaterialCommunityIcons
                  name={showMore ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color={colors.primary}
                />
              </TouchableOpacity>

              {showMore && (
                <>
                  <Text style={styles.label}>Tipo</Text>
                  {renderChips(typeOptions, type, setType)}
                  <Text style={styles.label}>Clima</Text>
                  {renderChips(weatherOptions, weather, setWeather)}
                  <Text style={styles.label}>Notas</Text>
                  <TextInput
                    style={[styles.input, styles.notesInput]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Notas opcionales"
                    placeholderTextColor={colors.textMuted}
                    multiline
                  />
                </>
              )}
              <View style={{ height: 100 }} />
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={colors.textOnPrimary} />
                ) : (
                  <Text style={styles.saveBtnText}>{isEdit ? 'Guardar cambios' : 'Guardar'}</Text>
                )}
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, selected) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selected) setDate(selected);
                }}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={startTime}
                mode="time"
                is24Hour
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, selected) => {
                  setShowTimePicker(Platform.OS === 'ios');
                  if (selected) setStartTime(selected);
                }}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlayStrong },
  sheetWrap: { maxHeight: '92%' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '100%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: { fontSize: 18, fontFamily: fontFamily.bold, color: colors.textPrimary },
  form: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: spacing.sm,
    fontFamily: fontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
    justifyContent: 'center',
  },
  selectedOption: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { color: colors.textSecondary, fontSize: 13, fontFamily: fontFamily.semibold },
  selectedOptionText: { color: colors.textOnPrimary },
  rowChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  presetChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    minHeight: 44,
    justifyContent: 'center',
  },
  presetChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  presetChipText: { color: colors.textSecondary, fontFamily: fontFamily.semibold, fontSize: 14 },
  presetChipTextActive: { color: colors.textOnPrimary },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: spacing.md,
  },
  pickerBtnText: { fontSize: 18, fontFamily: fontFamily.bold, color: colors.textPrimary },
  durationCustomRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md },
  stepper: { flex: 1 },
  stepperLabel: { color: colors.textMuted, fontSize: 12, marginBottom: 6 },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: { fontSize: 22, color: colors.primary, fontFamily: fontFamily.bold },
  stepperValue: { fontSize: 20, fontFamily: fontFamily.extrabold, color: colors.textPrimary },
  errorText: { color: colors.error, fontSize: 12, marginBottom: 8 },
  moreToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  moreToggleText: { color: colors.primaryText, fontFamily: fontFamily.semibold, fontSize: 14 },
  input: {
    backgroundColor: colors.surfaceMuted,
    color: colors.textPrimary,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesInput: { minHeight: 90, textAlignVertical: 'top' },
  footer: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: colors.textOnPrimary, fontFamily: fontFamily.bold, fontSize: 16 },
});

export default AddTrainingModal;
