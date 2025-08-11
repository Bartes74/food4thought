import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import Layout from '../components/Layout.jsx';
import axios from 'axios';

const FavoritesPage = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [favorites, setFavorites] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedEpisodes, setExpandedEpisodes] = useState({});

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/episodes/favorites', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setFavorites(response.data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleEpisode = (episodeId) => {
    setExpandedEpisodes(prev => ({
      ...prev,
      [episodeId]: !prev[episodeId]
    }));
  };

  const playEpisode = (episodeId) => {
    // Implementacja odtwarzania odcinka
    console.log('Playing episode:', episodeId);
  };

  const removeFavorite = async (episodeId) => {
    try {
      await axios.delete(`/api/episodes/${episodeId}/favorite`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setFavorites(prev => prev.filter(episode => episode.id !== episodeId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'not_started': { text: 'Nie rozpoczęty', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
      'in_progress': { text: 'W trakcie', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      'completed': { text: 'Ukończony', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      'paused': { text: 'Wstrzymany', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' }
    };

    const config = statusConfig[status] || statusConfig['not_started'];
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:00`;
    }
    return `${minutes}:00`;
  };

  // Filtruj ulubione na podstawie wyszukiwania
  const filteredFavorites = favorites ? favorites.filter(episode =>
    episode.title.toLowerCase().includes(search.toLowerCase()) ||
    episode.series_name.toLowerCase().includes(search.toLowerCase()) ||
    (episode.additional_info && episode.additional_info.toLowerCase().includes(search.toLowerCase()))
  ) : [];

  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-light-textSecondary dark:text-gray-400">Ładowanie ulubionych...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-12">
            <p className="text-light-textSecondary dark:text-gray-400">Musisz się zalogować, aby zobaczyć ulubione odcinki.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-light-text dark:text-white mb-8">
          Ulubione odcinki
        </h1>

        {/* Wyszukiwarka */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj w ulubionych..."
              className={`w-full px-4 py-3 pl-12 rounded-lg border ${
                isDarkMode 
                  ? 'bg-dark-surface border-dark-border text-white placeholder-gray-400' 
                  : 'bg-white border-light-border text-light-text placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-primary transition-all`}
            />
            <svg 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Lista ulubionych pogrupowana po seriach */}
        {filteredFavorites.length === 0 ? (
          <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-8 text-center`}>
            <p className="text-light-textSecondary dark:text-gray-400">
              {search ? 'Nie znaleziono ulubionych odcinków pasujących do wyszukiwania.' : 'Nie masz jeszcze żadnych ulubionych odcinków.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredFavorites && filteredFavorites.length > 0 ? (
              // Grupuj odcinki według serii
              Object.values(filteredFavorites.reduce((acc, episode) => {
                const seriesId = episode.series_id;
                if (!acc[seriesId]) {
                  acc[seriesId] = {
                    series_id: seriesId,
                    series_name: episode.series_name,
                    series_color: episode.series_color,
                    episodes: []
                  };
                }
                acc[seriesId].episodes.push(episode);
                return acc;
              }, {})).map((series) => (
                <div key={series.series_id}>
                  <h2 className="text-xl font-semibold text-light-text dark:text-white mb-4">
                    {series.series_name}
                  </h2>
                  <div className="space-y-3">
                    {series.episodes.map((episode) => (
                      <div
                        key={episode.id}
                        className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg shadow-lg transition-all duration-300`}
                      >
                        {/* Główna część odcinka */}
                        <div
                          className="p-4 cursor-pointer"
                          onClick={() => toggleEpisode(episode.id)}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-light-text dark:text-white">
                                  {episode.title}
                                </h3>
                                <span className="text-sm text-light-textSecondary dark:text-gray-400">
                                  • {new Date(episode.date_added).toLocaleDateString('pl-PL')}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {getStatusBadge(episode.status)}
                              <svg 
                                className={`w-5 h-5 transition-transform ${expandedEpisodes[episode.id] ? 'rotate-180' : ''}`} 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                              >
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Rozwinięta sekcja */}
                        {expandedEpisodes[episode.id] && (
                          <div className={`px-4 pb-4 border-t ${isDarkMode ? 'border-dark-border' : 'border-light-border'}`}>
                            {/* Informacje dodatkowe */}
                            {episode.additional_info && (
                              <div className="mt-4">
                                <h4 className="font-semibold text-light-text dark:text-white mb-2">
                                  Informacje dodatkowe
                                </h4>
                                <p className="text-sm text-light-textSecondary dark:text-gray-400 whitespace-pre-wrap">
                                  {episode.additional_info}
                                </p>
                              </div>
                            )}

                            {/* Tematy */}
                            {episode.topics && episode.topics.length > 0 && (
                              <div className="mt-4">
                                <h4 className="font-semibold text-light-text dark:text-white mb-2">
                                  Tematy w odcinku
                                </h4>
                                <div className="space-y-3">
                                  {episode.topics.map((topic, index) => (
                                    <div key={index} className={`p-3 rounded-lg ${isDarkMode ? 'bg-dark-bg' : 'bg-gray-50'}`}>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs text-primary font-medium">
                                          [{Math.floor(topic.timestamp / 60)}:{(topic.timestamp % 60).toString().padStart(2, '0')}]
                                        </span>
                                        <h5 className="font-medium text-light-text dark:text-white">
                                          {topic.title}
                                        </h5>
                                      </div>
                                      {topic.links.length > 0 && (
                                        <div className="ml-12 space-y-1">
                                          {topic.links.map((link, linkIndex) => (
                                            <a
                                              key={linkIndex}
                                              href={link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="block text-xs text-primary hover:text-primary-dark transition-colors truncate"
                                            >
                                              {link}
                                            </a>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Przyciski akcji */}
                            <div className="flex gap-3 mt-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playEpisode(episode.id);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                                Odtwórz
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFavorite(episode.id);
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                  isDarkMode 
                                    ? 'bg-dark-bg hover:bg-dark-border text-white' 
                                    : 'bg-gray-100 hover:bg-gray-200 text-light-text'
                                }`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                Usuń z ulubionych
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="text-6xl mb-4">💔</div>
                <h3 className="text-xl font-semibold mb-2">Brak ulubionych odcinków</h3>
                <p>Dodaj odcinki do ulubionych, aby szybciej do nich wracać!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FavoritesPage;
