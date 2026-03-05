import PDFDocument from 'pdfkit';

export interface ReportData {
  animalName: string;
  speciesLabel: string;
  generatedAt: Date;
  periodLabel: string;
  totals: { observations: number; observedDays: number; measuredSeconds: number; stressCount: number };
  categories: { label: string; durationSeconds: number; eventCount: number }[];
  stress: { topBehavior?: string; topLocation?: string; topStimulus?: string; averagePerDay: number };
  cognitiveTests: { label: string; count: number; averageDurationSeconds: number; averageScore?: number }[];
}

const FOREST = '#2F5D50';
const INK = '#2B2A26';
const MUTED = '#6B665A';

export function formatReportDuration(seconds: number): string {
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours > 0) {
    return `${hours} h ${String(minutes).padStart(2, '0')} min`;
  }
  return minutes > 0 ? `${minutes} min ${String(total % 60).padStart(2, '0')} s` : `${total} s`;
}

function heading(document: PDFKit.PDFDocument, text: string): void {
  document.moveDown(1).fillColor(FOREST).font('Times-Bold').fontSize(15).text(text).moveDown(0.3);
  document.fillColor(INK).font('Helvetica').fontSize(10.5);
}

function table(document: PDFKit.PDFDocument, rows: string[][], widths: number[]): void {
  const left = document.page.margins.left;
  rows.forEach((row, index) => {
    const top = document.y;
    row.forEach((cell, column) => {
      const offset = widths.slice(0, column).reduce((sum, width) => sum + width, 0);
      document
        .font(index === 0 ? 'Helvetica-Bold' : 'Helvetica')
        .fillColor(index === 0 ? FOREST : INK)
        .text(cell, left + offset, top, { width: widths[column] - 8 });
    });
    document.moveDown(0.4);
    document.x = left;
  });
  document.fillColor(INK).font('Helvetica');
}

/** Renders the behavioural assessment of an animal as a PDF document. */
export function renderReport(data: ReportData, options: { compress?: boolean } = {}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: 'A4', margin: 54, compress: options.compress ?? true });
    const chunks: Buffer[] = [];
    document.on('data', (chunk: Buffer) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);

    document.font('Times-Bold').fontSize(24).fillColor(FOREST).text('Bilan comportemental', { align: 'left' });
    document.font('Helvetica').fontSize(10.5).fillColor(MUTED);
    document.text(`Animal : ${data.animalName} (${data.speciesLabel.toLowerCase()})`);
    document.text(`Période : ${data.periodLabel}`);
    document.text(`Rapport généré le ${data.generatedAt.toLocaleDateString('fr-FR')}`);
    document.fillColor(INK);

    heading(document, 'Résumé');
    table(
      document,
      [
        ['Indicateur', 'Valeur'],
        ['Observations', String(data.totals.observations)],
        ['Jours observés', String(data.totals.observedDays)],
        ['Temps mesuré', formatReportDuration(data.totals.measuredSeconds)],
        ['Signes de stress', String(data.totals.stressCount)],
      ],
      [260, 200],
    );

    heading(document, 'Répartition par catégorie');
    table(
      document,
      [
        ['Catégorie', 'Temps mesuré', 'Événements'],
        ...data.categories.map((category) => [
          category.label,
          formatReportDuration(category.durationSeconds),
          String(category.eventCount),
        ]),
      ],
      [200, 160, 100],
    );

    if (data.totals.stressCount > 0) {
      heading(document, 'Analyse du stress');
      const rows = [
        ['Indicateur', 'Valeur'],
        ['Moyenne par jour', data.stress.averagePerDay.toFixed(1)],
      ];
      if (data.stress.topBehavior) rows.push(['Signe le plus fréquent', data.stress.topBehavior]);
      if (data.stress.topLocation) rows.push(['Lieu le plus fréquent', data.stress.topLocation]);
      if (data.stress.topStimulus) rows.push(['Stimulus le plus fréquent', data.stress.topStimulus]);
      table(document, rows, [260, 200]);
    }

    if (data.cognitiveTests.length > 0) {
      heading(document, 'Tests cognitifs');
      table(
        document,
        [
          ['Épreuve', 'Durée moyenne', 'Score moyen', 'Nombre'],
          ...data.cognitiveTests.map((test) => [
            test.label,
            formatReportDuration(test.averageDurationSeconds),
            test.averageScore === undefined ? 'N/A' : test.averageScore.toFixed(1),
            String(test.count),
          ]),
        ],
        [190, 120, 100, 60],
      );
    }

    document.moveDown(2).fontSize(8).fillColor(MUTED).text("Rapport généré par Jane, carnet d'observation du comportement animal.");
    document.end();
  });
}
