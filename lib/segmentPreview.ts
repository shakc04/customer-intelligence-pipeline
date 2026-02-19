import { prisma } from "@/lib/prisma";
import type { SegmentDefinition } from "@/lib/segments";

export interface PreviewResult {
  count: number;
  customers: { id: string; email: string }[];
}

const PREVIEW_LIMIT = 50;

export async function evaluateSegment(
  definition: SegmentDefinition
): Promise<PreviewResult> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - definition.days);

  switch (definition.kind) {
    case "event_type_in_last_days":
      return evaluateEventTypeInLastDays(definition.eventType, cutoff);

    case "event_property_equals":
      return evaluateEventPropertyEquals(
        definition.eventType,
        definition.path,
        definition.value,
        cutoff
      );

    case "event_count_gte_in_last_days":
      return evaluateEventCountGte(
        definition.eventType,
        cutoff,
        definition.minCount
      );
  }
}

async function evaluateEventTypeInLastDays(
  eventType: string,
  cutoff: Date
): Promise<PreviewResult> {
  const events = await prisma.event.findMany({
    where: {
      type: eventType,
      occurredAt: { gte: cutoff },
    },
    select: { customerId: true },
    distinct: ["customerId"],
  });

  const customerIds = events.map((e) => e.customerId);
  return fetchCustomers(customerIds);
}

async function evaluateEventPropertyEquals(
  eventType: string,
  path: string,
  value: string,
  cutoff: Date
): Promise<PreviewResult> {
  const events = await prisma.event.findMany({
    where: {
      type: eventType,
      occurredAt: { gte: cutoff },
      properties: {
        path: [path],
        equals: value,
      },
    },
    select: { customerId: true },
    distinct: ["customerId"],
  });

  const customerIds = events.map((e) => e.customerId);
  return fetchCustomers(customerIds);
}

async function evaluateEventCountGte(
  eventType: string,
  cutoff: Date,
  minCount: number
): Promise<PreviewResult> {
  const groups = await prisma.event.groupBy({
    by: ["customerId"],
    where: {
      type: eventType,
      occurredAt: { gte: cutoff },
    },
    _count: { _all: true },
    having: {
      customerId: {
        _count: { gte: minCount },
      },
    },
  });

  const customerIds = groups.map((g) => g.customerId);
  return fetchCustomers(customerIds);
}

async function fetchCustomers(customerIds: string[]): Promise<PreviewResult> {
  if (customerIds.length === 0) {
    return { count: 0, customers: [] };
  }

  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, email: true },
    take: PREVIEW_LIMIT,
    orderBy: { email: "asc" },
  });

  return {
    count: customerIds.length,
    customers,
  };
}
