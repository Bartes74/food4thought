import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from './LanguageSelector';
import ThemeToggle from './ThemeToggle';
import NotificationBanner from './NotificationBanner.jsx';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Sprawdź czy jesteśmy na stronie głównej
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg transition-colors duration-300 flex flex-col">
      {/* Banner powiadomień */}
      <NotificationBanner />
      
      {/* Header - zawsze w kolorze #006575 */}
      <header className="bg-primary border-b border-primary-dark p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* Przycisk wstecz - tylko jeśli nie jesteśmy na stronie głównej */}
            {!isHomePage && (
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                title="Wstecz"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            
            <Link to="/">
              <h1 className="text-xl font-semibold text-white hover:text-gray-200 transition-colors">
                Food 4 Thought
              </h1>
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageSelector />
            <span className="text-sm text-gray-200">{user?.email}</span>
            
            {/* Ikona ulubionych */}
            <Link
              to="/favorites"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title={t('common.favorites') || 'Ulubione'}
              data-testid="favorites-link"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>
            
            {/* Ikona osiągnięć */}
            <Link
              to="/achievements"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Osiągnięcia"
            >
              <span className="text-white text-lg">🏆</span>
            </Link>
            
            {/* Ikona ustawień - link do panelu administracyjnego */}
            <Link
              to="/admin"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title={t('common.settings') || 'Ustawienia'}
              data-testid="admin-link"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            
            {/* Ikona wylogowania */}
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title={t('common.logout') || 'Wyloguj'}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Główna treść */}
      <main className="flex-1">
        {children}
      </main>

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
  );
};

export default Layout;