// src/utils/imageUtils.js

// --- IMPORTANTE: La ruta dentro de require() es RELATIVA a ESTE archivo (imageUtils.js) ---
// Desde src/utils/ para llegar a assets/images/products/ necesitas subir dos niveles (`../../`)
// Verifica tu estructura de carpetas y ajusta si es necesario.

// 1. Mapeo de nombres de archivo a recursos requeridos estáticamente
const productImages = {
    '1.png': require('../../assets/images/products/1.png'),
    '2.png': require('../../assets/images/products/2.png'),
    '3.png': require('../../assets/images/products/3.png'),
    '4.png': require('../../assets/images/products/4.png'),
    '5.png': require('../../assets/images/products/5.png'),
    '6.png': require('../../assets/images/products/6.png'),
    '7.png': require('../../assets/images/products/7.png'),
    '8.png': require('../../assets/images/products/8.png'),
    '9.png': require('../../assets/images/products/9.png'),
    '10.png': require('../../assets/images/products/10.png'),
    '11.png': require('../../assets/images/products/11.png'),
    '12.png': require('../../assets/images/products/12.png'),
    '13.png': require('../../assets/images/products/13.png'),
    '14.png': require('../../assets/images/products/14.png'),
    '15.png': require('../../assets/images/products/15.png'), // Asegúrate de tener esta imagen si está en la DB
    '16.png': require('../../assets/images/products/16.png'), // Asegúrate de tener esta imagen si está en la DB
    '17.png': require('../../assets/images/products/17.png'),
    '18.png': require('../../assets/images/products/18.png'),
    // Agrega CADA archivo de imagen que tengas en tu base de datos y en assets.
    // El 'nombre.png' debe coincidir EXACTAMENTE con el valor en `products.image_url`
  };
  
  // 2. Imagen por defecto (opcional pero recomendado)
  // Crea una imagen placeholder en tus assets si quieres una específica.
  // Ajusta la ruta relativa también para esta imagen.
  const defaultProductImage = require('../../assets/images/favicon.png'); // ¡Asegúrate que este archivo exista o usa una de las existentes como defecto!
  // Por ejemplo, si no tienes placeholder.png, podrías usar:
  // const defaultProductImage = require('../../assets/images/products/default.png'); // Si tuvieras default.png
  // o incluso:
  // const defaultProductImage = productImages['1.png']; // Usar la imagen 1 como defecto si no se encuentra otra
  
  // 3. Función Auxiliar Exportada
  // Esta función toma el nombre de archivo de la base de datos y devuelve
  // el recurso de imagen correcto (del mapeo) o la imagen por defecto.
  export const getProductImageSource = (imageFilename) => {
    // Verifica si el nombre de archivo existe y está en nuestro mapeo
    if (imageFilename && productImages[imageFilename]) {
      return productImages[imageFilename];
    }
    // Si no se encuentra, devuelve la imagen por defecto
    return defaultProductImage;
  };
  
  // Puedes exportar el objeto directamente si lo necesitaras en otro lugar,
  // pero la función getProductImageSource es más útil para los componentes.
  // export { productImages };
  // Si decides exportar el objeto completo
