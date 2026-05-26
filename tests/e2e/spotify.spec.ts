import { expect, test } from "@playwright/test";

async function unlockAndOpenJukebox(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByLabel("Access password").fill("demo-access");
  await page.getByRole("button", { name: "Enter" }).click();
  await expect(page.locator("[data-desktop-lock-screen]")).toHaveCount(0);
  await page.locator('[title="Jukebox"]').click();
  return page.locator('[data-window-id="spotify"]');
}

test("uses the demo playlists, likes flow, and local audio assets", async ({ page }) => {
  const jukeboxWindow = await unlockAndOpenJukebox(page);

  await expect(jukeboxWindow.getByRole("heading", { name: "Build in Public" })).toBeVisible();
  await expect(jukeboxWindow.getByText("Made by Desktop Demo")).toBeVisible();
  await expect(jukeboxWindow.getByText("Bundled demo music stack")).toBeVisible();
  await expect(jukeboxWindow.getByRole("button", { name: "Deep Work" })).toBeVisible();
  await expect(jukeboxWindow.getByRole("button", { name: "Scheduled Drop" })).toBeVisible();
  await expect(jukeboxWindow.getByRole("button", { name: "Liked Songs" })).toBeVisible();

  await jukeboxWindow.getByLabel("Like Window Stack").click();
  await jukeboxWindow.getByRole("button", { name: "Liked Songs" }).click();
  await expect(jukeboxWindow.getByRole("heading", { name: "Liked Songs" })).toBeVisible();
  await expect(jukeboxWindow.getByRole("button", { name: "1 Window Stack Desktop Demo" })).toBeVisible();

  await jukeboxWindow.getByRole("button", { name: "1 Window Stack Desktop Demo" }).click();
  await expect(jukeboxWindow.getByLabel("Pause")).toBeVisible({ timeout: 10000 });
  const activeSources = await jukeboxWindow.locator("audio").evaluateAll((nodes) =>
    nodes.map((node) => (node as HTMLAudioElement).currentSrc).filter(Boolean),
  );
  expect(activeSources.some((src) => src.includes("/music/audio/") && src.endsWith(".wav"))).toBe(true);
});

test("keeps the scheduled drop gated before its unlock date", async ({ page }) => {
  const jukeboxWindow = await unlockAndOpenJukebox(page);

  await jukeboxWindow.getByRole("button", { name: "Scheduled Drop" }).click();

  await expect(jukeboxWindow.getByRole("heading", { name: "Build in Public" })).toBeVisible();
  await expect(page.getByText("This playlist unlocks on January 15, 2030.")).toBeVisible();
});
