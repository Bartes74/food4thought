// Minimal test with no imports or setup
test('minimal test', () => {
  expect(1 + 1).toBe(2);
});

describe('minimal describe', () => {
  test('another minimal test', () => {
    expect(2 * 2).toBe(4);
  });
});
