import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import StarRating from './StarRating';

const AudioPlayer = ({ episode, onEpisodeEnd, seriesInfo, onRatingChange }) => {
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const audioRef = useRef(null);
  
  // Stan playera
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(episode?.is_favorite || false);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [showFullInfo, setShowFullInfo] = useState(false);
  const [userRating, setUserRating] = useState(0);
  
  // Stan dla trackingu osiągnięć
  const [sessionStartTime, setSessionStartTime] = useState(null);
  
  // Tematy z pliku linków
  const topics = episode?.topics || [];

  // Pobierz kolor serii z seriesInfo lub użyj domyślnego
  const seriesColor = seriesInfo?.color || '#3B82F6';

  // Oblicz numer odcinka w serii
  const getEpisodeNumber = () => {
    if (!episode || !episode.episode_number) return '001';
    return String(episode.episode_number).padStart(3, '0');
  };

  // Załaduj zapisaną pozycję
  useEffect(() => {
    if (episode?.user_position && audioRef.current) {
      audioRef.current.currentTime = episode.user_position;
      setCurrentTime(episode.user_position);
    }
    setIsFavorite(episode?.is_favorite || false);
    setUserRating(episode?.user_rating || 0);
    // Reset stanu rozwinięcia gdy zmienia się odcinek
    setShowFullInfo(false);
    // Scroll do góry przy zmianie odcinka
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [episode]);

  // Zapisuj postęp co 5 sekund
  useEffect(() => {
    if (!episode?.id || !isPlaying) return;

    const interval = setInterval(() => {
      saveProgress();
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, currentTime, episode?.id]);

  // Funkcja do rejestrowania sesji słuchania dla osiągnięć
  const recordListeningSession = async (action) => {
    if (!user || !episode?.id) return;
    
    try {
      const now = new Date().toISOString();
      const sessionData = {
        episodeId: episode.id,
        startTime: sessionStartTime || now,
        endTime: action === 'end' ? now : null,
        playbackSpeed: playbackRate,
        completionRate: duration > 0 ? currentTime / duration : 0,
        durationSeconds: Math.floor(currentTime)
      };

      await axios.post('/api/achievements/record-session', sessionData);
    } catch (error) {
      console.error('Błąd podczas rejestrowania sesji:', error);
    }
  };

  // Formatowanie czasu
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Zapisz postęp
  const saveProgress = async () => {
    if (!episode?.id) return;
    
    try {
      await axios.post(`/api/episodes/${episode.id}/progress`, {
        position: Math.floor(currentTime),
        completed: false
      });
    } catch (error) {
      console.error('Błąd zapisywania postępu:', error);
    }
  };

  // Obsługa play/pause
  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      recordListeningSession('pause');
    } else {
      audioRef.current?.play();
      if (!sessionStartTime) {
        setSessionStartTime(new Date().toISOString());
      }
      recordListeningSession('play');
    }
    setIsPlaying(!isPlaying);
  };

  // Przewijanie
  const skip = (seconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  // Zmiana prędkości
  const speeds = [0.8, 1, 1.25, 1.5, 2];
  const changeSpeed = () => {
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    setPlaybackRate(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  // Aktualizacja aktualnego tematu na podstawie czasu
  useEffect(() => {
    if (topics.length === 0) return;
    
    const currentTopic = topics.findIndex((topic, index) => {
      const nextTopic = topics[index + 1];
      return currentTime >= topic.timestamp && (!nextTopic || currentTime < nextTopic.timestamp);
    });
    
    if (currentTopic !== -1 && currentTopic !== currentTopicIndex) {
      setCurrentTopicIndex(currentTopic);
    }
  }, [currentTime, topics]);

  // Obsługa progress bara
  const handleProgressChange = (e) => {
    const newTime = (e.target.value / 100) * duration;
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  // Aktualizacja czasu
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Załadowanie metadanych
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Obsługa zakończenia odcinka
  const handleEnded = async () => {
    console.log('=== AUDIO ENDED ===');
    console.log('Episode finished:', episode?.title);
    setIsPlaying(false);
    
    // Zapisz jako ukończony
    if (episode?.id) {
      try {
        console.log('Marking episode as completed:', episode.id);
        await axios.post(`/api/episodes/${episode.id}/progress`, {
          position: 0,
          completed: true
        });
        console.log('Episode marked as completed successfully');
        
        // Rejestruj sesję dla osiągnięć
        await recordListeningSession('end');
        
        // Oznacz odcinek jako ukończony w systemie osiągnięć
        try {
          await axios.post('/api/achievements/complete-episode', {
            episodeId: episode.id,
            completionRate: 1.0, // 100% ukończony
            playbackSpeed: playbackRate
          });
        } catch (error) {
          console.error('Błąd podczas rejestrowania ukończenia odcinka dla osiągnięć:', error);
        }
      } catch (error) {
        console.error('Błąd oznaczania jako ukończony:', error);
      }
    }
    
    // Wywołaj callback
    if (onEpisodeEnd) {
      console.log('Calling onEpisodeEnd callback');
      onEpisodeEnd();
    }
    console.log('=== AUDIO END HANDLING COMPLETE ===');
  };

  // Toggle ulubione
  const toggleFavorite = async () => {
    if (!episode?.id) return;
    
    try {
      const response = await axios.post(`/api/episodes/${episode.id}/favorite`);
      setIsFavorite(response.data.isFavorite);
    } catch (error) {
      console.error('Błąd zmiany ulubionych:', error);
    }
  };

  // Obsługa oceniania
  const handleRatingChange = async (rating) => {
    if (!episode?.id) return;
    
    try {
      await axios.post(`/api/episodes/${episode.id}/rating`, { rating });
      setUserRating(rating);
      
      // Odśwież dane odcinka po ocenieniu
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/episodes/${episode.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const updatedEpisode = await response.json();
        // Aktualizuj episode object z nowymi danymi
        if (updatedEpisode.user_rating !== undefined) {
          setUserRating(updatedEpisode.user_rating);
        }
      }
      // Wywołaj callback do odświeżenia listy odcinków
      if (typeof onRatingChange === 'function') {
        onRatingChange();
      }
      // Wywołaj globalny event do odświeżenia statystyk
      window.dispatchEvent(new Event('user-rated-episode'));
    } catch (error) {
      console.error('Błąd podczas oceniania odcinka:', error);
    }
  };

  const currentTopic = topics[currentTopicIndex] || null;

  if (!episode) {
    return (
      <div className={`w-full max-w-4xl mx-auto ${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-2xl shadow-xl p-6`}>
        <p className="text-center text-light-textSecondary dark:text-gray-400">
          Wybierz odcinek do odtworzenia
        </p>
      </div>
    );
  }

  // Przetwarzanie informacji dodatkowych
  const getDisplayInfo = () => {
    if (!episode?.additional_info) return { text: '', hasMore: false };
    
    const fullText = episode.additional_info;
    const maxChars = 500;
    
    if (showFullInfo || fullText.length <= maxChars) {
      return { text: fullText, hasMore: false };
    }
    
    return { 
      text: fullText.substring(0, maxChars) + ' [...]', 
      hasMore: true 
    };
  };

  const { text: displayText, hasMore } = getDisplayInfo();
  const hasAdditionalInfo = episode?.additional_info && episode.additional_info.length > 0;
  const showExpandButton = hasAdditionalInfo && episode.additional_info.length > 500;

  return (
    <div className={`w-full max-w-4xl mx-auto ${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-2xl shadow-xl p-6`}>
      {/* Ukryty element audio */}
      <audio
        ref={audioRef}
        src={episode.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPause={() => saveProgress()}
      />

      {/* Tytuł i informacje */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {episode.title}
          </h2>
          <StarRating
            rating={userRating}
            onRatingChange={handleRatingChange}
            size="lg"
            className="flex-shrink-0"
          />
        </div>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {episode.series_name} • {new Date(episode.date_added || Date.now()).toLocaleDateString('pl-PL')}
        </p>
      </div>

      {/* Grafika i linki */}
      <div className="flex gap-6 mb-6">
        {/* Grafika serii - 300x300 px */}
        <div className="flex-shrink-0">
          {seriesInfo?.image ? (
            <div className="relative w-[300px] h-[300px]">
              <img 
                src={seriesInfo.image}
                alt={episode.series_name}
                className="w-full h-full rounded-lg shadow-lg object-cover"
                onError={(e) => {
                  console.error('Błąd ładowania grafiki serii:', seriesInfo.image);
                  e.target.style.display = 'none';
                }}
              />
              {/* Numer odcinka na grafice */}
              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg">
                <span className="text-5xl font-bold">{getEpisodeNumber()}</span>
              </div>
            </div>
          ) : (
            <div 
              className="w-[300px] h-[300px] rounded-lg shadow-lg relative overflow-hidden flex items-center justify-center"
              style={{ backgroundColor: seriesColor }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <span className="text-7xl font-bold text-white/90 tracking-wider relative z-10">
                {getEpisodeNumber()}
              </span>
            </div>
          )}
        </div>

        {/* Aktualny temat i linki */}
        <div className="flex-1">
          <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {currentTopic ? currentTopic.title : 'Tematy odcinka'}
          </h3>
          
          {currentTopic && currentTopic.links.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {currentTopic.links.map((link, index) => (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block text-sm ${isDarkMode ? 'text-primary-light hover:text-primary' : 'text-primary hover:text-primary-dark'} transition-colors truncate`}
                >
                  {link}
                </a>
              ))}
            </div>
          ) : topics.length > 0 ? (
            <button
              onClick={() => setShowAllTopics(!showAllTopics)}
              className="text-sm text-primary hover:text-primary-dark transition-colors"
            >
              {showAllTopics ? 'Ukryj wszystkie tematy' : 'Pokaż wszystkie tematy'}
            </button>
          ) : (
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Brak linków dla tego odcinka
            </p>
          )}

          {/* Lista wszystkich tematów */}
          {showAllTopics && topics.length > 0 && (
            <div className="mt-4 space-y-2 max-h-52 overflow-y-auto">
              {topics.map((topic, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.currentTime = topic.timestamp;
                    }
                  }}
                  className={`block w-full text-left text-sm p-2 rounded ${
                    currentTopicIndex === index 
                      ? 'bg-primary/10 text-primary' 
                      : 'hover:bg-gray-100 dark:hover:bg-dark-bg'
                  } transition-colors`}
                >
                  <span className="font-medium">
                    [{Math.floor(topic.timestamp / 60)}:{(topic.timestamp % 60).toString().padStart(2, '0')}]
                  </span>{' '}
                  {topic.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Player controls */}
      <div className="mb-4">
        {/* Progress bar */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max="100"
            value={duration ? (currentTime / duration) * 100 : 0}
            onChange={handleProgressChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, ${seriesColor} 0%, ${seriesColor} ${duration ? (currentTime / duration) * 100 : 0}%, ${isDarkMode ? '#718096' : '#e5e7eb'} ${duration ? (currentTime / duration) * 100 : 0}%, ${isDarkMode ? '#718096' : '#e5e7eb'} 100%)`
            }}
          />
          <div className="flex justify-between mt-2">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {formatTime(currentTime)}
            </span>
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Kontrolki */}
        <div className="flex items-center justify-center gap-4">
          {/* Cofnij 15s */}
          <button
            onClick={() => skip(-15)}
            className={`relative p-3 rounded-full ${isDarkMode ? 'hover:bg-dark-bg' : 'hover:bg-gray-100'} transition-colors group`}
            title="Cofnij 15 sekund"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
            </svg>
            <span className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>15s</span>
          </button>

          {/* Play/Pause - zawsze z kolorem serii */}
          <button
            onClick={togglePlayPause}
            className={`p-4 rounded-full text-white transition-all transform hover:scale-105`}
            style={{ backgroundColor: seriesColor }}
            disabled={!episode.audioUrl}
          >
            {isPlaying ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          {/* Przewiń 30s */}
          <button
            onClick={() => skip(30)}
            className={`relative p-3 rounded-full ${isDarkMode ? 'hover:bg-dark-bg' : 'hover:bg-gray-100'} transition-colors group`}
            title="Przewiń 30 sekund"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.01 19V23l5-5-5-5v4c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6h2c0-4.42-3.58-8-8-8s-8 3.58-8 8 3.58 8 8 8z"/>
            </svg>
            <span className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>30s</span>
          </button>
        </div>

        {/* Dodatkowe kontrolki */}
        <div className="flex items-center justify-center gap-4 mt-4">
          {/* Prędkość */}
          <button
            onClick={changeSpeed}
            className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-dark-bg hover:bg-dark-border' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
          >
            <span className="text-sm font-medium">{playbackRate}x</span>
          </button>

          {/* Lista tematów */}
          <button
            onClick={() => setShowAllTopics(!showAllTopics)}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-dark-bg' : 'hover:bg-gray-100'} transition-colors`}
            title="Lista tematów"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
            </svg>
          </button>

          {/* Ulubione */}
          <button
            onClick={toggleFavorite}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-dark-bg' : 'hover:bg-gray-100'} transition-colors`}
            title={isFavorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
          >
            <svg 
              className={`w-6 h-6 transition-colors ${isFavorite ? 'text-red-500 fill-current' : ''}`} 
              fill={isFavorite ? 'currentColor' : 'none'} 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* Głośność */}
          <div className="relative">
            <button
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-dark-bg' : 'hover:bg-gray-100'} transition-colors`}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {showVolumeSlider && (
              <div className={`absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 p-2 ${isDarkMode ? 'bg-dark-bg' : 'bg-white'} rounded-lg shadow-lg`}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume * 100}
                  onChange={(e) => {
                    const newVolume = e.target.value / 100;
                    setVolume(newVolume);
                    if (audioRef.current) {
                      audioRef.current.volume = newVolume;
                    }
                  }}
                  className="h-24 w-2"
                  style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dodatkowe informacje */}
      {hasAdditionalInfo && (
        <div className={`mt-6 p-4 ${isDarkMode ? 'bg-dark-bg' : 'bg-gray-50'} rounded-xl relative`}>
          <div className="flex justify-between items-start mb-2">
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Dodatkowe informacje
            </h3>
            {showExpandButton && (
              <button
                onClick={() => setShowFullInfo(!showFullInfo)}
                className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
                title={showFullInfo ? "Zwiń" : "Rozwiń"}
              >
                <svg 
                  className={`w-5 h-5 transform transition-transform ${showFullInfo ? 'rotate-180' : ''}`} 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                </svg>
              </button>
            )}
          </div>
          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} whitespace-pre-wrap`}>
            {displayText}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;