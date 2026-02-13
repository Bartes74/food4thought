import React from 'react';

const PasswordStrengthIndicator = ({ password }) => {
  const hasSpecial = (pwd) => /[^a-zA-Z0-9]/.test(pwd || '');

  const calculateStrength = (password) => {
    if (!password) return 0;
    
    let score = 0;
    
    // Długość
    if (password.length >= 8) score += 10;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
    
    // Różnorodność znaków
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (hasSpecial(password)) score += 10;
    
    // Dodatkowe punkty za różnorodność
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= 8) score += 10;
    if (uniqueChars >= 12) score += 10;
    
    // Bonus za długość
    if (password.length > 20) score += 10;
    
    return Math.min(score, 100);
  };

  const getStrengthLabel = (strength) => {
    if (strength < 30) return { label: 'Bardzo słabe', color: 'bg-red-500' };
    if (strength < 50) return { label: 'Słabe', color: 'bg-orange-500' };
    if (strength < 70) return { label: 'Średnie', color: 'bg-yellow-500' };
    if (strength < 90) return { label: 'Silne', color: 'bg-green-500' };
    return { label: 'Bardzo silne', color: 'bg-emerald-500' };
  };

  const getRequirements = (password) => {
    const requirements = [
      { 
        label: 'Minimum 8 znaków', 
        met: password.length >= 8,
        icon: password.length >= 8 ? '✓' : '✗'
      },
      { 
        label: 'Wielka litera', 
        met: /[A-Z]/.test(password),
        icon: /[A-Z]/.test(password) ? '✓' : '✗'
      },
      { 
        label: 'Mała litera', 
        met: /[a-z]/.test(password),
        icon: /[a-z]/.test(password) ? '✓' : '✗'
      },
      { 
        label: 'Cyfra', 
        met: /\d/.test(password),
        icon: /\d/.test(password) ? '✓' : '✗'
      },
      { 
        label: 'Znak specjalny', 
        met: hasSpecial(password),
        icon: hasSpecial(password) ? '✓' : '✗'
      }
    ];
    
    return requirements;
  };

  const strength = calculateStrength(password);
  const { label, color } = getStrengthLabel(strength);
  const requirements = getRequirements(password);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-3">
      {/* Pasek siły hasła */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 dark:text-gray-400">Siła hasła:</span>
          <span className={`font-medium ${strength >= 70 ? 'text-green-600' : strength >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
            {label}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${color}`}
            style={{ width: `${strength}%` }}
          ></div>
        </div>
      </div>

      {/* Wymagania */}
      <div className="space-y-1">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Wymagania:</p>
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center text-sm">
            <span className={`mr-2 ${req.met ? 'text-green-600' : 'text-red-600'}`}>
              {req.icon}
            </span>
            <span className={req.met ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
