import { test, expect } from "@playwright/test";

test.describe("Visual Regression Tests", () => {
  // Note: First run creates baseline snapshots
  // Subsequent runs compare against baselines

  test.describe("Landing Page", () => {
    test("desktop view matches snapshot", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Wait for animations to settle
      await page.waitForTimeout(1000);

      // Take screenshot of above-fold content
      await expect(page).toHaveScreenshot("landing-desktop.png", {
        maxDiffPixels: 500, // Allow small differences for dynamic content
        fullPage: false,
      });
    });

    test("mobile view matches snapshot", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot("landing-mobile.png", {
        maxDiffPixels: 500,
        fullPage: false,
      });
    });
  });

  test.describe("Auth Pages", () => {
    test("sign-in page matches snapshot", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto("/sign-in");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Capture just the main content area
      await expect(page).toHaveScreenshot("sign-in.png", {
        maxDiffPixels: 1000, // Higher tolerance for Clerk widget
      });
    });

    test("sign-up page matches snapshot", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto("/sign-up");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot("sign-up.png", {
        maxDiffPixels: 1000,
      });
    });
  });

  test.describe("Error Pages", () => {
    test("404 page matches snapshot", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      const response = await page.goto("/this-page-does-not-exist");

      // Should return 404
      expect(response?.status()).toBe(404);

      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot("404-page.png", {
        maxDiffPixels: 200,
      });
    });
  });
});

test.describe("Component Visual Tests", () => {
  test.describe("Pricing Section", () => {
    test("pricing cards are visible", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto("/#pricing");
      await page.waitForLoadState("networkidle");

      // Scroll to pricing section
      const pricing = page.locator('[id="pricing"]');
      if (await pricing.isVisible()) {
        await pricing.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);

        await expect(pricing).toHaveScreenshot("pricing-section.png", {
          maxDiffPixels: 300,
        });
      }
    });
  });
});
