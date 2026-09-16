import { Currency, Location, Money } from './models';

export const LOCATION_LABELS: Record<Location, string> = {
  JO: 'Jordan',
  SA: 'Saudi Arabia',
};

export function currencyFor(location: Location): Currency {
  return location === 'JO' ? 'JOD' : 'SAR';
}

export function formatMoney(value: Money): string {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value.trim());
  if (match === null) return value;
  const [, sign, whole, fraction = ''] = match;
  return `${sign}${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction.padEnd(2, '0').slice(0, 2)}`;
}

export function itemSymbol(title: string): string {
  const letters = title.replace(/[^\p{L}\p{N}]/gu, '');
  if (letters === '') return '?';
  return letters.charAt(0).toUpperCase() + letters.charAt(1).toLowerCase();
}

export function itemNumber(id: number): string {
  return String(id).padStart(3, '0');
}

export function itemImageUrl(id: number, width: number, height: number): string {
  return `https://picsum.photos/seed/item-${id}/${width}/${height}`;
}
