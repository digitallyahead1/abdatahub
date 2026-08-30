/**
 * Timezone utilities for AB Data Hub
 * Standardizes transaction timestamps to West Africa Time (WAT, UTC+1 / Africa/Lagos)
 */

export function formatToWatIso(dateInput?: Date | string | number | null): string {
  if (!dateInput) {
    dateInput = new Date();
  }
  const date = typeof dateInput === 'string' || typeof dateInput === 'number'
    ? new Date(dateInput)
    : dateInput;

  if (isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  // Calculate WAT (West Africa Time = UTC+1)
  // Shift by 1 hour (3600000 ms) from UTC
  const watDate = new Date(date.getTime() + 1 * 60 * 60 * 1000);

  const yyyy = watDate.getUTCFullYear();
  const mm = String(watDate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(watDate.getUTCDate()).padStart(2, '0');
  const hh = String(watDate.getUTCHours()).padStart(2, '0');
  const min = String(watDate.getUTCMinutes()).padStart(2, '0');
  const ss = String(watDate.getUTCSeconds()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}+01:00`;
}

export const DateTransformer = {
  to: (value: any) => value,
  from: (value: any) => (value ? formatToWatIso(value) : value),
};
