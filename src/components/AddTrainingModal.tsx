import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fontFamily, radius, spacing } from '../theme';
import LoadingState from './ui/LoadingState';
import { hapticSuccess } from '../utils/haptics';

const GENERATING_MESSAGES = [
  'Analizando tu entrenamiento...',
  'Buscando productos adecuados...',
  'Generando recomendaciones personalizadas...',
];
// Función para formatear fechas en español
const formatDate = (date: Date) => {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

interface AddTrainingModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (trainingData: any) => void;
}

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

const AddTrainingModal: React.FC<AddTrainingModalProps> = ({ visible, onClose, onSave }) => {
  const [date, setDate] = useState<Date>(new Date());
  const [startHour, setStartHour] = useState('18');
  const [startMinute, setStartMinute] = useState('00');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState('media');
  const [type, setType] = useState('cardio');
  const [sportType, setSportType] = useState('10K');
  const [weather, setWeather] = useState('soleado');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Estados de validación
  const [durationError, setDurationError] = useState('');
  const [timeError, setTimeError] = useState('');

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible]);

  // Función para incrementar la fecha en un día
  const incrementDate = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + 1);
    setDate(newDate);
  };

  // Función para decrementar la fecha en un día
  const decrementDate = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() - 1);
    setDate(newDate);
  };

  const handleSave = async () => {
    // Validación de duración
    let isValid = true;
    if (!duration) {
      setDurationError('La duración es requerida');
      isValid = false;
    } else {
      const durationNum = parseInt(duration);
      if (isNaN(durationNum) || durationNum <= 0) {
        setDurationError('La duración debe ser un número positivo');
        isValid = false;
      } else {
        setDurationError('');
      }
    }

    // Validación de hora
    const hour = parseInt(startHour) || 0;
    const minute = parseInt(startMinute) || 0;

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      setTimeError('Hora inválida. Formato: 00-23 : 00-59');
      isValid = false;
    } else {
      setTimeError('');
    }

    if (!isValid) {
      return;
    }

    const durationNum = parseInt(duration);

    // Formatear fecha en zona horaria local (YYYY-MM-DD)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const localDate = `${year}-${month}-${day}`;

    const trainingData = {
      session_date: localDate,
      start_time: `${startHour.toString().padStart(2, '0')}:${startMinute
        .toString()
        .padStart(2, '0')}:00`,
      duration_min: durationNum,
      intensity,
      type,
      sport_type: sportType || undefined,
      weather,
      notes,
    };

    setSaving(true);
    try {
      await onSave(trainingData);
      await hapticSuccess();
      setSaving(false);
      resetForm();
      onClose();
    } catch (error) {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setDate(new Date());
    setStartHour('18');
    setStartMinute('00');
    setDuration('');
    setIntensity('media');
    setType('cardio');
    setSportType('10K');
    setWeather('soleado');
    setNotes('');
    setSaving(false);
    setDurationError('');
    setTimeError('');
  };

  const handleClose = () => {
    if (!saving) {
      resetForm();
      onClose();
    }
  };

  // formatDate ya está definida arriba

  return (
    <Modal visible={visible} animationType='none' transparent={true} onRequestClose={handleClose}>
      <Animated.View style={[styles.centeredView, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoiding}
        >
        <Animated.View
          style={[
            styles.modalView,
            {
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          {saving && (
            <View style={styles.loadingOverlay}>
              <LoadingState messages={GENERATING_MESSAGES} />
            </View>
          )}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Agregar Entrenamiento</Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={10}
              accessibilityRole='button'
              accessibilityLabel='Cerrar'
            >
              <MaterialCommunityIcons name='close' size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            {/* Fecha */}
            <Text style={styles.label}>Fecha</Text>
            <View style={styles.dateContainer}>
              <TouchableOpacity style={styles.dateButton} onPress={decrementDate}>
                <MaterialCommunityIcons name='chevron-left' size={24} color={colors.primary} />
              </TouchableOpacity>

              <View style={styles.dateDisplay}>
                <Text style={styles.dateText}>{formatDate(date)}</Text>
              </View>

              <TouchableOpacity style={styles.dateButton} onPress={incrementDate}>
                <MaterialCommunityIcons name='chevron-right' size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Hora de inicio */}
            <Text style={styles.label}>
              Hora de inicio <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.timeContainer}>
              <TextInput
                style={[styles.timeInput, timeError ? styles.inputError : null]}
                value={startHour}
                onChangeText={(text) => {
                  if (text.length <= 2 && /^\d*$/.test(text)) {
                    setStartHour(text);
                    setTimeError('');
                  }
                }}
                placeholder='18'
                placeholderTextColor={colors.textMuted}
                keyboardType='numeric'
                maxLength={2}
              />
              <Text style={styles.timeSeparator}>:</Text>
              <TextInput
                style={[styles.timeInput, timeError ? styles.inputError : null]}
                value={startMinute}
                onChangeText={(text) => {
                  if (text.length <= 2 && /^\d*$/.test(text)) {
                    setStartMinute(text);
                    setTimeError('');
                  }
                }}
                placeholder='00'
                placeholderTextColor={colors.textMuted}
                keyboardType='numeric'
                maxLength={2}
              />
            </View>
            {timeError ? <Text style={styles.errorText}>{timeError}</Text> : null}
            <Text style={styles.timeHint}>Formato: HH:MM (24hrs)</Text>

            {/* Duración */}
            <Text style={styles.label}>
              Duración (minutos) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, durationError ? styles.inputError : null]}
              value={duration}
              onChangeText={(text) => {
                setDuration(text);
                setDurationError('');
              }}
              placeholder='Ej: 45'
              placeholderTextColor={colors.textMuted}
              keyboardType='numeric'
            />
            {durationError ? <Text style={styles.errorText}>{durationError}</Text> : null}

            {/* Intensidad */}
            <Text style={styles.label}>Intensidad</Text>
            <View style={styles.optionsContainer}>
              {intensityOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionButton, intensity === option && styles.selectedOption]}
                  onPress={() => setIntensity(option)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.optionText, intensity === option && styles.selectedOptionText]}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tipo */}
            <Text style={styles.label}>Tipo</Text>
            <View style={styles.optionsContainer}>
              {typeOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionButton, type === option && styles.selectedOption]}
                  onPress={() => setType(option)}
                >
                  <Text style={[styles.optionText, type === option && styles.selectedOptionText]}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tipo de Deporte */}
            <Text style={styles.label}>Tipo de Deporte</Text>
            <View style={styles.optionsContainer}>
              {sportTypeOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionButton, sportType === option && styles.selectedOption]}
                  onPress={() => setSportType(option)}
                >
                  <Text
                    style={[styles.optionText, sportType === option && styles.selectedOptionText]}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Clima */}
            <Text style={styles.label}>Clima</Text>
            <View style={styles.optionsContainer}>
              {weatherOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionButton, weather === option && styles.selectedOption]}
                  onPress={() => setWeather(option)}
                >
                  <Text
                    style={[styles.optionText, weather === option && styles.selectedOptionText]}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notas */}
            <Text style={styles.label}>Notas</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder='Agrega alguna nota sobre tu entrenamiento'
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, saving && styles.buttonDisabled]}
              onPress={handleClose}
              disabled={saving}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton, saving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size='small' color={colors.textOnPrimary} />
              ) : (
                <Text style={[styles.buttonText, styles.saveButtonText]}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoiding: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  modalView: {
    backgroundColor: colors.surface,
    margin: spacing.xl,
    borderRadius: radius.xl,
    maxHeight: '82%',
    width: '92%',
    maxWidth: 480,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontFamily: fontFamily.bold,
  },
  formContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: spacing.sm,
    fontFamily: fontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  required: {
    color: colors.error,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 4,
  },
  dateButton: {
    padding: 10,
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: fontFamily.medium,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: 8,
  },
  timeInput: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.textPrimary,
    fontSize: 18,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
    width: 60,
    height: 50,
  },
  timeSeparator: {
    color: colors.textSecondary,
    fontSize: 22,
    fontFamily: fontFamily.bold,
  },
  timeHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.lg,
    marginLeft: 2,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    color: colors.textPrimary,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: spacing.lg,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 1,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
  },
  notesInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.xl,
    gap: 8,
  },
  optionButton: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 32,
    justifyContent: 'center',
  },
  selectedOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 13,
    fontFamily: fontFamily.semibold,
  },
  selectedOptionText: {
    color: colors.textOnPrimary,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: colors.primary,
    marginLeft: 10,
  },
  buttonText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
    fontSize: 15,
  },
  saveButtonText: {
    color: colors.textOnPrimary,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlayLoading,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    borderRadius: radius.xl,
  },
});

export default AddTrainingModal;
