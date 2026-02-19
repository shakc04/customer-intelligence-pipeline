import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        drafts: {
          where: { status: "approved" },
          include: { customer: { select: { id: true, email: true } } },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (campaign.drafts.length === 0) {
      return NextResponse.json(
        { error: "No approved drafts to send" },
        { status: 400 }
      );
    }

    // Simulate sends: upsert a Send record for each approved draft
    let sentCount = 0;
    let failedCount = 0;

    for (const draft of campaign.drafts) {
      const { id: customerId } = draft.customer;

      // Simulate a small random failure rate (deterministic: no actual randomness in tests)
      const simulatedSuccess = true; // Always succeed in simulation

      if (simulatedSuccess) {
        await prisma.send.upsert({
          where: {
            campaignId_customerId: { campaignId: id, customerId },
          },
          update: { status: "sent", sentAt: new Date(), error: null },
          create: {
            campaignId: id,
            customerId,
            status: "sent",
            sentAt: new Date(),
          },
        });
        sentCount++;
      } else {
        await prisma.send.upsert({
          where: {
            campaignId_customerId: { campaignId: id, customerId },
          },
          update: { status: "failed", error: "Simulated send failure" },
          create: {
            campaignId: id,
            customerId,
            status: "failed",
            error: "Simulated send failure",
          },
        });
        failedCount++;
      }
    }

    // Update campaign status based on results
    const newStatus =
      failedCount === 0 ? "sent" : sentCount === 0 ? "failed" : "sent"; // partial success → treat as sent

    await prisma.campaign.update({
      where: { id },
      data: { status: newStatus },
    });

    return NextResponse.json({ sentCount, failedCount });
  } catch (error) {
    console.error("Error sending campaign:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
