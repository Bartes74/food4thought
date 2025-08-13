import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import Layout from '../components/Layout';
import axios from 'axios';

const UserProfile = () => {
  const { user, checkAuth } = useAuth();
  const { t, language, changeLanguage } = useLanguage();
  const { isDarkMode } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [series, setSeries] = useState([]);
  const [preferences, setPreferences] = useState({
    language: 'polski',
    audioLanguage: 'polski',
    activeSeries: 'all',
    playbackSpeed: 1,
    autoPlay: true,
    showCompletedEpisodes: true
  });
  const [selectedSeries, setSelectedSeries] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Aktualizuj język interfejsu gdy zmieni się w preferencjach
    if (preferences.language !== language) {
      changeLanguage(preferences.language);
    }
  }, [preferences.language]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Pobierz serie
      const seriesRes = await axios.get('/api/series');
      setSeries(seriesRes.data || []);
      
      // Pobierz dane użytkownika z preferencjami
      const userRes = await axios.get('/api/auth/me');
      const userData = userRes.data.user;
      const userPrefs = userData.preferences || {};
      
      setPreferences({
        language: userPrefs.language || 'polski',
        audioLanguage: userPrefs.audioLanguage || 'polski',
        activeSeries: userPrefs.activeSeries || 'all',
        playbackSpeed: userPrefs.playbackSpeed || 1,
        autoPlay: userPrefs.autoPlay !== false,
        showCompletedEpisodes: userPrefs.showCompletedEpisodes !== false
      });
      
      // Ustaw wybrane serie
      if (userPrefs.activeSeries && Array.isArray(userPrefs.activeSeries)) {
        setSelectedSeries(userPrefs.activeSeries.map(id => id.toString()));
      }
    } catch (error) {
      console.error('Błąd pobierania danych:', error);
      setMessage('Błąd pobierania danych');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      const prefsToSave = {
        ...preferences,
        activeSeries: preferences.activeSeries === 'all' ? 'all' : selectedSeries
      };
      
      await axios.put('/api/users/preferences', prefsToSave);
      
      // Odśwież dane użytkownika w kontekście
      await checkAuth();
      
      setMessage('Preferencje zostały zapisane');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Błąd zapisywania preferencji:', error);
      setMessage('Błąd zapisywania preferencji');
    } finally {
      setSaving(false);
    }
  };

  const toggleSeriesSelection = (seriesId) => {
    const seriesIdStr = seriesId.toString();
    if (selectedSeries.includes(seriesIdStr)) {
      setSelectedSeries(selectedSeries.filter(id => id !== seriesIdStr));
    } else {
      setSelectedSeries([...selectedSeries, seriesIdStr]);
    }
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
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-light-text dark:text-white mb-8">
          Mój profil
        </h1>

        {/* Informacje o użytkowniku */}
        <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 mb-6 shadow-lg`}>
          <h2 className="text-xl font-semibold text-light-text dark:text-white mb-4">
            Dane konta
          </h2>
          <div className="space-y-2">
            <p className="text-light-text dark:text-gray-300">
              <span className="font-medium">Email:</span> {user?.email}
            </p>
            <p className="text-light-text dark:text-gray-300">
              <span className="font-medium">Rola:</span> {
                user?.role === 'super_admin' ? 'Super Administrator' :
                user?.role === 'admin' ? 'Administrator' : 'Użytkownik'
              }
            </p>
            <p className="text-light-text dark:text-gray-300">
              <span className="font-medium">Data utworzenia:</span> {
                user?.created_at ? new Date(user.created_at).toLocaleDateString('pl-PL') : 'Nieznana'
              }
            </p>
          </div>
        </div>

        {/* Preferencje językowe */}
        <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 mb-6 shadow-lg`}>
          <h2 className="text-xl font-semibold text-light-text dark:text-white mb-4">
            Preferencje językowe
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-light-text dark:text-gray-300 mb-2">
                Język interfejsu
              </label>
              <select
                value={preferences.language}
                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-dark-bg border-dark-border text-white' 
                    : 'bg-light-bg border-light-border'
                } focus:ring-2 focus:ring-primary outline-none`}
              >
                <option value="polski">Polski</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-light-text dark:text-gray-300 mb-2">
                Język audio
              </label>
              <select
                value={preferences.audioLanguage}
                onChange={(e) => setPreferences({ ...preferences, audioLanguage: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
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
          </div>
        </div>

        {/* Preferencje odtwarzania */}
        <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 mb-6 shadow-lg`}>
          <h2 className="text-xl font-semibold text-light-text dark:text-white mb-4">
            Preferencje odtwarzania
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-light-text dark:text-gray-300 mb-2">
                Domyślna prędkość odtwarzania
              </label>
              <select
                value={preferences.playbackSpeed}
                onChange={(e) => setPreferences({ ...preferences, playbackSpeed: parseFloat(e.target.value) })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-dark-bg border-dark-border text-white' 
                    : 'bg-light-bg border-light-border'
                } focus:ring-2 focus:ring-primary outline-none`}
              >
                <option value="0.8">0.8x</option>
                <option value="1">1x (Normalna)</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-light-text dark:text-gray-300">
                Automatyczne odtwarzanie następnego odcinka
              </span>
              <button
                onClick={() => setPreferences({ ...preferences, autoPlay: !preferences.autoPlay })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.autoPlay ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.autoPlay ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-light-text dark:text-gray-300">
                Pokazuj ukończone odcinki
              </span>
              <button
                onClick={() => setPreferences({ ...preferences, showCompletedEpisodes: !preferences.showCompletedEpisodes })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.showCompletedEpisodes ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.showCompletedEpisodes ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Wybór serii */}
        <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 mb-6 shadow-lg`}>
          <h2 className="text-xl font-semibold text-light-text dark:text-white mb-4">
            Twoje serie
          </h2>
          
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="seriesSelection"
                checked={preferences.activeSeries === 'all'}
                onChange={() => setPreferences({ ...preferences, activeSeries: 'all' })}
                className="text-primary"
              />
              <span className="text-light-text dark:text-gray-300">
                Wszystkie serie ({series.length})
              </span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input
                type="radio"
                name="seriesSelection"
                checked={preferences.activeSeries !== 'all'}
                onChange={() => setPreferences({ ...preferences, activeSeries: 'selected' })}
                className="text-primary"
              />
              <span className="text-light-text dark:text-gray-300">
                Wybrane serie ({selectedSeries.length})
              </span>
            </label>
          </div>
          
          {preferences.activeSeries !== 'all' && (
            <div className="grid md:grid-cols-2 gap-2 mt-4">
              {series.map((seria) => (
                <label
                  key={seria.id}
                  className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-bg"
                >
                  <input
                    type="checkbox"
                    checked={selectedSeries.includes(seria.id.toString())}
                    onChange={() => toggleSeriesSelection(seria.id)}
                    className="text-primary"
                  />
                  <span className="text-light-text dark:text-gray-300">
                    {seria.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Komunikat */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('Błąd') 
              ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' 
              : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
          }`}>
            {message}
          </div>
        )}

        {/* Przyciski */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Zapisywanie...' : 'Zapisz preferencje'}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default UserProfile;

