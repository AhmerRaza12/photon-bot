const puppeteer = require('puppeteer');
const { normalizeUserAgent } = require('./normalize-ua.js');
const { Solver } = require('@2captcha/captcha-solver');
const { readFileSync } = require('fs');
require('dotenv').config();
const {setTimeout } = require('timers/promises');
const CAPTCHA_API_KEY = process.env.CAPTCHA_API_KEY;
const solver = new Solver(CAPTCHA_API_KEY);
console.log(`Using 2captcha API key: ${CAPTCHA_API_KEY}`);
(async () => {
    const userAgent = await normalizeUserAgent();
    console.log(userAgent);
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: [
            '--start-maximized',
            `--user-agent=${userAgent}`,
            '--no-sandbox'
        ]
    });

    const [page] = await browser.pages();
    const preloadFile = readFileSync('./inject.js', 'utf8');
    await page.evaluateOnNewDocument(preloadFile);

    page.on('console', async (msg) => {
        const txt = msg.text();
        if (txt.includes('intercepted-params:')) {
            const params = JSON.parse(txt.replace('intercepted-params:', ''));
            console.log(params);

            try {
                console.log('Solving the captcha...');
                const res = await solver.cloudflareTurnstile(params);
                console.log(`Solved the captcha ${res.id}`);
                console.log(res);
                await page.evaluate((token) => {
                    cfCallback(token);
                }, res.data);
            } catch (e) {
                console.error(e.message);
                process.exit(1);
            }
        }
    });

    page.goto('https://photon-sol.tinyastro.io/');
    setTimeout(15000);
    await page.screenshot({ path: 'screenshot.png' });
    page_content = await page.content();
    console.log(page_content);
})();
