/** Human readable duration: "42 s", "2 min 05 s", "1 h 30 min". Empty when there is no duration. */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) {
    return '';
  }
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours > 0) {
    return `${hours} h ${String(minutes).padStart(2, '0')} min`;
  }
  if (minutes > 0) {
    return `${minutes} min ${String(total % 60).padStart(2, '0')} s`;
  }
  return `${total} s`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR');
}

/** Exact age in calendar years and months. */
export function computeAge(birthDate: string, today: Date = new Date()): { years: number; months: number } {
  const born = new Date(birthDate);
  let months = (today.getFullYear() - born.getFullYear()) * 12 + (today.getMonth() - born.getMonth());
  if (today.getDate() < born.getUTCDate()) {
    months -= 1;
  }
  return { years: Math.floor(months / 12), months: months % 12 };
}

export function formatAge(birthDate: string | null, today: Date = new Date()): string {
  if (!birthDate) {
    return 'Non renseigné';
  }
  const { years, months } = computeAge(birthDate, today);
  const yearsText = years > 0 ? `${years} an${years > 1 ? 's' : ''}` : '';
  return [yearsText, `${months} mois`].filter(Boolean).join(' ');
}
