import { test, expect } from "@playwright/test";

const routes = [
  "/",
  "/invoices/",
  "/expenses/",
  "/kleinunternehmer/",
  "/elster/",
  "/vat-reminders/",
];

const assets = ["/favicon.svg", "/vat-reminders/favicon.svg"];

test.describe("Professional Toolkit production smoke tests", () => {
  test("all published routes return an application shell", async ({ page, baseURL }) => {
    for (const route of routes) {
      const response = await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle" });
      expect(response?.status(), `${route} should be reachable`).toBe(200);
      await expect(page.locator("#root")).not.toBeEmpty();
      await expect(page.getByText("Gastmodus", { exact: false })).toBeVisible();
    }
  });

  test("favicons return image responses on root and nested routes", async ({ request, baseURL }) => {
    for (const asset of assets) {
      const response = await request.get(`${baseURL}${asset}`);
      expect(response.status(), `${asset} should return 200`).toBe(200);
      expect(response.headers()["content-type"]).toContain("image");
    }
  });

  test("guest dashboard has no failed API or console requests", async ({ page, baseURL }) => {
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("requestfailed", (request) => failedRequests.push(request.url()));
    page.on("response", (response) => {
      if (response.status() >= 400 && response.url().includes("/api/")) {
        failedRequests.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.goto(`${baseURL}/`, { waitUntil: "networkidle" });
    await expect(page.getByText("Gastmodus", { exact: false })).toBeVisible();
    expect(consoleErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });

  test("Kleinunternehmer calculator updates and exports CSV without login", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/kleinunternehmer/`, { waitUntil: "networkidle" });
    await page.locator("#currentYear").fill("18000");
    await page.locator("#previousYear").fill("45000");
    await expect(page.getByText("18.000 €", { exact: false })).toBeVisible();
    await expect(page.getByText("Sie sind berechtigt", { exact: false })).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "CSV exportieren" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("kleinunternehmer-pruefung.csv");
  });

  test("tax reminder widgets render in guest mode", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/vat-reminders/`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Umsatzsteuer-Voranmeldung" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Umsatzsteuer-Jahreserklärung" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Einnahmen-Überschuss-Rechnung (EÜR)" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Einkommensteuererklärung" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Erinnern" }).first()).toBeVisible();
  });
});
