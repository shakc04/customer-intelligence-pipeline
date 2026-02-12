import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("loads successfully and displays main heading", async ({ page }) => {
    await page.goto("/");

    // Check if the main heading is visible
    const heading = page.getByRole("heading", {
      name: "Customer Intelligence Pipeline",
      level: 1,
    });
    await expect(heading).toBeVisible();
  });

  test("displays all four feature sections", async ({ page }) => {
    await page.goto("/");

    // Check for all four feature section headings
    await expect(
      page.getByRole("heading", { name: "Data Ingestion", level: 2 })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Customer Profiles", level: 2 })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Audience Segmentation", level: 2 })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Campaign Management", level: 2 })
    ).toBeVisible();
  });

  test("displays tagline", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByText(
        "Transform first-party events into actionable customer insights and targeted campaigns"
      )
    ).toBeVisible();
  });
});
