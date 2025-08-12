/**
 * Walidator siły hasła
 * Sprawdza czy hasło spełnia wymagania bezpieczeństwa
 */

export const validatePassword = (password) => {
  const errors = [];
  const warnings = [];
  
  // Sprawdzenie długości
  if (password.length < 8) {
    errors.push('Hasło musi mieć minimum 8 znaków');
  } else if (password.length < 12) {
    warnings.push('Dłuższe hasło jest bezpieczniejsze (minimum 12 znaków)');
  }
  
  // Sprawdzenie wielkich liter
  if (!/[A-Z]/.test(password)) {
    errors.push('Hasło musi zawierać przynajmniej jedną wielką literę');
  }
  
  // Sprawdzenie małych liter
  if (!/[a-z]/.test(password)) {
    errors.push('Hasło musi zawierać przynajmniej jedną małą literę');
  }
  
  // Sprawdzenie cyfr
  if (!/\d/.test(password)) {
    errors.push('Hasło musi zawierać przynajmniej jedną cyfrę');
  }
  
  // Sprawdzenie znaków specjalnych
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Hasło musi zawierać przynajmniej jeden znak specjalny');
  }
  
  // Sprawdzenie czy nie zawiera popularnych wzorców
  const commonPatterns = ['password', '123456', 'qwerty', 'admin', 'user'];
  const lowerPassword = password.toLowerCase();
  if (commonPatterns.some(pattern => lowerPassword.includes(pattern))) {
    warnings.push('Hasło zawiera popularne wzorce - rozważ zmianę');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    strength: calculatePasswordStrength(password)
  };
};

/**
 * Oblicza siłę hasła (0-100)
 */
export const calculatePasswordStrength = (password) => {
  let score = 0;
  
  // Długość
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  
  // Różnorodność znaków
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/\d/.test(password)) score += 10;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 10;
  
  // Dodatkowe punkty za różnorodność
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= 8) score += 10;
  if (uniqueChars >= 12) score += 10;
  
  // Bonus za długość
  if (password.length > 20) score += 10;
  
  return Math.min(score, 100);
};

/**
 * Zwraca opis siły hasła
 */
export const getPasswordStrengthLabel = (strength) => {
  if (strength < 30) return { label: 'Bardzo słabe', color: 'red' };
  if (strength < 50) return { label: 'Słabe', color: 'orange' };
  if (strength < 70) return { label: 'Średnie', color: 'yellow' };
  if (strength < 90) return { label: 'Silne', color: 'lightgreen' };
  return { label: 'Bardzo silne', color: 'green' };
};
