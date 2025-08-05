import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';

const HistorySection = () => {
  const { isDarkMode } = useTheme();
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/episodes/my');
      const allEpisodes = [
        ...(response.data.completed || []).map(ep => ({ ...ep, status: 'completed' })),
        ...(response.data.inProgress || []).map(ep => ({ ...ep, status: 'inProgress' }))
      ];
      allEpisodes.sort((a, b) => new Date(b.last_played) - new Date(a.last_played));
      setEpisodes(allEpisodes);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEpisodes = episodes.filter(ep => {
    if (filter === 'all') return true;
    return ep.status === filter;
  });

  const handlePlayEpisode = (episodeId) => {
    localStorage.setItem('playEpisodeId', episodeId);
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtry */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-primary text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Wszystkie ({episodes.length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'completed'
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Ukończone ({episodes.filter(e => e.status === 'completed').length})
        </button>
        <button
          onClick={() => setFilter('inProgress')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'inProgress'
              ? 'bg-yellow-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          W trakcie ({episodes.filter(e => e.status === 'inProgress').length})
        </button>
      </div>

      {/* Lista odcinków */}
      <div className="space-y-3">
        {filteredEpisodes.map((episode) => (
          <div
            key={episode.id}
            className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg shadow-lg p-4 cursor-pointer hover:shadow-xl transition-all`}
            onClick={() => handlePlayEpisode(episode.id)}
          >
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h3 className="font-semibold text-light-text dark:text-white">
                  {episode.title}
                </h3>
                <p className="text-sm text-light-textSecondary dark:text-gray-400">
                  {episode.series_name} • Ostatnio: {new Date(episode.last_played).toLocaleDateString('pl-PL')}
                </p>
                {episode.status === 'inProgress' && episode.position > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${(episode.position / episode.duration) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="ml-4">
                {episode.status === 'completed' ? (
                  <span className="text-green-500">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </span>
                ) : (
                  <span className="text-yellow-500">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEpisodes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-light-textSecondary dark:text-gray-400">
            Brak odcinków w historii
          </p>
        </div>
      )}
    </div>
  );
};

export default HistorySection;