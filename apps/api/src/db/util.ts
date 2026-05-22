/** Normalises a DB timestamp (Date or string) to an ISO string. */
export function toIso(value: unknown): string {
  return new Date(value as string | number | Date).toISOString();
}
