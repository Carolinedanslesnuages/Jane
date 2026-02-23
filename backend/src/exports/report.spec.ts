import { formatReportDuration, renderReport, ReportData } from './report';

const data: ReportData = {
  animalName: 'Rex',
  generatedAt: new Date('2026-02-20T10:00:00Z'),
  periodLabel: '13/02/2026 au 20/02/2026',
  totals: { observations: 12, observedDays: 4, measuredSeconds: 5400, stressCount: 3 },
  categories: [
    { label: 'Repos', durationSeconds: 5400, eventCount: 0 },
    { label: 'Stress', durationSeconds: 0, eventCount: 3 },
  ],
  stress: { topBehavior: 'Aboyer', topLocation: 'Maison', averagePerDay: 0.4 },
  cognitiveTests: [{ label: 'Test du détour', count: 2, averageDurationSeconds: 15, averageScore: 7.5 }],
};

describe('formatReportDuration', () => {
  it('formats seconds, minutes and hours', () => {
    expect(formatReportDuration(42)).toBe('42 s');
    expect(formatReportDuration(125)).toBe('2 min 05 s');
    expect(formatReportDuration(5400)).toBe('1 h 30 min');
  });
});

describe('renderReport', () => {
  it('produces a PDF document', async () => {
    const pdf = await renderReport(data);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(1000);
  });

  it('is a complete document that grows with its content', async () => {
    const full = await renderReport(data, { compress: false });
    const quiet = await renderReport(
      { ...data, totals: { ...data.totals, stressCount: 0 }, cognitiveTests: [] },
      { compress: false },
    );
    expect(full.subarray(-6).toString()).toContain('%%EOF');
    expect(full.length).toBeGreaterThan(quiet.length);
  });

  it('works for a animal without stress signs or tests', async () => {
    const quiet = { ...data, totals: { ...data.totals, stressCount: 0 }, cognitiveTests: [] };
    await expect(renderReport(quiet)).resolves.toBeInstanceOf(Buffer);
  });
});
