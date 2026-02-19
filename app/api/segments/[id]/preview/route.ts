import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSegmentDefinition } from "@/lib/segments";
import { evaluateSegment } from "@/lib/segmentPreview";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const segment = await prisma.segment.findUnique({
      where: { id },
    });

    if (!segment) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    const result = validateSegmentDefinition(segment.definition);
    if (!result.valid) {
      return NextResponse.json(
        { error: `Invalid segment definition: ${result.error}` },
        { status: 400 }
      );
    }

    const preview = await evaluateSegment(result.definition);

    return NextResponse.json(preview);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
