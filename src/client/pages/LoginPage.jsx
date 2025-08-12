import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import LanguageSelector from '../components/LanguageSelector'
import ThemeToggle from '../components/ThemeToggle'
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('login') // 'login', 'register', 'reset', 'verification'
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [verificationToken, setVerificationToken] = useState('')
  const [registeredEmail, setRegisteredEmail] = useState('')
  
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const { t } = useLanguage()
  const { isDarkMode } = useTheme()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'login') {
      const result = await login(email, password)
      if (result.success) {
        navigate('/')
      } else {
        if (result.needsVerification) {
          setError('Email nie został zweryfikowany. Sprawdź swoją skrzynkę email i kliknij link weryfikacyjny.')
        } else {
          setError(t('login.invalidCredentials'))
        }
      }
    } else if (mode === 'register') {
      // Walidacja
      if (!email) {
        setError(t('register.emailRequired'))
        setLoading(false)
        return
      }
      if (!password) {
        setError(t('register.passwordRequired'))
        setLoading(false)
        return
      }
      if (!confirmPassword) {
        setError('Potwierdzenie hasła jest wymagane')
        setLoading(false)
        return
      }
      if (password !== confirmPassword) {
        setError('Hasła nie są identyczne')
        setLoading(false)
        return
      }

      const result = await register(email, password, confirmPassword)
      if (result.success) {
        // Po rejestracji pokazujemy link aktywacyjny
        setVerificationToken(result.verificationToken)
        setRegisteredEmail(email)
        setMode('verification')
        setError('')
      } else {
        if (result.error.includes('zarejestrowany') || result.error.includes('registered')) {
          setError(t('register.emailTaken'))
        } else if (result.error.includes('format')) {
          setError(t('register.invalidEmail'))
        } else if (result.error.includes('bezpieczeństwa')) {
          setError(result.error + ': ' + (result.details?.join(', ') || ''))
        } else {
          setError(result.error)
        }
      }
    }

    setLoading(false)
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setError('Link skopiowany do schowka!')
      setTimeout(() => setError(''), 2000)
    } catch (err) {
      setError('Nie udało się skopiować linku')
      setTimeout(() => setError(''), 2000)
    }
  }

  const handleVerification = async () => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${verificationToken}`)
      const data = await response.json()
      
      if (response.ok) {
        setError('Email został pomyślnie zweryfikowany! Możesz się teraz zalogować.')
        setTimeout(() => {
          setMode('login')
          setError('')
          setVerificationToken('')
          setRegisteredEmail('')
        }, 3000)
      } else {
        setError(data.error || 'Błąd weryfikacji email')
      }
    } catch (err) {
      setError('Błąd podczas weryfikacji email')
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await response.json()
      
      if (response.ok) {
        setError(t('reset.emailSent'))
        setTimeout(() => {
          setMode('login')
          setError('')
        }, 3000)
      } else {
        setError(data.error || t('common.error'))
      }
    } catch (err) {
      setError(t('common.error'))
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex flex-col transition-colors duration-300">
      {/* Header - taki sam jak na stronie głównej */}
      <header className="bg-primary border-b border-primary-dark p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold text-white">Food 4 Thought</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageSelector />
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Tytuł strony */}
          <div className="text-center mb-8">
            <p className="text-2xl font-semibold text-light-text dark:text-white">
              {mode === 'login' && t('login.subtitle')}
              {mode === 'register' && t('register.subtitle')}
              {mode === 'reset' && t('reset.subtitle')}
              {mode === 'verification' && 'Weryfikacja Email'}
            </p>
          </div>

          {/* Formularz */}
          <div className="bg-white dark:bg-dark-surface rounded-2xl p-8 shadow-xl transition-colors duration-300">
            {mode !== 'verification' && (
              <form onSubmit={mode === 'reset' ? handleReset : handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-light-text dark:text-gray-300 mb-2">
                  {t('common.email')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-light-text dark:text-white placeholder-gray-400"
                  placeholder={t('login.emailPlaceholder')}
                  required
                />
              </div>

              {/* Hasło - tylko dla login i register */}
              {mode !== 'reset' && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-light-text dark:text-gray-300 mb-2">
                    {t('common.password')}
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-light-text dark:text-white placeholder-gray-400"
                      placeholder={t('login.passwordPlaceholder')}
                      required={mode === 'login'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  
                  {/* Wskaźnik siły hasła - tylko dla rejestracji */}
                  {mode === 'register' && password && (
                    <PasswordStrengthIndicator password={password} />
                  )}
                </div>
              )}

              {/* Potwierdzenie hasła - tylko dla rejestracji */}
              {mode === 'register' && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-light-text dark:text-gray-300 mb-2">
                    Potwierdź hasło
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-light-text dark:text-white placeholder-gray-400"
                      placeholder="Wprowadź hasło ponownie"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  
                  {/* Wskaźnik zgodności haseł */}
                  {confirmPassword && (
                    <div className="mt-2 text-sm">
                      {password === confirmPassword ? (
                        <span className="text-green-600 flex items-center">
                          <span className="mr-1">✓</span> Hasła są identyczne
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center">
                          <span className="mr-1">✗</span> Hasła nie są identyczne
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Błąd */}
              {error && (
                <div className={`p-4 rounded-xl text-sm ${
                  error.includes(t('reset.emailSent')) ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                }`}>
                  {error}
                </div>
              )}

              {/* Przycisk submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('login.processing')}
                  </span>
                ) : (
                  <>
                    {mode === 'login' && t('login.loginButton')}
                    {mode === 'register' && t('register.registerButton')}
                    {mode === 'reset' && t('reset.resetButton')}
                  </>
                )}
              </button>
            </form>
            )}

            {/* Tryb weryfikacji email */}
            {mode === 'verification' && (
              <div className="mt-6 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl text-green-600">✓</span>
                  </div>
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                    Konto zostało utworzone!
                  </h3>
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    Kliknij poniższy link, aby zweryfikować swój adres email:
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Link weryfikacyjny:</p>
                    <p className="text-sm font-mono text-green-700 dark:text-green-300 break-all">
                      {`${window.location.origin}/verify-email?token=${verificationToken}`}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/verify-email?token=${verificationToken}`)}
                      className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      📋 Kopiuj link
                    </button>
                    <button
                      onClick={handleVerification}
                      className="flex-1 py-2 px-3 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      ✅ Weryfikuj teraz
                    </button>
                  </div>
                  
                  <div className="text-center">
                    <button
                      onClick={() => {
                        setMode('login')
                        setVerificationToken('')
                        setRegisteredEmail('')
                        setError('')
                      }}
                      className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm transition-colors"
                    >
                      ← Wróć do logowania
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Linki nawigacyjne */}
            {mode !== 'verification' && (
              <div className="mt-6 text-center space-y-2">
              {mode === 'login' && (
                <>
                  <button
                    onClick={() => {
                      setMode('register')
                      setError('')
                    }}
                    className="text-primary hover:text-primary-light transition-colors text-sm"
                  >
                    {t('login.registerLink')}
                  </button>
                  <br />
                  <button
                    onClick={() => {
                      setMode('reset')
                      setError('')
                    }}
                    className="text-light-textSecondary dark:text-gray-400 hover:text-light-text dark:hover:text-gray-300 transition-colors text-sm"
                  >
                    {t('login.forgotPassword')}
                  </button>
                </>
              )}
              
              {mode === 'register' && (
                <button
                  onClick={() => {
                    setMode('login')
                    setError('')
                  }}
                  className="text-primary hover:text-primary-light transition-colors text-sm"
                >
                  {t('register.loginLink')}
                </button>
              )}
              
              {mode === 'reset' && (
                <button
                  onClick={() => {
                    setMode('login')
                    setError('')
                  }}
                  className="text-primary hover:text-primary-light transition-colors text-sm"
                >
                  {t('reset.backToLogin')}
                </button>
              )}
            </div>
            )}
          </div>

          {/* Informacja dla developmentu */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-white dark:bg-dark-surface rounded-xl text-xs text-light-textSecondary dark:text-gray-500 text-center transition-colors duration-300 shadow-lg">
              <p>{t('login.testAccount')}</p>
              <p className="font-mono mt-1">admin@food4thought.local / admin123</p>
            </div>
          )}
        </div>
      </div>

      {/* Stopka z cieniem */}
      <footer className="py-4 text-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
        <p className="text-sm text-light-textSecondary dark:text-gray-500">
          <span className="text-primary">●</span> Food4Thought coded by{' '}
          <a href="#" className="text-primary hover:text-primary-light transition-colors">
            Innovation LAB
          </a>{' '}
          <span className="text-primary">●</span> {new Date().getFullYear()} r.
        </p>
      </footer>
    </div>
  )
}

export default LoginPage