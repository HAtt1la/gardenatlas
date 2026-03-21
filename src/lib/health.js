/**
 * Health engine — derives open care tasks and a health status for a plant.
 *
 * Health status is categorical: 'good' | 'fair' | 'poor' | 'bad'
 * driven by the count of open (unresolved) issues:
 *   0 issues            → good  (green)
 *   1 issue             → fair  (yellow)
 *   2 issues            → poor  (orange)
 *   3+ issues           → bad   (red)
 *
 * An "issue" is a care task that is currently open — meaning:
 *   - Its trigger condition is met (season window or triggering event exists)
 *   - No satisfying action event exists within the window
 *   - The window has not yet expired
 *
 * Expired tasks that were missed are NOT counted as open issues (they just
 * represent a past miss). Sickness events are counted separately as a
 * persistent issue until a reactive spray is recorded after them.
 */

import { db } from './db.js';

function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function parseDate(str) {
  const d = new Date(str);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the health status and open issues for a plant.
 *
 * Returns:
 * {
 *   status: 'good' | 'fair' | 'poor' | 'bad',
 *   issues: [{ rule, trigger, dueDate, expiresAt, label }],
 *   noProfile: boolean
 * }
 */
export async function getPlantHealth(plantId) {
  const plant = await db.plants.get(plantId);
  if (!plant || !plant.profileId) {
    return { status: 'good', issues: [], noProfile: true };
  }

  const rules = await db.careRules.where('profileId').equals(plant.profileId).toArray();
  if (!rules.length) {
    return { status: 'good', issues: [], noProfile: false };
  }

  const events = await db.events.where('plantId').equals(plantId).toArray();
  const now = today();
  const currentMonth = now.getMonth() + 1; // 1-based

  const issues = [];

  for (const rule of rules) {
    if (rule.trigger === 'season') {
      // Season trigger: active if we're currently in one of the trigger months
      const months = rule.triggerMonths || [];
      if (!months.includes(currentMonth)) continue;

      // Window: from the 1st of the first trigger month to windowDays after the last trigger month ends
      // Simplified: window is open now (we're in a trigger month), expires windowDays from today
      const windowStart = new Date(now.getFullYear(), currentMonth - 1, 1);
      const windowEnd = addDays(windowStart, rule.windowDays);

      // Already done if a matching action event exists within the window
      const done = events.some(e =>
        e.eventType === rule.action &&
        parseDate(e.date) >= windowStart &&
        parseDate(e.date) <= windowEnd
      );
      if (done) continue;

      // Still within window — open issue
      if (now <= windowEnd) {
        issues.push({
          ruleId: rule.id,
          trigger: rule.trigger,
          action: rule.action,
          product: rule.product || '',
          purpose: rule.purpose,
          dueDate: windowEnd.toISOString().split('T')[0],
          overdue: false
        });
      }

    } else if (rule.trigger === 'event:flowering') {
      // Triggered by each flowering event that hasn't been followed by a spray within windowDays
      const floweringEvents = events.filter(e => e.eventType === 'flowering');
      for (const fe of floweringEvents) {
        const triggerDate = parseDate(fe.date);
        const windowEnd = addDays(triggerDate, rule.windowDays);

        // Check if already handled — matching action after the trigger and within window
        const done = events.some(e =>
          e.eventType === rule.action &&
          parseDate(e.date) > triggerDate &&
          parseDate(e.date) <= windowEnd
        );
        if (done) continue;

        // Expired — past the window, not an open issue (just a missed one)
        if (now > windowEnd) continue;

        // Open issue — window still active
        const overdue = now > triggerDate;
        issues.push({
          ruleId: rule.id,
          trigger: rule.trigger,
          action: rule.action,
          product: rule.product || '',
          purpose: rule.purpose,
          dueDate: windowEnd.toISOString().split('T')[0],
          overdue,
          triggerEventId: fe.id,
          triggerDate: fe.date
        });
      }

    } else if (rule.trigger === 'event:sickness') {
      // Triggered by each sickness event not followed by a reactive action within windowDays
      const sicknessEvents = events.filter(e => e.eventType === 'sickness');
      for (const se of sicknessEvents) {
        const triggerDate = parseDate(se.date);
        const windowEnd = addDays(triggerDate, rule.windowDays);

        const done = events.some(e =>
          e.eventType === rule.action &&
          parseDate(e.date) > triggerDate &&
          parseDate(e.date) <= windowEnd
        );
        if (done) continue;

        // Sickness without treatment within window — persistent issue even after expiry
        // (unlike other triggers, this one stays until treated or manually closed)
        const overdue = now > windowEnd;
        issues.push({
          ruleId: rule.id,
          trigger: rule.trigger,
          action: rule.action,
          product: rule.product || '',
          purpose: rule.purpose,
          dueDate: windowEnd.toISOString().split('T')[0],
          overdue,
          triggerEventId: se.id,
          triggerDate: se.date,
          persistent: true
        });
      }

    } else if (rule.trigger === 'event:pruned') {
      // Triggered by pruning — e.g. apply wound sealant after pruning
      const pruningEvents = events.filter(e => e.eventType === 'pruned');
      for (const pe of pruningEvents) {
        const triggerDate = parseDate(pe.date);
        const windowEnd = addDays(triggerDate, rule.windowDays);

        const done = events.some(e =>
          e.eventType === rule.action &&
          parseDate(e.date) > triggerDate &&
          parseDate(e.date) <= windowEnd
        );
        if (done) continue;
        if (now > windowEnd) continue;

        issues.push({
          ruleId: rule.id,
          trigger: rule.trigger,
          action: rule.action,
          product: rule.product || '',
          purpose: rule.purpose,
          dueDate: windowEnd.toISOString().split('T')[0],
          overdue: now > triggerDate,
          triggerEventId: pe.id,
          triggerDate: pe.date
        });
      }
    }
  }

  // Also check watering if profile tracks it (future: tracksWatering flag)
  // Skipped for now — Phase 5

  const count = issues.length;
  const status = count === 0 ? 'good' : count === 1 ? 'fair' : count === 2 ? 'poor' : 'bad';

  return { status, issues, noProfile: false };
}

/**
 * Get health status for all plants in one pass (used by GardenMap).
 * Returns { [plantId]: { status, issueCount } }
 */
export async function getAllPlantHealthStatuses(plants) {
  const nonPlaceholders = plants.filter(p => p.type !== 'placeholder' && p.profileId);
  if (!nonPlaceholders.length) return {};

  const result = {};
  await Promise.all(nonPlaceholders.map(async (plant) => {
    const health = await getPlantHealth(plant.id);
    result[plant.id] = { status: health.status, issueCount: health.issues.length };
  }));
  return result;
}

// Map health status to a display color
export const HEALTH_COLORS = {
  good: '#27ae60',
  fair: '#f0c040',
  poor: '#e67e22',
  bad:  '#e74c3c',
  none: '#95a5a6'  // no profile assigned
};
