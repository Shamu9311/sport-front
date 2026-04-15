import axios from 'axios';
import Constants from 'expo-constants';
import { UserData, UserProfileData } from '../types/UserTypes';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setNetworkError, clearNetworkError } from './errorService';
import { notifySessionInvalidated } from './sessionInvalidation';

export const API_URL =
  Constants.expoConfig?.extra?.apiUrl || 'http://192.168.0.6:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autorización a todas las requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Configura interceptores para manejar errores y tokens expirados
api.interceptors.response.use(
  (response) => {
    clearNetworkError();
    return response;
  },
  async (error) => {
    const reqUrl = String(error.config?.url || '');
    const isAuthPath =
      reqUrl.includes('/auth/login') || reqUrl.includes('/auth/register');
    const hadAuthorization = !!error.config?.headers?.Authorization;

    if (
      error.response?.status === 401 &&
      hadAuthorization &&
      !isAuthPath
    ) {
      try {
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('token');
      } catch (storageError) {
        console.error('Error cleaning storage:', storageError);
      }
      notifySessionInvalidated();
    }

    if (error.response) {
      clearNetworkError();
      const data = error.response.data;
      const msg =
        (data && typeof data === 'object' && 'message' in data && (data as any).message) ||
        'Error en la solicitud';
      return Promise.reject({
        message: msg,
        status: error.response.status,
        response: error.response,
      });
    }
    if (error.request) {
      setNetworkError('Sin conexión. Verifica tu red e intenta de nuevo.');
      return Promise.reject({
        message: 'No se recibió respuesta del servidor',
      });
    }
    setNetworkError('Error de conexión. Intenta de nuevo.');
    return Promise.reject({
      message: 'Error al configurar la solicitud',
    });
  }
);

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const registerUser = async (userData: {
  username: string;
  email: string;
  password: string;
}) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getRecommendations = async (trainingData?: Record<string, unknown>) => {
  try {
    const response = await api.post(`/recommendations/`, {
      trainingData: trainingData || {},
    });

    // El backend devuelve un objeto con propiedades 'message' y 'recommendations'
    let recommendations = [];

    if (
      response.data &&
      response.data.recommendations &&
      Array.isArray(response.data.recommendations)
    ) {
      recommendations = response.data.recommendations;
    } else if (Array.isArray(response.data)) {
      recommendations = response.data;
    }

    // Definimos una interfaz para los productos recomendados
    interface ProductRecommendation {
      product_id: number;
      name?: string;
      description?: string;
      reasoning?: string;
      [key: string]: any; // Para cualquier otra propiedad que pueda tener el producto
    }

    // Proceso adicional para asegurar que cada recomendación tenga todos los campos necesarios
    if (recommendations.length > 0) {
      // Completar los datos faltantes con valores predeterminados
      const processedRecommendations = recommendations.map((product: ProductRecommendation) => ({
        ...product,
        // Usar los campos correctos del backend
        name: product.product_name || product.name || `Producto ${product.product_id}`,
        description:
          product.product_description ||
          product.description ||
          'Información no disponible en este momento',
        // Asegurar que tenemos una imagen
        image_url: product.image_url || '/assets/default-product.png',
      }));

      return processedRecommendations;
    }

    return recommendations;
  } catch (error) {
    console.error('Error al obtener recomendaciones:', error);
    throw error;
  }
};

