import { toCsv, toCsvCell } from './csv';

describe('toCsvCell', () => {
  it('leaves simple values untouched and empties null', () => {
    expect(toCsvCell('Rex')).toBe('Rex');
    expect(toCsvCell(12.5)).toBe('12.5');
    expect(toCsvCell(null)).toBe('');
    expect(toCsvCell(undefined)).toBe('');
  });

  it('quotes commas, quotes and line breaks', () => {
    expect(toCsvCell('a,b')).toBe('"a,b"');
    expect(toCsvCell('il a dit "non"')).toBe('"il a dit ""non"""');
    expect(toCsvCell('ligne 1\nligne 2')).toBe('"ligne 1\nligne 2"');
  });

  it('neutralises spreadsheet formulas', () => {
    expect(toCsvCell('=SOMME(A1:A2)')).toBe("'=SOMME(A1:A2)");
    expect(toCsvCell('@cmd')).toBe("'@cmd");
    expect(toCsvCell('-1+1')).toBe("'-1+1");
  });

  it('does not alter negative numbers', () => {
    expect(toCsvCell(-3)).toBe('-3');
  });

  it('writes dates in ISO format', () => {
    expect(toCsvCell(new Date('2026-01-10T10:00:00Z'))).toBe('2026-01-10T10:00:00.000Z');
  });
});

describe('toCsv', () => {
  it('starts with a byte order mark and uses CRLF line endings', () => {
    const csv = toCsv(['nom', 'race'], [['Rex', 'Border, Collie']]);
    expect(csv).toBe('﻿nom,race\r\nRex,"Border, Collie"\r\n');
  });
});
