const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { setTimeout } = require('timers/promises');

puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-web-security',
            '--enable-features=NetworkService,NetworkServiceInProcess',
            '--enable-automation',
            '--disable-infobars',
            '--disable-gpu',
            '--window-size=1920,1080',
        ],
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/78.0.3904.108 Chrome/78.0.3904.108 Safari/537.36');

    try {
        console.log('Navigating to the page...');
        await page.goto('https://photon-sol.tinyastro.io/', { waitUntil: 'domcontentloaded' });
        await setTimeout(3000);

        const content = await page.content();
        console.log('Page HTML:', content);

    } catch (error) {
        console.error('Error navigating to page:', error);
    } finally {
        await browser.close();
    }
})();
