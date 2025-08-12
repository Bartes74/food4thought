import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import Layout from '../components/Layout';
import HistorySection from '../components/HistorySection';
import StarRating from '../components/StarRating';

const StatsPage = () => {
  const { user } = useAuth();
  const { isDark: isDarkMode } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [seriesStats, setSeriesStats] = useState([]);
  const [topRatedEpisodes, setTopRatedEpisodes] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchStatsRef = useRef();

  const fetchStats = useCallback(async () => {
    if (!user || !user.id) return;
    try {
      const response = await axios.get(`/api/users/${user.id}/stats`);
      setStats(response.data);
      
      // Pobierz statystyki według serii
      const seriesResponse = await axios.get('/api/users/series-stats');
      setSeriesStats(seriesResponse.data || []);
      
      // Pobierz najwyżej oceniane odcinki
      const topRatedResponse = await axios.get('/api/episodes/my/top-rated');
      setTopRatedEpisodes(topRatedResponse.data || []);

      // Pobierz osiągnięcia z backendu
      const achievementsResponse = await axios.get('/api/achievements');
      setAchievements(achievementsResponse.data || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Aktualizuj ref przy każdej zmianie fetchStats
  useEffect(() => {
    fetchStatsRef.current = fetchStats;
  }, [fetchStats]);

  useEffect(() => {
    if (user && user.id) {
      fetchStatsRef.current?.();
    }
    
    // Sprawdź URL parametr tab
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'series', 'patterns', 'achievements', 'history', 'ratings'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams, user]);
  
  useEffect(() => {
    const handler = () => {
      if (user && user.id) {
        fetchStatsRef.current?.();
      }
    };
    window.addEventListener('user-rated-episode', handler);
    return () => {
      window.removeEventListener('user-rated-episode', handler);
    };
  }, [user]);

  const formatTime = (minutes) => {
    if (!minutes) return '0 min';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}min` : `${mins} min`;
  };

const getAllAchievements = () => {
    if (!stats || !achievements || !achievements.length) return { unlocked: [], locked: [], achievements: [], nextGoal: null };
    
    const totalHours = stats.totalListeningTime / 60;
    const allAchievements = [];
    
    // 🎧 OSIĄGNIĘCIA ZA LICZBĘ ODCINKÓW
    const episodeMilestones = [
      { count: 1, name: 'Pierwszy krok', description: 'Ukończono pierwszy odcinek', icon: '🎧' },
      { count: 10, name: '10 odcinków', description: 'Ukończono 10 odcinków', icon: '🏆' },
      { count: 25, name: '25 odcinków', description: 'Ukończono 25 odcinków', icon: '🏆' },
      { count: 50, name: '50 odcinków', description: 'Ukończono 50 odcinków', icon: '🏆' },
      { count: 100, name: '100 odcinków', description: 'Ukończono 100 odcinków', icon: '🏆' }
    ];

    episodeMilestones.forEach(milestone => {
      allAchievements.push({
        id: `episodes_${milestone.count}`,
        name: milestone.name,
        description: milestone.description,
        icon: milestone.icon,
        category: 'episodes',
        unlocked: stats.completedCount >= milestone.count,
        progress: Math.min(stats.completedCount, milestone.count),
        target: milestone.count,
        progressText: `${stats.completedCount}/${milestone.count}`
      });
    });

    // ⏰ OSIĄGNIĘCIA ZA CZAS SŁUCHANIA
    const timeMilestones = [
      { hours: 10, name: '10 godzin', description: '10 godzin słuchania', icon: '⏰' },
      { hours: 50, name: '50 godzin', description: '50 godzin słuchania', icon: '⏱️' },
      { hours: 100, name: '100 godzin', description: '100 godzin słuchania', icon: '📻' },
      { hours: 200, name: '200 godzin', description: '200 godzin słuchania', icon: '🎵' },
      { hours: 500, name: '500 godzin', description: '500 godzin słuchania', icon: '🎼' }
    ];

    timeMilestones.forEach(milestone => {
      allAchievements.push({
        id: `time_${milestone.hours}`,
        name: milestone.name,
        description: milestone.description,
        icon: milestone.icon,
        category: 'time',
        unlocked: totalHours >= milestone.hours,
        progress: Math.min(totalHours, milestone.hours),
        target: milestone.hours,
        progressText: `${Math.round(totalHours)}h/${milestone.hours}h`
      });
    });

    // ❤️ OSIĄGNIĘCIA ZA ULUBIONE
    const favoriteMilestones = [
      { count: 1, name: 'Pierwsze serce', description: 'Dodano pierwszy ulubiony odcinek', icon: '💖' },
      { count: 10, name: 'Miłośnik', description: '10 ulubionych odcinków', icon: '❤️' },
      { count: 25, name: 'Kolekcjoner serc', description: '25 ulubionych odcinków', icon: '💕' },
      { count: 50, name: 'Wielki miłośnik', description: '50 ulubionych odcinków', icon: '💝' }
    ];

    favoriteMilestones.forEach(milestone => {
      allAchievements.push({
        id: `favorites_${milestone.count}`,
        name: milestone.name,
        description: milestone.description,
        icon: milestone.icon,
        category: 'favorites',
        unlocked: stats.favoritesCount >= milestone.count,
        progress: Math.min(stats.favoritesCount, milestone.count),
        target: milestone.count,
        progressText: `${stats.favoritesCount}/${milestone.count}`
      });
    });

    // 📚 OSIĄGNIĘCIA Z BACKENDU (zastępują statyczne TODO)
    achievements.forEach(achievement => {
      const progress = achievement.progress_value || 0;
      const unlocked = achievement.completed === 1;
      
      let progressText = '';
      switch (achievement.requirement_type) {
        case 'high_speed_listening_time':
          progressText = `${Math.round(progress / 60)}/${Math.round(achievement.requirement_value / 60)} min na 2x`;
          break;
        case 'perfect_completions':
          progressText = `${progress}/${achievement.requirement_value} precyzyjnych`;
          break;
        case 'night_owl_sessions':
          progressText = `${progress}/${achievement.requirement_value} nocy`;
          break;
        case 'early_bird_sessions':
          progressText = `${progress}/${achievement.requirement_value} poranków`;
          break;
        case 'current_streak':
          progressText = `${progress}/${achievement.requirement_value} dni z rzędu`;
          break;
        case 'daily_episodes_count':
          progressText = `${progress}/${achievement.requirement_value} w jednym dniu`;
          break;
        default:
          progressText = `${progress}/${achievement.requirement_value}`;
      }

      allAchievements.push({
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category,
        unlocked: unlocked,
        progress: progress,
        target: achievement.requirement_value,
        progressText: progressText,
        earnedAt: achievement.earned_at
      });
    });

    // Rozdziel na odblokowane i zablokowane
    const unlocked = allAchievements.filter(a => a.unlocked);
    const locked = allAchievements.filter(a => !a.unlocked);

    // Znajdź najbliższy cel
    const nextGoal = locked
      .filter(a => a.category !== 'special') // Pomiń specjalne na razie
      .sort((a, b) => (a.target - a.progress) - (b.target - b.progress))[0];

    return { unlocked, locked, achievements: allAchievements, nextGoal };
  };

  const getMotivationalMessage = () => {
    const { nextGoal, unlocked } = getAllAchievements();
    
    if (!nextGoal) {
      return "🎉 Gratulacje! Odblokowane wszystkie podstawowe osiągnięcia!";
    }

    const remaining = nextGoal.target - nextGoal.progress;
    const category = nextGoal.category;

    if (category === 'episodes') {
      if (remaining === 1) {
        return `🎯 Jeszcze jeden odcinek do osiągnięcia "${nextGoal.name}"!`;
      }
      return `🎯 Jeszcze ${remaining} odcinków do osiągnięcia "${nextGoal.name}"!`;
    } else if (category === 'time') {
      const remainingHours = Math.ceil(remaining);
      if (remainingHours === 1) {
        return `⏰ Jeszcze około godziny słuchania do osiągnięcia "${nextGoal.name}"!`;
      }
      return `⏰ Jeszcze około ${remainingHours} godzin słuchania do osiągnięcia "${nextGoal.name}"!`;
    } else if (category === 'favorites') {
      if (remaining === 1) {
        return `❤️ Dodaj jeszcze jeden odcinek do ulubionych dla "${nextGoal.name}"!`;
      }
      return `❤️ Dodaj jeszcze ${remaining} odcinków do ulubionych dla "${nextGoal.name}"!`;
    }

    return `🚀 Dalej tak trzymaj! Następny cel: ${nextGoal.name}`;
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
        <h1 className="text-3xl font-bold mb-8 text-light-text dark:text-white">
          Twoje statystyki
        </h1>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8" data-testid="stats-tabs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Przegląd
          </button>
          <button
            onClick={() => setActiveTab('series')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'series'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Serie
          </button>
          <button
            onClick={() => setActiveTab('patterns')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'patterns'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Wzorce słuchania
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Historia
          </button>
          <button
  onClick={() => setActiveTab('achievements')}
  className={`px-4 py-2 font-medium transition-colors ${
    activeTab === 'achievements'
      ? 'text-primary border-b-2 border-primary'
      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
  }`}
>
  Osiągnięcia ({getAllAchievements().unlocked?.length || 0}/{getAllAchievements().achievements?.length || 0})
</button>
          <button
            onClick={() => setActiveTab('ratings')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'ratings'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Oceny ({topRatedEpisodes?.length || 0})
          </button>
        </div>

        {/* Przegląd */}
        {activeTab === 'overview' && stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="overview-stats">
              <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                <div className="text-4xl mb-2">🎧</div>
                <h3 className="text-lg font-semibold mb-1">Całkowity czas</h3>
                <p className="text-2xl font-bold text-primary">{formatTime(stats.totalListeningTime)}</p>
              </div>
              
              <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                <div className="text-4xl mb-2">✅</div>
                <h3 className="text-lg font-semibold mb-1">Ukończone</h3>
                <p className="text-2xl font-bold text-green-500">{stats.completedCount}</p>
                <p className="text-sm text-gray-500">odcinków</p>
              </div>
              
              <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                <div className="text-4xl mb-2">▶️</div>
                <h3 className="text-lg font-semibold mb-1">W trakcie</h3>
                <p className="text-2xl font-bold text-yellow-500">{stats.inProgressCount}</p>
                <p className="text-sm text-gray-500">odcinków</p>
              </div>
              
              <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                <div className="text-4xl mb-2">❤️</div>
                <h3 className="text-lg font-semibold mb-1">Ulubione</h3>
                <p className="text-2xl font-bold text-red-500">{stats.favoritesCount}</p>
                <p className="text-sm text-gray-500">odcinków</p>
              </div>
            </div>
            
            {/* Informacja o ocenionych odcinkach */}
            {topRatedEpisodes && topRatedEpisodes.length > 0 && (
              <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg mt-6`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">⭐</div>
                    <div>
                      <h3 className="text-lg font-semibold text-light-text dark:text-white">
                        Masz {topRatedEpisodes?.length || 0} ocenionych odcinków
                      </h3>
                      <p className="text-sm text-light-textSecondary dark:text-gray-400">
                        Zobacz swoje najwyżej ocenione odcinki w tabie "Oceny"
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('ratings')}
                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
                  >
                    Zobacz oceny
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Statystyki według serii */}
        {activeTab === 'series' && seriesStats && (
          <div className="space-y-6" data-testid="series-stats">
            {seriesStats.map((series) => (
              <div key={series.id} className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">{series.name}</h3>
                  <span className="text-sm text-gray-500">
                    {series.completedCount}/{series.totalCount} ukończonych
                  </span>
                </div>
                
                <div className="mb-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(series.completedCount / series.totalCount) * 100}%`,
                        backgroundColor: series.color || '#3B82F6'
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {Math.round((series.completedCount / series.totalCount) * 100)}% ukończone
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Czas słuchania:</span>
                    <span className="ml-2 font-medium">{formatTime(series.totalTime || 0)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Ostatnio:</span>
                    <span className="ml-2 font-medium">
                      {series.lastPlayed ? new Date(series.lastPlayed).toLocaleDateString('pl-PL') : 'Nigdy'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {seriesStats.length === 0 && (
              <div className="text-center py-12">
                <p className="text-light-textSecondary dark:text-gray-400">
                  Brak danych o seriach
                </p>
              </div>
            )}
          </div>
        )}

        {/* Wzorce słuchania */}
        {activeTab === 'patterns' && (
          <div className="space-y-6" data-testid="listening-patterns">
            <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
              <h3 className="text-xl font-semibold mb-4">Twoje nawyki słuchania</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Średni czas słuchania dziennie</p>
                  <p className="text-2xl font-bold">
                    {stats.averageDailyListening ? formatTime(Math.round(stats.averageDailyListening)) : '0 min'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Preferowana prędkość</p>
                  <p className="text-2xl font-bold">{stats.preferredSpeed || '1.0'}x</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Średnia długość sesji</p>
                  <p className="text-2xl font-bold">
                    {stats.averageSessionLength ? formatTime(Math.round(stats.averageSessionLength)) : '0 min'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Osiągnięcia */}
        {activeTab === 'achievements' && (
          <div className="space-y-6" data-testid="achievements">
            {/* Motywacyjny komunikat */}
            <div className={`${isDarkMode ? 'bg-primary/10 border-primary/20' : 'bg-primary/5 border-primary/20'} rounded-xl p-6 border-2`}>
              <div className="text-center">
                <h3 className="text-xl font-bold text-primary mb-2">
                  {getMotivationalMessage()}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Odblokowanych osiągnięć: {getAllAchievements().unlocked.length}/{getAllAchievements().achievements.length}
                </p>
              </div>
            </div>

            {/* Postęp do najbliższego celu */}
            {getAllAchievements().nextGoal && (
              <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                <h3 className="text-lg font-semibold mb-4 text-primary">🎯 Najbliższy cel</h3>
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{getAllAchievements().nextGoal.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{getAllAchievements().nextGoal.name}</h4>
                    <p className="text-sm text-gray-500 mb-2">{getAllAchievements().nextGoal.description}</p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className="h-3 bg-primary rounded-full transition-all duration-500"
                        style={{ 
                          width: `${(getAllAchievements().nextGoal.progress / getAllAchievements().nextGoal.target) * 100}%` 
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{getAllAchievements().nextGoal.progressText}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Odblokowane osiągnięcia */}
            {getAllAchievements().unlocked.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-green-600">
                  🏆 Odblokowane osiągnięcia ({getAllAchievements().unlocked.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getAllAchievements().unlocked.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg border-2 border-green-200 dark:border-green-800`}
                    >
                      <div className="text-4xl mb-3">{achievement.icon}</div>
                      <h3 className="font-semibold mb-1 text-green-600">{achievement.name}</h3>
                      <p className="text-sm text-gray-500">{achievement.description}</p>
                      <div className="mt-2">
                        <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                          <div className="h-2 bg-green-500 rounded-full w-full"></div>
                        </div>
                        <p className="text-xs text-green-600 mt-1">✅ Ukończone!</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Zablokowane osiągnięcia - grupowane po kategoriach */}
            {getAllAchievements().locked.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-600">
                  🔒 Do odblokowania ({getAllAchievements().locked.length})
                </h3>
                
                {/* Grupa po kategoriach */}
                {['episodes', 'time', 'favorites', 'special'].map(category => {
                  const categoryAchievements = getAllAchievements().locked.filter(a => a.category === category);
                  if (categoryAchievements.length === 0) return null;
                  
                  const categoryNames = {
                    episodes: '🎧 Za odcinki',
                    time: '⏰ Za czas słuchania', 
                    favorites: '❤️ Za ulubione',
                    special: '⭐ Specjalne'
                  };
                  
                  return (
                    <div key={category} className="mb-6">
                      <h4 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-300">
                        {categoryNames[category]}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryAchievements.map((achievement) => (
                          <div
                            key={achievement.id}
                            className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg opacity-75`}
                          >
                            <div className="text-4xl mb-3 grayscale">{achievement.icon}</div>
                            <h3 className="font-semibold mb-1">{achievement.name}</h3>
                            <p className="text-sm text-gray-500">{achievement.description}</p>
                            {achievement.category !== 'special' && (
                              <div className="mt-2">
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="h-2 bg-gray-400 rounded-full transition-all duration-500"
                                    style={{ 
                                      width: `${(achievement.progress / achievement.target) * 100}%` 
                                    }}
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{achievement.progressText}</p>
                              </div>
                            )}
                            {achievement.category === 'special' && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500">🔜 Wkrótce dostępne</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legenda */}
            <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
              <h3 className="text-lg font-semibold mb-4">📋 Legenda osiągnięć</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2 text-primary">🎧 Za odcinki</h4>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• 1, 10, 25, 50, 100 ukończonych odcinków</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-primary">⏰ Za czas słuchania</h4>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• 10, 50, 100, 200, 500 godzin</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-primary">❤️ Za ulubione</h4>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• 1, 10, 25, 50 ulubionych odcinków</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-primary">⭐ Specjalne</h4>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• Maraton (7 dni z rzędu)</li>
                    <li>• Słuchacz dnia (5 odcinków/dzień)</li>
                    <li>• Nocny marynarz & Ranny ptaszek</li>
                    <li>• Szybki jak błyskawica (2x speed)</li>
                    <li>• Precyzyjny słuchacz (95%+ ukończenie)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Historia */}
        {activeTab === 'history' && (
          <div data-testid="listening-history">
            <HistorySection />
          </div>
        )}

        {/* Oceny */}
        {activeTab === 'ratings' && (
          <div className="space-y-6" data-testid="user-ratings">
            <h2 className="text-2xl font-bold text-light-text dark:text-white mb-6">
              Twoje oceny odcinków
            </h2>
            <div className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
              {topRatedEpisodes && topRatedEpisodes.length > 0 ? (
                <div className="space-y-4">
                  {topRatedEpisodes.map((episode, index) => (
                    <div
                      key={episode.id}
                      className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg font-bold text-primary">#{index + 1}</span>
                            <h4 className="font-semibold text-light-text dark:text-white">
                              {episode.title}
                            </h4>
                          </div>
                          <p className="text-sm text-light-textSecondary dark:text-gray-400 mb-2">
                            {episode.series_name} • {new Date(episode.date_added).toLocaleDateString('pl-PL')}
                          </p>
                          <div className="flex items-center gap-4">
                            <StarRating
                              rating={episode.rating}
                              readonly={true}
                              size="sm"
                              showHalfStars={false}
                            />
                            <span className="text-sm text-light-textSecondary dark:text-gray-400">
                              Twoja ocena: {episode.rating}/5
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {episode.completed ? (
                            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded">
                              Ukończony
                            </span>
                          ) : episode.position > 0 ? (
                            <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded">
                              W trakcie
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                              Nie rozpoczęty
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">⭐</div>
                  <h4 className="text-lg font-semibold mb-2">Brak ocenionych odcinków</h4>
                  <p className="text-light-textSecondary dark:text-gray-400">
                    Zacznij oceniać odcinki, aby zobaczyć je tutaj!
                  </p>
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