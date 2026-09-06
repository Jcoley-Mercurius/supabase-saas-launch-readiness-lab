import { expect, test } from "@playwright/test";

/**
 * Harness smoke check only.
 *
 * Confirms the application serves and the browser-verification pipeline runs.
 * It deliberately asserts no product copy, evidence state, or design token -
 * those belong to the slice that implements them.
 */
test("application responds and renders a document", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.ok(), "the app should serve / successfully").toBe(true);
  await expect(page.locator("body")).toBeVisible();
});
