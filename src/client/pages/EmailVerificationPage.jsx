import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';
import ThemeToggle from '../components/ThemeToggle';

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Brak tokenu weryfikacyjnego');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`/api/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(response.data.message);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'Błąd weryfikacji email');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleResendVerification = async () => {
    const email = searchParams.get('email');
    if (!email) {
      setMessage('Brak adresu email do ponownego wysłania');
      return;
    }

    try {
      await axios.post('/api/auth/resend-verification', { email });
      setMessage('Email weryfikacyjny został ponownie wysłany. Sprawdź swoją skrzynkę.');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Błąd podczas wysyłania emaila');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex flex-col transition-colors duration-300">
        <header className="bg-primary border-b border-primary-dark p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-semibold text-white">Food 4 Thought</h1>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <LanguageSelector />
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-light-text dark:text-white">Weryfikowanie adresu email...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex flex-col transition-colors duration-300">
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
          <div className="bg-white dark:bg-dark-surface rounded-2xl p-8 shadow-xl transition-colors duration-300">
            <div className="text-center">
              {status === 'success' ? (
                <>
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl text-green-600">✓</span>
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                    Weryfikacja udana!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {message}
                  </p>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition-colors duration-200"
                  >
                    Przejdź do logowania
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl text-red-600">✗</span>
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                    Błąd weryfikacji
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {message}
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={handleResendVerification}
                      className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition-colors duration-200"
                    >
                      Wyślij ponownie email weryfikacyjny
                    </button>
                    <button
                      onClick={() => navigate('/login')}
                      className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors duration-200"
                    >
                      Przejdź do logowania
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
