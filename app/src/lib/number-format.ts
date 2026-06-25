const RU_NUMBER_FORMAT = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 3,
});

const RU_CURRENCY_FORMAT = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 2,
});

export function toFiniteNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().replace(/\s/g, '').replace(',', '.');
    if (normalized === '') {
      return fallback;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

export function formatNumber(value: unknown): string {
  return RU_NUMBER_FORMAT.format(toFiniteNumber(value));
}

export function formatCurrency(value: unknown): string {
  return `${RU_CURRENCY_FORMAT.format(toFiniteNumber(value))} ₽`;
}

export function formatUnit(value: string | null | undefined): string {
  const normalized = (value || '').trim().toLowerCase();

  if (normalized === 'bag' || normalized === 'bags') {
    return 'меш.';
  }

  return value || '';
}
