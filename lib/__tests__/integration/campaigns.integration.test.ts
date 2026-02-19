/**
 * Integration tests for campaign-related API routes.
 * These tests hit the real Postgres database and are excluded from
 * the unit-test run. They run via `pnpm test:integration` in CI's
 * e2e job (which spins up a real Postgres container).
 */

import { prisma } from "../../prisma";

// Helper to create a minimal customer + segment for test campaigns
async function createTestFixtures() {
  const customer = await prisma.customer.create({
    data: { email: `test-${Date.now()}@example.com` },
  });
  const segment = await prisma.segment.create({
    data: {
      name: `Test Segment ${Date.now()}`,
      definition: {
        kind: "event_type_in_last_days",
        eventType: "page_view",
        days: 30,
      },
    },
  });
  return { customer, segment };
}

describe("Campaign integration tests", () => {
  let testCustomerId: string;
  let testSegmentId: string;
  let testCampaignId: string;

  beforeAll(async () => {
    const { customer, segment } = await createTestFixtures();
    testCustomerId = customer.id;
    testSegmentId = segment.id;
  });

  afterAll(async () => {
    // Clean up all test data
    if (testCampaignId) {
      await prisma.send.deleteMany({ where: { campaignId: testCampaignId } });
      await prisma.emailDraft.deleteMany({
        where: { campaignId: testCampaignId },
      });
      await prisma.campaign.deleteMany({ where: { id: testCampaignId } });
    }
    await prisma.event.deleteMany({ where: { customerId: testCustomerId } });
    await prisma.customer.deleteMany({ where: { id: testCustomerId } });
    await prisma.segment.deleteMany({ where: { id: testSegmentId } });
    await prisma.$disconnect();
  });

  it("creates a campaign with a segment snapshot", async () => {
    const segment = await prisma.segment.findUniqueOrThrow({
      where: { id: testSegmentId },
    });

    const campaign = await prisma.campaign.create({
      data: {
        name: "Integration Test Campaign",
        segmentId: testSegmentId,
        segmentSnapshot: segment.definition,
        status: "draft",
      },
    });

    testCampaignId = campaign.id;

    expect(campaign.id).toBeTruthy();
    expect(campaign.status).toBe("draft");
    expect(campaign.segmentSnapshot).toEqual(segment.definition);
  });

  it("upserts an email draft idempotently", async () => {
    // First upsert
    const draft1 = await prisma.emailDraft.upsert({
      where: {
        campaignId_customerId: {
          campaignId: testCampaignId,
          customerId: testCustomerId,
        },
      },
      update: { subject: "Updated subject", body: "Updated body" },
      create: {
        campaignId: testCampaignId,
        customerId: testCustomerId,
        subject: "Original subject",
        body: "Original body",
        status: "generated",
      },
    });

    expect(draft1.subject).toBe("Original subject");

    // Second upsert — should update
    const draft2 = await prisma.emailDraft.upsert({
      where: {
        campaignId_customerId: {
          campaignId: testCampaignId,
          customerId: testCustomerId,
        },
      },
      update: { subject: "Updated subject", body: "Updated body" },
      create: {
        campaignId: testCampaignId,
        customerId: testCustomerId,
        subject: "Original subject",
        body: "Original body",
        status: "generated",
      },
    });

    expect(draft2.id).toBe(draft1.id); // same record
    expect(draft2.subject).toBe("Updated subject");

    // Only one draft record should exist
    const count = await prisma.emailDraft.count({
      where: { campaignId: testCampaignId, customerId: testCustomerId },
    });
    expect(count).toBe(1);
  });

  it("transitions draft status from generated to approved", async () => {
    const draft = await prisma.emailDraft.findFirst({
      where: { campaignId: testCampaignId, customerId: testCustomerId },
    });
    expect(draft).not.toBeNull();

    const updated = await prisma.emailDraft.update({
      where: { id: draft!.id },
      data: { status: "approved" },
    });

    expect(updated.status).toBe("approved");
  });

  it("upserts a Send record idempotently", async () => {
    const send1 = await prisma.send.upsert({
      where: {
        campaignId_customerId: {
          campaignId: testCampaignId,
          customerId: testCustomerId,
        },
      },
      update: { status: "sent", sentAt: new Date() },
      create: {
        campaignId: testCampaignId,
        customerId: testCustomerId,
        status: "queued",
      },
    });

    expect(send1.status).toBe("queued");

    const send2 = await prisma.send.upsert({
      where: {
        campaignId_customerId: {
          campaignId: testCampaignId,
          customerId: testCustomerId,
        },
      },
      update: { status: "sent", sentAt: new Date() },
      create: {
        campaignId: testCampaignId,
        customerId: testCustomerId,
        status: "queued",
      },
    });

    expect(send2.id).toBe(send1.id);
    expect(send2.status).toBe("sent");

    const count = await prisma.send.count({
      where: { campaignId: testCampaignId, customerId: testCustomerId },
    });
    expect(count).toBe(1);
  });

  it("updates campaign status to sent", async () => {
    await prisma.campaign.update({
      where: { id: testCampaignId },
      data: { status: "sent" },
    });

    const campaign = await prisma.campaign.findUniqueOrThrow({
      where: { id: testCampaignId },
    });
    expect(campaign.status).toBe("sent");
  });
});
