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
      'speed': '⚡ Prędkość',
      'playback_speed': '🚀 Prędkość odtwarzania',
      'precision': '🎯 Dokładność',
      'patterns': '🕐 Wzorce czasowe',
      'time_patterns': '🌙 Wzorce czasowe',
      'streak': '🔥 Serie',
      'streaks': '💪 Wytrwałość',
      'daily': '📅 Codzienność',
      'daily_activity': '🏃 Aktywność dzienna',
      'general': '🏆 Ogólne'
    };
    return names[category] || category;
  };

  const getRequirementDescription = (achievement) => {
    const { requirement_type, requirement_value } = achievement;
    
    const descriptions = {
      'episodes_completed': `Ukończ ${requirement_value} odcinków`,
      'perfect_completion': `Ukończ odcinek z 95%+ dokładnością`,
      'perfect_completions': `Ukończ ${requirement_value} odcinków z 95%+ dokładnością`,
      'high_speed_time': `Słuchaj przez ${formatTime(requirement_value)} z prędkością 2x`,
      'high_speed_listening_time': `Słuchaj przez ${formatTime(requirement_value)} z prędkością 2x`,
      'current_streak': `Słuchaj przez ${requirement_value} dni z rzędu`,
      'streak_days': `Słuchaj przez ${requirement_value} dni z rzędu`,
      'daily_episodes': `Słuchaj ${requirement_value} odcinków w jeden dzień`,
      'daily_episodes_count': `Słuchaj ${requirement_value} odcinków w jeden dzień`,
      'night_owl_sessions': `Słuchaj ${requirement_value} razy między 22:00 a 6:00`,
      'early_bird_sessions': `Słuchaj ${requirement_value} razy między 5:00 a 9:00`
    };
    
    return descriptions[requirement_type] || `Wykonaj ${requirement_value} ${requirement_type}`;
  };

  const getProgressText = (achievement) => {
    const { progress_value, requirement_value, requirement_type } = achievement;
    const percentage = Math.min((progress_value / requirement_value) * 100, 100);
    
    if (requirement_type === 'high_speed_time' || requirement_type === 'high_speed_listening_time') {
      return `${formatTime(progress_value)} / ${formatTime(requirement_value)} (${Math.round(percentage)}%)`;
    }
    
    return `${progress_value} / ${requirement_value} (${Math.round(percentage)}%)`;
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Błąd</h2>
            <p className="text-gray-600 dark:text-gray-300">Musisz być zalogowany, aby zobaczyć osiągnięcia.</p>
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
            <p className="mt-4 text-gray-600 dark:text-gray-300">Ładowanie osiągnięć...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-red-500">Błąd</h2>
            <p className="mb-4 text-gray-600 dark:text-gray-300">{error}</p>
            <button 
              onClick={fetchAchievements}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
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
      <div className="max-w-7xl mx-auto p-6">
        {/* Nagłówek */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🏆 Osiągnięcia
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Odblokowanych: {unlockedCount}/{totalCount}
          </p>
        </div>

        {/* Osiągnięcia pogrupowane według kategorii */}
        <div className="space-y-8">
          {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
            <div key={category} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {getCategoryName(category)}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryAchievements.map((achievement) => (
                  <div 
                    key={achievement.id} 
                    className={`p-4 rounded-lg border-2 transition-all ${
                      achievement.completed 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-start mb-3">
                      <span className={`text-3xl mr-3 mt-1 ${achievement.completed ? '' : 'grayscale opacity-50'}`}>
                        {achievement.icon}
                      </span>
                      <div className="flex-1">
                        <h4 className={`font-semibold text-gray-900 dark:text-white ${
                          achievement.completed ? 'text-green-600 dark:text-green-400' : ''
                        }`}>
                          {achievement.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {achievement.description}
                        </p>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          🎯 {getRequirementDescription(achievement)}
                        </div>
                      </div>
                    </div>
                    
                    {!achievement.completed && achievement.progress_value !== undefined && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1 text-gray-600 dark:text-gray-300">
                          <span>Postęp</span>
                          <span>{getProgressText(achievement)}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-600">
                          <div 
                            className="h-2 rounded-full bg-primary transition-all duration-300"
                            style={{ 
                              width: `${Math.min((achievement.progress_value / achievement.requirement_value) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          💡 {getRequirementDescription(achievement)}
                        </div>
                      </div>
                    )}
                    
                    {achievement.completed && (
                      <div className="mt-3 text-sm text-green-600 dark:text-green-400 font-medium">
                        ✅ Odblokowane {achievement.earned_at && new Date(achievement.earned_at).toLocaleDateString('pl-PL')}
                      </div>
                    )}
                    
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      🏅 {achievement.points} punktów
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Komunikat gdy brak osiągnięć */}
          {achievements.length === 0 && (
            <div className="text-center py-12 text-gray-600 dark:text-gray-300">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Brak osiągnięć</h3>
              <p>Słuchaj odcinków, aby odblokować pierwsze osiągnięcia!</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AchievementsPage; 