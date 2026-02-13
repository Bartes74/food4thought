import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const NotificationModal = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
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
      
      // Reload notifications from server to ensure dismissed ones are filtered out
      await loadNotifications();
      
      // If no notifications left, hide modal
      const updatedNotifications = await axios.get('/api/notifications');
      if (updatedNotifications.data.length === 0) {
        setIsVisible(false);
        setCurrentNotificationIndex(0);
      } else {
        // Adjust index if needed
        setCurrentNotificationIndex(prev => {
          const maxIndex = updatedNotifications.data.length - 1;
          return prev > maxIndex ? maxIndex : prev;
        });
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

  // Renderowanie różnych typów powiadomień
  const renderNotificationContent = (notification) => {
    const type = notification.notification_type || 'text';
    
    switch (type) {
      case 'text':
        return renderTextNotification(notification);
      
      case 'episode':
        return renderEpisodeNotification(notification);
      
      case 'series':
        return renderSeriesNotification(notification);
      
      default:
        return renderTextNotification(notification);
    }
  };

  const renderTextNotification = (notification) => (
    <div className="text-center">
      <div className="mb-4">
        <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-light-text dark:text-white mb-2">
          {notification.title}
        </h3>
        <p className="text-light-textSecondary dark:text-gray-300 leading-relaxed">
          {notification.message}
        </p>
      </div>
    </div>
  );

  const handleEpisodeAction = async (notification) => {
    try {
      const metadata = notification.metadata || {};
      const episodeId = metadata.episodeId;
      
      if (!episodeId) {
        console.error('No episode ID provided in notification metadata');
        return;
      }

      // Dismiss the notification first
      await handleDismiss(notification.id);
      
      // Navigate to home page with episode autoplay
      navigate('/', { 
        state: { 
          autoStartEpisode: episodeId,
          autoPlay: metadata.autoPlay || false
        } 
      });
    } catch (error) {
      console.error('Error handling episode action:', error);
    }
  };

  const renderEpisodeNotification = (notification) => {
    const metadata = notification.metadata || {};
    
    return (
      <div className="text-center">
        <div className="mb-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 5v10l7-5-7-5z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-light-text dark:text-white mb-2">
            {notification.title}
          </h3>
          <p className="text-light-textSecondary dark:text-gray-300 leading-relaxed mb-4">
            {notification.message}
          </p>
          
          {/* Episode title with service header color background */}
          {metadata.episodeTitle && (
            <div className="mb-4">
              <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-4 border border-primary/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-primary">
                    Ważny odcinek
                  </span>
                </div>
                <h4 className="text-lg font-semibold text-light-text dark:text-white mb-1">
                  {metadata.episodeTitle}
                </h4>
                <p className="text-xs text-light-textSecondary dark:text-gray-400">
                  Automatyczne odtwarzanie włączone
                </p>
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => handleEpisodeAction(notification)}
              className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-md"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 5v10l7-5-7-5z" />
              </svg>
              Odtwórz
            </button>
            
            <button
              onClick={() => handleDismiss(notification.id)}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors shadow-md"
            >
              Anuluj
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleSeriesAction = async (notification, action) => {
    try {
      const metadata = notification.metadata || {};
      const seriesId = metadata.seriesId;
      
      if (!seriesId) {
        console.error('No series ID provided in notification metadata');
        return;
      }

      if (action === 'favorite') {
        // Add series to favorites
        await axios.post(`/api/series/${seriesId}/favorite`, {}, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
      }
      
      // Dismiss the notification after any action
      await handleDismiss(notification.id);
      
      if (action === 'favorite') {
        // Navigate to series page or home with series filter
        navigate('/', { 
          state: { 
            selectedSeries: seriesId
          } 
        });
      }
    } catch (error) {
      console.error('Error handling series action:', error);
    }
  };

  const renderSeriesNotification = (notification) => {
    const metadata = notification.metadata || {};
    
    return (
      <div className="text-center">
        <div className="mb-4">
          <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 14.846 4.632 16 6.414 16H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 6H6.28l-.31-1.243A1 1 0 005 4H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-light-text dark:text-white mb-2">
            {notification.title}
          </h3>
          <p className="text-light-textSecondary dark:text-gray-300 leading-relaxed mb-4">
            {notification.message}
          </p>
          
          {/* Series preview */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-4">
            {metadata.imageUrl && (
              <div className="mb-3">
                <img 
                  src={metadata.imageUrl} 
                  alt="Serie cover"
                  className="w-24 h-24 mx-auto rounded-lg object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="text-purple-800 dark:text-purple-200">
              {metadata.description && (
                <p className="text-sm mb-2">
                  {metadata.description}
                </p>
              )}
              {metadata.seriesId && (
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  Seria ID: {metadata.seriesId}
                </p>
              )}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => handleSeriesAction(notification, 'favorite')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              Dodaj do ulubionych
            </button>
            
            <button
              onClick={() => handleSeriesAction(notification, 'reject')}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Nie interesuje mnie
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${
        isDarkMode ? 'bg-dark-surface' : 'bg-white'
      } rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100`}>
        
        {/* Header z nawigacją */}
        {notifications.length > 1 && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={handlePrevious}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Poprzednie powiadomienie"
            >
              <svg className="w-5 h-5 text-light-text dark:text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            <span className="text-sm text-light-textSecondary dark:text-gray-400">
              {currentNotificationIndex + 1} z {notifications.length}
            </span>
            
            <button
              onClick={handleNext}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Następne powiadomienie"
            >
              <svg className="w-5 h-5 text-light-text dark:text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Treść powiadomienia */}
        <div className="p-6">
          {renderNotificationContent(currentNotification)}
        </div>

        {/* Footer z akcjami */}
        {currentNotification?.notification_type === 'text' && (
          <div className="flex items-center justify-center gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => handleDismiss(currentNotification.id)}
              disabled={isLoading}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-light-text dark:text-white'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Odrzucanie...
                </div>
              ) : (
                'Nie pokazuj więcej'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationModal;