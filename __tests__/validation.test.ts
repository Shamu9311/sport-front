import {
  isValidEmail,
  isValidProfileAge,
  isValidPositiveNumber,
  isValidTrainingDuration,
} from '../src/utils/validation';

describe('validation utils', () => {
  it('valida emails correctos', () => {
    expect(isValidEmail('user@test.com')).toBe(true);
  });

  it('rechaza emails inválidos', () => {
    expect(isValidEmail('bad-email')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('valida edad del perfil entre 12 y 120', () => {
    expect(isValidProfileAge(25)).toBe(true);
    expect(isValidProfileAge(8)).toBe(false);
    expect(isValidProfileAge(130)).toBe(false);
  });

  it('valida peso y altura positivos', () => {
    expect(isValidPositiveNumber('70')).toBe(true);
    expect(isValidPositiveNumber('0')).toBe(false);
  });

  it('valida duración de entrenamiento positiva', () => {
    expect(isValidTrainingDuration('60')).toBe(true);
    expect(isValidTrainingDuration('0')).toBe(false);
    expect(isValidTrainingDuration('abc')).toBe(false);
  });
});
