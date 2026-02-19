import { NextRequest, NextResponse } from "next/server";
import { smartGenerateDraft } from "@/lib/smartDraft/client";

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { customerEmail, recentEventType, recommendedSku } = body as Record<
      string,
      unknown
    >;

    if (typeof customerEmail !== "string" || !customerEmail.trim()) {
      return NextResponse.json(
        { error: "customerEmail is required" },
        { status: 400 }
      );
    }

    const draft = await smartGenerateDraft({
      customerEmail: customerEmail.trim(),
      recentEventType:
        typeof recentEventType === "string" ? recentEventType : undefined,
      recommendedSku:
        typeof recommendedSku === "string" ? recommendedSku : null,
    });

    return NextResponse.json(draft);
  } catch (error) {
    console.error("Error generating smart draft:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
