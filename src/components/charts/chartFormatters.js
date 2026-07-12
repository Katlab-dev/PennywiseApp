import { formatCurrency } from '../../utils/formatCurrency';

export function formatCompactCurrency(value) {
  const amount = Number(value) || 0;
  if (Math.abs(amount) >= 1000000) return `R ${(amount / 1000000).toFixed(1)}m`;
  if (Math.abs(amount) >= 1000) return `R ${(amount / 1000).toFixed(1)}k`;
  return `R ${amount.toFixed(0)}`;
}

export function FinanceTooltip({ active, payload, label, labelFormatter }) {
  if (!active || !payload?.length) return null;
  const displayLabel = labelFormatter ? labelFormatter(label) : label;

  return (
    <div className="chart-tooltip">
      {displayLabel && <div className="chart-tooltip__label">{displayLabel}</div>}
      {payload.filter((item) => item.value != null).map((item) => (
        <div className="chart-tooltip__row" key={`${item.name}-${item.dataKey}`}>
          <span className="chart-tooltip__key">
            <span className="chart-tooltip__dot" style={{ background: item.color || item.fill }} />
            {item.name}
          </span>
          <strong>{formatCurrency(item.value)}</strong>
        </div>
      ))}
    </div>
  );
}
