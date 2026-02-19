import type { SegmentDefinition } from "@/lib/segments";
import type { SmartGenerateProvider } from "./types";

/**
 * Mock provider that parses natural language prompts into segment definitions
 * using simple keyword matching. No external API required.
 */
export class MockSmartGenerateProvider implements SmartGenerateProvider {
  async generate(prompt: string): Promise<SegmentDefinition> {
    const lower = prompt.toLowerCase();

    const days = parseDays(lower);
    const minCount = parseMinCount(lower);
    const eventType = parseEventType(lower);

    // "pricing page" / "visited /pricing" → event_property_equals
    const pricingMatch = lower.match(
      /(?:pricing|\/pricing|visited\s+\/\w+|viewed\s+\/\w+)/
    );
    if (pricingMatch) {
      const pathMatch = lower.match(/\/(\w+)/);
      const path = pathMatch ? `/${pathMatch[1]}` : "/pricing";
      return {
        kind: "event_property_equals",
        eventType: "page_view",
        path: "path",
        value: path,
        days,
      };
    }

    // "at least N" / ">= N" / "more than N" → event_count_gte_in_last_days
    if (minCount > 0) {
      return {
        kind: "event_count_gte_in_last_days",
        eventType,
        days,
        minCount,
      };
    }

    // Default: event_type_in_last_days
    return {
      kind: "event_type_in_last_days",
      eventType,
      days,
    };
  }
}

function parseDays(text: string): number {
  const match = text.match(/(?:last|past|within)\s+(\d+)\s*days?/);
  if (match) return parseInt(match[1], 10);

  const weekMatch = text.match(/(?:last|past)\s+(\d+)\s*weeks?/);
  if (weekMatch) return parseInt(weekMatch[1], 10) * 7;

  if (text.includes("week")) return 7;
  if (text.includes("month")) return 30;

  return 30; // default
}

function parseMinCount(text: string): number {
  // "at least 3" / "at least 10"
  const atLeast = text.match(/at\s+least\s+(\d+)/);
  if (atLeast) return parseInt(atLeast[1], 10);

  // ">= 3" / ">= 10"
  const gte = text.match(/>=\s*(\d+)/);
  if (gte) return parseInt(gte[1], 10);

  // "more than 3" → gte 4
  const moreThan = text.match(/more\s+than\s+(\d+)/);
  if (moreThan) return parseInt(moreThan[1], 10) + 1;

  return 0; // no count constraint detected
}

function parseEventType(text: string): string {
  // Map common phrases to event types
  const mappings: [RegExp, string][] = [
    [/add(?:ed)?\s+to\s+cart/, "added_to_cart"],
    [/purchas/, "purchase"],
    [/sign(?:ed)?\s*up/, "signup"],
    [/log(?:ged)?\s*in/, "login"],
    [/page\s*view/, "page_view"],
    [/check(?:ed)?\s*out/, "checkout"],
  ];

  for (const [pattern, eventType] of mappings) {
    if (pattern.test(text)) return eventType;
  }

  return "page_view"; // default
}
