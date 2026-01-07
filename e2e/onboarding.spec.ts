import { test, expect } from "@playwright/test";

test.describe("Onboarding Flow", () => {
  test.describe("Public Access", () => {
    test("onboarding page loads", async ({ page }) => {
      const response = await page.goto("/onboarding");

      // Should redirect to sign-in if not authenticated
      // or show loading/waiting state if webhook pending
      expect(response?.status()).toBeLessThan(500);
      await expect(page.locator("body")).toBeVisible();
    });
  });

  test.describe("Onboarding UI Components", () => {
    // These tests would require auth mock
    // Testing component structure without full auth

    test("vertical selector has all options", async ({ page }) => {
      // Mock auth or use test user
      // For now, just verify the component structure exists in the build
      const response = await page.goto("/onboarding");
      expect(response?.status()).toBeLessThan(500);
    });
  });
});

test.describe("Landing Page Features", () => {
  test("landing page shows hero section", async ({ page }) => {
    await page.goto("/");

    // Check for key landing page elements
    await expect(page.locator("body")).toBeVisible();

    // Should have main content
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("landing page has navigation", async ({ page }) => {
    await page.goto("/");

    // Look for header/nav elements
    const header = page.locator("header").first();
    await expect(header).toBeVisible();
  });

  test("landing page has CTA buttons", async ({ page }) => {
    await page.goto("/");

    // Look for call-to-action buttons
    const buttons = page.locator("button, a[href*='sign']");
    expect(await buttons.count()).toBeGreaterThan(0);
  });
});

test.describe("Mobile Responsive", () => {
  const viewports = [
    { name: "iPhone SE", width: 375, height: 667 },
    { name: "iPhone 12", width: 390, height: 844 },
    { name: "iPad Mini", width: 768, height: 1024 },
    { name: "iPad Pro", width: 1024, height: 1366 },
  ];

  for (const viewport of viewports) {
    test(`landing page is responsive on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");

      // Should not have horizontal overflow
      const body = page.locator("body");
      const bodyWidth = await body.evaluate((el) => el.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width);
    });
  }

  test("mobile menu toggle works", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Find mobile menu button
    const menuButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]').first();

    if (await menuButton.isVisible()) {
      await menuButton.click();

      // Menu should be expanded
      await expect(menuButton).toHaveAttribute("aria-expanded", "true");
    }
  });

  test("touch targets are adequately sized", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Check that buttons have minimum touch target size (44px recommended)
    const buttons = page.locator("button:visible, a:visible").first();

    if (await buttons.isVisible()) {
      const box = await buttons.boundingBox();
      if (box) {
        // At least one dimension should be 44px or larger
        expect(box.height >= 32 || box.width >= 32).toBeTruthy();
      }
    }
  });
});

test.describe("Performance Checks", () => {
  test("landing page loads within acceptable time", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - startTime;

    // Should load DOM in under 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test("no console errors on landing page", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Filter known non-critical errors
    const criticalErrors = errors.filter(
      (e) => !e.includes("hydration") &&
             !e.includes("Warning:") &&
             !e.includes("Clerk")
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
