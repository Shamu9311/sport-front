import React, { useState } from 'react';
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
const typeOptions = ['cardio', 'fuerza', 'hiit', 'resistencia', 'crossfit', 'otro'];
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
    if (!duration) {
      Alert.alert('Error', 'Por favor ingresa la duración del entrenamiento');
      return;
    }

    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      Alert.alert('Error', 'La duración debe ser un número positivo');
      return;
    }

    const hour = parseInt(startHour) || 0;
    const minute = parseInt(startMinute) || 0;
    
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      Alert.alert('Error', 'Hora inválida. Formato: 00-23 : 00-59');
      return;
    }

    // Formatear fecha en zona horaria local (YYYY-MM-DD)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const localDate = `${year}-${month}-${day}`;

    const trainingData = {
      session_date: localDate,
      start_time: `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00`,
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
  };

  const handleClose = () => {
    if (!saving) {
      resetForm();
      onClose();
    }
  };

  // formatDate ya está definida arriba

  return (
    <Modal visible={visible} animationType='slide' transparent={true} onRequestClose={handleClose}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          {saving && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size='large' color='#D4AF37' />
              <Text style={styles.loadingText}>Generando recomendaciones...</Text>
            </View>
          )}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Agregar Entrenamiento</Text>
            <TouchableOpacity onPress={handleClose}>
              <MaterialCommunityIcons name='close' size={24} color='#fff' />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            {/* Fecha */}
            <Text style={styles.label}>Fecha</Text>
            <View style={styles.dateContainer}>
              <TouchableOpacity style={styles.dateButton} onPress={decrementDate}>
                <MaterialCommunityIcons name='chevron-left' size={24} color='#D4AF37' />
              </TouchableOpacity>

              <View style={styles.dateDisplay}>
                <Text style={styles.dateText}>{formatDate(date)}</Text>
              </View>

              <TouchableOpacity style={styles.dateButton} onPress={incrementDate}>
                <MaterialCommunityIcons name='chevron-right' size={24} color='#D4AF37' />
              </TouchableOpacity>
            </View>

            {/* Hora de inicio */}
            <Text style={styles.label}>
              Hora de inicio <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.timeContainer}>
              <TextInput
                style={styles.timeInput}
                value={startHour}
                onChangeText={(text) => {
                  if (text.length <= 2 && /^\d*$/.test(text)) {
                    setStartHour(text);
                  }
                }}
                placeholder='18'
                placeholderTextColor='#666'
                keyboardType='numeric'
                maxLength={2}
              />
              <Text style={styles.timeSeparator}>:</Text>
              <TextInput
                style={styles.timeInput}
                value={startMinute}
                onChangeText={(text) => {
                  if (text.length <= 2 && /^\d*$/.test(text)) {
                    setStartMinute(text);
                  }
                }}
                placeholder='00'
                placeholderTextColor='#666'
                keyboardType='numeric'
                maxLength={2}
              />
              <Text style={styles.timeHint}>Formato: HH:MM (24hrs)</Text>
            </View>

            {/* Duración */}
            <Text style={styles.label}>
              Duración (minutos) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              placeholder='Ej: 45'
              placeholderTextColor='#666'
              keyboardType='numeric'
            />

            {/* Intensidad */}
            <Text style={styles.label}>Intensidad</Text>
            <View style={styles.optionsContainer}>
              {intensityOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionButton, intensity === option && styles.selectedOption]}
                  onPress={() => setIntensity(option)}
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
              placeholderTextColor='#666'
              multiline
              numberOfLines={4}
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={saving}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size='small' color='#000' />
              ) : (
                <Text style={[styles.buttonText, styles.saveButtonText]}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: '#1a1a1a',
    margin: 20,
    borderRadius: 15,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  formContainer: {
    padding: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  required: {
    color: '#ff4d4d',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 5,
  },
  dateButton: {
    padding: 10,
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    color: '#fff',
    fontSize: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  timeInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    width: 60,
    height: 50,
  },
  timeSeparator: {
    color: '#D4AF37',
    fontSize: 24,
    fontWeight: 'bold',
  },
  timeHint: {
    color: '#999',
    fontSize: 12,
    marginLeft: 10,
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
  },
  selectedOption: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  optionText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
  },
  selectedOptionText: {
    color: '#000',
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#D4AF37',
    marginLeft: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButtonText: {
    color: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 25, 25, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    borderRadius: 15,
  },
  loadingText: {
    color: '#D4AF37',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddTrainingModal;
