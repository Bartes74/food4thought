// Simple test to verify Jest frontend setup works
describe('Frontend Testing Setup', () => {
  it('should run basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have jsdom environment', () => {
    expect(window).toBeDefined();
    expect(document).toBeDefined();
  });

  it('should be able to create DOM elements', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello World';
    expect(div.textContent).toBe('Hello World');
  });

  it('should support modern JavaScript features', () => {
    const arr = [1, 2, 3];
    const doubled = arr.map(x => x * 2);
    expect(doubled).toEqual([2, 4, 6]);
  });
});