import { chromium } from 'playwright';

(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER_ERROR:', error));
    
    await page.goto('http://localhost:5173/', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    
    await browser.close();
  } catch(e) {
    console.error(e);
  }
})();
