const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { setTimeout } = require('timers/promises');

// Use Puppeteer Extra with Stealth Plugin
puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({
        headless: true, // Running in headless mode
        defaultViewport: null,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-infobars',
            '--window-size=1920,1080',
        ],
    });

    const page = await browser.newPage();

    // Set a realistic user agent
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
    );

    // Set Accept-Language and other headers
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
    });

    // Prevent detection of headless Chrome by overriding certain properties
    await page.evaluateOnNewDocument(() => {
        // Mimic a real browser environment
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined, // Remove the "webdriver" property
        });

        Object.defineProperty(window, 'chrome', {
            get: () => ({
                runtime: {},
            }),
        });

        Object.defineProperty(navigator, 'platform', {
            get: () => 'Win32', // Mimic a Windows platform
        });

        Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3], // Fake plugins
        });

        Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en'], // Mimic browser language settings
        });
    });

    // Set viewport to mimic a realistic screen resolution
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        console.log('Navigating to the page...');
        await page.goto('https://photon-sol.tinyastro.io/', {
            waitUntil: 'domcontentloaded', // Wait for the DOM to load
        });

        // Wait for a specific element to ensure the page has loaded
        await page.waitForSelector('body', { timeout: 10000 });

        // Optional: If there is a JavaScript challenge, wait for Cloudflare's process to resolve
        await setTimeout(5000); // Increase timeout if needed

        // Extract and print the page content
        const content = await page.content();
        console.log('Page HTML:', content);
    } catch (error) {
        console.error('Error navigating to the page:', error);
    } finally {
        await browser.close();
    }
})();