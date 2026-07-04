
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on('pageerror', err => console.log('PAGEERROR:', err.message));
await page.goto('https://xace1825.github.io/smart-cube-hub/?nocache=4#/', { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(3000);
const root = await page.evaluate(() => document.getElementById('root')?.children.length);
console.log('root children:', root);
await browser.close();
