import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import axios from 'axios';

const AchievementsPage = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const { t, language, formatDate } = useLanguage();
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
        setError(t('errors.sessionExpired'));
      } else if (error.response?.status === 403) {
        setError(t('errors.forbidden'));
      } else {
        setError(t('errors.serverError'));
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

  const getCategoryLabel = (category) => {
    // Prefer tłumaczenie; w razie braku pokaż nazwę kategorii
    const translated = t(`achievements.categories.${category}`);
    return translated || category;
  };

  const getRequirementDescription = (achievement) => {
    const { requirement_type, requirement_value } = achievement;
    const key = `achievements.requirements.${requirement_type}`;
    let template = t(key);
    if (!template) {
      // Ostateczny fallback gdy brak klucza we wszystkich językach
      return `${requirement_value} ${requirement_type}`;
    }
    const timeStr = formatTime(requirement_value);
    return template
      .replace('{value}', String(requirement_value))
      .replace('{time}', timeStr);
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
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('common.error')}</h2>
            <p className="text-gray-600 dark:text-gray-300">{t('errors.unauthorized')}</p>
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
            <p className="mt-4 text-gray-600 dark:text-gray-300">{t('common.loading')}</p>
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
            <h2 className="text-2xl font-bold mb-4 text-red-500">{t('common.error')}</h2>
            <p className="mb-4 text-gray-600 dark:text-gray-300">{error}</p>
            <button 
              onClick={fetchAchievements}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
            >
              {t('common.retry')}
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
      <div className="max-w-7xl mx-auto p-6" data-testid="achievements">
        {/* Nagłówek */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🏆 {t('achievements.title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {t('achievements.unlockedCount').replace('{unlocked}', String(unlockedCount)).replace('{total}', String(totalCount))}
          </p>
        </div>

        {/* Osiągnięcia pogrupowane według kategorii */}
        <div className="space-y-8">
          {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
            <div key={category} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {getCategoryLabel(category)}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryAchievements.map((achievement) => (
                  <div 
                    key={achievement.id} 
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col ${
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
                          {t(`achievements.titles.${achievement.slug || ''}`) || t(`achievements.titlesByType.${achievement.requirement_type || ''}`) || achievement.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {language === 'pl' ? (achievement.description || getRequirementDescription(achievement)) : getRequirementDescription(achievement)}
                        </p>
                        {achievement.completed ? (
                          <div className="mt-2 text-sm text-green-600 dark:text-green-400 font-medium">
                            ✅ {t('achievements.completed')} {achievement.earned_at && formatDate(achievement.earned_at)}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    
                    {!achievement.completed && achievement.progress_value !== undefined && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1 text-gray-600 dark:text-gray-300">
                          <span>{t('achievements.progress')}</span>
                          <span>{getProgressText(achievement)}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-600" style={{ fontSize: 0, lineHeight: 0 }}>
                          <div 
                            className="h-2 rounded-full bg-primary transition-all duration-300"
                            style={{ 
                              width: `${Math.min((achievement.progress_value / achievement.requirement_value) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-auto pt-2 text-xs text-gray-500 dark:text-gray-400 self-start">
                      🏅 {achievement.points} {t('achievements.points')}
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
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{t('achievements.noAchievements')}</h3>
              <p>{t('achievements.keepListening')}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AchievementsPage; 