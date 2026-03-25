const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatINR(value) {
  if (value == null || value === '') return '—';
  const amount = Number(value);
  if (Number.isNaN(amount)) return '—';
  return inrFormatter.format(amount);
}
