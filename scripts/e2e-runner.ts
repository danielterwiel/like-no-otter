#!/usr/bin/env tsx
/**
 * E2E Test Runner using Playwright
 * Parses Maestro YAML tests and runs them against Expo web build
 */

import { chromium, Browser, Page } from "@playwright/test";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { parse as parseYaml } from "yaml";

const EXPO_PORT = 8081;
const BASE_URL = `http://localhost:${EXPO_PORT}`;

interface TestResult {
  file: string;
  passed: boolean;
  error?: string;
}

let browser: Browser | null = null;
let page: Page | null = null;

async function setupBrowser(): Promise<void> {
  browser = await chromium.launch({
    headless: true,
  });
  page = await browser.newPage();
  // Set a long default timeout for navigation and actions
  page.setDefaultTimeout(120000);
  page.setDefaultNavigationTimeout(120000);
}

async function teardownBrowser(): Promise<void> {
  if (page) {
    await page.close();
  }
  if (browser) {
    await browser.close();
  }
}

async function translateMaestroCommand(
  command: unknown,
): Promise<{ success: boolean; error?: string }> {
  if (!page) {
    return { success: false, error: "Browser not initialized" };
  }

  if (typeof command === "string") {
    // Simple command like "launchApp"
    if (command === "launchApp") {
      try {
        await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 180000 });
        // Wait an extra second for any final rendering
        await page.waitForTimeout(2000);
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }
    return { success: true };
  }

  if (typeof command === "object" && command !== null) {
    const cmd = command as Record<string, unknown>;

    // assertVisible
    if ("assertVisible" in cmd) {
      const assert = cmd.assertVisible as Record<string, string>;

      try {
        if (assert.id) {
          // React Native Web converts testID to data-testid
          const element = page.locator(`[data-testid="${assert.id}"]`);
          await element.waitFor({ state: "visible", timeout: 10000 });
        }

        if (assert.text) {
          // Look for text content - use first() to handle multiple matches
          const element = page.getByText(assert.text).first();
          await element.waitFor({ state: "visible", timeout: 10000 });
        }

        return { success: true };
      } catch (error) {
        const id = assert.id ? `testID "${assert.id}"` : `text "${assert.text}"`;
        return { success: false, error: `Element with ${id} not visible: ${error}` };
      }
    }

    // tapOn
    if ("tapOn" in cmd) {
      const tap = cmd.tapOn as Record<string, string>;
      try {
        if (tap.id) {
          await page.locator(`[data-testid="${tap.id}"]`).click();
        } else if (tap.text) {
          // Try role=tab first for tab navigation, then fall back to text
          const tabLocator = page.getByRole("tab", { name: tap.text });
          const tabCount = await tabLocator.count();
          if (tabCount === 1) {
            await tabLocator.click();
          } else {
            // Fall back to first matching text element
            await page.getByText(tap.text).first().click();
          }
        }
        await page.waitForTimeout(500);
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }

    // inputText
    if ("inputText" in cmd) {
      const input = cmd.inputText as string;
      try {
        await page.keyboard.type(input);
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }

    // extendedWaitUntil
    if ("extendedWaitUntil" in cmd) {
      const wait = cmd.extendedWaitUntil as Record<string, unknown>;
      const timeout = (wait.timeout as number) || 10000;

      try {
        if (wait.visible && typeof wait.visible === "object") {
          const visible = wait.visible as Record<string, string>;
          if (visible.id) {
            const element = page.locator(`[data-testid="${visible.id}"]`);
            await element.waitFor({ state: "visible", timeout });
          }
          if (visible.text) {
            const element = page.getByText(visible.text).first();
            await element.waitFor({ state: "visible", timeout });
          }
        }
        return { success: true };
      } catch (error) {
        return { success: false, error: `extendedWaitUntil failed: ${error}` };
      }
    }
  }

  return { success: true };
}

async function runTest(testFile: string): Promise<TestResult> {
  const content = readFileSync(testFile, "utf-8");
  const documents = content.split("---").filter((d) => d.trim());

  // Skip config section (first document with appId)
  const commands: unknown[] = [];
  for (const doc of documents) {
    const parsed = parseYaml(doc);
    if (Array.isArray(parsed)) {
      commands.push(...parsed);
    }
  }

  for (const command of commands) {
    const result = await translateMaestroCommand(command);
    if (!result.success) {
      return { file: testFile, passed: false, error: result.error };
    }
  }

  return { file: testFile, passed: true };
}

async function main() {
  const args = process.argv.slice(2);
  const testDir = args[0] || "maestro";
  const specificTest = args[1];

  console.log("E2E Test Runner (Playwright)");
  console.log("================================\n");

  // Get test files
  let testFiles: string[] = [];
  if (specificTest) {
    testFiles = [join(testDir, specificTest)];
  } else {
    testFiles = readdirSync(testDir)
      .filter((f) => f.endsWith(".yaml") && f.startsWith("us-"))
      .sort()
      .map((f) => join(testDir, f));
  }

  // Filter to only run tests for completed user stories
  const completedTests = testFiles.filter(
    (f) =>
      f.includes("us-001-app-launches") ||
      f.includes("us-002-database-setup") ||
      f.includes("us-003-tab-navigation") ||
      f.includes("us-004-seed-exercises") ||
      f.includes("us-005-healthkit-permissions") ||
      f.includes("us-006-health-metrics-cards"),
  );

  if (completedTests.length === 0) {
    console.log("No applicable tests found.");
    process.exit(0);
  }

  console.log(`Found ${completedTests.length} test(s) to run\n`);

  // Setup browser
  await setupBrowser();

  const results: TestResult[] = [];

  try {
    for (const testFile of completedTests) {
      const testName = testFile.split("/").pop() || testFile;
      process.stdout.write(`Running: ${testName}... `);

      const result = await runTest(testFile);
      results.push(result);

      if (result.passed) {
        console.log("\x1b[32mPASSED\x1b[0m");
      } else {
        console.log("\x1b[31mFAILED\x1b[0m");
        console.log(`  Error: ${result.error}`);
      }
    }
  } finally {
    await teardownBrowser();
  }

  console.log("\n================================");
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Test runner error:", error);
  teardownBrowser();
  process.exit(1);
});
