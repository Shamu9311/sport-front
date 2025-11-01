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
const weatherOptions = ['soleado', 'nublado', 'lluvia', 'fresco', 'caluroso', 'húmedo'];

const AddTrainingModal: React.FC<AddTrainingModalProps> = ({ visible, onClose, onSave }) => {
  const [date, setDate] = useState<Date>(new Date());
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState('media');
  const [type, setType] = useState('cardio');
  const [weather, setWeather] = useState('soleado');
  const [notes, setNotes] = useState('');

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

  const handleSave = () => {
    if (!duration) {
      Alert.alert('Error', 'Por favor ingresa la duración del entrenamiento');
      return;
    }

    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      Alert.alert('Error', 'La duración debe ser un número positivo');
      return;
    }

    const trainingData = {
      session_date: date.toISOString(), // Convertir a ISO string para el backend
      duration_min: durationNum,
      intensity,
      type,
      weather,
      notes,
    };

    onSave(trainingData);
    resetForm();
  };

  const resetForm = () => {
    setDate(new Date());
    setDuration('');
    setIntensity('media');
    setType('cardio');
    setWeather('soleado');
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // formatDate ya está definida arriba

  return (
    <Modal visible={visible} animationType='slide' transparent={true} onRequestClose={handleClose}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
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
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleClose}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
              <Text style={[styles.buttonText, styles.saveButtonText]}>Guardar</Text>
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
});

export default AddTrainingModal;
