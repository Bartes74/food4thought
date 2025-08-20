import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import Layout from '../components/Layout';
import axios from 'axios';

const AdminStatsPage = () => {
  const { user } = useAuth();
  const { t, formatDate } = useLanguage();
  const { isDarkMode } = useTheme();
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('users'); // users, episodes, series, technical
  const [timeRange, setTimeRange] = useState('all'); // today, week, month, all

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    if (isAdmin) {
      fetchAdminStats();
    }
  }, [timeRange]);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/admin-stats/stats?range=${timeRange}`);
      setAdminStats(response.data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      if (error.code === 'ERR_NETWORK') {
        setError('Nie można połączyć się z serwerem. Sprawdź czy backend działa na porcie 3001.');
      } else if (error.response?.status === 401) {
        setError('Brak uprawnień do wyświetlenia statystyk.');
      } else if (error.response?.status === 403) {
        setError('Dostęp zabroniony. Wymagane uprawnienia administratora.');
      } else {
        setError('Błąd podczas ładowania statystyk. Spróbuj ponownie.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const formatDateLocal = (dateString) => formatDate(dateString);

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Brak uprawnień</h1>
            <p className="text-light-textSecondary dark:text-gray-400">
              Nie masz uprawnień do przeglądania statystyk administratora.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

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

  if (error) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Błąd ładowania statystyk</h1>
            <p className="text-light-textSecondary dark:text-gray-400 mb-6">
              {error}
            </p>
            <button
              onClick={fetchAdminStats}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              Spróbuj ponownie
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-light-text dark:text-white">
            {t('adminStats.title')}
          </h1>
          
          {/* Filtr czasu */}
          <div className="flex gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-dark-surface border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="today">{t('adminStats.timeFilter.today')}</option>
              <option value="week">{t('adminStats.timeFilter.week')}</option>
              <option value="month">{t('adminStats.timeFilter.month')}</option>
              <option value="all">{t('adminStats.timeFilter.all')}</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t('adminStats.tabs.users')}
          </button>
          <button
            onClick={() => setActiveTab('episodes')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'episodes'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t('adminStats.tabs.episodes')}
          </button>
          <button
            onClick={() => setActiveTab('series')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'series'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t('adminStats.tabs.series')}
          </button>
          <button
            onClick={() => setActiveTab('technical')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'technical'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t('adminStats.tabs.technical')}
          </button>
        </div>

        {adminStats && (
          <>
            {/* Statystyki użytkowników */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                {/* Ogólne statystyki użytkowników */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                    <div className="text-4xl mb-2">👥</div>
                    <h3 className="text-lg font-semibold mb-1">{t('adminStats.users.allUsers')}</h3>
                    <p className="text-2xl font-bold text-primary">{adminStats.users?.total || 0}</p>
                  </div>
                  
                  <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                    <div className="text-4xl mb-2">🟢</div>
                    <h3 className="text-lg font-semibold mb-1">{t('adminStats.users.activeUsers')}</h3>
                    <p className="text-2xl font-bold text-green-500">{adminStats.users?.active || 0}</p>
                    <p className="text-sm text-gray-500">{timeRange === 'today' ? t('adminStats.users.today') : t('adminStats.users.inPeriod').replace('{period}', timeRange === 'week' ? t('adminStats.users.week') : t('adminStats.users.month'))}</p>
                  </div>
                  
                  <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                    <div className="text-4xl mb-2">📈</div>
                    <h3 className="text-lg font-semibold mb-1">{t('adminStats.users.newUsers')}</h3>
                    <p className="text-2xl font-bold text-blue-500">{adminStats.users?.new || 0}</p>
                    <p className="text-sm text-gray-500">{timeRange === 'today' ? t('adminStats.users.today') : t('adminStats.users.inPeriod').replace('{period}', timeRange === 'week' ? t('adminStats.users.week') : t('adminStats.users.month'))}</p>
                  </div>
                  
                  <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                    <div className="text-4xl mb-2">🔄</div>
                    <h3 className="text-lg font-semibold mb-1">{t('adminStats.users.retention')}</h3>
                    <p className="text-2xl font-bold text-purple-500">{adminStats.users?.retention || 0}%</p>
                    <p className="text-sm text-gray-500">{t('adminStats.users.sevenDay')}</p>
                  </div>
                </div>

                {/* Najbardziej aktywni użytkownicy */}
                <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                  <h3 className="text-xl font-semibold mb-4">{t('adminStats.users.mostActive')}</h3>
                  <div className="space-y-3">
                    {adminStats.users?.topActive?.map((user, index) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-primary">#{index + 1}</span>
                          <div>
                            <p className="font-medium">{user.email}</p>
                            <p className="text-sm text-gray-500">{user.completedCount} {t('adminStats.users.completedEpisodes')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatTime(user.totalListeningTime)}</p>
                          <p className="text-sm text-gray-500">{t('adminStats.users.listeningTime')}</p>
                        </div>
                      </div>
                    )) || <p className="text-gray-500">Brak danych</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Statystyki odcinków */}
            {activeTab === 'episodes' && (
              <div className="space-y-6">
                {/* Ogólne statystyki odcinków */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                    <div className="text-4xl mb-2">🎧</div>
                    <h3 className="text-lg font-semibold mb-1">{t('adminStats.episodes.allEpisodes')}</h3>
                    <p className="text-2xl font-bold text-primary">{adminStats.episodes?.total || 0}</p>
                  </div>
                  
                  <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                    <div className="text-4xl mb-2">⭐</div>
                    <h3 className="text-lg font-semibold mb-1">{t('adminStats.episodes.averageRating')}</h3>
                    <p className="text-2xl font-bold text-yellow-500">
                      {adminStats.episodes?.averageRating ? `${adminStats.episodes.averageRating.toFixed(1)}/5` : 'N/A'}
                    </p>
                  </div>
                  
                  <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                    <div className="text-4xl mb-2">✅</div>
                    <h3 className="text-lg font-semibold mb-1">{t('adminStats.episodes.completionRate')}</h3>
                    <p className="text-2xl font-bold text-green-500">{adminStats.episodes?.completionRate || 0}%</p>
                  </div>
                  
                  <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                    <div className="text-4xl mb-2">🕒</div>
                    <h3 className="text-lg font-semibold mb-1">{t('adminStats.episodes.averageCompletionTime')}</h3>
                    <p className="text-2xl font-bold text-blue-500">
                      {adminStats.episodes?.averageCompletionTime ? formatTime(adminStats.episodes.averageCompletionTime) : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Najpopularniejsze odcinki */}
                <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                  <h3 className="text-xl font-semibold mb-4">{t('adminStats.episodes.mostPopular')}</h3>
                  <div className="space-y-3">
                    {adminStats.episodes?.topPopular?.map((episode, index) => (
                      <div key={episode.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-primary">#{index + 1}</span>
                          <div>
                            <p className="font-medium">{episode.title}</p>
                            <p className="text-sm text-gray-500">{episode.seriesName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{episode.listensCount} {t('adminStats.episodes.listens')}</p>
                          <p className="text-sm text-gray-500">
                            {episode.averageRating ? `${episode.averageRating.toFixed(1)}/5 ⭐` : t('adminStats.episodes.noRatings')}
                          </p>
                        </div>
                      </div>
                    )) || <p className="text-gray-500">Brak danych</p>}
                  </div>
                </div>

                {/* Odcinki z najwyższym współczynnikiem porzucania */}
                <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                  <h3 className="text-xl font-semibold mb-4">{t('adminStats.episodes.mostAbandoned')}</h3>
                  <div className="space-y-3">
                    {adminStats.episodes?.mostAbandoned?.map((episode, index) => (
                      <div key={episode.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-red-500">#{index + 1}</span>
                          <div>
                            <p className="font-medium">{episode.title}</p>
                            <p className="text-sm text-gray-500">{episode.seriesName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-500">{episode.abandonmentRate}%</p>
                          <p className="text-sm text-gray-500">{t('adminStats.episodes.abandonment')}</p>
                        </div>
                      </div>
                    )) || <p className="text-gray-500">Brak danych</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Statystyki serii */}
            {activeTab === 'series' && (
              <div className="space-y-6">
                {/* Ogólne statystyki serii */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                    <div className="text-4xl mb-2">📚</div>
                    <h3 className="text-lg font-semibold mb-1">{t('adminStats.series.allSeries')}</h3>
                    <p className="text-2xl font-bold text-primary">{adminStats.series?.total || 0}</p>
                  </div>
                  
                  <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                    <div className="text-4xl mb-2">🟢</div>
                    <h3 className="text-lg font-semibold mb-1">{t('adminStats.series.activeSeries')}</h3>
                    <p className="text-2xl font-bold text-green-500">{adminStats.series?.active || 0}</p>
                  </div>
                  
                  <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                    <div className="text-4xl mb-2">🏆</div>
                    <h3 className="text-lg font-semibold mb-1">{t('adminStats.series.topRated')}</h3>
                    <p className="text-lg font-bold text-yellow-500">{adminStats.series?.topRated?.name || 'N/A'}</p>
                    <p className="text-sm text-gray-500">
                      {adminStats.series?.topRated?.rating ? `${adminStats.series.topRated.rating.toFixed(1)}/5` : ''}
                    </p>
                  </div>
                  
                  <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                    <div className="text-4xl mb-2">📈</div>
                    <h3 className="text-lg font-semibold mb-1">{t('adminStats.series.averageCompletion')}</h3>
                    <p className="text-2xl font-bold text-blue-500">{adminStats.series?.averageCompletion || 0}%</p>
                  </div>
                </div>

                {/* Najpopularniejsze serie */}
                <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                  <h3 className="text-xl font-semibold mb-4">{t('adminStats.series.seriesStatistics')}</h3>
                  <div className="space-y-4">
                    {adminStats.series?.details?.map((series) => (
                      <div key={series.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-lg">{series.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{series.episodeCount} {t('adminStats.series.episodes')}</span>
                            <span>{series.activeUsers} {t('adminStats.series.activeUsers')}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-500">{t('adminStats.series.listeningTime')}</p>
                            <p className="text-lg font-bold">{formatTime(series.totalListeningTime || 0)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">{t('adminStats.series.completionRate')}</p>
                            <p className="text-lg font-bold">{series.completionRate || 0}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">{t('adminStats.series.averageRating')}</p>
                            <p className="text-lg font-bold">
                              {series.averageRating ? `${series.averageRating.toFixed(1)}/5` : 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(series.completionRate || 0)}`}
                            style={{ width: `${series.completionRate || 0}%` }}
                          />
                        </div>
                      </div>
                    )) || <p className="text-gray-500">Brak danych</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Statystyki techniczne */}
            {activeTab === 'technical' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Języki interfejsu */}
                  <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                    <h3 className="text-xl font-semibold mb-4">{t('adminStats.technical.interfaceLanguages')}</h3>
                    <div className="space-y-3">
                      {adminStats.technical?.languages?.map((lang) => (
                        <div key={lang.language} className="flex items-center justify-between">
                          <span className="font-medium">{lang.language}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="h-2 bg-primary rounded-full transition-all duration-500"
                                style={{ width: `${lang.percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold">{lang.percentage}%</span>
                          </div>
                        </div>
                      )) || <p className="text-gray-500">Brak danych</p>}
                    </div>
                  </div>

                  {/* Prędkości odtwarzania */}
                  <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                    <h3 className="text-xl font-semibold mb-4">{t('adminStats.technical.playbackSpeeds')}</h3>
                    <div className="space-y-3">
                      {adminStats.technical?.playbackSpeeds?.map((speed) => (
                        <div key={speed.speed} className="flex items-center justify-between">
                          <span className="font-medium">{speed.speed}x</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="h-2 bg-primary rounded-full transition-all duration-500"
                                style={{ width: `${speed.percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold">{speed.percentage}%</span>
                          </div>
                        </div>
                      )) || <p className="text-gray-500">Brak danych</p>}
                    </div>
                  </div>
                </div>

                {/* Aktywność w czasie */}
                <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                  <h3 className="text-xl font-semibold mb-4">{t('adminStats.technical.hourlyActivity')}</h3>
                  <div className="grid grid-cols-12 gap-1">
                    {adminStats.technical?.hourlyActivity?.map((hour) => (
                      <div key={hour.hour} className="text-center">
                        <div 
                          className="bg-primary rounded mb-1 transition-all duration-300"
                          style={{ 
                            height: `${Math.max(4, (hour.activity / 100) * 60)}px`,
                            opacity: hour.activity / 100 
                          }}
                          title={`${hour.hour}:00 - ${hour.activity}% aktywności`}
                        />
                        <span className="text-xs text-gray-500">{hour.hour}</span>
                      </div>
                    )) || Array.from({length: 24}, (_, i) => (
                      <div key={i} className="text-center">
                        <div className="bg-gray-300 rounded mb-1 h-1" />
                        <span className="text-xs text-gray-500">{i}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default AdminStatsPage;