import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import Layout from '../components/Layout';

const AdminPanel = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  // Opcje dla zwykłego użytkownika
  const userOptions = [
    {
      title: 'Mój profil',
      description: 'Zarządzaj swoimi danymi i preferencjami',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      link: '/profile'
    },
    {
      title: 'Ulubione',
      description: 'Zobacz swoje ulubione odcinki',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      link: '/favorites'
    },
    {
      title: 'Statystyki',
      description: 'Przeglądaj statystyki i historię odsłuchanych odcinków',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      link: '/stats'
    }
  ];

  // Dodatkowe opcje dla administratora
  const adminOptions = [
    {
      title: 'Zarządzanie seriami',
      description: 'Dodawaj, edytuj i usuwaj serie',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      link: '/series'
    },
    {
      title: 'Zarządzanie odcinkami',
      description: 'Dodawaj nowe odcinki i zarządzaj istniejącymi',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      ),
      link: '/episodes'
    },
    {
      title: 'Użytkownicy',
      description: 'Zarządzaj kontami użytkowników',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      link: '/users'
    },
    {
      title: 'Statystyki',
      description: 'Zobacz statystyki aplikacji',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      link: '/admin-stats'
    }
  ];

  // Opcje tylko dla super administratora
  const superAdminOptions = [
    {
      title: 'Uprawnienia',
      description: 'Zarządzaj rolami i uprawnieniami użytkowników',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      link: '/permissions'
    }
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-light-text dark:text-white mb-8">
          {isAdmin ? 'Panel administracyjny' : 'Moje konto'}
        </h1>

        {/* Informacje o użytkowniku */}
        <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 mb-8 shadow-lg`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-light-text dark:text-white">{user?.email}</h2>
              <p className="text-sm text-light-textSecondary dark:text-gray-400">
                Rola: {user?.role === 'super_admin' ? 'Super Administrator' : 
                       user?.role === 'admin' ? 'Administrator' : 'Użytkownik'}
              </p>
            </div>
          </div>
        </div>

        {/* Opcje użytkownika */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-light-text dark:text-white mb-4">
            Twoje opcje
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userOptions.map((option) => (
              <Link
                key={option.link}
                to={option.link}
                className={`${isDarkMode ? 'bg-dark-surface hover:bg-dark-border' : 'bg-white hover:bg-gray-50'} 
                  rounded-lg p-6 shadow-lg transition-all duration-300 hover:shadow-xl`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-primary">{option.icon}</div>
                  <div>
                    <h3 className="font-semibold text-light-text dark:text-white">{option.title}</h3>
                    <p className="text-sm text-light-textSecondary dark:text-gray-400 mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Opcje administratora */}
        {isAdmin && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-light-text dark:text-white mb-4">
              Narzędzia administratora
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminOptions.map((option) => (
                <Link
                  key={option.link}
                  to={option.link}
                  className={`${isDarkMode ? 'bg-dark-surface hover:bg-dark-border' : 'bg-white hover:bg-gray-50'} 
                    rounded-lg p-6 shadow-lg transition-all duration-300 hover:shadow-xl`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-primary">{option.icon}</div>
                    <div>
                      <h3 className="font-semibold text-light-text dark:text-white">{option.title}</h3>
                      <p className="text-sm text-light-textSecondary dark:text-gray-400 mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        
      </div>
    </Layout>
  );
};

export default AdminPanel;