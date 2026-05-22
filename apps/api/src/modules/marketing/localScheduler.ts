/**
 * In-process recurring scheduler — the fallback used when Temporal (and its
 * durable Schedules) is unavailable, so "定期触发" still works out of the box.
 *
 * Timers live only for the lifetime of the API process; the marketing service
 * re-arms active in-process schedules on startup.
 */
const timers = new Map<string, NodeJS.Timeout>();

export function startLocalSchedule(
  id: string,
  intervalMinutes: number,
  tick: () => void,
): void {
  stopLocalSchedule(id);
  timers.set(id, setInterval(tick, intervalMinutes * 60_000));
}

export function stopLocalSchedule(id: string): void {
  const timer = timers.get(id);
  if (timer) {
    clearInterval(timer);
    timers.delete(id);
  }
}
