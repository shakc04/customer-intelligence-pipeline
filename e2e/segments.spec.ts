import { test, expect } from "@playwright/test";

test.describe("Segments", () => {
  test("full flow: create segment via form → view detail → preview matches", async ({
    page,
    request,
  }) => {
    // Step 1: Seed two customers with events via API
    const email1 = `seg-cart-${Date.now()}@example.com`;
    const email2 = `seg-nocart-${Date.now()}@example.com`;

    // Customer 1: has an added_to_cart event
    await request.post("/api/events", {
      data: { email: email1, type: "added_to_cart", properties: {} },
    });

    // Customer 2: has a page_view event only
    await request.post("/api/events", {
      data: { email: email2, type: "page_view", properties: {} },
    });

    // Step 2: Navigate to new segment page
    await page.goto("/segments/new");
    await expect(
      page.getByRole("heading", { name: "New Segment", level: 1 })
    ).toBeVisible();

    // Step 3: Fill in segment form
    const segmentName = `Cart Users ${Date.now()}`;
    await page.getByLabel("Segment Name *").fill(segmentName);
    await page.getByLabel("Description").fill("Users who added to cart");
    await page
      .getByLabel("Rule Type *")
      .selectOption("event_type_in_last_days");
    await page.getByLabel("Event Type *").fill("added_to_cart");
    await page.getByLabel("Days (lookback window) *").fill("30");

    // Step 4: Submit
    await page.getByRole("button", { name: "Create Segment" }).click();

    // Step 5: Should redirect to segment detail page
    await expect(
      page.getByRole("heading", { name: segmentName, level: 1 })
    ).toBeVisible();

    // Step 6: Preview should auto-load and show matching customer
    await expect(page.getByText("matching customer")).toBeVisible();
    await expect(page.getByText(email1)).toBeVisible();

    // Step 7: Non-matching customer should NOT be in preview
    await expect(page.getByText(email2)).not.toBeVisible();
  });

  test("segments list page shows created segments", async ({
    page,
    request,
  }) => {
    // Create a segment via API
    const segmentName = `List Test ${Date.now()}`;
    const res = await request.post("/api/segments", {
      data: {
        name: segmentName,
        definition: {
          kind: "event_type_in_last_days",
          eventType: "purchase",
          days: 7,
        },
      },
    });
    expect(res.status()).toBe(201);

    // Navigate to segments list
    await page.goto("/segments");
    await expect(
      page.getByRole("heading", { name: "Segments", level: 1 })
    ).toBeVisible();

    // Verify segment appears
    await expect(page.getByText(segmentName)).toBeVisible();
  });

  test("smart generate fills the form", async ({ page, request }) => {
    // Seed an event so preview will work later
    const email = `sg-smart-${Date.now()}@example.com`;
    await request.post("/api/events", {
      data: { email, type: "added_to_cart", properties: {} },
    });

    await page.goto("/segments/new");

    // Type a natural language prompt
    await page
      .locator("textarea")
      .first()
      .fill("Users who added to cart in the last 7 days");

    // Click Smart Generate
    await page.getByRole("button", { name: "Smart Generate" }).click();

    // Form should be populated
    await expect(page.getByLabel("Event Type *")).toHaveValue("added_to_cart");
    await expect(page.getByLabel("Days (lookback window) *")).toHaveValue("7");
  });

  test("event_count_gte segment: only matches customers with enough events", async ({
    page,
    request,
  }) => {
    const emailFrequent = `seg-freq-${Date.now()}@example.com`;
    const emailRare = `seg-rare-${Date.now()}@example.com`;

    // Frequent user: 3 page_view events
    for (let i = 0; i < 3; i++) {
      await request.post("/api/events", {
        data: { email: emailFrequent, type: "page_view", properties: {} },
      });
    }

    // Rare user: 1 page_view event
    await request.post("/api/events", {
      data: { email: emailRare, type: "page_view", properties: {} },
    });

    // Create segment: at least 3 page_views in 30 days
    const segmentName = `Frequent Viewers ${Date.now()}`;
    await page.goto("/segments/new");
    await page.getByLabel("Segment Name *").fill(segmentName);
    await page
      .getByLabel("Rule Type *")
      .selectOption("event_count_gte_in_last_days");
    await page.getByLabel("Event Type *").fill("page_view");
    await page.getByLabel("Days (lookback window) *").fill("30");
    await page.getByLabel("Minimum Count *").fill("3");

    await page.getByRole("button", { name: "Create Segment" }).click();

    // Should show segment detail with preview
    await expect(
      page.getByRole("heading", { name: segmentName, level: 1 })
    ).toBeVisible();
    await expect(page.getByText("matching customer")).toBeVisible();

    // Frequent user should match
    await expect(page.getByText(emailFrequent)).toBeVisible();

    // Rare user should NOT match
    await expect(page.getByText(emailRare)).not.toBeVisible();
  });

  test("API validation: missing name returns 400", async ({ request }) => {
    const res = await request.post("/api/segments", {
      data: {
        definition: {
          kind: "event_type_in_last_days",
          eventType: "purchase",
          days: 7,
        },
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("name");
  });

  test("API validation: invalid definition returns 400", async ({
    request,
  }) => {
    const res = await request.post("/api/segments", {
      data: {
        name: "Bad Segment",
        definition: { kind: "nonexistent_rule" },
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Unknown");
  });
});
