import axios from 'axios';
import Constants from 'expo-constants';
import { UserProfileData } from '../types/UserTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, removeToken } from './tokenStorage';
import { setNetworkError, clearNetworkError } from './errorService';
import { notifySessionInvalidated } from './sessionInvalidation';

const configuredUrl = Constants.expoConfig?.extra?.apiUrl as string | undefined;
export const API_URL =
  configuredUrl || (__DEV__ ? 'http://192.168.0.6:5000' : '');

/** Normaliza respuestas `{ success, data }` del backend */
export function unwrapApiPayload<T = unknown>(payload: unknown): T {
  if (
    payload &&
    typeof payload === 'object' &&
    'success' in payload &&
    (payload as { success?: boolean }).success === true &&
    'data' in payload
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export function formatDietaryRestrictions(
  value: string | string[] | undefined | null
): string {
  if (!value) return 'no';
  if (Array.isArray(value)) {
    const filtered = value.filter(Boolean);
    return filtered.length > 0 ? filtered.join(', ') : 'no';
  }
  return value;
}

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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
        await removeToken();
      } catch (storageError) {
        console.error('Error cleaning storage:', storageError);
      }
      notifySessionInvalidated();
    }

    if (error.response) {
      clearNetworkError();
      const data = error.response.data;
      const defaultMessage =
        error.response.status === 403
          ? 'No tienes permiso para esta acción'
          : 'Error en la solicitud';
      const msg =
        (data &&
          typeof data === 'object' &&
          'message' in data &&
          (data as { message?: string }).message) ||
        defaultMessage;
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
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (userData: {
  username: string;
  email: string;
  password: string;
}) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const getProfile = async (userId: number) => {
  try {
    const response = await api.get(`/profile/${userId}/profile`);

    if (response.data?.success && response.data.data?.profile) {
      const profile = response.data.data.profile;
      return {
        success: true,
        data: {
          user: response.data.data.user,
          profile: {
            ...profile,
            dietary_restrictions: formatDietaryRestrictions(profile.dietary_restrictions),
          },
        },
      };
    }

    if (response.data?.success && !response.data.data?.profile) {
      return {
        success: false,
        data: null,
        message: 'Usuario sin perfil',
      };
    }

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
    if (error.response) {
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
        message: `Error del servidor: ${error.response.status} - ${
          error.response.data?.message || 'Error desconocido'
        }`,
      };
    }
    if (error.request) {
      return {
        success: false,
        data: null,
        message: 'No se pudo conectar con el servidor',
      };
    }
    return {
      success: false,
      data: null,
      message: 'Error al procesar la solicitud de perfil',
    };
  }
};

export const saveUserProfile = async (userId: number, profileData: UserProfileData) => {
  try {
    const preparedData = {
      ...profileData,
      dietary_restrictions: Array.isArray(profileData.dietary_restrictions)
        ? profileData.dietary_restrictions.join(',')
        : profileData.dietary_restrictions || 'no',
    };

    const response = await api.post(`/profile/${userId}/profile`, preparedData);
    return response.data;
  } catch (error: any) {
    console.error('Error saving profile:', error);
    throw error;
  }
};

export const getProductCategories = async () => {
  const response = await api.get('/products/categories');
  const data = unwrapApiPayload(response.data);
  return Array.isArray(data) ? data : [];
};

export const getProductsByCategory = async (categoryId: string) => {
  try {
    const response = await api.get(`/products/category/${categoryId}`);
    const payload = response.data;
    const data = unwrapApiPayload<{ products?: unknown[] }>(payload);

    let products: unknown[] = [];
    if (data?.products && Array.isArray(data.products)) {
      products = data.products;
    } else if (Array.isArray(data)) {
      products = data;
    } else if (payload?.products && Array.isArray(payload.products)) {
      products = payload.products;
    } else if (Array.isArray(payload)) {
      products = payload;
    }

    return (products as Record<string, unknown>[]).map((product) => ({
      ...product,
      product_name: product.product_name || product.name || `Producto ${product.product_id}`,
      product_description:
        product.product_description || product.description || 'Descripción no disponible',
      image_url: product.image_url || '/assets/default-product.png',
      price: product.price || 0,
      category_id: product.category_id || parseInt(categoryId, 10),
    }));
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
    const payload = response.data;
    const data = unwrapApiPayload<{
      products?: unknown[];
      total?: number;
      hasMore?: boolean;
    }>(payload);

    let products: unknown[] = [];
    if (data?.products && Array.isArray(data.products)) {
      products = data.products;
    } else if (payload?.products && Array.isArray(payload.products)) {
      products = payload.products;
    } else if (Array.isArray(data)) {
      products = data;
    } else if (Array.isArray(payload)) {
      products = payload;
    }

    const processedProducts = (products as Record<string, unknown>[]).map((product) => ({
      ...product,
      product_name: product.product_name || product.name || `Producto ${product.product_id}`,
      product_description:
        product.product_description || product.description || 'Descripción no disponible',
      image_url: product.image_url || '/assets/default-product.png',
    }));

    return {
      products: processedProducts,
      total: data?.total ?? payload?.total ?? processedProducts.length,
      hasMore: data?.hasMore ?? payload?.hasMore ?? false,
    };
  } catch (error) {
    console.error('Error en searchProducts:', error);
    throw error;
  }
};

