const puppeteer = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');
const { executablePath } = require('puppeteer'); // This can help if you need the path to a specific Chromium executable
const { setTimeout } = require('timers/promises');
// Cloudflare-protected page URL
const link = 'https://www.g2.com/';

// Function to get HTML content through Cloudflare protection
const getHtmlThoughCloudflare = async (url) => {
  puppeteer.use(pluginStealth()); // Use the Stealth plugin to prevent detection

  try {
    // Launch Puppeteer with stealth and headless mode
    const browser = await puppeteer.launch({
      headless: true, // Running in headless mode
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled', // Disable automated browsing features
        '--window-size=1920,1080',
      ],
    });

    const page = await browser.newPage();

    // Set a realistic user agent and headers to further prevent detection
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Wait for some time to let any Cloudflare challenges complete (increase if needed)
    await setTimeout(8000); 

    // Get the page content
    const html = await page.content();

    await browser.close();
    console.log(`HTML content successfully fetched from: ${url}`);
    return html;
  } catch (error) {
    console.error('Error fetching page content:', error);
  }
};

// Call the function to get the HTML content of the page
getHtmlThoughCloudflare(link)
  .then((html) => {
    if (html) {
      console.log('HTML Content:', html); // Print HTML content if successfully fetched
    }
  })
  .catch((err) => {
    console.error('Error:', err); // Catch any errors that occur
  });
