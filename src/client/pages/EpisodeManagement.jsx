import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import Layout from '../components/Layout';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

const EpisodeManagement = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  const [searchParams] = useSearchParams();
  
  const [series, setSeries] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  
  // Formularz nowego odcinka
  const [newEpisode, setNewEpisode] = useState({
    title: '',
    series_id: '',
    language: 'polski',
    audioFile: null,
    linksContent: '',
    additionalInfo: ''
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState(null);

  useEffect(() => {
    // Sprawdź czy jest parametr series w URL
    const seriesId = searchParams.get('series');
    if (seriesId) {
      setSelectedSeries(seriesId);
    }
    fetchData();
  }, [searchParams]);

  const fetchData = async () => {
    try {
      const [seriesRes, episodesRes] = await Promise.all([
        axios.get('/api/series'),
        axios.get('/api/episodes/my')
      ]);
      
      setSeries(seriesRes.data);
      setEpisodes(episodesRes.data);
    } catch (error) {
      console.error('Błąd pobierania danych:', error);
      setError('Błąd pobierania danych');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'audio/mpeg') {
      setNewEpisode({ ...newEpisode, audioFile: file });
    } else {
      setError('Wybierz plik MP3');
    }
  };

  const handleUploadEpisode = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!newEpisode.title || !newEpisode.series_id || !newEpisode.audioFile) {
      setError('Wypełnij wszystkie wymagane pola');
      return;
    }

    const formData = new FormData();
    formData.append('title', newEpisode.title);
    formData.append('series_id', newEpisode.series_id);
    formData.append('language', newEpisode.language);
    formData.append('audio', newEpisode.audioFile);
    formData.append('additional_info', newEpisode.additionalInfo); // DODANE

    try {
      const response = await axios.post('/api/episodes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      // Jeśli mamy linki, dodaj je od razu
      if (newEpisode.linksContent) {
        await axios.post(`/api/episodes/${response.data.id}/links`, {
          content: newEpisode.linksContent
        });
      }

      await fetchData();
      setShowAddModal(false);
      setNewEpisode({
        title: '',
        series_id: '',
        language: 'polski',
        audioFile: null,
        linksContent: '',
        additionalInfo: '' // RESET
      });
      setUploadProgress(0);
    } catch (error) {
      setError(error.response?.data?.error || 'Błąd podczas uploadu');
      setUploadProgress(0);
    }
  };

  const handleAddLinks = async (episodeId, content) => {
    try {
      await axios.post(`/api/episodes/${episodeId}/links`, { content });
      setShowEditModal(false);
      setEditingEpisode(null);
      // Odśwież dane
      await fetchData();
    } catch (error) {
      setError(error.response?.data?.error || 'Błąd dodawania linków');
    }
  };

  const handleUpdateEpisodeInfo = async (episodeId, updates) => {
    try {
      // Zaktualizuj informacje dodatkowe
      await axios.put(`/api/episodes/${episodeId}`, updates);
      
      // Jeśli są linki, zaktualizuj je też
      if (updates.linksContent !== undefined) {
        await axios.post(`/api/episodes/${episodeId}/links`, { content: updates.linksContent });
      }
      
      setShowEditModal(false);
      setEditingEpisode(null);
      await fetchData();
    } catch (error) {
      setError(error.response?.data?.error || 'Błąd aktualizacji odcinka');
    }
  };

  const handleDeleteEpisode = async (episodeId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten odcinek?')) {
      return;
    }

    try {
      await axios.delete(`/api/episodes/${episodeId}`);
      await fetchData();
    } catch (error) {
      setError(error.response?.data?.error || 'Błąd usuwania odcinka');
    }
  };

  // Filtrowanie odcinków
  const allEpisodes = [
    ...(episodes.new || []),
    ...(episodes.inProgress || []),
    ...(episodes.completed || [])
  ];

  const filteredEpisodes = selectedSeries === 'all' 
    ? allEpisodes 
    : allEpisodes.filter(ep => ep.series_id === parseInt(selectedSeries));

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
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-light-text dark:text-white">
            Zarządzanie odcinkami
          </h1>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
          >
            + Dodaj odcinek
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Filtr serii */}
        <div className="mb-6">
          <select
            value={selectedSeries}
            onChange={(e) => setSelectedSeries(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              isDarkMode 
                ? 'bg-dark-surface border-dark-border text-white' 
                : 'bg-white border-light-border'
            } focus:ring-2 focus:ring-primary outline-none`}
          >
            <option value="all">Wszystkie serie</option>
            {series.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Lista odcinków */}
        <div className="space-y-3">
          {filteredEpisodes.map((episode) => (
            <div
              key={episode.id}
              className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg shadow-lg transition-all duration-300`}
            >
              <div className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-light-text dark:text-white">
                        {episode.title}
                      </h3>
                      <span className="text-sm text-light-textSecondary dark:text-gray-400">
                        • {episode.series_name} • {new Date(episode.date_added).toLocaleDateString('pl-PL')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {episode.completed && (
                      <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded">
                        Ukończony
                      </span>
                    )}
                    {episode.position > 0 && !episode.completed && (
                      <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded">
                        W trakcie
                      </span>
                    )}
                    {!episode.position && !episode.completed && (
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                        Nowy
                      </span>
                    )}
                    {episode.favorite_date && (
                      <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded">
                        ♥
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setEditingEpisode(episode);
                        setShowEditModal(true);
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg transition-colors"
                      title="Informacje i linki"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteEpisode(episode.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"
                      title="Usuń"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEpisodes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-light-textSecondary dark:text-gray-400">
              Nie ma jeszcze żadnych odcinków
            </p>
          </div>
        )}

        {/* Modal dodawania odcinka */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className={`w-full max-w-2xl ${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 my-8`}>
              <h2 className="text-xl font-bold mb-6 text-light-text dark:text-white">
                Dodaj nowy odcinek
              </h2>
              
              <form onSubmit={handleUploadEpisode} className="space-y-4">
                {/* Tytuł */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-light-text dark:text-gray-300">
                    Tytuł odcinka *
                  </label>
                  <input
                    type="text"
                    value={newEpisode.title}
                    onChange={(e) => setNewEpisode({ ...newEpisode, title: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-dark-bg border-dark-border text-white' 
                        : 'bg-light-bg border-light-border'
                    } focus:ring-2 focus:ring-primary outline-none`}
                    required
                  />
                </div>

                {/* Seria */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-light-text dark:text-gray-300">
                    Seria *
                  </label>
                  <select
                    value={newEpisode.series_id}
                    onChange={(e) => setNewEpisode({ ...newEpisode, series_id: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-dark-bg border-dark-border text-white' 
                        : 'bg-light-bg border-light-border'
                    } focus:ring-2 focus:ring-primary outline-none`}
                    required
                  >
                    <option value="">Wybierz serię</option>
                    {series.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Język */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-light-text dark:text-gray-300">
                    Język
                  </label>
                  <select
                    value={newEpisode.language}
                    onChange={(e) => setNewEpisode({ ...newEpisode, language: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-dark-bg border-dark-border text-white' 
                        : 'bg-light-bg border-light-border'
                    } focus:ring-2 focus:ring-primary outline-none`}
                  >
                    <option value="polski">Polski</option>
                    <option value="angielski">Angielski</option>
                    <option value="francuski">Francuski</option>
                  </select>
                </div>

                {/* Plik audio */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-light-text dark:text-gray-300">
                    Plik audio (MP3) *
                  </label>
                  <input
                    type="file"
                    accept="audio/mp3,audio/mpeg"
                    onChange={handleFileSelect}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-dark-bg border-dark-border text-white' 
                        : 'bg-light-bg border-light-border'
                    } focus:ring-2 focus:ring-primary outline-none`}
                    required
                  />
                  {newEpisode.audioFile && (
                    <p className="text-sm text-light-textSecondary dark:text-gray-400 mt-1">
                      Wybrany plik: {newEpisode.audioFile.name}
                    </p>
                  )}
                </div>

                {/* NOWE POLE - Informacje dodatkowe */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-light-text dark:text-gray-300">
                    Informacje dodatkowe
                  </label>
                  <textarea
                    value={newEpisode.additionalInfo}
                    onChange={(e) => setNewEpisode({ ...newEpisode, additionalInfo: e.target.value })}
                    rows={4}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    } focus:ring-2 focus:ring-primary outline-none`}
                    placeholder="Dodatkowe informacje o odcinku, które będą widoczne w szczegółach..."
                  />
                </div>

                {/* Linki (opcjonalne) */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-light-text dark:text-gray-300">
                    Linki i timestampy (opcjonalne)
                  </label>
                  <textarea
                    value={newEpisode.linksContent}
                    onChange={(e) => setNewEpisode({ ...newEpisode, linksContent: e.target.value })}
                    placeholder="[00:00] # Wprowadzenie&#10;- https://example.com/link1&#10;- https://example.com/link2&#10;&#10;[05:30] # Główny temat&#10;- https://example.com/link3"
                    rows={6}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    } focus:ring-2 focus:ring-primary outline-none font-mono text-sm`}
                  />
                </div>

                {/* Progress */}
                {uploadProgress > 0 && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}

                {/* Błąd */}
                {error && (
                  <p className="text-red-600 text-sm">{error}</p>
                )}

                {/* Przyciski */}
                {/* Przyciski */}
                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setNewEpisode({
                        title: '',
                        series_id: '',
                        language: 'polski',
                        audioFile: null,
                        linksContent: '',
                        additionalInfo: ''
                      });
                      setUploadProgress(0);
                      setError('');
                    }}
                    disabled={uploadProgress > 0}
                    className="flex-1 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    disabled={uploadProgress > 0}
                    className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {uploadProgress > 0 ? `Przesyłanie... ${uploadProgress}%` : 'Dodaj odcinek'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal edycji informacji i linków */}
        {showEditModal && editingEpisode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className={`w-full max-w-2xl ${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 my-8`}>
              <h2 className="text-xl font-bold mb-4 text-light-text dark:text-white">
                Edytuj informacje - {editingEpisode.title}
              </h2>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const additionalInfo = e.target.elements.additionalInfo.value;
                const linksContent = e.target.elements.links.value;
                handleUpdateEpisodeInfo(editingEpisode.id, { additional_info: additionalInfo, linksContent });
              }}>
                {/* Informacje dodatkowe */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-light-text dark:text-gray-300">
                    Informacje dodatkowe
                  </label>
                  <textarea
                    name="additionalInfo"
                    rows={8}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    } focus:ring-2 focus:ring-primary outline-none`}
                    placeholder="Dodatkowe informacje o odcinku..."
                    defaultValue={editingEpisode.additional_info || ''}
                  />
                </div>

                {/* Linki i timestampy */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-light-text dark:text-gray-300">
                    Linki i timestampy
                  </label>
                  <textarea
                    name="links"
                    placeholder="[00:00] # Wprowadzenie&#10;- https://example.com/link1&#10;- https://example.com/link2&#10;&#10;[05:30] # Główny temat&#10;- https://example.com/link3"
                    rows={8}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    } focus:ring-2 focus:ring-primary outline-none font-mono text-sm`}
                    defaultValue={editingEpisode.linksContent || ''}
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
                  >
                    Zapisz
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingEpisode(null);
                    }}
                    className="flex-1 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Anuluj
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EpisodeManagement;