export const getSavedRecommendations = async () => {
  const response = await api.get(`/recommendations/saved`);
  const payload = response.data;
  const data = unwrapApiPayload<{ recommendations?: unknown[] }>(payload);

  if (data?.recommendations && Array.isArray(data.recommendations)) {
    return data.recommendations;
  }
  if (payload?.recommendations && Array.isArray(payload.recommendations)) {
    return payload.recommendations;
  }
  return [];
};

export const getFullProductDetails = async (productId: string) => {
  const response = await api.get(`/products/${productId}/full`);
  return unwrapApiPayload(response.data);
};

export const getUserTrainingSessions = async (userId: number) => {
  try {
    const response = await api.get(`/training/user/${userId}`);
    const data = unwrapApiPayload(response.data);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching training sessions:', error);
    throw error;
  }
};

export const getTrainingSession = async (sessionId: number) => {
  try {
    const response = await api.get(`/training/${sessionId}`);
    return unwrapApiPayload(response.data);
  } catch (error) {
    console.error('Error fetching training session:', error);
    throw error;
  }
};

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
    return unwrapApiPayload(response.data);
  } catch (error) {
    console.error('Error creating training session:', error);
    throw error;
  }
};

export const updateTrainingSession = async (
  sessionId: number,
  trainingData: {
    session_date?: string;
    duration_min?: number;
    intensity?: string;
    type?: string;
    weather?: string;
    sport_type?: string;
    notes?: string;
  }
) => {
  try {
    const response = await api.put(`/training/${sessionId}`, trainingData);
    return unwrapApiPayload(response.data);
  } catch (error) {
    console.error('Error updating training session:', error);
    throw error;
  }
};

export const deleteTrainingSession = async (sessionId: number) => {
  try {
    const response = await api.delete(`/training/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting training session:', error);
    throw error;
  }
};

export const getTrainingSessionRecommendationsBySession = async (sessionId: number) => {
  const response = await api.get(`/training/${sessionId}/recommendations`);
  const data = unwrapApiPayload(response.data);
  return Array.isArray(data) ? data : [];
};

export const pollTrainingRecommendations = async (
  sessionId: number,
  maxAttempts = 5,
  delayMs = 4000
) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    const recommendations = await getTrainingSessionRecommendationsBySession(sessionId);
    if (recommendations.length > 0) {
      return recommendations;
    }
  }
  return [];
};

export const saveProductFeedback = async (
  userId: number,
  productId: number,
  feedback: 'positivo' | 'negativo',
  notes?: string
) => {
  try {
    const response = await api.post('/recommendations/product-feedback', {
      userId,
      productId,
      feedback,
      notes,
    });
    return response.data;
  } catch (error) {
    console.error('Error saving product feedback:', error);
    throw error;
  }
};

export const getUserFeedbackHistory = async () => {
  try {
    const response = await api.get(`/recommendations/user-feedback`);
    const data = unwrapApiPayload<{ feedback?: unknown[] }>(response.data);
    if (data?.feedback && Array.isArray(data.feedback)) {
      return { success: true, feedback: data.feedback };
    }
    if (response.data?.feedback && Array.isArray(response.data.feedback)) {
      return response.data;
    }
    return { success: true, feedback: [] };
  } catch (error) {
    console.error('Error getting user feedback:', error);
    throw error;
  }
};

export const getNotificationPreferences = async (userId: number) => {
  try {
    const response = await api.get(`/notifications/preferences/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    throw error;
  }
};

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
