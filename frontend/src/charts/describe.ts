/** The structure shared by the charts built for Chart.js: labels and datasets of numbers. */
interface ChartLike {
  labels?: unknown[];
  datasets: { label?: string; data: (number | null)[] }[];
}

/**
 * A text for screen readers that carries the values of a chart, not only its title:
 * "Événements par catégorie : Stress 2, Jeu 1."
 */
export function describeChart(title: string, chart: ChartLike | null | undefined): string {
  if (!chart || chart.datasets.length === 0) {
    return `${title} : aucune donnée.`;
  }
  const labels = (chart.labels ?? []).map(String);
  if (chart.datasets.length === 1) {
    const entries = chart.datasets[0].data.map((value, index) => `${labels[index] ?? index + 1} ${value ?? 0}`);
    return `${title} : ${entries.join(', ')}.`;
  }
  const series = chart.datasets.map((dataset) => {
    const entries = dataset.data
      .map((value, index) => (value ? `${labels[index] ?? index + 1} ${value}` : null))
      .filter((entry): entry is string => entry !== null);
    return `${dataset.label ?? 'Série'} : ${entries.join(', ') || 'rien'}`;
  });
  return `${title}. ${series.join(' ; ')}.`;
}
