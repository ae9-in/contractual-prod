const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatINR(value) {
  if (value == null || value === '') return '—';
  const normalized = typeof value === 'string'
    ? value.replace(/[^0-9.-]/g, '')
    : value;
  const amount = Number(normalized);
  if (Number.isNaN(amount)) return '—';
  return inrFormatter.format(amount);
}
