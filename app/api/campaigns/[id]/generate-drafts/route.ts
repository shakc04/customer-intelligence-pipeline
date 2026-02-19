import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSegmentDefinition } from "@/lib/segments";
import { evaluateSegment } from "@/lib/segmentPreview";
import {
  extractRecommendedSku,
  extractRecentEventType,
} from "@/lib/campaignUtils";
import { smartGenerateDraft } from "@/lib/smartDraft/client";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({ where: { id } });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Validate stored snapshot
    const result = validateSegmentDefinition(campaign.segmentSnapshot);
    if (!result.valid) {
      return NextResponse.json(
        { error: `Invalid segment snapshot: ${result.error}` },
        { status: 400 }
      );
    }

    // Evaluate segment using snapshot to find matching customers
    const preview = await evaluateSegment(result.definition);
    const customerIds = preview.customers.map((c) => c.id);

    if (customerIds.length === 0) {
      return NextResponse.json({ draftedCount: 0 });
    }

    // Batch-fetch recent events for all matched customers (avoids N+1)
    const cutoff = new Date(Date.now() - THIRTY_DAYS_MS);
    const recentEvents = await prisma.event.findMany({
      where: {
        customerId: { in: customerIds },
        occurredAt: { gte: cutoff },
      },
      select: {
        customerId: true,
        type: true,
        properties: true,
        occurredAt: true,
      },
      orderBy: { occurredAt: "desc" },
    });

    // Group events by customer
    const eventsByCustomer = new Map<string, typeof recentEvents>();
    for (const event of recentEvents) {
      if (!eventsByCustomer.has(event.customerId)) {
        eventsByCustomer.set(event.customerId, []);
      }
      eventsByCustomer.get(event.customerId)!.push(event);
    }

    // Generate and upsert drafts
    let draftedCount = 0;
    for (const { id: customerId, email: customerEmail } of preview.customers) {
      const events = eventsByCustomer.get(customerId) ?? [];
      const recommendedSku = extractRecommendedSku(events);
      const recentEventType = extractRecentEventType(events);

      const { subject, body } = await smartGenerateDraft({
        customerEmail,
        recentEventType,
        recommendedSku,
      });

      await prisma.emailDraft.upsert({
        where: { campaignId_customerId: { campaignId: id, customerId } },
        update: { subject, body, recommendedSku },
        create: { campaignId: id, customerId, subject, body, recommendedSku },
      });

      draftedCount++;
    }

    // Advance campaign status if drafts were created
    if (draftedCount > 0) {
      await prisma.campaign.update({
        where: { id },
        data: { status: "drafted" },
      });
    }

    return NextResponse.json({ draftedCount });
  } catch (error) {
    console.error("Error generating drafts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
