import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import AudioPlayer from '../components/AudioPlayer'
import Layout from '../components/Layout'
import StarRating from '../components/StarRating'
import axios from 'axios'

const HomePage = () => {
  const { user } = useAuth()
  const { t, formatDate } = useLanguage()
  const { isDarkMode } = useTheme()
  const location = useLocation()
  
  const [series, setSeries] = useState([])
  const [episodes, setEpisodes] = useState({ new: [], inProgress: [], completed: [] })
  const [currentEpisode, setCurrentEpisode] = useState(null)
  const [seriesInfo, setSeriesInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedSeriesId, setSelectedSeriesId] = useState(null)

  
  // State dla wyszukiwarki
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searchFilters, setSearchFilters] = useState({
    seriesId: 'all',
    dateFrom: '',
    dateTo: '',
    showAdvanced: false
  })
  const [isSearching, setIsSearching] = useState(false)
  const [sortBy, setSortBy] = useState('date') // 'date', 'rating', 'title'
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initializeApp = async () => {
      await fetchData()
      
      // Sprawdź czy mamy odcinek do automatycznego odtworzenia
      const playEpisodeId = localStorage.getItem('playEpisodeId');
      if (playEpisodeId) {
        localStorage.removeItem('playEpisodeId');
        // Poczekaj aż dane się załadują, potem odtwórz
        setTimeout(() => {
          loadEpisodeDetails(playEpisodeId);
        }, 500);
      } else {
        // Jeśli nie ma odcinka do automatycznego odtworzenia, spróbuj wczytać ostatni odcinek
        loadLastPlayedEpisode();
      }
    }

    initializeApp()

    // Dodaj event listener do odświeżania listy po zmianach w playerze
    const handleEpisodeUpdate = () => {
      // Zamiast pełnego fetchData(), tylko odśwież oceny i ulubione
      refreshEpisodeRatings();
    };

    window.addEventListener('episode-favorite-toggled', handleEpisodeUpdate);
    window.addEventListener('episode-rated', handleEpisodeUpdate);

    return () => {
      window.removeEventListener('episode-favorite-toggled', handleEpisodeUpdate);
      window.removeEventListener('episode-rated', handleEpisodeUpdate);
    };
  }, [])

  // Handle navigation state from notifications
  useEffect(() => {
    if (location.state?.autoStartEpisode) {
      const episodeId = location.state.autoStartEpisode;
      
      // Load the episode
      loadEpisodeDetails(episodeId);
      
      // Clear the navigation state
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (location.state?.selectedSeries) {
      const seriesId = location.state.selectedSeries;
      
      // Set the selected series filter
      setSelectedSeriesId(parseInt(seriesId));
      
      // Clear the navigation state
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state]);

  // Dodaj useEffect który będzie pobierał informacje o serii
  useEffect(() => {
    if (currentEpisode?.series_id) {
      fetchSeriesInfo(currentEpisode.series_id);
    }
  }, [currentEpisode?.series_id]);

  // Funkcja filtrowania odcinków według wybranej serii i preferencji użytkownika
  const getFilteredEpisodes = (episodeList) => {
    let filtered = episodeList;
    
    // Filtruj według wybranej serii (jeśli użytkownik kliknął na serię)
    if (selectedSeriesId) {
      filtered = filtered.filter(episode => episode.series_id === selectedSeriesId);
    } else {
      // Filtruj według preferencji użytkownika (jeśli nie ma wybranej serii)
      const activeSeries = (user && user.preferences && user.preferences.activeSeries) || 'all';
      const showCompleted = (user && user.preferences && (user.preferences.showCompleted || user.preferences.show_completed)) ?? true;
      
      if (activeSeries !== 'all' && Array.isArray(activeSeries)) {
        const activeSeriesIds = activeSeries.map(id => parseInt(id));
        filtered = filtered.filter(episode => activeSeriesIds.includes(episode.series_id));
      }

      // Preferencja: ukryj ukończone odcinki, jeśli użytkownik tak ustawił
      if (!showCompleted) {
        filtered = filtered.filter(episode => !episode.completed);
      }
    }
    
    return filtered;
  }

  // Funkcja sortowania odcinków
  const getSortedEpisodes = (episodeList) => {
    const filtered = getFilteredEpisodes(episodeList);
    
    switch (sortBy) {
      case 'rating':
        return [...filtered].sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
      case 'title':
        return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
      case 'date':
      default:
        return [...filtered].sort((a, b) => new Date(b.date_added) - new Date(a.date_added));
    }
  }

  // Funkcja dodawania/usuwania z ulubionych
  const toggleFavorite = async (episodeId, e) => {
    e.stopPropagation(); // Zapobiegaj kliknięciu na odcinek
    
    try {
      const episode = episodes.new?.find(e => e.id === episodeId) || 
                     episodes.inProgress?.find(e => e.id === episodeId) || 
                     episodes.completed?.find(e => e.id === episodeId);
      
      if (!episode) return;
      
      if (episode.is_favorite) {
        // Usuń z ulubionych
        const response = await axios.delete(`/api/episodes/${episodeId}/favorite`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const newFavoriteStatus = response.data.isFavorite;
        
        // Aktualizuj lokalny stan
        setEpisodes(prev => ({
          new: prev.new.map(e => e.id === episodeId ? { ...e, is_favorite: newFavoriteStatus } : e),
          inProgress: prev.inProgress.map(e => e.id === episodeId ? { ...e, is_favorite: newFavoriteStatus } : e),
          completed: prev.completed.map(e => e.id === episodeId ? { ...e, is_favorite: newFavoriteStatus } : e)
        }));
      } else {
        // Dodaj do ulubionych
        const response = await axios.post(`/api/episodes/${episodeId}/favorite`, {}, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const newFavoriteStatus = response.data.isFavorite;
        
        // Aktualizuj lokalny stan
        setEpisodes(prev => ({
          new: prev.new.map(e => e.id === episodeId ? { ...e, is_favorite: newFavoriteStatus } : e),
          inProgress: prev.inProgress.map(e => e.id === episodeId ? { ...e, is_favorite: newFavoriteStatus } : e),
          completed: prev.completed.map(e => e.id === episodeId ? { ...e, is_favorite: newFavoriteStatus } : e)
        }));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Funkcja oceniania odcinka
  const handleRatingChange = async (episodeId, rating, e) => {
    if (e) e.stopPropagation(); // Zapobiegaj kliknięciu na odcinek
    
    try {
      await axios.post(`/api/episodes/${episodeId}/rating`, { rating }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      // Aktualizuj lokalny stan
      setEpisodes(prev => ({
        new: prev.new.map(e => e.id === episodeId ? { ...e, user_rating: rating } : e),
        inProgress: prev.inProgress.map(e => e.id === episodeId ? { ...e, user_rating: rating } : e),
        completed: prev.completed.map(e => e.id === episodeId ? { ...e, user_rating: rating } : e)
      }));
    } catch (error) {
      console.error('Error saving rating:', error);
    }
  };

  // Funkcja wyszukiwania z poprawionymi parametrami
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery.trim(),
        ...(searchFilters.seriesId !== 'all' && { series_id: searchFilters.seriesId }),
        ...(searchFilters.dateFrom && { date_from: searchFilters.dateFrom }),
        ...(searchFilters.dateTo && { date_to: searchFilters.dateTo })
      });

      console.log('🔍 Searching with params:', params.toString());
      
      // Użyj fetch zamiast axios z ręcznym dodaniem tokenu
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/episodes/search?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Search response:', data);
      
      setSearchResults(data);
    } catch (error) {
      console.error('Błąd wyszukiwania:', error);
      if (error.message.includes('401')) {
        alert('Problem z autoryzacją - spróbuj się wylogować i zalogować ponownie');
      } else if (error.message.includes('404')) {
        alert('Endpoint wyszukiwania nie został znaleziony');
      }
      setSearchResults({ episodes: [], total: 0 });
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setSearchFilters({
      seriesId: 'all',
      dateFrom: '',
      dateTo: '',
      showAdvanced: false
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Obsługa kliknięcia w serię
  const handleSeriesClick = (seriesId) => {
    setSelectedSeriesId(selectedSeriesId === seriesId ? null : seriesId);
  }

  // Pobierz nazwę wybranej serii
  const getSelectedSeriesName = () => {
    if (!selectedSeriesId) return null;
    const serie = series.find(s => s.id === selectedSeriesId);
    return serie?.name;
  }

  const fetchData = async () => {
    try {
      setError(null)
      const token = localStorage.getItem('token')
      
      const [seriesRes, episodesRes] = await Promise.all([
        fetch('/api/series', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/episodes/my', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])
      
      const seriesData = await seriesRes.json()
      const episodesData = await episodesRes.json()
      
      setSeries(seriesData)
      setEpisodes(episodesData)

      // Nie ustawiaj automatycznie pierwszego odcinka - to zrobi loadLastPlayedEpisode
      // lub domyślna logika w useEffect
    } catch (error) {
      console.error('Błąd pobierania danych:', error)
      // Nie pokazuj błędu użytkownikowi - po prostu pokaż pusty player
    } finally {
      setLoading(false)
    }
  }

  const fetchSeriesInfo = async (seriesId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/series/${seriesId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setSeriesInfo(data)
    } catch (error) {
      console.error('Error fetching series info:', error)
    }
  };

  // Funkcja do odświeżania tylko ocen i ulubionych bez resetowania aktualnego odcinka
  const refreshEpisodeRatings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/episodes/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const episodesData = await response.json()
      
      // Aktualizuj tylko dane odcinków, nie resetuj currentEpisode
      setEpisodes(episodesData)
      
      // Jeśli jest aktualny odcinek, zaktualizuj jego dane
      if (currentEpisode) {
        const currentEpisodeId = currentEpisode.id;
        const updatedEpisode = episodesData.new?.find(e => e.id === currentEpisodeId) ||
                               episodesData.inProgress?.find(e => e.id === currentEpisodeId) ||
                               episodesData.completed?.find(e => e.id === currentEpisodeId);
        
        if (updatedEpisode) {
          // Zaktualizuj currentEpisode z nowymi danymi (np. z nową oceną)
          setCurrentEpisode(prev => ({
            ...prev,
            user_rating: updatedEpisode.user_rating,
            average_rating: updatedEpisode.average_rating,
            rating_count: updatedEpisode.rating_count,
            is_favorite: updatedEpisode.is_favorite
          }));
        }
      }
    } catch (error) {
      console.error('Błąd odświeżania ocen:', error)
    }
  };

  const loadLastPlayedEpisode = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/episodes/last-played', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const lastPlayedEpisode = await response.json()
        
        if (lastPlayedEpisode) {
          console.log('Wczytywanie ostatniego odcinka:', lastPlayedEpisode.title)
          
          // Pobierz pełne szczegóły odcinka z tematami
          await loadEpisodeDetails(lastPlayedEpisode.id)
        } else {
          console.log('Brak ostatniego odcinka, używam domyślnej logiki')
          // Jeśli nie ma ostatniego odcinka, użyj domyślnej logiki z uwzględnieniem preferencji
          const filteredInProgress = getFilteredEpisodes(episodes.inProgress || []);
          const filteredNew = getFilteredEpisodes(episodes.new || []);
          
          if (filteredInProgress.length > 0) {
            loadEpisodeDetails(filteredInProgress[0].id)
          } else if (filteredNew.length > 0) {
            loadEpisodeDetails(filteredNew[0].id)
          }
        }
      } else {
        console.log('Błąd pobierania ostatniego odcinka, używam domyślnej logiki')
        // Jeśli błąd, użyj domyślnej logiki z uwzględnieniem preferencji
        const filteredInProgress = getFilteredEpisodes(episodes.inProgress || []);
        const filteredNew = getFilteredEpisodes(episodes.new || []);
        
        if (filteredInProgress.length > 0) {
          loadEpisodeDetails(filteredInProgress[0].id)
        } else if (filteredNew.length > 0) {
          loadEpisodeDetails(filteredNew[0].id)
        }
      }
    } catch (error) {
      console.error('Błąd wczytywania ostatniego odcinka:', error)
      // Jeśli błąd, użyj domyślnej logiki z uwzględnieniem preferencji
      const filteredInProgress = getFilteredEpisodes(episodes.inProgress || []);
      const filteredNew = getFilteredEpisodes(episodes.new || []);
      
      if (filteredInProgress.length > 0) {
        loadEpisodeDetails(filteredInProgress[0].id)
      } else if (filteredNew.length > 0) {
        loadEpisodeDetails(filteredNew[0].id)
      }
    }
  }

  const loadEpisodeDetails = async (episodeId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/episodes/${episodeId}?language=${(user && user.preferences && user.preferences.audioLanguage) || 'polski'}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      // Pobierz tematy odcinka
      try {
        const topicsResponse = await fetch(`/api/episodes/${episodeId}/topics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const topicsData = await topicsResponse.json()
        data.topics = topicsData.topics || []
      } catch (topicsError) {
        console.log('Nie udało się wczytać tematów:', topicsError)
        data.topics = []
      }
      
      setCurrentEpisode(data)
      
      // Pobierz informacje o serii dla tego odcinka
      if (data.series_id) {
        fetchSeriesInfo(data.series_id)
      }
    } catch (error) {
      console.error('Błąd ładowania odcinka:', error)
    }
  }

  const handleEpisodeSelect = (episodeId) => {
    loadEpisodeDetails(episodeId)
  }

  // Odbierz żądanie z autoPlay do odtworzenia następnego odcinka (z informacją o auto-starcie)
  useEffect(() => {
    const handler = (e) => {
      const nextId = e?.detail?.episodeId;
      const autoStart = e?.detail?.autoStart;
      if (nextId) {
        if (autoStart) setAutoStartId(nextId);
        loadEpisodeDetails(nextId);
      }
    };
    window.addEventListener('request-play-episode', handler);
    return () => window.removeEventListener('request-play-episode', handler);
  }, []);

  // Po ukończeniu odcinka – odśwież listy (aby zniknął z "W trakcie")
  useEffect(() => {
    const refresh = () => {
      refreshEpisodeRatings();
      fetchData();
    };
    window.addEventListener('episode-completed', refresh);
    return () => window.removeEventListener('episode-completed', refresh);
  }, []);

  // Callback zmiany odcinka (bez logiki autoplay)
  const handleEpisodeChange = (newEpisode) => {
    setCurrentEpisode(newEpisode);
    // Przewiń do odtwarzacza
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Usunięto: stary flow autoodtwarzania (przeniesiony do AudioPlayer)
  

  const allEpisodes = [
    ...(episodes.new || []),
    ...(episodes.inProgress || []),
    ...(episodes.completed || [])
  ]

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
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-4 py-8">
        {/* Zawsze pokazuj sekcję playera */}
        <section className="mb-8">
          <AudioPlayer 
            episode={currentEpisode} 
            seriesInfo={seriesInfo}
            onRatingChange={fetchData}
            onEpisodeChange={handleEpisodeChange}
          />
        </section>

        {/* Globalna wyszukiwarka */}
        <section className="mb-8">
          <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
            <h2 className="text-xl font-bold text-light-text dark:text-white mb-4">
              🔍 {t('homePage.searchEpisodes')}
            </h2>
            
            {/* Główne pole wyszukiwania */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('homePage.searchPlaceholder')}
                  data-testid="search-input"
                  className={`w-full px-4 py-3 pl-10 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-dark-bg border-dark-border text-white placeholder-gray-400' 
                      : 'bg-light-bg border-light-border placeholder-gray-500'
                  } focus:ring-2 focus:ring-primary outline-none`}
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('homePage.searching')}
                  </div>
                ) : (
                  t('homePage.search')
                )}
              </button>
              
              <button
                onClick={() => setSearchFilters({ ...searchFilters, showAdvanced: !searchFilters.showAdvanced })}
                className={`px-4 py-3 rounded-lg transition-colors ${
                  searchFilters.showAdvanced 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                title={t('homePage.advancedFilters')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </button>
              
              {searchResults && (
                <button
                  onClick={clearSearch}
                  className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  title="Wyczyść wyszukiwanie"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Filtry zaawansowane */}
            {searchFilters.showAdvanced && (
              <div className={`${isDarkMode ? 'bg-dark-bg' : 'bg-gray-50'} rounded-lg p-4 mb-4`}>
                <h3 className="font-semibold mb-3 text-light-text dark:text-white">{t('homePage.advancedFilters')}</h3>
                
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Filtr serii */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-light-text dark:text-gray-300">
                      {t('homePage.series')}
                    </label>
                    <select
                      value={searchFilters.seriesId}
                      onChange={(e) => setSearchFilters({ ...searchFilters, seriesId: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-dark-surface border-dark-border text-white' 
                          : 'bg-white border-light-border'
                      } focus:ring-2 focus:ring-primary outline-none`}
                    >
                      <option value="all">{t('homePage.allSeries')}</option>
                      {series.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Data od */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-light-text dark:text-gray-300">
                      {t('homePage.dateFrom')}
                    </label>
                    <input
                      type="date"
                      value={searchFilters.dateFrom}
                      onChange={(e) => setSearchFilters({ ...searchFilters, dateFrom: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-dark-surface border-dark-border text-white' 
                          : 'bg-white border-light-border'
                      } focus:ring-2 focus:ring-primary outline-none`}
                    />
                  </div>
                  
                  {/* Data do */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-light-text dark:text-gray-300">
                      {t('homePage.dateTo')}
                    </label>
                    <input
                      type="date"
                      value={searchFilters.dateTo}
                      onChange={(e) => setSearchFilters({ ...searchFilters, dateTo: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-dark-surface border-dark-border text-white' 
                          : 'bg-white border-light-border'
                      } focus:ring-2 focus:ring-primary outline-none`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Wyniki wyszukiwania */}
            {searchResults && (
              <div className="mt-6" data-testid="search-results">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-light-text dark:text-white">
                    {t('homePage.searchResults')}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {t('homePage.foundEpisodes').replace('{count}', String(searchResults.total || 0)).replace('{query}', searchQuery)}
                  </span>
                </div>
                
                {searchResults.episodes && searchResults.episodes.length > 0 ? (
                  <div className="space-y-3">
                    {searchResults.episodes.map((episode) => (
                      <div
                        key={episode.id}
                        onClick={() => handleEpisodeSelect(episode.id)}
                        className={`${isDarkMode ? 'bg-dark-bg' : 'bg-gray-50'} rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-300`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-light-text dark:text-white">
                                {episode.title}
                              </h4>
                              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                                {episode.series_name}
                              </span>
                            </div>
                            
                            {episode.additional_info && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                                {episode.additional_info.length > 150 
                                  ? episode.additional_info.substring(0, 150) + '...' 
                                  : episode.additional_info
                                }
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>📅 {formatDate(episode.date_added)}</span>
                              {episode.completed && <span className="text-green-500">✅ {t('favorites.completed')}</span>}
                              {episode.position > 0 && !episode.completed && (
                                <span className="text-yellow-500">▶️ {t('favorites.inProgress')}</span>
                              )}
                              {episode.is_favorite && <span className="text-red-500">❤️ Ulubiony</span>}
                            </div>
                          </div>
                          
                          <div className="ml-4">
                            <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🔍</div>
                    <p className="text-gray-500">{t('homePage.noResults')}</p>
                    <p className="text-sm text-gray-400 mt-1">{t('homePage.tryDifferentCriteria')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Lista odcinków - tylko jeśli są */}
        {allEpisodes.length > 0 && (
          <>
            {/* Informacja o filtrze */}
            {selectedSeriesId && (
              <div className="mb-6 flex items-center gap-3">
                <span className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {t('homePage.episodesFromSeries').replace('{seriesName}', getSelectedSeriesName() || '')}
                </span>
                <button
                  onClick={() => setSelectedSeriesId(null)}
                  className="px-3 py-1 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {t('homePage.showAll')}
                </button>
              </div>
            )}

            {/* Nowe odcinki */}
            {getFilteredEpisodes(episodes.new || []).length > 0 && (
              <section className="mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-light-text dark:text-white">
                    {t('homePage.newEpisodes')}
                    {selectedSeriesId && ` (${getFilteredEpisodes(episodes.new || []).length})`}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-light-textSecondary dark:text-gray-400">Sortuj:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className={`px-3 py-1 text-sm rounded border ${
                        isDarkMode 
                          ? 'bg-dark-surface border-dark-border text-white' 
                          : 'bg-white border-light-border'
                      } focus:ring-2 focus:ring-primary outline-none`}
                    >
                      <option value="date">Data</option>
                      <option value="rating">Ocena</option>
                      <option value="title">Tytuł</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-3" data-testid="episodes-list">
                  {getSortedEpisodes(episodes.new || []).map((episode) => (
                    <div
                      key={episode.id}
                      onClick={() => handleEpisodeSelect(episode.id)}
                      className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg shadow-lg transition-all duration-300 cursor-pointer hover:shadow-xl`}
                      data-testid="episode-item"
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-light-text dark:text-white">
                                {episode.title}
                              </h3>
                              <span className="text-sm text-light-textSecondary dark:text-gray-400">
                                • {episode.series_name} • {formatDate(episode.date_added)}
                              </span>
                            </div>
                            <div className="mt-2">
                              <StarRating
                                rating={episode.user_rating || 0}
                                onRatingChange={(rating, event) => handleRatingChange(episode.id, rating, event)}
                                size="sm"
                                showHalfStars={true}
                              />
                              {episode.rating_count > 0 && (
                                <span className="text-xs text-light-textSecondary dark:text-gray-400 ml-2">
                                  Średnia: {episode.average_rating?.toFixed(1) || 0}/5 ({episode.rating_count} ocen)
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                              {t('favorites.new')}
                            </span>
                            <button
                              onClick={(e) => toggleFavorite(episode.id, e)}
                              className={`p-1 rounded transition-colors ${
                                episode.is_favorite 
                                  ? 'text-red-500 hover:text-red-600' 
                                  : 'text-gray-400 hover:text-red-500'
                              }`}
                              title={episode.is_favorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
                            >
                              <svg className="w-5 h-5" fill={episode.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </button>
                            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* W trakcie słuchania */}
            {getFilteredEpisodes(episodes.inProgress || []).length > 0 && (
              <section className="mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-light-text dark:text-white">
                    {t('homePage.inProgress')}
                    {selectedSeriesId && ` (${getFilteredEpisodes(episodes.inProgress || []).length})`}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-light-textSecondary dark:text-gray-400">Sortuj:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className={`px-3 py-1 text-sm rounded border ${
                        isDarkMode 
                          ? 'bg-dark-surface border-dark-border text-white' 
                          : 'bg-white border-light-border'
                      } focus:ring-2 focus:ring-primary outline-none`}
                    >
                      <option value="date">Data</option>
                      <option value="rating">Ocena</option>
                      <option value="title">Tytuł</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-3">
                  {getSortedEpisodes(episodes.inProgress || []).map((episode) => (
                    <div
                      key={episode.id}
                      onClick={() => handleEpisodeSelect(episode.id)}
                      className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg shadow-lg transition-all duration-300 cursor-pointer hover:shadow-xl`}
                      data-testid="episode-item"
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-light-text dark:text-white">
                                {episode.title}
                              </h3>
                              <span className="text-sm text-light-textSecondary dark:text-gray-400">
                                • {episode.series_name} • {formatDate(episode.date_added)}
                              </span>
                            </div>
                            <div className="mt-2">
                              <StarRating
                                rating={episode.user_rating || 0}
                                onRatingChange={(rating, event) => handleRatingChange(episode.id, rating, event)}
                                size="sm"
                                showHalfStars={true}
                              />
                              {episode.rating_count > 0 && (
                                <span className="text-xs text-light-textSecondary dark:text-gray-400 ml-2">
                                  Średnia: {episode.average_rating?.toFixed(1) || 0}/5 ({episode.rating_count} ocen)
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded">
                              {t('favorites.inProgress')}
                            </span>
                            <button
                              onClick={(e) => toggleFavorite(episode.id, e)}
                              className={`p-1 rounded transition-colors ${
                                episode.is_favorite 
                                  ? 'text-red-500 hover:text-red-600' 
                                  : 'text-gray-400 hover:text-red-500'
                              }`}
                              title={episode.is_favorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
                            >
                              <svg className="w-5 h-5" fill={episode.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </button>
                            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
             
        {/* Twoje Serie - pokazuj według preferencji użytkownika */}
        {series.length > 0 && (() => {
          const activeSeries = (user && user.preferences && user.preferences.activeSeries) || 'all';
          let seriesToShow = series;
          
          if (activeSeries !== 'all' && Array.isArray(activeSeries)) {
            const activeSeriesIds = activeSeries.map(id => parseInt(id));
            seriesToShow = series.filter(seria => activeSeriesIds.includes(seria.id));
          }
          
          return seriesToShow.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-bold text-light-text dark:text-white mb-6">
                {activeSeries === 'all' ? t('homePage.yourSeries') : t('homePage.selectedSeries')}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {seriesToShow.map((seria) => (
                <div
                  key={seria.id}
                  onClick={() => handleSeriesClick(seria.id)}
                  className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-xl p-6 hover:shadow-lg transition-all duration-300 border-2 cursor-pointer ${
                    selectedSeriesId === seria.id 
                      ? 'border-primary shadow-lg transform scale-105' 
                      : 'border-light-border dark:border-dark-border hover:border-primary/50'
                  }`}
                >
                  {/* Dodaj grafikę lub kolorowy placeholder */}
                  <div className="mb-4">
                    {seria.image ? (
                      <img 
                        src={seria.image}
                        alt={seria.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <div 
                        className="w-full h-32 rounded-lg flex items-center justify-center text-white font-bold text-3xl"
                        style={{ backgroundColor: seria.color || '#3B82F6' }}
                      >
                        {seria.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-light-text dark:text-white">{seria.name}</h3>
                  <p className="text-sm text-light-textSecondary dark:text-gray-400 mt-1">
                    {t('homePage.episodesCount').replace('{count}', String(seria.episode_count || 0))}
                  </p>
                  {/* Liczba nowych odcinków w tej serii */}
                  {(() => {
                    const newInSeries = episodes.new?.filter(e => e.series_id === seria.id).length || 0
                    const inProgressInSeries = episodes.inProgress?.filter(e => e.series_id === seria.id).length || 0
                    const totalActive = newInSeries + inProgressInSeries;
                    return totalActive > 0 && (
                      <span className="inline-block mt-2 text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                        {t('homePage.toListen').replace('{count}', String(totalActive))}
                      </span>
                    )
                  })()}
                  
                  {/* Wskaźnik wybranej serii */}
                  {selectedSeriesId === seria.id && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {t('homePage.selectedSeries')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
        })()}
      </div>
    </Layout>
  )
}

export default HomePage