export const addConsumption = async (userId: number, productId: number, quantity: number) => {
  try {
    const response = await api.post(`/users/${userId}/consumption`, { productId, quantity });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProfile = async (userId: number) => {
  try {
    const response = await api.get(`/profile/${userId}/profile`);

    // Si la respuesta es exitosa y tiene datos de perfil
    if (response.data && response.data.success && response.data.data?.profile) {
      return {
        success: true,
        data: {
          user: response.data.data.user,
          profile: {
            ...response.data.data.profile,
            dietary_restrictions: response.data.data.profile?.dietary_restrictions
              ? response.data.data.profile.dietary_restrictions.split(',')
              : [],
          },
        },
      };
    }

    // Si la respuesta es exitosa pero no hay perfil
    if (response.data && response.data.success && !response.data.data?.profile) {
      return {
        success: false,
        data: null,
        message: 'Usuario sin perfil',
      };
    }

    // Para cualquier otro caso de respuesta no exitosa
    return {
      success: false,
      data: null,
      message: response.data?.message || 'No se pudo obtener el perfil',
    };
  } catch (error: any) {
    const status = error?.status ?? error?.response?.status;
    if (status === 401) {
      return {
        success: false,
        data: null,
        message: 'Sesión expirada. Vuelve a iniciar sesión.',
      };
    }
    console.error('Error en getProfile:', error);
    // Manejar diferentes tipos de errores
    if (error.response) {
      // El servidor respondió con un estado fuera del rango 2xx
      if (error.response.status === 404) {
        return {
          success: false,
          data: null,
          message: 'Usuario sin perfil',
        };
      }
      return {
        success: false,
        data: null,
        message: `Error del servidor: ${error.response.status} - ${error.response.data?.message || 'Error desconocido'
          }`,
      };
    } else if (error.request) {
      // La solicitud fue hecha pero no hubo respuesta
      return {
        success: false,
        data: null,
        message: 'No se pudo conectar con el servidor',
      };
    }
    // Error al configurar la solicitud
    return {
      success: false,
      data: null,
      message: 'Error al procesar la solicitud de perfil',
    };
  }
};

export const saveUserProfile = async (userId: number, profileData: UserProfileData) => {
  try {
    // Preparar los datos para el backend
    const preparedData = {
      ...profileData,
      // Convertir arrays a strings para el backend
      dietary_restrictions: Array.isArray(profileData.dietary_restrictions)
        ? profileData.dietary_restrictions.join(',')
        : profileData.dietary_restrictions || '',
    };

    // Asegurar que la ruta es correcta y coincide con el backend
    const response = await api.post(`/profile/${userId}/profile`, preparedData);
    return response.data;
  } catch (error: any) {
    console.error('Error saving profile:', error);
    throw error;
  }
};

export const getProductCategories = async () => {
  try {
    const response = await api.get('/products/categories');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProductsByCategory = async (categoryId: string) => {
  try {
    const response = await api.get(`/products/category/${categoryId}`);

    let products = [];

    // Manejar diferentes formatos de respuesta
    if (response.data && Array.isArray(response.data)) {
      // Si la respuesta es directamente un array de productos
      products = response.data;
    } else if (response.data && response.data.products && Array.isArray(response.data.products)) {
      // Si la respuesta tiene una propiedad 'products' que es un array
      products = response.data.products;
    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
      // Si la respuesta tiene una propiedad 'data' que es un array
      products = response.data.data;
    }

    // Asegurarse de que cada producto tenga los campos necesarios
    const processedProducts = products.map((product: any) => ({
      ...product,
      product_name: product.product_name || product.name || `Producto ${product.product_id}`,
      product_description:
        product.product_description || product.description || 'Descripción no disponible',
      image_url: product.image_url || '/assets/default-product.png',
      // Asegurar que los campos opcionales tengan valores por defecto
      price: product.price || 0,
      category_id: product.category_id || parseInt(categoryId, 10),
    }));

    return processedProducts;
  } catch (error) {
    console.error('Error en getProductsByCategory:', error);
    throw error;
  }
};

export const searchProducts = async (filters: {
  q?: string;
  category?: string;
  timing?: string;
  type?: string;
  limit?: number;
  offset?: number;
}) => {
  try {
    const params = new URLSearchParams();

    if (filters.q) params.append('q', filters.q);
    if (filters.category) params.append('category', filters.category);
    if (filters.timing) params.append('timing', filters.timing);
    if (filters.type) params.append('type', filters.type);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const response = await api.get(`/products/search?${params.toString()}`);

    let products = [];
    if (response.data && response.data.products && Array.isArray(response.data.products)) {
      products = response.data.products;
    } else if (Array.isArray(response.data)) {
      products = response.data;
    }

    // Procesar productos para asegurar campos necesarios
    const processedProducts = products.map((product: any) => ({
      ...product,
      product_name: product.product_name || product.name || `Producto ${product.product_id}`,
      product_description:
        product.product_description || product.description || 'Descripción no disponible',
      image_url: product.image_url || '/assets/default-product.png',
    }));

    return {
      products: processedProducts,
      total: response.data?.total || processedProducts.length,
      hasMore: response.data?.hasMore || false,
    };
  } catch (error) {
    console.error('Error en searchProducts:', error);
    throw error;
  }
};

export const getProductDetails = async (productId: string) => {
  try {
    const response = await api.get(`/products/${productId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProductNutrition = async (productId: string) => {
  try {
    const response = await api.get(`/products/${productId}/nutrition`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProductFlavors = async (productId: string) => {
  try {
    const response = await api.get(`/products/${productId}/flavors`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Obtener recomendaciones guardadas (usuario = token JWT)
export const getSavedRecommendations = async () => {
  const response = await api.get(`/recommendations/saved`);
  let recommendations: any[] = [];
  if (
    response.data &&
    response.data.recommendations &&
    Array.isArray(response.data.recommendations)
  ) {
    recommendations = response.data.recommendations;
  }
  return recommendations;
};

export const getProductAttributes = async (productId: string) => {
  try {
    const response = await api.get(`/products/${productId}/attributes`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

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
    const response = await api.get(`/training/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching training sessions:', error);
    throw error;
  }
};

// Obtener una sesión de entrenamiento específica
export const getTrainingSession = async (sessionId: number) => {
  try {
    const response = await api.get(`/training/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching training session:', error);
    throw error;
  }
};

// Crear una nueva sesión de entrenamiento
export const createTrainingSession = async (trainingData: {
  userId: number;
  sessionDate: string;
  durationMin: number;
  intensity: string;
  type: string;
  weather?: string;
  sport_type?: string;
  notes?: string;
}) => {
  try {
    const response = await api.post('/training', trainingData);
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
    sport_type?: string;
    notes?: string;
  }
) => {
  try {
    const response = await api.put(`/training/${sessionId}`, trainingData);
    return response.data;
  } catch (error) {
    console.error('Error updating training session:', error);
    throw error;
  }
};

// Eliminar una sesión de entrenamiento
export const deleteTrainingSession = async (sessionId: number) => {
  try {
    const response = await api.delete(`/training/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting training session:', error);
    throw error;
  }
};

/** Recomendaciones asociadas a una sesión (requiere JWT; el backend valida propiedad de la sesión) */
export const getTrainingSessionRecommendationsBySession = async (sessionId: number) => {
  const response = await api.get(`/training/${sessionId}/recommendations`);
  return response.data;
};

// Obtener recomendaciones basadas en una sesión de entrenamiento
export const getTrainingRecommendations = async (trainingId: number, userId: number) => {
  try {
    const response = await api.post('/recommendations/training', { trainingId, userId });

    let recommendations = [];

    if (response.data && Array.isArray(response.data)) {
      recommendations = response.data;
    } else if (
      response.data &&
      response.data.recommendations &&
      Array.isArray(response.data.recommendations)
    ) {
      recommendations = response.data.recommendations;
    }

    return recommendations;
  } catch (error) {
    console.error('Error fetching training recommendations:', error);
    throw error;
  }
};

// Guardar feedback del usuario sobre un producto
export const saveProductFeedback = async (userId: number, productId: number, feedback: 'positivo' | 'negativo', notes?: string) => {
  try {
    const response = await api.post('/recommendations/product-feedback', {
      userId,
      productId,
      feedback,
      notes
    });
    return response.data;
  } catch (error) {
    console.error('Error saving product feedback:', error);
    throw error;
  }
};

// Obtener historial de feedback del usuario (token JWT)
export const getUserFeedbackHistory = async () => {
  try {
    const response = await api.get(`/recommendations/user-feedback`);
    return response.data;
  } catch (error) {
    console.error('Error getting user feedback:', error);
    throw error;
  }
};

// Obtener preferencias de notificaciones
export const getNotificationPreferences = async (userId: number) => {
  try {
    const response = await api.get(`/notifications/preferences/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    throw error;
  }
};

// Actualizar preferencias de notificaciones
export const updateNotificationPreferences = async (
  userId: number,
  preferences: {
    consumption_reminders: boolean;
    training_alerts: boolean;
    preferred_time: string;
  }
) => {
  try {
    const response = await api.put(`/notifications/preferences/${userId}`, preferences);
    return response.data;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};

export default api;
