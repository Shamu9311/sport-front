/**
 * Servicio global para notificar errores de red a la UI.
 * El interceptor de axios llama a setNetworkError cuando no hay respuesta del servidor.
 */

type ErrorListener = (message: string | null) => void;

let listeners: ErrorListener[] = [];
let currentError: string | null = null;

export const setNetworkError = (message: string) => {
  currentError = message;
  listeners.forEach((cb) => cb(message));
};

export const clearNetworkError = () => {
  currentError = null;
  listeners.forEach((cb) => cb(null));
};

export const subscribeToNetworkError = (listener: ErrorListener) => {
  listeners.push(listener);
  if (currentError) {
    listener(currentError);
  }
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
};

export const getCurrentError = () => currentError;
