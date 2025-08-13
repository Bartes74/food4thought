import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import Layout from '../components/Layout';
import axios from 'axios';

const StatsPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  
  const [stats, setStats] = useState(null);
  const [seriesStats, setSeriesStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [statsResponse, seriesResponse] = await Promise.all([
        axios.get(`/api/users/${user.id}/stats`),
        axios.get('/api/users/series-stats')
      ]);
      
      console.log('Stats response:', statsResponse.data);
      console.log('Completed episodes:', statsResponse.data.completedEpisodes);
      
      setStats(statsResponse.data);
      setSeriesStats(seriesResponse.data);
    } catch (error) {
      console.error('Błąd pobierania statystyk:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return 'Dni: 0, 00:00:00';
    
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `Dni: ${days}, ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Brak';
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-light-textSecondary dark:text-gray-400">Ładowanie statystyk...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-light-text dark:text-white mb-8">
          Statystyki
        </h1>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-gray-700 text-primary dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Przegląd
          </button>
          <button
            onClick={() => setActiveTab('series')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'series'
                ? 'bg-white dark:bg-gray-700 text-primary dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Według serii
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Główne statystyki */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700`}>
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Całkowity czas</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatTime(stats?.totalListeningTime || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700`}>
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Ukończone</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats?.completedCount || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700`}>
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">W trakcie</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats?.inProgressCount || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700`}>
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-red-600 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Ulubione</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats?.favoritesCount || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Szczegółowe statystyki */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700`}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Szczegółowe statystyki
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Postęp słuchania
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">Ukończone odcinki</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {stats?.completedCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">Odcinki w trakcie</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {stats?.inProgressCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">Całkowity czas słuchania</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatTime(stats?.totalListeningTime || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Aktywność
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">Ulubione odcinki</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {stats?.favoritesCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">Średni czas na odcinek</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {stats?.completedCount > 0 
                          ? formatTime(Math.round(stats.totalListeningTime / stats.completedCount))
                          : '0 min'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista ukończonych odcinków */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700`}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Ukończone odcinki
              </h2>
              {stats?.completedEpisodes && stats.completedEpisodes.length > 0 ? (
                <div className="space-y-4">
                  {stats.completedEpisodes.map((episode) => (
                    <div key={episode.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: episode.series_color || '#3B82F6' }}></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{episode.title}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            {episode.series_name} • {formatDate(episode.start_time)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {formatTime(episode.final_position || 0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-300">
                    Brak ukończonych odcinków
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'series' && (
          <div className="space-y-6">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700`}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Statystyki według serii
              </h2>
              
              {seriesStats.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-300">
                    Brak danych o seriach
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {seriesStats.map((series) => (
                    <div key={series.id} className="border-b border-gray-200 dark:border-gray-600 pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full mr-3"
                            style={{ backgroundColor: series.color || '#3B82F6' }}
                          ></div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {series.name}
                          </h3>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {series.completedCount} / {series.totalCount}
                          </span>
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            backgroundColor: series.color || '#3B82F6',
                            width: `${series.totalCount > 0 ? (series.completedCount / series.totalCount) * 100 : 0}%`
                          }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-2 text-sm">
                        <span className="text-gray-600 dark:text-gray-300">
                          Postęp: {series.totalCount > 0 ? Math.round((series.completedCount / series.totalCount) * 100) : 0}%
                        </span>
                        <span className="text-gray-600 dark:text-gray-300">
                          {series.completedCount} ukończonych
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StatsPage;

