// ── Segment definition types ──

export interface EventTypeInLastDays {
  kind: "event_type_in_last_days";
  eventType: string;
  days: number;
}

export interface EventPropertyEquals {
  kind: "event_property_equals";
  eventType: string;
  path: string;
  value: string;
  days: number;
}

export interface EventCountGteInLastDays {
  kind: "event_count_gte_in_last_days";
  eventType: string;
  days: number;
  minCount: number;
}

export type SegmentDefinition =
  | EventTypeInLastDays
  | EventPropertyEquals
  | EventCountGteInLastDays;

// ── Validation ──

export function validateSegmentDefinition(
  def: unknown
):
  | { valid: true; definition: SegmentDefinition }
  | { valid: false; error: string } {
  if (!def || typeof def !== "object" || Array.isArray(def)) {
    return { valid: false, error: "Definition must be a JSON object" };
  }

  const d = def as Record<string, unknown>;

  if (typeof d.kind !== "string") {
    return { valid: false, error: "Definition must have a 'kind' field" };
  }

  switch (d.kind) {
    case "event_type_in_last_days":
      return validateEventTypeInLastDays(d);
    case "event_property_equals":
      return validateEventPropertyEquals(d);
    case "event_count_gte_in_last_days":
      return validateEventCountGteInLastDays(d);
    default:
      return {
        valid: false,
        error: `Unknown definition kind: '${d.kind}'`,
      };
  }
}

function validateEventTypeInLastDays(
  d: Record<string, unknown>
):
  | { valid: true; definition: EventTypeInLastDays }
  | { valid: false; error: string } {
  if (typeof d.eventType !== "string" || d.eventType.trim() === "") {
    return { valid: false, error: "eventType must be a non-empty string" };
  }
  if (typeof d.days !== "number" || !Number.isInteger(d.days) || d.days <= 0) {
    return { valid: false, error: "days must be a positive integer" };
  }
  return {
    valid: true,
    definition: {
      kind: "event_type_in_last_days",
      eventType: d.eventType.trim(),
      days: d.days,
    },
  };
}

function validateEventPropertyEquals(
  d: Record<string, unknown>
):
  | { valid: true; definition: EventPropertyEquals }
  | { valid: false; error: string } {
  if (typeof d.eventType !== "string" || d.eventType.trim() === "") {
    return { valid: false, error: "eventType must be a non-empty string" };
  }
  if (typeof d.path !== "string" || d.path.trim() === "") {
    return { valid: false, error: "path must be a non-empty string" };
  }
  if (typeof d.value !== "string") {
    return { valid: false, error: "value must be a string" };
  }
  if (typeof d.days !== "number" || !Number.isInteger(d.days) || d.days <= 0) {
    return { valid: false, error: "days must be a positive integer" };
  }
  return {
    valid: true,
    definition: {
      kind: "event_property_equals",
      eventType: d.eventType.trim(),
      path: d.path.trim(),
      value: d.value,
      days: d.days,
    },
  };
}

function validateEventCountGteInLastDays(
  d: Record<string, unknown>
):
  | { valid: true; definition: EventCountGteInLastDays }
  | { valid: false; error: string } {
  if (typeof d.eventType !== "string" || d.eventType.trim() === "") {
    return { valid: false, error: "eventType must be a non-empty string" };
  }
  if (typeof d.days !== "number" || !Number.isInteger(d.days) || d.days <= 0) {
    return { valid: false, error: "days must be a positive integer" };
  }
  if (
    typeof d.minCount !== "number" ||
    !Number.isInteger(d.minCount) ||
    d.minCount <= 0
  ) {
    return { valid: false, error: "minCount must be a positive integer" };
  }
  return {
    valid: true,
    definition: {
      kind: "event_count_gte_in_last_days",
      eventType: d.eventType.trim(),
      days: d.days,
      minCount: d.minCount,
    },
  };
}
