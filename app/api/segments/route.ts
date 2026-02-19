import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSegmentDefinition } from "@/lib/segments";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (
      !body.name ||
      typeof body.name !== "string" ||
      body.name.trim() === ""
    ) {
      return NextResponse.json(
        { error: "Segment name is required" },
        { status: 400 }
      );
    }

    const result = validateSegmentDefinition(body.definition);
    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const segment = await prisma.segment.create({
      data: {
        name: body.name.trim(),
        description:
          typeof body.description === "string"
            ? body.description.trim() || null
            : null,
        definition: result.definition,
      },
    });

    return NextResponse.json({ segmentId: segment.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating segment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const segments = await prisma.segment.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ segments });
  } catch (error) {
    console.error("Error listing segments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
