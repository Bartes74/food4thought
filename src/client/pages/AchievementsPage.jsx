import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import axios from 'axios';

const AchievementsPage = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/achievements');
      setAchievements(response.data.achievements || []);
      setStats(response.data.stats || {});
      setError(null);
    } catch (error) {
      console.error('Błąd podczas pobierania osiągnięć:', error);
      if (error.response?.status === 401) {
        setError('Sesja wygasła. Zaloguj się ponownie.');
      } else if (error.response?.status === 403) {
        setError('Brak uprawnień do wyświetlenia osiągnięć.');
      } else {
        setError('Błąd serwera podczas pobierania osiągnięć.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0 min';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  };

  const groupAchievementsByCategory = (achievements) => {
    const groups = {};
    achievements.forEach(achievement => {
      if (!groups[achievement.category]) {
        groups[achievement.category] = [];
      }
      groups[achievement.category].push(achievement);
    });
    return groups;
  };

  const getCategoryName = (category) => {
    const names = {
      'speed': 'Prędkość',
      'precision': 'Dokładność',
      'patterns': 'Wzorce czasowe',
      'streak': 'Serie',
      'daily': 'Codzienność'
    };
    return names[category] || category;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'speed': '⚡',
      'precision': '🎯',
      'patterns': '🕐',
      'streak': '🔥',
      'daily': '📅'
    };
    return icons[category] || '🏆';
  };

  if (!user) {
    return (
      <Layout>
        <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-dark-bg text-white' : 'bg-gray-50 text-gray-900'}`}>
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Błąd</h2>
            <p>Musisz być zalogowany, aby zobaczyć osiągnięcia.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-dark-bg text-white' : 'bg-gray-50 text-gray-900'}`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Ładowanie osiągnięć...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-dark-bg text-white' : 'bg-gray-50 text-gray-900'}`}>
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-red-500">Błąd</h2>
            <p className="mb-4">{error}</p>
            <button 
              onClick={fetchAchievements}
              className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-dark-surface hover:bg-gray-600' : 'bg-white hover:bg-gray-100'} transition-colors`}
            >
              Spróbuj ponownie
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const groupedAchievements = groupAchievementsByCategory(achievements);
  const unlockedCount = achievements.filter(a => a.completed).length;
  const totalCount = achievements.length;

  return (
    <Layout>
      <div className={`min-h-screen ${isDarkMode ? 'bg-dark-bg text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Nagłówek */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">🏆 Osiągnięcia</h1>
            <p className={`text-lg ${isDarkMode ? 'text-dark-textSecondary' : 'text-gray-600'}`}>
              Odblokowanych: {unlockedCount}/{totalCount}
            </p>
          </div>

          {/* Statystyki */}
          <div className={`mb-8 p-6 rounded-xl ${isDarkMode ? 'bg-dark-surface' : 'bg-white'} shadow-lg`}>
            <h2 className="text-xl font-semibold mb-4">📊 Twoje statystyki</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{formatTime(stats.total_listening_time || 0)}</div>
                <div className={`text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-gray-600'}`}>Całkowity czas słuchania</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.total_episodes_completed || 0}</div>
                <div className={`text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-gray-600'}`}>Ukończone odcinki</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.current_streak || 0}</div>
                <div className={`text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-gray-600'}`}>Aktualna seria</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.longest_streak || 0}</div>
                <div className={`text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-gray-600'}`}>Najdłuższa seria</div>
              </div>
            </div>
          </div>

          {/* Osiągnięcia pogrupowane według kategorii */}
          <div className="space-y-8">
            {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
              <div key={category} className={`p-6 rounded-xl ${isDarkMode ? 'bg-dark-surface' : 'bg-white'} shadow-lg`}>
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">{getCategoryIcon(category)}</span>
                  <h3 className="text-xl font-semibold">{getCategoryName(category)}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryAchievements.map((achievement) => (
                    <div 
                      key={achievement.id} 
                      className={`p-4 rounded-lg border-2 transition-all ${
                        achievement.completed 
                          ? `${isDarkMode ? 'border-green-500 bg-green-500/10' : 'border-green-500 bg-green-50'}`
                          : `${isDarkMode ? 'border-dark-border bg-dark-border/20' : 'border-gray-200 bg-gray-50'}`
                      }`}
                    >
                      <div className="flex items-center mb-3">
                        <span className={`text-3xl mr-3 ${achievement.completed ? '' : 'grayscale opacity-50'}`}>
                          {achievement.icon}
                        </span>
                        <div className="flex-1">
                          <h4 className={`font-semibold ${achievement.completed ? 'text-green-600' : ''}`}>
                            {achievement.name}
                          </h4>
                          <p className={`text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-gray-600'}`}>
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                      
                      {!achievement.completed && achievement.progress_value !== undefined && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Postęp</span>
                            <span>{achievement.progress_value}/{achievement.requirement_value}</span>
                          </div>
                          <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-dark-border' : 'bg-gray-200'}`}>
                            <div 
                              className="h-2 rounded-full bg-primary transition-all duration-300"
                              style={{ 
                                width: `${Math.min((achievement.progress_value / achievement.requirement_value) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {achievement.completed && (
                        <div className="mt-3 text-sm text-green-600 font-medium">
                          ✅ Odblokowane {achievement.earned_at && new Date(achievement.earned_at).toLocaleDateString('pl-PL')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Komunikat gdy brak osiągnięć */}
          {achievements.length === 0 && (
            <div className={`text-center py-12 ${isDarkMode ? 'text-dark-textSecondary' : 'text-gray-600'}`}>
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold mb-2">Brak osiągnięć</h3>
              <p>Słuchaj odcinków, aby odblokować pierwsze osiągnięcia!</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AchievementsPage; 