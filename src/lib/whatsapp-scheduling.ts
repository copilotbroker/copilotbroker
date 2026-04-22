/**
 * Adjusts a UTC date so it falls inside the broker's working hours window (BRT/UTC-3).
 * If the date is before the start of the window, advances to the start of the same day.
 * If after, advances to the start of the next day.
 *
 * @param scheduledDate Desired UTC time
 * @param whStart "HH:MM" in BRT (e.g. "09:00")
 * @param whEnd "HH:MM" in BRT (e.g. "21:00")
 * @returns adjusted Date and whether the input was changed
 */
export function adjustToWorkingHours(
  scheduledDate: Date,
  whStart: string,
  whEnd: string
): { adjusted: Date; wasAdjusted: boolean } {
  const BRT_OFFSET = -3; // hours from UTC
  const brtTime = new Date(scheduledDate.getTime() + BRT_OFFSET * 60 * 60 * 1000);

  const [startH, startM] = whStart.split(":").map(Number);
  const [endH, endM] = whEnd.split(":").map(Number);

  const currentMinutes = brtTime.getUTCHours() * 60 + brtTime.getUTCMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
    return { adjusted: scheduledDate, wasAdjusted: false };
  }

  const targetBRT = new Date(brtTime);
  targetBRT.setUTCHours(startH, startM, 0, 0);
  if (currentMinutes > endMinutes) {
    targetBRT.setUTCDate(targetBRT.getUTCDate() + 1);
  }

  return {
    adjusted: new Date(targetBRT.getTime() - BRT_OFFSET * 60 * 60 * 1000),
    wasAdjusted: true,
  };
}

/**
 * Formats a UTC date in BRT (UTC-3) as "DD/MM HH:MM".
 */
export function formatBRT(date: Date): string {
  const brt = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  const dd = String(brt.getUTCDate()).padStart(2, "0");
  const mm = String(brt.getUTCMonth() + 1).padStart(2, "0");
  const hh = String(brt.getUTCHours()).padStart(2, "0");
  const mi = String(brt.getUTCMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${mi}`;
}

/**
 * Computes the schedule for a cadence, applying:
 * 1. effectiveStart = adjustToWorkingHours(now + initial jitter)
 * 2. each step = adjustToWorkingHours(effectiveStart + cumulative delay + small jitter)
 *
 * Step 0 has delayMinutes = 0 (immediate from effectiveStart).
 *
 * @returns array with one entry per step containing scheduled time and adjustment info
 */
export interface CadenceStepInput {
  delayMinutes: number;
}

export interface ScheduledStep {
  scheduledAt: Date;
  desiredAt: Date;
  wasAdjusted: boolean;
}

export function computeCadenceSchedule(
  steps: CadenceStepInput[],
  whStart: string,
  whEnd: string,
  initialJitterMs: number = Math.floor(Math.random() * 30 + 15) * 1000
): ScheduledStep[] {
  const now = new Date(Date.now() + initialJitterMs);
  const { adjusted: effectiveStart } = adjustToWorkingHours(now, whStart, whEnd);

  return steps.map((step, i) => {
    const cumulativeDelayMs = i === 0 ? 0 : step.delayMinutes * 60 * 1000;
    const smallJitterMs = i === 0 ? 0 : Math.floor(Math.random() * 60) * 1000;
    const desiredAt = new Date(effectiveStart.getTime() + cumulativeDelayMs + smallJitterMs);
    const { adjusted, wasAdjusted } = adjustToWorkingHours(desiredAt, whStart, whEnd);
    return { scheduledAt: adjusted, desiredAt, wasAdjusted };
  });
}
