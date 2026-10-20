const { isEnabled } = require('./featureSettings');

describe('feature settings', () => {
  test('boş değer varsayılanı açık kabul eder', () => {
    expect(isEnabled('', true)).toBe(true);
    expect(isEnabled(null, true)).toBe(true);
  });

  test('kapalı yazımları kapatır', () => {
    expect(isEnabled('false')).toBe(false);
    expect(isEnabled('0')).toBe(false);
    expect(isEnabled('Hayır')).toBe(false);
    expect(isEnabled('off')).toBe(false);
  });

  test('açık yazımları açar', () => {
    expect(isEnabled('true', false)).toBe(true);
    expect(isEnabled('Evet', false)).toBe(true);
  });
});
