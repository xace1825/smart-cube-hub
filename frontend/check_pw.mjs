
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on('pageerror', err => console.log('PAGEERROR:', err.message, err.stack?.split("\n")?.[0]));
page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
page.on('requestfailed', req => console.log('REQFAIL:', req.url(), req.failure().errorText));
await page.goto('https://xace1825.github.io/smart-cube-hub/?nocache=3#/', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(5000);
const scrambles = await page.evaluate(() => {
  const divs = Array.from(document.querySelectorAll('div'));
  return divs.filter(d => d.textContent.trim().split(' ').length > 10).map(d => d.textContent.trim()).slice(0,3);
});
console.log('SCRAMBLES:', scrambles);
await browser.close();
