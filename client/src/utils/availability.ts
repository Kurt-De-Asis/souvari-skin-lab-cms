export interface SlotLike {
  staff_id: number;
  staff_name?: string;
  start?: string;
  time?: string;
}

function slotStart(slot: SlotLike): string {
  return slot.start ?? slot.time ?? '';
}

/** Free-slot count per specialist for the day — a proxy for how booked they are. */
function freeSlotsByStaff(slots: SlotLike[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const s of slots) {
    if (!s.staff_id) continue;
    counts.set(s.staff_id, (counts.get(s.staff_id) || 0) + 1);
  }
  return counts;
}

/**
 * Collapses per-specialist availability into one entry per start time.
 * When several specialists are free at the same time, the least-busy one
 * (most remaining free slots that day, tie-break by lowest staff id) is
 * auto-assigned so a concrete staff_id always travels with the chosen slot.
 */
export function dedupeSlotsByTime<T extends SlotLike>(slots: T[]): T[] {
  if (slots.length === 0) return slots;

  const freeByStaff = freeSlotsByStaff(slots);
  const byTime = new Map<string, T[]>();

  for (const s of slots) {
    const start = slotStart(s);
    if (!start) continue;
    const group = byTime.get(start);
    if (group) {
      group.push(s);
    } else {
      byTime.set(start, [s]);
    }
  }

  const result: T[] = [];
  for (const group of byTime.values()) {
    if (group.length === 1) {
      result.push(group[0]);
      continue;
    }
    let pick = group[0];
    let pickFree = freeByStaff.get(pick.staff_id) ?? 0;
    for (const s of group) {
      const free = freeByStaff.get(s.staff_id) ?? 0;
      if (free > pickFree || (free === pickFree && s.staff_id < pick.staff_id)) {
        pick = s;
        pickFree = free;
      }
    }
    result.push(pick);
  }

  return result;
}