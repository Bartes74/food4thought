// Helper functions tests
describe('Helper functions', () => {
  describe('formatTime', () => {
    const formatTime = (seconds) => {
      if (isNaN(seconds)) return '0:00';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    it('should format seconds to MM:SS format', () => {
      expect(formatTime(0)).toBe('0:00');
      expect(formatTime(30)).toBe('0:30');
      expect(formatTime(60)).toBe('1:00');
      expect(formatTime(90)).toBe('1:30');
      expect(formatTime(3661)).toBe('61:01');
    });

    it('should handle invalid input', () => {
      expect(formatTime(NaN)).toBe('0:00');
      expect(formatTime(undefined)).toBe('0:00');
      expect(formatTime(null)).toBe('0:00');
    });

    it('should handle decimal values', () => {
      expect(formatTime(90.7)).toBe('1:30');
      expect(formatTime(59.9)).toBe('0:59');
    });
  });

  describe('formatTimeMinutes', () => {
    const formatTimeMinutes = (minutes) => {
      if (isNaN(minutes)) return '0:00';
      const hours = Math.floor(minutes / 60);
      const mins = Math.floor(minutes % 60);
      return hours > 0 ? `${hours}:${mins.toString().padStart(2, '0')}h` : `${mins}min`;
    };

    it('should format minutes correctly', () => {
      expect(formatTimeMinutes(30)).toBe('30min');
      expect(formatTimeMinutes(60)).toBe('1:00h');
      expect(formatTimeMinutes(90)).toBe('1:30h');
      expect(formatTimeMinutes(0)).toBe('0min');
    });

    it('should handle invalid input', () => {
      expect(formatTimeMinutes(NaN)).toBe('0:00');
      expect(formatTimeMinutes(undefined)).toBe('0:00');
      expect(formatTimeMinutes(null)).toBe('0min');
    });
  });
});