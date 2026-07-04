
const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('pageerror', err => console.log('PAGEERROR:', err.message));
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  await page.goto('http://192.168.0.102:3000/#/timer', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(5000);
  const text = await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div'));
    return divs.map(d => d.textContent.trim()).filter(t => t.length > 5).slice(0,20).join(' | ');
  });
  console.log('PAGE TEXT:', text);
  await browser.close();
})();
