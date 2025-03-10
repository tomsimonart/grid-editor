import { test, expect } from "@playwright/test";
import { ConnectModulePage } from "../pages/connectModulePage";
import { ModulePage } from "../pages/modulePage";
import { PAGE_PATH, mockNavigatorSerial } from "../utility";
import { ConfigPage } from "../pages/configPage";

let connectModulePage;
let modulePage;
let configPage;

test.beforeEach(async ({ page }) => {
  await mockNavigatorSerial(page);
  connectModulePage = new ConnectModulePage(page);
  modulePage = new ModulePage(page);
  configPage = new ConfigPage(page);
  await page.goto(PAGE_PATH);
  await connectModulePage.openVirtualModules();
});

test.describe("Modules", () => {
  test.afterEach(async () => {
    await modulePage.removeModule();
  });

  const moduleNames = ["BU16", "EF44", "EN16", "PBF4", "PO16"];
  for (const moduleName of moduleNames) {
    test(`should add a ${moduleName}`, async () => {
      await connectModulePage.addModule(moduleName);
      await expect(modulePage.modules[moduleName]).toBeVisible();
    });
  }
});

test.describe("Module Operations", () => {
  test("should change module", async () => {
    await connectModulePage.addModule("BU16");
    await modulePage.changeModule();
    await connectModulePage.addModule("PO16");
    await expect(modulePage.modules["PO16"]).toBeVisible();
  });

  test("should remove module", async () => {
    await connectModulePage.addModule("BU16");
    await modulePage.removeModule();
    await expect(modulePage.modules["BU16"]).toBeHidden();
  });

  const expectModule = "PO16";
  test(`Select Multiple Modules and Verifying Visibility of Module ${expectModule}`, async () => {
    await connectModulePage.selectModule("BU16");
    await connectModulePage.selectModule("EN16");
    await connectModulePage.addModule(expectModule);
    await expect(modulePage.modules[expectModule]).toBeVisible();
  });

  test("cancel add module", async ({ page }) => {
    await connectModulePage.selectModule("EN16");
    await page.mouse.click(1, 1);
    await expect(connectModulePage.virtualModuleButton).toBeVisible();
  });
});

test.describe("Add extra module", () => {
  const sides = ["left", "top", "right", "bottom"];
  for (const side of sides) {
    test(`to ${side} side`, async () => {
      await connectModulePage.addModule("EF44");
      await modulePage.openAddModuleToSide(side);
      await connectModulePage.addModule("EN16");
      await expect(modulePage.modulesFromTheFirstModule[side]).toBeVisible();
    });
  }
});

test("Clear module fetching config automatically", async ({ page }) => {
  await connectModulePage.addModule("EF44");
  await modulePage.clearConfig();
  await expect(page.locator("#cfg-2")).toBeVisible();
});

test("Discard module fetching config automatically", async ({ page }) => {
  await connectModulePage.addModule("EF44");
  await configPage.removeAllActions();
  await modulePage.discardConfig();
  await expect(page.locator("#cfg-2")).toBeVisible();
});
