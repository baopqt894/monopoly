/** Shared creation validation; missing fields preserve old room/snapshot defaults. */
import type { MatchDurationMinutes } from '@typhu/contracts';

export const MATCH_DURATIONS: readonly MatchDurationMinutes[] = [15, 30, 45, 60];
export function resolveMatchDuration(options: { durationMinutes?: number }): { durationMinutes: MatchDurationMinutes } {
  const durationMinutes = options.durationMinutes === undefined ? 60 : options.durationMinutes;
  if (!MATCH_DURATIONS.includes(durationMinutes as MatchDurationMinutes))
    throw new Error('Thời gian chơi phải là 15, 30, 45 hoặc 60 phút.');
  return { durationMinutes: durationMinutes as MatchDurationMinutes };
}

export function resolveMoneySettings(options: { startingCash?: number; goSalary?: number }) {
  const startingCash = options.startingCash === undefined ? 1500 : options.startingCash;
  const goSalary = options.goSalary === undefined ? 200 : options.goSalary;
  if (!Number.isSafeInteger(startingCash) || startingCash < 1 || startingCash > 1_000_000)
    throw new Error('Tiền khởi đầu phải là số nguyên từ 1 đến 1.000.000.');
  if (!Number.isSafeInteger(goSalary) || goSalary < 0 || goSalary > 1_000_000)
    throw new Error('Tiền qua Xuất phát phải là số nguyên từ 0 đến 1.000.000.');
  return { startingCash, goSalary };
}
