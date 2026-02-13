import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import axios from 'axios';

const NotificationBanner = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications');
      setNotifications(response.data);
      setIsVisible(response.data.length > 0);
    } catch (error) {
      console.error('Błąd ładowania powiadomień:', error);
    }
  };

  const handleView = async (notificationId) => {
    try {
      await axios.post(`/api/notifications/${notificationId}/view`);
    } catch (error) {
      console.error('Błąd rejestrowania wyświetlenia:', error);
    }
  };

  const handleDismiss = async (notificationId) => {
    setIsLoading(true);
    try {
      await axios.post(`/api/notifications/${notificationId}/dismiss`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notifications.length <= 1) {
        setIsVisible(false);
      } else {
        setCurrentNotificationIndex(prev => prev >= notifications.length - 1 ? 0 : prev + 1);
      }
    } catch (error) {
      console.error('Błąd odrzucania powiadomienia:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    setCurrentNotificationIndex(prev => prev >= notifications.length - 1 ? 0 : prev + 1);
  };

  const handlePrevious = () => {
    setCurrentNotificationIndex(prev => prev <= 0 ? notifications.length - 1 : prev - 1);
  };

  // Zarejestruj wyświetlenie przy zmianie bieżącego powiadomienia
  const currentNotification = notifications[currentNotificationIndex];
  useEffect(() => {
    if (currentNotification) {
      handleView(currentNotification.id);
    }
  }, [currentNotification]);

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Treść powiadomienia */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              {/* Ikona */}
              <div className="flex-shrink-0">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              
              {/* Tytuł i treść */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium truncate">
                  {currentNotification.title}
                </h3>
                <p className="text-sm opacity-90 line-clamp-2">
                  {currentNotification.message}
                </p>
              </div>
            </div>
          </div>

          {/* Kontrolki */}
          <div className="flex items-center space-x-2 ml-4">
            {/* Nawigacja (jeśli więcej niż jedno powiadomienie) */}
            {notifications.length > 1 && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={handlePrevious}
                  className="p-1 rounded hover:bg-blue-700 transition-colors"
                  title="Poprzednie powiadomienie"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                <span className="text-xs opacity-75">
                  {currentNotificationIndex + 1} / {notifications.length}
                </span>
                
                <button
                  onClick={handleNext}
                  className="p-1 rounded hover:bg-blue-700 transition-colors"
                  title="Następne powiadomienie"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}

            {/* Przycisk odrzucenia */}
            <button
              onClick={() => handleDismiss(currentNotification.id)}
              disabled={isLoading}
              className="p-1 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
              title="Nie pokazuj więcej"
            >
              {isLoading ? (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationBanner;
