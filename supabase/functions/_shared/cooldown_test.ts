import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { cooldownInfo, isPersonalCooldownActive, PERSONAL_COOLDOWN_HOURS } from "./cooldown.ts";

Deno.test("inactive when connectedAt is null/undefined", () => {
  assertEquals(isPersonalCooldownActive(null), false);
  assertEquals(isPersonalCooldownActive(undefined), false);
  assertEquals(cooldownInfo(null).active, false);
});

Deno.test("inactive when connected exactly 24h ago", () => {
  const ts = new Date(Date.now() - PERSONAL_COOLDOWN_HOURS * 3600 * 1000 - 1000).toISOString();
  assertEquals(isPersonalCooldownActive(ts), false);
});

Deno.test("active when connected 1h ago, ~23h remaining", () => {
  const ts = new Date(Date.now() - 1 * 3600 * 1000).toISOString();
  const info = cooldownInfo(ts);
  assertEquals(info.active, true);
  assertEquals(info.hoursRemaining, 23);
});

Deno.test("active when connected 22.8h ago (Bibiana scenario), ~2h remaining", () => {
  const ts = new Date(Date.now() - 22.8 * 3600 * 1000).toISOString();
  const info = cooldownInfo(ts);
  assertEquals(info.active, true);
  assertEquals(info.hoursRemaining, 2);
});

Deno.test("inactive when connected 25h ago (Pedro scenario)", () => {
  const ts = new Date(Date.now() - 25 * 3600 * 1000).toISOString();
  assertEquals(isPersonalCooldownActive(ts), false);
});
