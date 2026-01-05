#!/usr/bin/env node
// @ts-check

const usage = `Generate before/after screenshots for two URLs using Playwright.

Usage:
  node script/compare-screenshots.js <before-url> <after-url>

Examples:
  node script/compare-screenshots.js https://git-scm.com http://localhost:5000
  node script/compare-screenshots.js https://git-scm.com https://myuser.github.io/git-scm.com/`;

const { chromium } = require('@playwright/test');

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error(usage);
    process.exit(1);
  }

  const beforeUrl = args[0];
  const afterUrl = args[1];

  const browser = await chromium.launch();

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();

    // Take "before" screenshot
    console.error(`Navigating to before URL: ${beforeUrl}`);
    await page.goto(beforeUrl, { waitUntil: 'networkidle' });
    const beforePath = '.before.png';
    await page.screenshot({ path: beforePath, fullPage: true });
    console.error(`Saved: ${beforePath}`);

    // Take "after" screenshot
    console.error(`Navigating to after URL: ${afterUrl}`);
    await page.goto(afterUrl, { waitUntil: 'networkidle' });
    const afterPath = '.after.png';
    await page.screenshot({ path: afterPath, fullPage: true });
    console.error(`Saved: ${afterPath}`);

    console.error(`\nScreenshots saved:`);
    console.error('  - .before.png');
    console.error('  - .after.png');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
