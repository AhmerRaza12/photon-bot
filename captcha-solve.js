const puppeteerExtraStealth= require('puppeteer-extra-plugin-stealth');
const puppeteer = require('puppeteer-extra');
const { setTimeout } = require('timers/promises')

puppeteer.use(puppeteerExtraStealth());

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--no-sandbox',
             '--disable-setuid-sandbox',
             '--start-maximized',
             '--disable-infobars',

        ]
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
    await page.goto('https://photon-sol.tinyastro.io/');
    await page.waitForNetworkIdle();
    await page.screenshot({ path: 'screenshot.png' });
    console.log('page content:', await page.content());

})();