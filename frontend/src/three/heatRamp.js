// Colour scale for the 0–100 heat stress index (HTSI). Each stop sits at the middle
// of one category band, so a city's colour always matches its category.
export const HEAT_RAMP = [
  { at: 10, label: 'Low', color: '#2aa98f' },
  { at: 30, label: 'Moderate', color: '#e8c547' },
  { at: 50, label: 'High', color: '#f0832e' },
  { at: 70, label: 'Very high', color: '#e23a36' },
  { at: 90, label: 'Extreme', color: '#c2188b' },
];

export const NO_DATA_COLOR = '#5b5470';

const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (rgb) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

/**
 * @param {number | null | undefined} score heat stress index, 0–100
 * @returns {string} hex colour
 */
export function heatColor(score) {
  if (score === null || score === undefined || Number.isNaN(score)) return NO_DATA_COLOR;
  const first = HEAT_RAMP[0];
  const last = HEAT_RAMP[HEAT_RAMP.length - 1];
  if (score <= first.at) return first.color;
  if (score >= last.at) return last.color;

  const upper = HEAT_RAMP.findIndex((stop) => score <= stop.at);
  const a = HEAT_RAMP[upper - 1];
  const b = HEAT_RAMP[upper];
  const t = (score - a.at) / (b.at - a.at);
  const from = toRgb(a.color);
  const to = toRgb(b.color);
  return toHex(from.map((v, i) => v + (to[i] - v) * t));
}
