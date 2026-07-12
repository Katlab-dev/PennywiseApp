import React from 'react';
import './CurrencyRain.css';

const PARTICLES = [
  ['R', 3, 0, 15, 26, 'mint'], ['$', 8, -7, 20, -18, 'blue'], ['R', 13, -2, 13, 34, 'coral'],
  ['¢', 18, -11, 17, -26, 'violet'], ['R', 23, -4, 22, 18, 'mint'], ['$', 29, -15, 15, 42, 'coral'],
  ['R', 34, -8, 19, -34, 'blue'], ['£', 39, -1, 14, 23, 'violet'], ['R', 44, -13, 21, -20, 'mint'],
  ['$', 49, -5, 16, 38, 'blue'], ['R', 54, -18, 23, -32, 'coral'], ['€', 59, -9, 18, 16, 'violet'],
  ['R', 64, -3, 14, 30, 'mint'], ['$', 69, -12, 20, -35, 'coral'], ['R', 74, -6, 17, 24, 'blue'],
  ['¥', 79, -16, 24, -22, 'violet'], ['R', 84, -10, 15, 36, 'mint'], ['$', 89, -4, 19, -28, 'blue'],
  ['R', 94, -14, 22, 20, 'coral'], ['¢', 97, -7, 16, -16, 'mint'],
];

export default function CurrencyRain() {
  return (
    <div className="currency-rain" aria-hidden="true">
      {PARTICLES.map(([symbol, left, delay, duration, drift, tone], index) => (
        <span
          className={`currency-rain__particle currency-rain__particle--${tone}`}
          style={{
            '--rain-left': `${left}%`,
            '--rain-delay': `${delay}s`,
            '--rain-duration': `${duration}s`,
            '--rain-drift': `${drift}px`,
            '--rain-scale': 0.68 + (index % 5) * 0.14,
          }}
          key={`${symbol}-${left}`}
        >
          <i>{symbol}</i>
        </span>
      ))}
    </div>
  );
}
