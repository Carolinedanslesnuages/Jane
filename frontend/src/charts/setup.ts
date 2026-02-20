import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';

let registered = false;

/** Registers the Chart.js parts Jane uses and applies the theme to every chart. */
export function setupCharts(): void {
  if (registered) {
    return;
  }
  Chart.register(ArcElement, BarElement, CategoryScale, Legend, LinearScale, LineElement, PointElement, Title, Tooltip);
  Chart.defaults.font.family = "'Source Sans 3', 'Source Sans Pro', system-ui, sans-serif";
  Chart.defaults.color = '#2b2a26';
  Chart.defaults.borderColor = '#e4dcc8';
  Chart.defaults.maintainAspectRatio = false;
  Chart.defaults.plugins.title.font = { family: "'Source Serif 4', Georgia, serif", size: 16, weight: 'bold' };
  Chart.defaults.plugins.title.align = 'start';
  registered = true;
}

/** The colour of each behaviour category, as in the stylesheet (charts cannot read CSS variables). */
export const CATEGORY_HEX: Record<string, string> = {
  EXPLORATION: '#4e7c8c',
  PLAY: '#d9923b',
  REST: '#8272a8',
  SOCIAL: '#5e8c4f',
  STRESS: '#b8503e',
  ELIMINATION: '#8c8577',
};

export const ACCENT_HEX = '#2f5d50';
