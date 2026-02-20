/** Characters that make a spreadsheet read a cell as a formula. */
const FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

/** Escapes one CSV cell, neutralising spreadsheet formulas. */
export function toCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  let text = value instanceof Date ? value.toISOString() : String(value);
  if (typeof value === 'string' && FORMULA_PREFIXES.some((prefix) => text.startsWith(prefix))) {
    text = `'${text}`;
  }
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Builds a CSV document (UTF-8 with a byte order mark, so that Excel reads the accents). */
export function toCsv(header: string[], rows: unknown[][]): string {
  const lines = [header, ...rows].map((row) => row.map(toCsvCell).join(','));
  return `﻿${lines.join('\r\n')}\r\n`;
}
