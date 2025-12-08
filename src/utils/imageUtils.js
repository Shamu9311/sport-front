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
    '19.png': require('../../assets/images/products/19.png'),
    '20.png': require('../../assets/images/products/20.png'),
    '21.png': require('../../assets/images/products/21.png'),
    '22.png': require('../../assets/images/products/22.png'),
    '23.png': require('../../assets/images/products/23.png'),
    '24.png': require('../../assets/images/products/24.png'),
    '25.png': require('../../assets/images/products/25.png'),
    '26.png': require('../../assets/images/products/26.png'),
    '27.png': require('../../assets/images/products/27.png'),
    '28.png': require('../../assets/images/products/28.png'),
    '29.png': require('../../assets/images/products/29.png'),
    '30.png': require('../../assets/images/products/30.png'),
    '31.png': require('../../assets/images/products/31.png'),
    '32.png': require('../../assets/images/products/32.png'),
    '33.png': require('../../assets/images/products/33.png'),
    '34.png': require('../../assets/images/products/34.png'),
    '35.png': require('../../assets/images/products/35.png'),
    '36.png': require('../../assets/images/products/36.png'),
    '37.png': require('../../assets/images/products/37.png'),
    '38.png': require('../../assets/images/products/38.png'),
    '39.png': require('../../assets/images/products/39.png'),
    '40.png': require('../../assets/images/products/40.png'),
    '41.png': require('../../assets/images/products/41.png'),
    '42.png': require('../../assets/images/products/42.png'),
    '43.png': require('../../assets/images/products/43.png'),
    '44.png': require('../../assets/images/products/44.png'),
    '45.png': require('../../assets/images/products/45.png'),
    '46.png': require('../../assets/images/products/46.png'),
    '47.png': require('../../assets/images/products/47.png'),
    '48.png': require('../../assets/images/products/48.png'),
    '49.png': require('../../assets/images/products/49.png'),
    '50.png': require('../../assets/images/products/50.png'),
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
