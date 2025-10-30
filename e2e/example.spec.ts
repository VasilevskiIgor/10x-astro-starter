import { test, expect } from "@playwright/test";

test.describe("Example-E2E-Test", () => {
  test("should-load-the-homepage", async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");

    // Check if page loaded
    await expect(page).toHaveTitle(/Magic Travel App/i);
  });

  test("should-have-access-to-environment-variables-from-.env.test", async () => {
    // Environment variables from .env.test are available in Node.js context
    const supabaseUrl = process.env.SUPABASE_URL;
    const e2eUsername = process.env.E2E_USERNAME;

    // Verify env vars are loaded
    expect(supabaseUrl).toBeDefined();
    expect(supabaseUrl).toContain("supabase.co");
    expect(e2eUsername).toBe("user@example.com");

    console.log("Supabase URL:", supabaseUrl);
    console.log("E2E Username:", e2eUsername);
  });
});
