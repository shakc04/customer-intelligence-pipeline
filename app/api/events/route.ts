import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidEmail, normalizeEmail } from "@/lib/utils";

interface CreateEventRequest {
  email?: string;
  customer?: { email?: string };
  type: string;
  properties?: object;
  occurredAt?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateEventRequest = await request.json();
    const email = body.email ?? body.customer?.email;

    // Validate required fields
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (
      !body.type ||
      typeof body.type !== "string" ||
      body.type.trim() === ""
    ) {
      return NextResponse.json(
        { error: "Event type is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate properties (must be an object if provided)
    let properties = {};
    if (body.properties !== undefined) {
      if (
        typeof body.properties !== "object" ||
        body.properties === null ||
        Array.isArray(body.properties)
      ) {
        return NextResponse.json(
          { error: "Properties must be a JSON object" },
          { status: 400 }
        );
      }
      properties = body.properties;
    }

    // Parse occurredAt or default to current time
    let occurredAt: Date;
    if (body.occurredAt) {
      occurredAt = new Date(body.occurredAt);
      if (isNaN(occurredAt.getTime())) {
        return NextResponse.json(
          { error: "Invalid occurredAt date format" },
          { status: 400 }
        );
      }
    } else {
      occurredAt = new Date();
    }

    // Get idempotency key from header (optional)
    const idempotencyKey = request.headers.get("Idempotency-Key") || null;

    // Upsert customer by email
    const customer = await prisma.customer.upsert({
      where: { email: normalizedEmail },
      update: {},
      create: { email: normalizedEmail },
    });

    // Check for existing event with same idempotency key
    if (idempotencyKey) {
      const existingEvent = await prisma.event.findFirst({
        where: {
          customerId: customer.id,
          idempotencyKey: idempotencyKey,
        },
      });

      if (existingEvent) {
        return NextResponse.json(
          {
            created: false,
            eventId: existingEvent.id,
            customerId: customer.id,
          },
          { status: 200 }
        );
      }
    }

    // Create new event
    const event = await prisma.event.create({
      data: {
        customerId: customer.id,
        type: body.type.trim(),
        properties: properties,
        occurredAt: occurredAt,
        idempotencyKey: idempotencyKey,
      },
    });

    return NextResponse.json(
      {
        created: true,
        eventId: event.id,
        customerId: customer.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
