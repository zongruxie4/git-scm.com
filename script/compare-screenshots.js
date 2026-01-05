#!/usr/bin/env node
// @ts-check

const usage = `Generate before/after screenshots for two URLs using Playwright.

Usage:
  node script/compare-screenshots.js [options] <before-url> <after-url>

Options:
  --dark              Emulate dark mode (prefers-color-scheme: dark)
  --light             Emulate light mode (default)
  --clip=<WxH+X+Y>    Clip screenshots to specified region (e.g., --clip=1280x720+0+0)

Examples:
  node script/compare-screenshots.js https://git-scm.com http://localhost:5000
  node script/compare-screenshots.js --dark https://git-scm.com http://localhost:5000
  node script/compare-screenshots.js --clip=1280x720+0+0 https://git-scm.com http://localhost:5000`;

const { chromium } = require('@playwright/test');

async function main() {
  const args = process.argv.slice(2);
  const options = {
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    colorScheme: 'light',
  };
  let clip;

  const urls = args.filter(arg => {
    if (!arg.startsWith('--')) return true;

    if (arg === '--dark') {
      options.colorScheme = 'dark';
    } else if (arg === '--light') {
      options.colorScheme = 'light';
    } else if (arg.startsWith('--clip=')) {
      const match = arg.slice(7).match(/^(\d+)x(\d+)\+(\d+)\+(\d+)$/);
      if (!match) {
        console.error(`Invalid clip format: ${arg} (expected --clip=WxH+X+Y)`);
        process.exit(1);
      }
      clip = {
        width: parseInt(match[1], 10),
        height: parseInt(match[2], 10),
        x: parseInt(match[3], 10),
        y: parseInt(match[4], 10),
      };
      // Ensure viewport is large enough to contain the clip region
      options.viewport = {
        width: Math.max(options.viewport.width, clip.x + clip.width),
        height: Math.max(options.viewport.height, clip.y + clip.height),
      };
    } else {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }
    return false;
  });

  if (urls.length !== 2) {
    console.error(usage);
    process.exit(1);
  }

  const beforeUrl = urls[0];
  const afterUrl = urls[1];

  const browser = await chromium.launch();

  try {
    const context = await browser.newContext(options);

    const page = await context.newPage();

    if (options.colorScheme === 'dark') {
      console.error('Using dark mode (prefers-color-scheme: dark)');
    }

    async function takeScreenshot(url, outputPath) {
      console.error(`Navigating to: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.screenshot({ path: outputPath, clip, fullPage: !clip });
      const pageDims = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      }));
      const info = clip
        ? `${clip.width}x${clip.height}+${clip.x}+${clip.y} of ${pageDims.width}x${pageDims.height}`
        : `${pageDims.width}x${pageDims.height}`;
      console.error(`Saved: ${outputPath} (${info})`);
    }

    await takeScreenshot(beforeUrl, '.before.png');
    await takeScreenshot(afterUrl, '.after.png');

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
