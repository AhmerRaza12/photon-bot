const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { setTimeout } = require('timers/promises');

// Use Puppeteer Extra with Stealth Plugin
puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new', // Use new headless mode to reduce bot detection
        defaultViewport: null,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-infobars',
            '--window-size=1920,1080',
            '--enable-features=NetworkService,NetworkServiceInProcess',
        ],
    });

    const page = await browser.newPage();

    // Set a realistic user agent and headers
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

    // await page.setExtraHTTPHeaders({
    //     'Accept-Language': 'en-US,en;q=0.9',
    // });

    // Prevent detection of headless Chrome by overriding certain properties
    await page.evaluateOnNewDocument(() => {
        // Mimic a real browser environment
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        Object.defineProperty(window, 'chrome', { get: () => ({ runtime: {} }) });
        Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    });

    await page.setViewport({ width: 1920, height: 1080 });

    try {
        console.log('Navigating to the page...');
        // Attempt to navigate to the page and wait for Cloudflare to resolve the challenge
        await page.goto('https://photon-sol.tinyastro.io/', { waitUntil: 'domcontentloaded' });

        // Introduce a delay to allow for Cloudflare challenge resolution
        await setTimeout(8000); // Increase timeout if needed

        // Optional: Check the content after a brief wait to ensure Cloudflare has passed
        const content = await page.content();
        console.log('Page HTML:', content);

    } catch (error) {
        console.error('Error navigating to the page:', error);
    } finally {
        await browser.close();
    }
})();
