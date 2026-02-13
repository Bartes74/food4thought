import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import Layout from '../components/Layout.jsx';
import axios from 'axios';

const NotificationManagement = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  
  const [notifications, setNotifications] = useState([]);
  const [episodes, setEpisodes] = useState({ new: [], inProgress: [], completed: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Formularz nowego powiadomienia
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    notification_type: 'text',
    metadata: {}
  });
  const [submitting, setSubmitting] = useState(false);

  // Szczegółowe statystyki
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [notificationsRes, episodesRes] = await Promise.all([
        axios.get('/api/notifications/admin'),
        axios.get('/api/episodes/my')
      ]);
      setNotifications(notificationsRes.data);
      setEpisodes(episodesRes.data);
    } catch (error) {
      console.error('Błąd ładowania danych:', error);
      setError('Nie udało się załadować danych');
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications/admin');
      setNotifications(response.data);
    } catch (error) {
      console.error('Błąd ładowania powiadomień:', error);
      setError('Nie udało się załadować powiadomień');
    }
  };

  // Helper function to get all episodes in a flat array
  const getAllEpisodes = () => {
    return [
      ...(episodes.new || []),
      ...(episodes.inProgress || []),
      ...(episodes.completed || [])
    ].sort((a, b) => new Date(b.date_added) - new Date(a.date_added));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      setError('Tytuł i treść są wymagane');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      await axios.post('/api/notifications/admin', formData);
      
      // Resetuj formularz
      setFormData({ 
        title: '', 
        message: '', 
        notification_type: 'text', 
        metadata: {} 
      });
      setShowForm(false);
      
      // Przeładuj listę
      await loadData();
    } catch (error) {
      console.error('Błąd tworzenia powiadomienia:', error);
      setError('Nie udało się utworzyć powiadomienia');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (notificationId, currentStatus) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      await axios.put(`/api/notifications/admin/${notificationId}`, {
        title: notification.title,
        message: notification.message,
        is_active: !currentStatus
      });
      
      await loadData();
    } catch (error) {
      console.error('Błąd aktualizacji powiadomienia:', error);
      setError('Nie udało się zaktualizować powiadomienia');
    }
  };

  const handleDelete = async (notificationId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć to powiadomienie?')) {
      return;
    }

    try {
      await axios.delete(`/api/notifications/admin/${notificationId}`);
      await loadData();
    } catch (error) {
      console.error('Błąd usuwania powiadomienia:', error);
      setError('Nie udało się usunąć powiadomienia');
    }
  };

  const loadStats = async (notificationId) => {
    try {
      const response = await axios.get(`/api/notifications/admin/${notificationId}/stats`);
      setStats(response.data);
      setSelectedNotification(notifications.find(n => n.id === notificationId));
      setShowStats(true);
    } catch (error) {
      console.error('Błąd ładowania statystyk:', error);
      setError('Nie udało się załadować statystyk');
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <p className="text-red-600">Brak uprawnień do tej strony</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-light-text dark:text-white mb-2">
              Zarządzanie powiadomieniami
            </h1>
            <p className="text-light-textSecondary dark:text-gray-400">
              Twórz i zarządzaj powiadomieniami dla użytkowników aplikacji.
            </p>
          </div>
          
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
          >
            {showForm ? 'Anuluj' : '+ Nowe powiadomienie'}
          </button>
        </div>

        {/* Błąd */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Formularz nowego powiadomienia */}
        {showForm && (
          <div className={`mb-8 ${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg shadow-lg p-6`}>
            <h2 className="text-xl font-semibold mb-4 text-light-text dark:text-white">
              Nowe powiadomienie
            </h2>
          
                      <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-light-text dark:text-gray-300 mb-2">
                  Tytuł
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                    isDarkMode 
                      ? 'bg-dark-bg border-dark-border text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Wprowadź tytuł powiadomienia"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-light-text dark:text-gray-300 mb-2">
                  Treść
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                    isDarkMode 
                      ? 'bg-dark-bg border-dark-border text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Wprowadź treść powiadomienia"
                  required
                />
              </div>

              {/* Typ powiadomienia */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-light-text dark:text-gray-300 mb-2">
                  Typ powiadomienia
                </label>
                <select
                  value={formData.notification_type}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      notification_type: e.target.value,
                      metadata: {} // Reset metadata when changing type
                    });
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                    isDarkMode 
                      ? 'bg-dark-bg border-dark-border text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="text">📝 Tekstowe</option>
                  <option value="episode">🎧 Ważny odcinek</option>
                  <option value="series">📺 Nowa seria</option>
                </select>
              </div>

              {/* Metadata fields based on notification type */}
              {formData.notification_type === 'episode' && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="text-sm font-medium text-light-text dark:text-white mb-3">
                    Wybierz odcinek
                  </h4>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-light-text dark:text-gray-300 mb-1">
                      Odcinek
                    </label>
                    <select
                      value={formData.metadata.episodeId || ''}
                      onChange={(e) => {
                        const episodeId = parseInt(e.target.value) || null;
                        const selectedEpisode = getAllEpisodes().find(ep => ep.id === episodeId);
                        setFormData({ 
                          ...formData, 
                          metadata: { 
                            ...formData.metadata, 
                            episodeId: episodeId,
                            autoPlay: true, // Always auto-play for episode notifications
                            episodeTitle: selectedEpisode?.title || ''
                          }
                        });
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                        isDarkMode 
                          ? 'bg-dark-bg border-dark-border text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Wybierz odcinek...</option>
                      {getAllEpisodes().length > 0 && (
                        <>
                          {episodes.new?.length > 0 && (
                            <optgroup label="🆕 Nowe odcinki">
                              {episodes.new.map(episode => (
                                <option key={episode.id} value={episode.id}>
                                  {episode.title} ({episode.series_name})
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {episodes.inProgress?.length > 0 && (
                            <optgroup label="▶️ W trakcie">
                              {episodes.inProgress.map(episode => (
                                <option key={episode.id} value={episode.id}>
                                  {episode.title} ({episode.series_name})
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {episodes.completed?.length > 0 && (
                            <optgroup label="✅ Ukończone">
                              {episodes.completed.map(episode => (
                                <option key={episode.id} value={episode.id}>
                                  {episode.title} ({episode.series_name})
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </>
                      )}
                    </select>
                    {getAllEpisodes().length === 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        Brak dostępnych odcinków
                      </p>
                    )}
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-800/30 p-3 rounded">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                        Automatyczne odtwarzanie włączone
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Po kliknięciu powiadomienia odcinek od razu zacznie się odtwarzać
                    </p>
                  </div>
                </div>
              )}

              {formData.notification_type === 'series' && (
                <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="text-sm font-medium text-light-text dark:text-white mb-3">
                    Ustawienia serii
                  </h4>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-light-text dark:text-gray-300 mb-1">
                      ID serii
                    </label>
                    <input
                      type="number"
                      value={formData.metadata.seriesId || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        metadata: { ...formData.metadata, seriesId: parseInt(e.target.value) || null }
                      })}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                        isDarkMode 
                          ? 'bg-dark-bg border-dark-border text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Wprowadź ID serii"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-light-text dark:text-gray-300 mb-1">
                      URL obrazka serii
                    </label>
                    <input
                      type="text"
                      value={formData.metadata.imageUrl || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        metadata: { ...formData.metadata, imageUrl: e.target.value }
                      })}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                        isDarkMode 
                          ? 'bg-dark-bg border-dark-border text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Wprowadź URL obrazka serii"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-light-text dark:text-gray-300 mb-1">
                      Krótki opis serii
                    </label>
                    <textarea
                      value={formData.metadata.description || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        metadata: { ...formData.metadata, description: e.target.value }
                      })}
                      rows={2}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                        isDarkMode 
                          ? 'bg-dark-bg border-dark-border text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Wprowadź krótki opis serii"
                    />
                  </div>
                </div>
              )}
            
                          <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {submitting ? 'Tworzenie...' : 'Utwórz powiadomienie'}
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
                >
                  Anuluj
                </button>
              </div>
          </form>
        </div>
      )}

        {/* Lista powiadomień */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-light-textSecondary dark:text-gray-400">Ładowanie...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-light-textSecondary dark:text-gray-400">Brak powiadomień.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg shadow-lg p-4 ${
                    !notification.is_active ? 'opacity-60' : ''
                  }`}
                >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-light-text dark:text-white">
                        {notification.title}
                      </h3>
                      
                      {/* Typ powiadomienia */}
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        notification.notification_type === 'episode' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : notification.notification_type === 'series'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {notification.notification_type === 'episode' && '🎧 Odcinek'}
                        {notification.notification_type === 'series' && '📺 Seria'}
                        {notification.notification_type === 'text' && '📝 Tekst'}
                      </span>
                      
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        notification.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {notification.is_active ? 'Aktywne' : 'Nieaktywne'}
                      </span>
                    </div>
                    
                    <p className="text-light-textSecondary dark:text-gray-400 mt-1">
                      {notification.message}
                    </p>
                    
                    {/* Metadata display */}
                    {notification.notification_type === 'episode' && notification.metadata && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-800 dark:text-blue-200">
                            🎧 Odcinek ID: {notification.metadata.episodeId || 'Nie określono'}
                          </span>
                          {notification.metadata.autoPlay && (
                            <span className="text-blue-600 dark:text-blue-400">
                              ▶️ Auto-odtwarzanie
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {notification.notification_type === 'series' && notification.metadata && (
                      <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-sm">
                        <div className="text-purple-800 dark:text-purple-200">
                          📺 Seria ID: {notification.metadata.seriesId || 'Nie określono'}
                        </div>
                        {notification.metadata.description && (
                          <div className="text-purple-600 dark:text-purple-400 mt-1">
                            {notification.metadata.description}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm text-light-textSecondary dark:text-gray-400">
                        • Utworzone przez: {notification.created_by_email}
                      </span>
                      <span className="text-sm text-light-textSecondary dark:text-gray-400">
                        • Data: {new Date(notification.created_at).toLocaleDateString('pl-PL')}
                      </span>
                    </div>
                    
                    {/* Statystyki */}
                    <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                        <p className="font-semibold text-blue-800 dark:text-blue-200">
                          {notification.total_users || 0}
                        </p>
                        <p className="text-blue-600 dark:text-blue-400">Użytkowników</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                        <p className="font-semibold text-green-800 dark:text-green-200">
                          {notification.total_views || 0}
                        </p>
                        <p className="text-green-600 dark:text-green-400">Wyświetleń</p>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg">
                        <p className="font-semibold text-orange-800 dark:text-orange-200">
                          {notification.dismissed_count || 0}
                        </p>
                        <p className="text-orange-600 dark:text-orange-400">Odrzuconych</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadStats(notification.id)}
                      className="px-3 py-1 bg-primary hover:bg-primary-dark text-white rounded text-sm transition-colors"
                    >
                      Statystyki
                    </button>
                    
                    <button
                      onClick={() => handleToggleActive(notification.id, notification.is_active)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        notification.is_active
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {notification.is_active ? 'Dezaktywuj' : 'Aktywuj'}
                    </button>
                    
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                    >
                      Usuń
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

        {/* Modal ze statystykami */}
        {showStats && stats && selectedNotification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-light-text dark:text-white">
                    Statystyki: {selectedNotification.title}
                  </h2>
                  <button
                    onClick={() => setShowStats(false)}
                    className="text-light-textSecondary hover:text-light-text dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

              {/* Podsumowanie */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                    {stats.summary.total_users}
                  </p>
                  <p className="text-blue-600 dark:text-blue-400">Użytkowników</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {stats.summary.total_views}
                  </p>
                  <p className="text-green-600 dark:text-green-400">Wyświetleń</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                    {stats.summary.dismissed_count}
                  </p>
                  <p className="text-orange-600 dark:text-orange-400">Odrzuconych</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                    {stats.summary.active_users}
                  </p>
                  <p className="text-purple-600 dark:text-purple-400">Aktywnych</p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">
                    {stats.summary.average_views}
                  </p>
                  <p className="text-indigo-600 dark:text-indigo-400">Średnio wyświetleń</p>
                </div>
              </div>

              {/* Szczegółowa lista */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3 text-light-text dark:text-white">Email</th>
                      <th className="text-center py-2 px-3 text-light-text dark:text-white">Wyświetlenia</th>
                      <th className="text-center py-2 px-3 text-light-text dark:text-white">Status</th>
                      <th className="text-center py-2 px-3 text-light-text dark:text-white">Pierwsze wyświetlenie</th>
                      <th className="text-center py-2 px-3 text-light-text dark:text-white">Ostatnie wyświetlenie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.details.map((stat) => (
                      <tr key={stat.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-2 px-3 text-light-text dark:text-white">{stat.user_email}</td>
                        <td className="text-center py-2 px-3 text-light-text dark:text-white">{stat.views_count}</td>
                        <td className="text-center py-2 px-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            stat.dismissed
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {stat.dismissed ? 'Odrzucone' : 'Aktywne'}
                          </span>
                        </td>
                        <td className="text-center py-2 px-3 text-light-text dark:text-white">
                          {stat.first_viewed_at 
                            ? new Date(stat.first_viewed_at).toLocaleString('pl-PL')
                            : '-'
                          }
                        </td>
                        <td className="text-center py-2 px-3 text-light-text dark:text-white">
                          {stat.last_viewed_at 
                            ? new Date(stat.last_viewed_at).toLocaleString('pl-PL')
                            : '-'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
};

export default NotificationManagement;
