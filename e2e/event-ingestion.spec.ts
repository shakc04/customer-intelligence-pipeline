import { test, expect } from "@playwright/test";

test.describe("Event Ingestion Flow", () => {
  test("full flow: ingest event → navigate to customer → verify timeline", async ({
    page,
  }) => {
    // Generate unique email for this test
    const testEmail = `test-${Date.now()}@example.com`;
    const eventType = "page_view";
    const properties = { page: "/home", referrer: "google" };

    // Step 1: Navigate to ingest page
    await page.goto("/ingest");
    await expect(
      page.getByRole("heading", { name: "Ingest Event", level: 1 })
    ).toBeVisible();

    // Step 2: Fill out the form
    await page.getByLabel("Customer Email *").fill(testEmail);
    await page.getByLabel("Event Type *").fill(eventType);
    await page.getByLabel("Properties (JSON)").fill(JSON.stringify(properties));

    // Step 3: Submit the form
    await page.getByRole("button", { name: "Submit Event" }).click();

    // Step 4: Wait for success message
    await expect(page.getByText(/Event created successfully/)).toBeVisible();

    // Step 5: Click "View customer timeline" link
    await page.getByRole("link", { name: /View customer timeline/ }).click();

    // Step 6: Verify we're on the customer timeline page
    await expect(
      page.getByRole("heading", { name: testEmail, level: 1 })
    ).toBeVisible();
    await expect(page.getByText("1 event tracked")).toBeVisible();

    // Step 7: Verify the event appears in the timeline
    await expect(
      page.getByRole("heading", { name: eventType, level: 3 })
    ).toBeVisible();

    // Step 8: Verify properties are displayed
    await expect(page.getByText('"page": "/home"')).toBeVisible();
    await expect(page.getByText('"referrer": "google"')).toBeVisible();
  });

  test("idempotency: submitting same event twice with idempotency key", async ({
    page,
  }) => {
    // Generate unique identifiers
    const testEmail = `idempotent-${Date.now()}@example.com`;
    const idempotencyKey = `key-${Date.now()}`;

    // Step 1: Navigate to ingest page
    await page.goto("/ingest");

    // Step 2: Fill form with idempotency key
    await page.getByLabel("Customer Email *").fill(testEmail);
    await page.getByLabel("Event Type *").fill("purchase");
    await page.getByLabel("Idempotency Key (optional)").fill(idempotencyKey);

    // Step 3: Submit first time
    await page.getByRole("button", { name: "Submit Event" }).click();
    await expect(page.getByText(/Event created successfully/)).toBeVisible();

    // Step 4: Submit same event again (form was reset, so refill)
    await page.getByLabel("Customer Email *").fill(testEmail);
    await page.getByLabel("Event Type *").fill("purchase");
    await page.getByLabel("Idempotency Key (optional)").fill(idempotencyKey);
    await page.getByRole("button", { name: "Submit Event" }).click();

    // Step 5: Verify idempotency message
    await expect(
      page.getByText(/Event already exists \(idempotency\)/)
    ).toBeVisible();

    // Step 6: Navigate to customer timeline
    await page.getByRole("link", { name: /View customer timeline/ }).click();

    // Step 7: Verify only ONE event exists (not duplicated)
    await expect(page.getByText("1 event tracked")).toBeVisible();
    await expect(page.getByTestId("idempotency-badge")).toBeVisible();
  });

  test("navigate from customers list to timeline", async ({ page }) => {
    // Generate unique email
    const testEmail = `nav-test-${Date.now()}@example.com`;

    // Step 1: Create an event first
    await page.goto("/ingest");
    await page.getByLabel("Customer Email *").fill(testEmail);
    await page.getByLabel("Event Type *").fill("signup");
    await page.getByRole("button", { name: "Submit Event" }).click();
    await expect(page.getByText(/Event created successfully/)).toBeVisible();

    // Step 2: Navigate to customers list
    await page.goto("/customers");
    await expect(
      page.getByRole("heading", { name: "Customers", level: 1 })
    ).toBeVisible();

    // Step 3: Find the customer in the table
    const customerRow = page.locator("tr", { hasText: testEmail });
    await expect(customerRow).toBeVisible();
    await expect(customerRow.getByText("1 event")).toBeVisible();

    // Step 4: Click "View Timeline" link
    await customerRow.getByRole("link", { name: /View Timeline/ }).click();

    // Step 5: Verify timeline page
    await expect(
      page.getByRole("heading", { name: testEmail, level: 1 })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "signup", level: 3 })
    ).toBeVisible();
  });
});
