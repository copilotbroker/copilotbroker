// Personal WhatsApp instance cooldown after connection.
// Prevents brokers from sending the FIRST outbound message to a lead
// during the first N hours after connecting their personal QR code.
// This protects against Meta blocking newly-connected numbers.

export const PERSONAL_COOLDOWN_HOURS = 24;

export function isPersonalCooldownActive(connectedAt: string | null | undefined): boolean {
  if (!connectedAt) return false;
  const ts = new Date(connectedAt).getTime();
  if (Number.isNaN(ts)) return false;
  const elapsedMs = Date.now() - ts;
  return elapsedMs < PERSONAL_COOLDOWN_HOURS * 60 * 60 * 1000;
}

export function cooldownInfo(connectedAt: string | null | undefined) {
  if (!connectedAt) return { active: false, unlocksAt: null as string | null, hoursRemaining: 0 };
  const ts = new Date(connectedAt).getTime();
  if (Number.isNaN(ts)) return { active: false, unlocksAt: null, hoursRemaining: 0 };
  const unlocksAtMs = ts + PERSONAL_COOLDOWN_HOURS * 60 * 60 * 1000;
  const remainingMs = unlocksAtMs - Date.now();
  return {
    active: remainingMs > 0,
    unlocksAt: new Date(unlocksAtMs).toISOString(),
    hoursRemaining: Math.max(0, Math.ceil(remainingMs / (60 * 60 * 1000))),
  };
}
