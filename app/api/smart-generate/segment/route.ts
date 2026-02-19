import { NextRequest, NextResponse } from "next/server";
import { smartGenerateSegmentDefinition } from "@/lib/smartGenerate/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (
      !body.prompt ||
      typeof body.prompt !== "string" ||
      body.prompt.trim() === ""
    ) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const definition = await smartGenerateSegmentDefinition(body.prompt.trim());

    return NextResponse.json({ definition });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
