import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_STATUSES = ["approved", "rejected"] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; draftId: string }> }
) {
  try {
    const { id: campaignId, draftId } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { status } = body as Record<string, unknown>;
    if (
      typeof status !== "string" ||
      !ALLOWED_STATUSES.includes(status as AllowedStatus)
    ) {
      return NextResponse.json(
        { error: `status must be one of: ${ALLOWED_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify draft belongs to this campaign
    const existing = await prisma.emailDraft.findFirst({
      where: { id: draftId, campaignId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    // Only allow transitions from "generated"
    if (existing.status !== "generated") {
      return NextResponse.json(
        { error: `Cannot transition draft from status "${existing.status}"` },
        { status: 409 }
      );
    }

    const updated = await prisma.emailDraft.update({
      where: { id: draftId },
      data: { status: status as AllowedStatus },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating draft:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
