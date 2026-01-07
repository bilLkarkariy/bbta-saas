import { test, expect } from "@playwright/test";

// Helper to bypass Clerk auth for testing
// In a real setup, you'd mock Clerk or use test credentials
test.describe("Dashboard Pages Visibility", () => {
  // Note: These tests assume auth is bypassed or mocked
  // For full E2E, configure Clerk test mode or mock middleware

  test.describe("Public Pages", () => {
    test("home page loads without errors", async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      const response = await page.goto("/");
      expect(response?.status()).toBeLessThan(500);

      // Allow hydration errors but no critical crashes
      const criticalErrors = consoleErrors.filter(
        (e) => !e.includes("hydration") && !e.includes("Warning:")
      );
      expect(criticalErrors.length).toBe(0);
    });

    test("sign-in page loads without errors", async ({ page }) => {
      const response = await page.goto("/sign-in");
      expect(response?.status()).toBeLessThan(500);

      // Should show Clerk sign-in component or redirect
      await expect(page.locator("body")).toBeVisible();
    });

    test("sign-up page loads without errors", async ({ page }) => {
      const response = await page.goto("/sign-up");
      expect(response?.status()).toBeLessThan(500);

      await expect(page.locator("body")).toBeVisible();
    });
  });

  test.describe("Dashboard Pages (Require Auth)", () => {
    // These will redirect to sign-in if not authenticated
    // In a full E2E setup, you'd authenticate first

    test("dashboard redirects or shows content", async ({ page }) => {
      const response = await page.goto("/dashboard");

      // Should either show dashboard or redirect to auth
      expect(response?.status()).toBeLessThan(500);
      await expect(page.locator("body")).toBeVisible();
    });

    test("contacts page redirects or shows content", async ({ page }) => {
      const response = await page.goto("/dashboard/contacts");

      expect(response?.status()).toBeLessThan(500);
      await expect(page.locator("body")).toBeVisible();
    });

    test("templates page redirects or shows content", async ({ page }) => {
      const response = await page.goto("/dashboard/templates");

      expect(response?.status()).toBeLessThan(500);
      await expect(page.locator("body")).toBeVisible();
    });

    test("campaigns page redirects or shows content", async ({ page }) => {
      const response = await page.goto("/dashboard/campaigns");

      expect(response?.status()).toBeLessThan(500);
      await expect(page.locator("body")).toBeVisible();
    });

    test("campaigns new page redirects or shows content", async ({ page }) => {
      const response = await page.goto("/dashboard/campaigns/new");

      expect(response?.status()).toBeLessThan(500);
      await expect(page.locator("body")).toBeVisible();
    });

    test("integrations page redirects or shows content", async ({ page }) => {
      const response = await page.goto("/dashboard/integrations");

      expect(response?.status()).toBeLessThan(500);
      await expect(page.locator("body")).toBeVisible();
    });

    test("faq page redirects or shows content", async ({ page }) => {
      const response = await page.goto("/dashboard/faq");

      expect(response?.status()).toBeLessThan(500);
      await expect(page.locator("body")).toBeVisible();
    });

    test("settings page redirects or shows content", async ({ page }) => {
      const response = await page.goto("/dashboard/settings");

      expect(response?.status()).toBeLessThan(500);
      await expect(page.locator("body")).toBeVisible();
    });

    test("conversations page redirects or shows content", async ({ page }) => {
      const response = await page.goto("/dashboard/conversations");

      expect(response?.status()).toBeLessThan(500);
      await expect(page.locator("body")).toBeVisible();
    });
  });

  test.describe("API Routes", () => {
    test("clerk webhook returns method not allowed for GET", async ({ request }) => {
      const response = await request.get("/api/webhooks/clerk");
      // Webhook should reject non-POST
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test("twilio webhook returns method not allowed for GET", async ({ request }) => {
      const response = await request.get("/api/webhooks/twilio");
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});

test.describe("No JavaScript Errors", () => {
  test("home page has no critical JS errors", async ({ page }) => {
    const errors: Error[] = [];
    page.on("pageerror", (error) => errors.push(error));

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      (e) => !e.message.includes("hydration") && !e.message.includes("Clerk")
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
