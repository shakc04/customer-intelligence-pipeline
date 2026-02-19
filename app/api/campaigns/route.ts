import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (
      !body.name ||
      typeof body.name !== "string" ||
      body.name.trim() === ""
    ) {
      return NextResponse.json(
        { error: "Campaign name is required" },
        { status: 400 }
      );
    }

    if (!body.segmentId || typeof body.segmentId !== "string") {
      return NextResponse.json(
        { error: "segmentId is required" },
        { status: 400 }
      );
    }

    const segment = await prisma.segment.findUnique({
      where: { id: body.segmentId },
    });

    if (!segment) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: body.name.trim(),
        description:
          typeof body.description === "string"
            ? body.description.trim() || null
            : null,
        segmentId: segment.id,
        segmentSnapshot: segment.definition,
        status: "draft",
      },
    });

    return NextResponse.json({ campaignId: campaign.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        updatedAt: true,
        segment: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("Error listing campaigns:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
