/** Validación de email (misma lógica que el backend) */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test((email || '').trim());
}

export function isValidProfileAge(age: string | number): boolean {
  const value = typeof age === 'number' ? age : parseInt(String(age), 10);
  return !Number.isNaN(value) && value >= 12 && value <= 120;
}

export function isValidPositiveNumber(value: string | number): boolean {
  const num = typeof value === 'number' ? value : parseInt(String(value), 10);
  return !Number.isNaN(num) && num > 0;
}

export function isValidTrainingDuration(duration: string | number): boolean {
  const num = typeof duration === 'number' ? duration : parseInt(String(duration), 10);
  return !Number.isNaN(num) && num > 0;
}
