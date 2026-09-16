import { currencyFor, formatMoney, itemNumber, itemSymbol } from './format';

describe('formatMoney', () => {
  it('keeps two decimals without float rounding', () => {
    expect(formatMoney('150.00')).toBe('150.00');
    expect(formatMoney('0.1')).toBe('0.10');
    expect(formatMoney('20')).toBe('20.00');
  });

  it('adds thousands separators', () => {
    expect(formatMoney('1234567.89')).toBe('1,234,567.89');
  });

  it('returns malformed values unchanged', () => {
    expect(formatMoney('n/a')).toBe('n/a');
  });
});

describe('item helpers', () => {
  it('maps location to currency', () => {
    expect(currencyFor('JO')).toBe('JOD');
    expect(currencyFor('SA')).toBe('SAR');
  });

  it('derives the tile symbol and number', () => {
    expect(itemSymbol('Sword of Valor')).toBe('Sw');
    expect(itemSymbol('')).toBe('?');
    expect(itemNumber(7)).toBe('007');
  });
});
