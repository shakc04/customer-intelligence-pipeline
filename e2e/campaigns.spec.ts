import { test, expect } from "@playwright/test";

test.describe("Campaigns", () => {
  /**
   * Full happy-path flow:
   * 1. Seed a customer + event via API
   * 2. Create a segment via API
   * 3. Create a campaign via the UI form
   * 4. Generate drafts on the campaign detail page
   * 5. Approve a draft
   * 6. Send approved drafts
   * 7. Verify campaign status is "sent"
   */
  test("full flow: create → generate drafts → approve → send", async ({
    page,
    request,
  }) => {
    const ts = Date.now();
    const email = `camp-user-${ts}@example.com`;

    // Step 1: Seed customer with an added_to_cart event carrying a SKU
    await request.post("/api/events", {
      data: {
        email,
        type: "added_to_cart",
        properties: { sku: `SKU-${ts}` },
      },
    });

    // Step 2: Create a segment via API (added_to_cart in last 30 days)
    const segRes = await request.post("/api/segments", {
      data: {
        name: `Campaign Segment ${ts}`,
        definition: {
          kind: "event_type_in_last_days",
          eventType: "added_to_cart",
          days: 30,
        },
      },
    });
    expect(segRes.status()).toBe(201);
    const { segmentId } = await segRes.json();

    // Step 3: Navigate to new campaign page
    await page.goto("/campaigns/new");
    await expect(
      page.getByRole("heading", { name: "New Campaign", level: 1 })
    ).toBeVisible();

    // Step 4: Fill in the campaign form
    const campaignName = `Test Campaign ${ts}`;
    await page.getByLabel("Campaign Name *").fill(campaignName);
    await page.getByLabel("Description").fill("E2E test campaign");

    // Wait for segments to load and select our segment
    await expect(page.getByTestId("segment-select")).toBeVisible();
    await page.getByTestId("segment-select").selectOption({ value: segmentId });

    // Step 5: Submit
    await page.getByTestId("create-campaign").click();

    // Step 6: Should redirect to campaign detail page
    await expect(
      page.getByRole("heading", { name: campaignName, level: 1 })
    ).toBeVisible();
    await expect(page.getByTestId("campaign-status")).toHaveText("draft");

    // Step 7: Generate drafts
    await page.getByTestId("generate-drafts").click();

    // Wait for drafts to appear
    await expect(page.getByTestId("draft-row").first()).toBeVisible();
    await expect(page.getByTestId("campaign-status")).toHaveText("drafted");

    // Step 8: Approve the first draft
    await page.getByTestId("approve-draft").first().click();

    // Approved badge should appear in the first draft row
    await expect(
      page.getByTestId("draft-row").first().getByText("approved")
    ).toBeVisible();

    // Step 9: Send approved drafts
    await expect(page.getByTestId("send-approved")).toBeVisible();
    await page.getByTestId("send-approved").click();

    // Step 10: Campaign status should become "sent"
    await expect(page.getByTestId("campaign-status")).toHaveText("sent");
  });

  test("campaigns list shows created campaign", async ({ page, request }) => {
    const ts = Date.now();

    // Create segment
    const segRes = await request.post("/api/segments", {
      data: {
        name: `List Seg ${ts}`,
        definition: {
          kind: "event_type_in_last_days",
          eventType: "purchase",
          days: 7,
        },
      },
    });
    const { segmentId } = await segRes.json();

    // Create campaign via API
    const campRes = await request.post("/api/campaigns", {
      data: {
        name: `Listed Campaign ${ts}`,
        segmentId,
      },
    });
    expect(campRes.status()).toBe(201);

    // Navigate to campaigns list
    await page.goto("/campaigns");
    await expect(
      page.getByRole("heading", { name: "Campaigns", level: 1 })
    ).toBeVisible();

    await expect(page.getByText(`Listed Campaign ${ts}`)).toBeVisible();
  });

  test("generate drafts returns 0 when no customers match segment", async ({
    request,
  }) => {
    const ts = Date.now();

    // Create segment that will match nothing (very specific event type)
    const segRes = await request.post("/api/segments", {
      data: {
        name: `Empty Seg ${ts}`,
        definition: {
          kind: "event_type_in_last_days",
          eventType: `no_such_event_${ts}`,
          days: 7,
        },
      },
    });
    const { segmentId } = await segRes.json();

    // Create campaign
    const campRes = await request.post("/api/campaigns", {
      data: { name: `Empty Campaign ${ts}`, segmentId },
    });
    const { campaignId } = await campRes.json();

    // Call generate-drafts
    const genRes = await request.post(
      `/api/campaigns/${campaignId}/generate-drafts`
    );
    expect(genRes.status()).toBe(200);
    const body = await genRes.json();
    expect(body.draftedCount).toBe(0);
  });

  test("PATCH draft: valid status transition approved", async ({ request }) => {
    const ts = Date.now();
    const email = `patch-${ts}@example.com`;

    // Seed customer
    await request.post("/api/events", {
      data: { email, type: "purchase", properties: {} },
    });

    // Create segment + campaign
    const segRes = await request.post("/api/segments", {
      data: {
        name: `Patch Seg ${ts}`,
        definition: {
          kind: "event_type_in_last_days",
          eventType: "purchase",
          days: 30,
        },
      },
    });
    const { segmentId } = await segRes.json();

    const campRes = await request.post("/api/campaigns", {
      data: { name: `Patch Campaign ${ts}`, segmentId },
    });
    const { campaignId } = await campRes.json();

    // Generate drafts
    await request.post(`/api/campaigns/${campaignId}/generate-drafts`);

    // Fetch campaign to get draft ID
    const campDetail = await request.get(`/api/campaigns/${campaignId}`);
    const campaign = await campDetail.json();
    const draftId = campaign.drafts[0]?.id;
    expect(draftId).toBeTruthy();

    // Approve the draft
    const patchRes = await request.patch(
      `/api/campaigns/${campaignId}/drafts/${draftId}`,
      { data: { status: "approved" } }
    );
    expect(patchRes.status()).toBe(200);
    const updated = await patchRes.json();
    expect(updated.status).toBe("approved");
  });

  test("PATCH draft: invalid status returns 400", async ({ request }) => {
    const ts = Date.now();
    const email = `patch-bad-${ts}@example.com`;

    await request.post("/api/events", {
      data: { email, type: "signup", properties: {} },
    });

    const segRes = await request.post("/api/segments", {
      data: {
        name: `BadPatch Seg ${ts}`,
        definition: {
          kind: "event_type_in_last_days",
          eventType: "signup",
          days: 30,
        },
      },
    });
    const { segmentId } = await segRes.json();

    const campRes = await request.post("/api/campaigns", {
      data: { name: `BadPatch Campaign ${ts}`, segmentId },
    });
    const { campaignId } = await campRes.json();

    await request.post(`/api/campaigns/${campaignId}/generate-drafts`);

    const campDetail = await request.get(`/api/campaigns/${campaignId}`);
    const campaign = await campDetail.json();
    const draftId = campaign.drafts[0]?.id;

    const patchRes = await request.patch(
      `/api/campaigns/${campaignId}/drafts/${draftId}`,
      { data: { status: "sent" } } // "sent" is not a valid DraftStatus
    );
    expect(patchRes.status()).toBe(400);
  });

  test("API validation: missing segmentId returns 400", async ({ request }) => {
    const res = await request.post("/api/campaigns", {
      data: { name: "No Segment Campaign" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("segmentId");
  });

  test("smart-draft/email endpoint returns subject and body", async ({
    request,
  }) => {
    const res = await request.post("/api/smart-draft/email", {
      data: {
        customerEmail: "smarttest@example.com",
        recentEventType: "purchase",
        recommendedSku: "WIDGET-1",
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.subject).toBe("string");
    expect(typeof body.body).toBe("string");
    expect(body.subject.length).toBeGreaterThan(0);
  });
});
