import Toast from 'react-native-toast-message';

export type NotifyOptions = {
  text2?: string;
  visibilityTime?: number;
  onPress?: () => void;
  actionLabel?: string;
};

function show(
  type: 'success' | 'error' | 'info' | 'warning',
  text1: string,
  options?: NotifyOptions
) {
  Toast.show({
    type,
    text1,
    text2: options?.text2,
    visibilityTime: options?.visibilityTime ?? 3500,
    onPress: options?.onPress,
    props: options?.actionLabel ? { actionLabel: options.actionLabel } : undefined,
  });
}

export type ApiLikeError = {
  message?: string;
  status?: number;
  code?: string;
};

export function messageFromError(err: unknown): string {
  const e = err as ApiLikeError;
  const status = e?.status;
  const msg = e?.message?.trim();

  if (e?.code === 'ECONNABORTED' || msg?.toLowerCase().includes('timeout')) {
    return 'La solicitud tardó demasiado. Revisa tu conexión e intenta de nuevo.';
  }
  if (status === 0 || msg?.includes('No se recibió respuesta')) {
    return 'Sin conexión con el servidor. Verifica tu red.';
  }
  if (status === 401) {
    return 'Tu sesión expiró. Inicia sesión de nuevo.';
  }
  if (status === 403) {
    return 'No tienes permiso para esta acción.';
  }
  if (status === 404) {
    return 'No encontramos lo que buscabas.';
  }
  if (status === 409) {
    return msg || 'Este dato ya está en uso.';
  }
  if (status && status >= 500) {
    return 'Error en el servidor. Intenta más tarde.';
  }
  if (status === 400) {
    return msg || 'Revisa los datos e intenta de nuevo.';
  }
  if (msg && !msg.startsWith('Error del servidor:')) {
    return msg;
  }
  return 'Algo salió mal. Intenta de nuevo.';
}

export const notify = {
  success: (text1: string, options?: NotifyOptions) => show('success', text1, options),
  error: (text1: string, options?: NotifyOptions) => show('error', text1, options),
  info: (text1: string, options?: NotifyOptions) => show('info', text1, options),
  warning: (text1: string, options?: NotifyOptions) => show('warning', text1, options),
  fromError: (err: unknown, fallback = 'Algo salió mal. Intenta de nuevo.') => {
    const text1 = messageFromError(err);
    show('error', text1 === 'Algo salió mal. Intenta de nuevo.' ? fallback : text1);
  },
};
