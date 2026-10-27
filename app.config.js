// app.config.js - Permite usar variables de entorno para la URL del API
// Crear archivo .env en la raíz con: EXPO_PUBLIC_API_URL=http://TU_IP:5000
export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.6:5000',
  },
});
