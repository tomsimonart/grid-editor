import { test, expect } from "@playwright/test";
import { ConnectModulePage } from "../pages/connectModulePage";
import { ModulePage } from "../pages/modulePage";
import { PAGE_PATH, mockNavigatorSerial, getRandomInt } from "../utility";
import { ConfigPage } from "../pages/configPage";

let connectModulePage;
let modulePage;
let configPage;

test.beforeEach(async ({ page }) => {
  await mockNavigatorSerial(page);
});

test.describe("Action Block Operations", () => {
  test.beforeEach(async ({ page }) => {
    connectModulePage = new ConnectModulePage(page);
    modulePage = new ModulePage(page);
    configPage = new ConfigPage(page);
    await page.goto(PAGE_PATH);
    await connectModulePage.openVirtualModules();
    await connectModulePage.addModule("EN16");
  });

  test("Add Action Block to empty element", async () => {
    await configPage.removeAllActions();
    await configPage.openActionsOnEmptyElement();
    await configPage.addActionBlock("led", "Color");
    await expect(
      configPage.blocks["led"]["Color"]["elements"]["Blue"]
    ).toBeVisible();
  });

  test("Copy and Paste", async ({ page }) => {
    const expectedComment = "action operation";
    await configPage.removeAllActions();
    await configPage.addCommentBlock(expectedComment);
    await configPage.selectAllActions();
    await configPage.copyAction();
    await modulePage.selectModuleElement(3);
    await configPage.selectElementEvent("Timer");
    await configPage.pasteAction();
    await expect(await configPage.getTextFromComment()).toBe(expectedComment);
    await expect(page.locator("#cfg-1")).toBeVisible(); //last action block is comment visible
  });

  test("Cut and Paste", async () => {
    const expectedComment = "action operation";
    await configPage.removeAllActions();
    await configPage.addCommentBlock(expectedComment);
    await configPage.selectAllActions();
    await configPage.cutAction();
    await expect(await configPage.noActionAddActionButton).toBeVisible();
    await modulePage.selectModuleElement(5);
    await configPage.selectElementEvent("Timer");
    await configPage.pasteAction();
    await expect(await configPage.getTextFromComment()).toBe(expectedComment);
  });

  test("Merge", async ({ page }) => {
    const expectedComment = "merged comment";
    await configPage.removeAllActions();
    await configPage.addCommentBlock(expectedComment);
    await configPage.addCommentBlock();
    await configPage.selectAllActions();
    await configPage.mergeAction();
    await configPage.openFirstActionBlock();
    await expect(
      page.getByText(`--[[${expectedComment}]]--[[This Is A Comment]]`)
    ).toBeVisible();
  });

  test("Remove", async () => {
    await configPage.removeAllActions();
    await expect(await configPage.noActionAddActionButton).toBeVisible();
  });
});

