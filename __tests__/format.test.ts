import {
  displayLabel,
  formatConsumptionWhen,
  formatNumber,
  hasSessionEnded,
  profileValueLabel,
  weatherLabel,
  weatherToUi,
} from '../src/utils/format';

describe('utilidades de formato', () => {
  it('arma el texto de "Cuándo" sin errores gramaticales e incluye el intervalo', () => {
    expect(formatConsumptionWhen('antes', 30)).toBe('Antes del entrenamiento · 30 min antes');
    expect(formatConsumptionWhen('durante', null, 45)).toBe('Durante el entrenamiento · cada 45 min');
    expect(formatConsumptionWhen('despues', 30)).toBe('Después del entrenamiento · dentro de 30 min');
    expect(formatConsumptionWhen('diario')).toBe('Uso diario');
  });

  it('muestra etiquetas con tildes y nombres legibles', () => {
    expect(displayLabel('natacion')).toBe('Natación');
    expect(displayLabel('media marathon')).toBe('Media maratón');
    expect(displayLabel('mixed')).toBe('Mixto');
    expect(displayLabel('hiit')).toBe('HIIT');
    expect(displayLabel('con cafeina')).toBe('Con cafeína');
    expect(displayLabel('hidratacion')).toBe('Hidratación');
  });

  it('traduce valores del perfil', () => {
    expect(profileValueLabel('dietary_restrictions', 'no')).toBe('Ninguna');
    expect(profileValueLabel('gender', 'hombre')).toBe('Masculino');
    expect(profileValueLabel('training_frequency', '3-4')).toBe('3-4 veces/sem');
    expect(profileValueLabel('caffeine_tolerance', 'medio')).toBe('Media');
    expect(profileValueLabel('sweat_level', null)).toBe('Sin definir');
  });

  it('formatea números sin decimales innecesarios', () => {
    expect(formatNumber('89.00')).toBe('89');
    expect(formatNumber('0.10')).toBe('0.1');
    expect(formatNumber(null)).toBe('');
  });

  it('traduce el clima de BD a la etiqueta del formulario', () => {
    expect(weatherToUi('calido')).toBe('soleado');
    expect(weatherLabel('moderado')).toBe('Nublado');
  });

  it('determina si una sesión ya terminó', () => {
    const now = new Date(2026, 10, 13, 12, 0, 0);
    expect(hasSessionEnded({ session_date: '2026-11-13', start_time: '10:00:00', duration_min: 60 }, now)).toBe(true);
    expect(hasSessionEnded({ session_date: '2026-11-13', start_time: '11:30:00', duration_min: 60 }, now)).toBe(false);
    expect(hasSessionEnded({ session_date: '2026-11-14', start_time: '07:00:00', duration_min: 30 }, now)).toBe(false);
  });
});
