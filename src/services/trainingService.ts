import api from './api';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from './api';

// Helper function to safely get token from storage
const getToken = async () => {
  try {
    // Use AsyncStorage for React Native
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      return await AsyncStorage.getItem('token');
    }
    // Use localStorage for web if available
    else if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  } catch (error) {
    console.warn('Error accessing storage:', error);
    return null;
  }
};

// Obtener todas las sesiones de entrenamiento del usuario
export const getUserTrainingSessions = async (userId: number) => {
  try {
    const token = await getToken();
    const response = await api.get('/training', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching training sessions:', error);
    throw error;
  }
};

// Obtener una sesión de entrenamiento específica
export const getTrainingSession = async (sessionId: number) => {
  try {
    const token = await getToken();
    const response = await api.get(`${API_URL}/training/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching training session:', error);
    throw error;
  }
};

// Crear una nueva sesión de entrenamiento
export const createTrainingSession = async (trainingData: {
  sessionDate: string;
  durationMin: number;
  intensity: string;
  type: string;
  weather?: string;
  notes?: string;
}) => {
  try {
    const token = await getToken();
    const response = await api.post(`${API_URL}/training`, trainingData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating training session:', error);
    throw error;
  }
};

// Actualizar una sesión de entrenamiento existente
export const updateTrainingSession = async (
  sessionId: number,
  trainingData: {
    sessionDate: string;
    durationMin: number;
    intensity: string;
    type: string;
    weather?: string;
    notes?: string;
  }
) => {
  try {
    const token = await getToken();
    const response = await api.put(`${API_URL}/training/${sessionId}`, trainingData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating training session:', error);
    throw error;
  }
};

// Eliminar una sesión de entrenamiento
export const deleteTrainingSession = async (sessionId: number) => {
  try {
    const token = await getToken();
    const response = await api.delete(`${API_URL}/training/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting training session:', error);
    throw error;
  }
};

// Obtener recomendaciones basadas en una sesión de entrenamiento
export const getTrainingRecommendations = async (trainingId: number, userId: number) => {
  try {
    const token = await getToken();
    const response = await api.post('/recommendations/training', 
      { trainingId, userId },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    let recommendations = [];
    
    if (response.data && Array.isArray(response.data)) {
      recommendations = response.data;
    } else if (response.data && response.data.recommendations && Array.isArray(response.data.recommendations)) {
      recommendations = response.data.recommendations;
    }
    
    return recommendations;
  } catch (error) {
    console.error('Error fetching training recommendations:', error);
    throw error;
  }
};
