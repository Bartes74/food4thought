import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AudioPlayer from '../../components/AudioPlayer';
import axios from 'axios';

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock HTMLMediaElement
Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: jest.fn().mockImplementation(() => Promise.resolve()),
});

Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: jest.fn(),
});

Object.defineProperty(window.HTMLMediaElement.prototype, 'currentTime', {
  writable: true,
  value: 0,
});

Object.defineProperty(window.HTMLMediaElement.prototype, 'duration', {
  writable: true,
  value: 100,
});

// Mock axios
jest.mock('axios');

// Mock contexts
const mockAuthContext = {
  user: { id: 1, email: 'test@example.com', token: 'test-token' }
};

const mockLanguageContext = {
  t: (key) => key,
  formatDate: (date) => date
};

const mockThemeContext = {
  isDarkMode: false
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => mockLanguageContext
}));

jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => mockThemeContext
}));

const AllProviders = ({ children }) => <>{children}</>;

describe('AudioPlayer', () => {
  const mockEpisode = {
    id: 1,
    title: 'Test Episode',
    filename: 'test.mp3',
    series_id: 100,
    series_name: 'Test Series',
    audioUrl: '/audio/seria100/polski/test.mp3',
    user_position: 0,
    is_favorite: false,
    user_rating: 0,
    topics: [
      {
        title: 'Intro',
        timestamp: '00:00',
        timeInSeconds: 0,
        links: []
      },
      {
        title: 'Main Content',
        timestamp: '01:30',
        timeInSeconds: 90,
        links: ['https://example.com']
      }
    ]
  };

  const defaultProps = {
    episode: mockEpisode,
    onEpisodeChange: jest.fn(),
    seriesInfo: { color: '#3B82F6' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    axios.post.mockResolvedValue({ data: {} });
    window.scrollTo = jest.fn();
  });

  it('should render audio player with episode info', () => {
    render(<AudioPlayer {...defaultProps} />, { wrapper: AllProviders });
    
    expect(screen.getByText('Test Episode')).toBeInTheDocument();
    expect(screen.getByText(/Test Series/)).toBeInTheDocument();
  });

  it('should render play/pause button', () => {
    render(<AudioPlayer {...defaultProps} />, { wrapper: AllProviders });
    
    const playButton = screen.getByLabelText('Odtwórz');
    expect(playButton).toBeInTheDocument();
  });

  it('should render speed control button', () => {
    render(<AudioPlayer {...defaultProps} />, { wrapper: AllProviders });
    
    const speedButton = screen.getByText('1x');
    expect(speedButton).toBeInTheDocument();
  });

  it('should change playback speed when speed button is clicked', () => {
    render(<AudioPlayer {...defaultProps} />, { wrapper: AllProviders });
    
    const speedButton = screen.getByText('1x');
    
    // Click to change speed
    fireEvent.click(speedButton);
    expect(screen.getByText('1.25x')).toBeInTheDocument();
    
    fireEvent.click(speedButton);
    expect(screen.getByText('1.5x')).toBeInTheDocument();
  });

  it('should render skip forward and backward buttons', () => {
    render(<AudioPlayer {...defaultProps} />, { wrapper: AllProviders });
    
    const skipBackButton = screen.getByTitle('audioPlayer.rewind15');
    const skipForwardButton = screen.getByTitle('audioPlayer.forward30');
    
    expect(skipBackButton).toBeInTheDocument();
    expect(skipForwardButton).toBeInTheDocument();
  });

  it('should render favorite button', () => {
    render(<AudioPlayer {...defaultProps} />, { wrapper: AllProviders });
    
    const favoriteButton = screen.getByTestId('favorite-button');
    expect(favoriteButton).toBeInTheDocument();
  });

  it('should toggle favorite when favorite button is clicked', async () => {
    axios.post.mockResolvedValue({ data: { isFavorite: true } });
    
    render(<AudioPlayer {...defaultProps} />, { wrapper: AllProviders });
    
    const favoriteButton = screen.getByTestId('favorite-button');
    fireEvent.click(favoriteButton);
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/episodes/1/favorite',
        {},
        expect.any(Object)
      );
    });
  });

  it('should render star rating component', () => {
    render(<AudioPlayer {...defaultProps} />, { wrapper: AllProviders });
    
    const starButtons = screen.getByTestId('user-rating').querySelectorAll('svg');
    
    expect(starButtons.length).toBeGreaterThan(0);
  });

  it('should update rating when star is clicked', () => {
    axios.post.mockResolvedValue({ data: {} });
    
    render(<AudioPlayer {...defaultProps} />, { wrapper: AllProviders });
    
    const starButtons = screen.getByTestId('user-rating').querySelectorAll('svg');
    
    if (starButtons.length > 0) {
      fireEvent.click(starButtons[2]); // Click 3rd star

      const filledStars = Array.from(screen.getByTestId('user-rating').querySelectorAll('svg')).filter(
        (star) => star.getAttribute('fill') === 'currentColor'
      );
      expect(filledStars).toHaveLength(3);
      expect(axios.post).not.toHaveBeenCalledWith(
        '/api/episodes/1/rating',
        expect.any(Object),
        expect.any(Object)
      );
    }
  });

  it('should render episode topics', () => {
    render(<AudioPlayer {...defaultProps} />, { wrapper: AllProviders });
    
    expect(screen.getByText('Intro')).toBeInTheDocument();

    fireEvent.click(screen.getByText('audioPlayer.showAllTopics'));
    expect(screen.getByText('Main Content')).toBeInTheDocument();
    expect(screen.getByText('[00:00]')).toBeInTheDocument();
    expect(screen.getByText('[01:30]')).toBeInTheDocument();
  });

  it('should handle episode with no topics', () => {
    const episodeWithoutTopics = {
      ...mockEpisode,
      topics: []
    };
    
    render(<AudioPlayer {...defaultProps} episode={episodeWithoutTopics} />, { wrapper: AllProviders });
    
    // Should still render player without crashing
    expect(screen.getByText('Test Episode')).toBeInTheDocument();
  });

  it('should handle null episode gracefully', () => {
    render(<AudioPlayer {...defaultProps} episode={null} />, { wrapper: AllProviders });
    
    // Should render placeholder or empty state
    expect(screen.queryByText('Test Episode')).not.toBeInTheDocument();
  });

  it('should show progress bar', () => {
    render(<AudioPlayer {...defaultProps} />, { wrapper: AllProviders });
    
    const progressBar = screen.getByRole('slider');
    expect(progressBar).toBeInTheDocument();
  });

  it('should save progress periodically', async () => {
    jest.useFakeTimers();
    axios.post.mockResolvedValue({ data: {} });
    
    render(<AudioPlayer {...defaultProps} />, { wrapper: AllProviders });
    
    // Simulate play button click
    const playButton = screen.getByLabelText('Odtwórz');
    fireEvent.click(playButton);
    
    // Fast forward time to trigger progress save
    jest.advanceTimersByTime(5000);
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/episodes/1/progress',
        expect.any(Object),
        expect.any(Object)
      );
    });
    
    jest.useRealTimers();
  });

  it('should record listening session for achievements', async () => {
    axios.post.mockResolvedValue({ data: {} });
    
    render(<AudioPlayer {...defaultProps} />, { wrapper: AllProviders });
    
    const playButton = screen.getByLabelText('Odtwórz');
    fireEvent.click(playButton);
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/achievements/record-session',
        expect.objectContaining({
          episodeId: 1,
          playbackSpeed: 1,
          completionRate: expect.any(Number)
        })
      );
    });
  });
});
