import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import Layout from '../components/Layout';
import axios from 'axios';

const FavoritesPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedEpisodes, setExpandedEpisodes] = useState({});

  useEffect(() => {
    fetchFavorites();
  }, [search]);

  const fetchFavorites = async () => {
    try {
      const response = await axios.get('/api/episodes/favorites', {
        params: { search }
      });
      setFavorites(response.data);
    } catch (error) {
      console.error('Błąd pobierania ulubionych:', error);
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
    // Zapisz ID odcinka do odtworzenia w localStorage
    localStorage.setItem('playEpisodeId', episodeId);
    navigate('/');
  };

  const removeFavorite = async (episodeId) => {
    try {
      await axios.post(`/api/episodes/${episodeId}/favorite`);
      // Odśwież listę
      fetchFavorites();
    } catch (error) {
      console.error('Błąd usuwania z ulubionych:', error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return (
          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
            Nowy
          </span>
        );
      case 'inProgress':
        return (
          <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded">
            W trakcie
          </span>
        );
      case 'completed':
        return (
          <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded">
            Ukończony
          </span>
        );
      default:
        return null;
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-light-textSecondary dark:text-gray-400">Ładowanie...</p>
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
        {favorites.length === 0 ? (
          <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-8 text-center`}>
            <p className="text-light-textSecondary dark:text-gray-400">
              {search ? 'Nie znaleziono ulubionych odcinków pasujących do wyszukiwania.' : 'Nie masz jeszcze żadnych ulubionych odcinków.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {favorites.map((series) => (
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
            ))}
          </div>
        )}
      </div>
      {/* Komunikat gdy brak ulubionych */}
      {!loading && favorites.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="text-6xl mb-4">💔</div>
          <h3 className="text-xl font-semibold mb-2">Brak ulubionych odcinków</h3>
          <p>Dodaj odcinki do ulubionych, aby szybciej do nich wracać!</p>
        </div>
      )}
    </Layout>
  );
};

export default FavoritesPage;