const MOSCOW_OFFSET_MS = 3 * 60 * 60 * 1000;

export function parseSlotToUtc(slot: string): Date {
  // slot format: YYYY-MM-DDTHH:mm (local Moscow time)
  const local = new Date(`${slot}:00+03:00`);
  if (Number.isNaN(local.getTime())) {
    throw new Error('Неверный формат слота');
  }
  return local;
}

export function formatSlotMoscow(date: Date): string {
  const ms = date.getTime() + MOSCOW_OFFSET_MS;
  const d = new Date(ms);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export function toInputValueMoscow(date: Date): string {
  const ms = date.getTime() + MOSCOW_OFFSET_MS;
  const d = new Date(ms);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}
