export function formatCurrency(value, symbol = 'R', locale = 'en-US') {
  // TODO: Read currency/locale from user settings later
  const amount = Number(value) || 0;
  const formatted = amount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol} ${formatted}`;
}