test.describe("Element Operations", () => {
  test.beforeEach(async ({ page }) => {
    connectModulePage = new ConnectModulePage(page);
    modulePage = new ModulePage(page);
    configPage = new ConfigPage(page);
    await page.goto(PAGE_PATH);
    await connectModulePage.openVirtualModules();
    await connectModulePage.addModule("BU16");
  });

  test("Copy and Overwrite", async () => {
    const initComment = "init pasted";
    const buttonComment = "button pasted";
    const timerComment = "timer pasted";
    await configPage.removeAllActions();
    await configPage.addCommentBlock(buttonComment);
    await configPage.selectElementEvent("Setup");
    await configPage.removeAllActions();
    await configPage.addCommentBlock(initComment);
    await configPage.selectElementEvent("Timer");
    await configPage.removeAllActions();
    await configPage.addCommentBlock(timerComment);
    await configPage.copyElement();
    await modulePage.selectModuleElement(3);
    await configPage.overwriteElement();

    await expect(await configPage.getTextFromComment()).toBe(timerComment);
    await configPage.selectElementEvent("Setup");
    await expect(await configPage.getTextFromComment()).toBe(initComment);
    await configPage.selectElementEvent("Button");
    await expect(await configPage.getTextFromComment()).toBe(buttonComment);
  });

  test("Overwrite element", async ({ page }) => {
    await configPage.copyElement();
    await configPage.overwriteElement();
    await expect(page.locator("#cfg-2")).toBeVisible(); //default last action block is visible
  });

  test("Discard with Event change", async ({ page }) => {
    const notVisibleComment = "Not Exist";
    await configPage.removeAllActions();
    await configPage.addCommentBlock(notVisibleComment);
    await configPage.selectElementEvent("Timer");
    await configPage.discardElement();
    await configPage.selectElementEvent("Button");

    await expect(
      await configPage.getActionBlock("code", "Comment Block")
    ).toBeHidden();
    await expect(page.locator("#cfg-2")).toBeVisible(); //default last action block is visible
  });

  test("Discard immediately", async ({ page }) => {
    await configPage.removeAllActions();
    await configPage.discardElement();
    await expect(page.locator("#cfg-2")).toBeVisible(); //default last action block is visible
  });

  test("Clear", async ({ page }) => {
    const notVisibleComment = "Not Exist";
    await configPage.removeAllActions();
    await configPage.addCommentBlock(notVisibleComment);
    await configPage.selectElementEvent("Timer");
    await configPage.clearElement();
    await configPage.selectElementEvent("Button");

    await expect(
      await configPage.getActionBlock("code", "Comment Block")
    ).toBeHidden();
    await expect(page.locator("#cfg-2")).toBeVisible(); //default last action block is visible
  });

  test("Copy and Overwrite with Element right click", async () => {
    const expectedComment = "test comment";
    await modulePage.selectModuleElement(0);
    await configPage.removeAllActions();
    await configPage.addCommentBlock(expectedComment);
    await modulePage.rightClickModuleElement(0);
    await modulePage.copyElement();
    await modulePage.rightClickModuleElement(1);
    await modulePage.overwriteElement();
    await expect(await configPage.getTextFromComment()).toBe(expectedComment);
  });

  test("Discard with Element right click", async ({ page }) => {
    const notVisibleComment = "Not Exist";
    await configPage.removeAllActions();
    await configPage.addCommentBlock(notVisibleComment);
    await configPage.selectElementEvent("Timer");
    await modulePage.rightClickModuleElement(0);
    await modulePage.discardElement();
    await configPage.selectElementEvent("Button");

    await expect(
      await configPage.getActionBlock("code", "Comment Block")
    ).toBeHidden();
    await expect(page.locator("#cfg-2")).toBeVisible(); //default last action block is visible
  });

  test("Clear with Element right click", async ({ page }) => {
    const notVisibleComment = "Not Exist";
    await configPage.removeAllActions();
    await configPage.addCommentBlock(notVisibleComment);
    await configPage.selectElementEvent("Timer");
    await modulePage.rightClickModuleElement(2);
    await modulePage.clearElement();
    await configPage.selectElementEvent("Button");

    await expect(
      await configPage.getActionBlock("code", "Comment Block")
    ).toBeHidden();
    await expect(page.locator("#cfg-2")).toBeVisible(); //default last action block is visible
  });
});

test.describe("Character limit", () => {
  test.beforeEach(async ({ page }) => {
    connectModulePage = new ConnectModulePage(page);
    modulePage = new ModulePage(page);
    configPage = new ConfigPage(page);
    await page.goto(PAGE_PATH);
    await connectModulePage.openVirtualModules();
    await connectModulePage.addModule("EN16");
  });

  //test for https://github.com/intechstudio/grid-editor/issues/741
  test("block the Paste Action", async () => {
    await configPage.selectAllActions();
    await configPage.copyAction();
    await configPage.pasteAction();
    await configPage.pasteAction();
    await expect(await modulePage.characterLimitPasteToast).toBeVisible();
  });

  test("block the Add action", async () => {
    await configPage.selectAllActions();
    await configPage.copyAction();
    await configPage.pasteAction();
    await configPage.openActionBlockList();
    await configPage.addActionBlock("midi", "MIDI 14");
    await configPage.openActionBlockList();
    await configPage.addActionBlock("midi", "MIDI NRPN");
    await expect(await modulePage.characterLimitAddToast).toBeVisible();
  });

  const characterlimit = `print("It says I need to type at least ten characters, so here's this. Y'know what? I'm gonna type one hundred characters instead. Actually, I'm going to type five hundred characters. I'm definitely not going to type anywhere near one thousand characters, because that'd be ridiculous. Even if I wanted to type one thousand characters, I have to go to bed now anyway, so I simply don't have the time. I mean, I could just type a bunch of random letters or hold down one key, but that would be no fun at all.")`;
  test("in comment", async () => {
    await configPage.removeAllActions();
    await configPage.addCommentBlock(characterlimit);
    await modulePage.storeConfig();
    await expect(await modulePage.characterLimitAddToast).toBeVisible();
  });

  test("in code", async () => {
    await configPage.removeAllActions();
    await configPage.addAndEditCodeBlock(characterlimit);
    await expect
      .soft(await configPage.codeBlockCharacterLimitMessage)
      .toBeVisible();
    await expect(await configPage.commitCodeButton).toBeDisabled();
  });

  test("character limit count", async () => {
    const text = 'print("test")';
    await configPage.removeAllActions();
    await configPage.addAndEditCodeBlock(text);
    await configPage.commitCode();
    await expect(configPage.characterCount).toContainText("32");
  });
});
