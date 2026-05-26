import { expect, test } from "@playwright/test";

test("owner login keeps locked apps gated in the default session", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Demo workstation")).toBeVisible();

  await page.getByLabel("Access password").fill("demo-access");
  await page.getByRole("button", { name: "Enter" }).click();

  await expect(page.getByText("Finder").first()).toBeVisible();
  await page.locator('[title="Notes"]').click();
  await expect(page.getByText("Notes is locked in owner mode. Use the test session to inspect it safely.")).toBeVisible();
});

test("test login opens locked apps without owner-state interference", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Demo workstation")).toBeVisible();

  await page.getByLabel("Access password").fill("demo-test");
  await page.getByRole("button", { name: "Enter" }).click();

  await page.locator('[title="Notes"]').click();
  await expect(page.getByText("Note of the Day").first()).toBeVisible();

  await page.locator('[title="Jukebox"]').click();
  await expect(page.getByRole("heading", { name: "Build in Public" })).toBeVisible();

  await page.locator('[data-window-id="spotify"] [aria-label="Close window"]').click();
  await expect(page.locator('[data-window-id="spotify"]')).toHaveCount(0);
});

test("uses the public demo lock asset", async ({ page }) => {
  await page.goto("/");

  const lockScreen = page.locator("[data-desktop-lock-screen]");
  await expect(lockScreen).toBeVisible();

  const lockStyles = await lockScreen.evaluate((element) => {
    const styles = window.getComputedStyle(element);
    return {
      backgroundImage: styles.backgroundImage,
      fontFamily: styles.fontFamily,
    };
  });

  expect(lockStyles.backgroundImage).toContain("lockscreen.svg");
  expect(lockStyles.fontFamily).toMatch(/-apple-system|BlinkMacSystemFont|SF Pro|Helvetica Neue/);
});
