const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { Solver } = require('@2captcha/captcha-solver');
const { normalizeUserAgent } = require('./normalize-ua.js');
const { readFileSync } = require('fs');
require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
puppeteer.use(StealthPlugin());

const CAPTCHA_API_KEY = process.env.CAPTCHA_API_KEY;
const PHANTOM_PRIVATE_KEY=process.env.PHANTOM_PRIVATE_KEY;
const PHANTOM_PASSWORD= process.env.PHANTOM_PASSWORD;
const phantom_extension_path = '/opt/google/chrome/extensions/phantom-extension';
// const phantom_extension_path='C:/Users/ahmer/AppData/Local/Google/Chrome/User Data/Default/Extensions/bfnaelmomeimhlpmgjnjophhpkkoljpa/24.28.0_0';
const chrome_user_data_dir = './user-directory';

const solver = new Solver(CAPTCHA_API_KEY);
let browser = null;
const MAX_DIRECTORY_SIZE_MB = 8000;
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function solveCaptcha(page, params) {
    console.log('Solving the captcha...');
    try {
        const res = await solver.cloudflareTurnstile(params);
        console.log(`Solved the captcha: ${res.id}`);
        await page.evaluate((token) => {
            cfCallback(token);
        }, res.data);    
        await delay(5000); 
    } catch (e) {
        console.error(`Captcha solving failed: ${e.message}`);
    }
}

async function main() {
    try {
        await cleanUpBrowser();
        await directoryCleanup(chrome_user_data_dir);
        const userAgent = await normalizeUserAgent();
    if (fs.existsSync('cancelled-orders.json')) {
        fs.unlinkSync('cancelled-orders.json');
        console.log('Deleted "cancelled-orders.json" file.');
    }
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        args: [
             `--disable-extensions-except=${phantom_extension_path}`,
            `--load-extension=${phantom_extension_path}`,
            '--start-maximized',
            `--user-agent=${userAgent}`,
            '--no-sandbox',
            // '--auto-open-devtools-for-tabs',
        ],
        userDataDir: chrome_user_data_dir
    });
    console.log('Browser opened.');

   


    const pages = await browser.pages();
    let mainPage = pages.length > 0 ? pages[0] : null;
    
    const preloadFile = readFileSync('./inject.js', 'utf8');
    await mainPage.evaluateOnNewDocument(preloadFile);
    mainPage.on('console', async (msg) => {
        const txt = msg.text();
        if (txt.includes('intercepted-params:')) {
            const params = JSON.parse(txt.replace('intercepted-params:', ''));
            console.log('CAPTCHA parameters intercepted:', params);
            await solveCaptcha(mainPage, params);
        }
    });

    await mainPage.goto('https://photon-sol.tinyastro.io/');
    await delay(6000); 
    await mainPage.waitForSelector('span.p-home__title__speed__inner', { timeout: 60000 });
    console.log(window.location.href);
    await mainPage.reload();
    await delay(4000); 

    
    const page_content = await mainPage.content();
    console.log('Page content:', page_content); 

    const allPages = await browser.pages();
    let extensionPage = allPages.find(page => page.url().includes('chrome-extension://'));

    if (extensionPage) {
        console.log('Extension page detected.');
        console.log('Wait until we complete the sign-in process...');
    
        try {
            await extensionPage.waitForSelector('::-p-xpath(//button[contains(@class, "ai2qbc9") and contains(text(), "I already have a wallet")])', { timeout: 20000});
            await extensionPage.$eval('::-p-xpath(//button[contains(@class, "ai2qbc9") and contains(text(), "I already have a wallet")])', button => {
                button.evaluate(b => b.click());  
            });
            await delay(2000);
        
            importprivatekey = await extensionPage.waitForSelector('::-p-xpath(//button[3])', { timeout: 20000});
            await importprivatekey.evaluate(b => b.click());
            
            await delay(2000);
            name_input = await extensionPage.waitForSelector("::-p-xpath(//input[@name='name'])", { timeout: 20000});
            await name_input.type("any");
            private_key_input=await extensionPage.waitForSelector("::-p-xpath(//textarea)", { timeout: 20000});
            await delay(1500);
            await private_key_input.type(PHANTOM_PRIVATE_KEY);
            await delay(2000);
            await extensionPage.$eval("::-p-xpath(//button[@data-testid='onboarding-form-submit-button'])", button => {
                button.evaluate(b => b.click());  
            });
            await delay(2000);
        
            password_input = await extensionPage.waitForSelector("::-p-xpath(//input[@name='password'])", { timeout: 20000});
            await password_input.type(PHANTOM_PASSWORD.toString());
            await delay(1000);
            confirm_password_input = await extensionPage.waitForSelector("::-p-xpath(//input[@name='confirmPassword'])", { timeout: 20000});
            await confirm_password_input.type(PHANTOM_PASSWORD.toString());
            await delay(1000);
            checkbox_input = await extensionPage.waitForSelector("::-p-xpath(//input[@type='checkbox'])", { timeout: 20000});
            await checkbox_input.evaluate(b => b.click());
            await delay(1000);
            await extensionPage.$eval("::-p-xpath(//button[@data-testid='onboarding-form-submit-button'])", button => {
                button.evaluate(b => b.click());  
            });
            await delay(4000);
            await extensionPage.$eval("::-p-xpath(//button[@data-testid='onboarding-form-submit-button'])", button => {
                button.evaluate(b => b.click());  
            });
            await delay(4000);
            await mainPage.bringToFront();
            await mainPage.$eval("::-p-xpath(//button[contains(.,'Connect wallet')])", button => {
                button.evaluate(b => b.click());  
            });
            await delay(3000);
            const allPages = await browser.pages();
            const popupPage = allPages.find(page => page.url().includes('chrome-extension://') && page.url().includes('notification.html'));
            if (popupPage) {
        
                await popupPage.bringToFront();
                await delay(2000);
                try {
                    const connectButton = await popupPage.waitForSelector('::-p-xpath(//button[contains(., "Connect")])', { timeout: 20000 });
                    await connectButton.evaluate(b => b.click());
        
                    await delay(5000); 
                    let confirmPopup = null;
                    for (let i = 0; i < 5; i++) { 
                        const allPages = await browser.pages();
                        confirmPopup = allPages.find(page => 
                            page.url().includes('chrome-extension://') && 
                            page.url().includes('notification.html') &&
                            !page.isClosed()
                        );
        
                        if (confirmPopup && confirmPopup !== popupPage) {
                            console.log('Detected new popup or updated confirmation popup.');
                            await confirmPopup.bringToFront();
                            break;
                        }
                        console.log(`Retrying to detect updated popup... (${i + 1}/5)`);
                        await delay(2000); 
                    }
        
                    if (!confirmPopup) {
                        throw new Error('Failed to detect updated popup window.');
                    }
        
                    const confirmButton = await confirmPopup.waitForSelector('::-p-xpath(//button[@data-testid="primary-button"])', { timeout: 20000 });
                    await confirmButton.evaluate(b => b.click());
        
                    await delay(5000);
        
                } catch (error) {
                    console.error('Error during wallet connection:', error);
                }
        
            }
            else{
                console.log('Popup page not detected!');
            }
        
        } catch (error) {
            console.error('Error waiting for or clicking wallet button:', error);
        }
    } else {
        console.log('Extension not triggered, skipping onboarding.');
        console.log('No need to connect wallet. already connected');
    }
    await mainPage.bringToFront();
    console.log('On main page.')
    console.log('current url:', mainPage.url());
    const orderButton = await mainPage.waitForSelector("::-p-xpath(//a[.='Orders'])", { timeout: 20000 });
    await orderButton.click();
    await delay(6000);
   
    let isEndOfPage = false;
    let previousHeight = 0; 
    let retryCount = 0;     
    const maxRetries = 5;   
    
    while (!isEndOfPage) { 
        
        await mainPage.evaluate(() => window.scrollBy(0, 1000));
        await delay(2000);
    
        await mainPage.evaluate(() => {
            const scrollContainer = document.querySelector('.u-overflow-x-auto.c-grid-table-scroll.c-grid-table-scroll--my-holdings.c-grid-table-scroll--sm');
            if (scrollContainer) {
                scrollContainer.scrollBy(200, 0);
                console.log('Scrolled the horizontal container to the right.');
                setTimeout(() => {
                    scrollContainer.scrollBy(-200, 0);
                    console.log('Scrolled the horizontal container to the left.');
                }, 1000);
            } else {
                console.error('Horizontal scroll container not found.');
            }
        });
        await delay(2000);
    
        console.log('Scrolling horizontally');
    
        const currentHeight = await mainPage.evaluate('document.body.scrollHeight');
        if (currentHeight === previousHeight) {
            retryCount++;
            console.log(`No new content detected. Retry ${retryCount}/${maxRetries}`);
            if (retryCount >= maxRetries) {
                isEndOfPage = true; 
            }
        } else {
            retryCount = 0; 
            previousHeight = currentHeight;
        }
        isEndOfPage = isEndOfPage || await mainPage.evaluate(() => {
            return window.innerHeight + window.scrollY >= document.body.scrollHeight;
        });
    
        if (isEndOfPage) {
            console.log('Scrolled to the end of the page.');
    
            orderscount = await mainPage.$$eval("::-p-xpath(//div[@class='c-grid-table__tr c-trades-table__tr c-trades-table__tr--buy'])", rows => rows.length);
            console.log('Total Orders:', orderscount.toString());
        }
    }
    await delay(3000);

    
   

    const cancelOrders = await mainPage.$$eval(
        "::-p-xpath(//span[.='canceled']/ancestor::div[contains(@class,'c-grid-table__tr ')])",
        (rows) => {
            const convertTargetPrice = (price) => {
                const regex = /MC \$(\d+(\.\d+)?)([KM])?/i;
                const match = price.match(regex);
                if (match) {
                    let value = parseFloat(match[1]);
                    const suffix = match[3];
            
                    if (suffix === 'M' || suffix === 'm') {
                        value *= 1000000; 
                    } else if (suffix === 'K' || suffix === 'k') {
                        value *= 1000; 
                    }
                    return Math.round(value); 
                }
                return 0; 
            };
    
            const getXPathElementText = (context, xpath) => {
                const element = document.evaluate(xpath, context, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                return element ? element.textContent.trim() : "N/A";
            };
    
            const getXPathElementAttribute = (context, xpath) => {
                const element = document.evaluate(xpath, context, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                return element ? element.nodeValue.trim() : "N/A";
            };
    
            const baseUrl = "https://photon-sol.tinyastro.io";
            
            return rows.map((row, index) => {
                const relativeLink = getXPathElementAttribute(row, ".//div[3]//a/@href");
                const tokenLink = relativeLink !== "N/A" ? new URL(relativeLink, baseUrl).href : "N/A";
                const tokenAmount = getXPathElementText(row, ".//div[4]");
                const tokenCondition = getXPathElementText(row, ".//div[5]//span");
                const tokenTargetPrice = getXPathElementText(row, ".//div[7]//div[@class='c-indx-table__cell__subtext']");
                return {
                    id: `order-${index + 1}`,
                    status: "not done",
                    tokenLink,
                    tokenAmount,
                    tokenCondition,
                    tokenTargetPrice: convertTargetPrice(tokenTargetPrice), 
                };
            });
        }
    );
    console.log('Cancel Orders length before removing duplicates', cancelOrders.length);
    const activeOrders = await mainPage.$$eval(
        "::-p-xpath(//span[.='active']/ancestor::div[contains(@class,'c-grid-table__tr ')])",
        (rows) => {
    
            const getXPathElementText = (context, xpath) => {
                const element = document.evaluate(xpath, context, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                return element ? element.textContent.trim() : "N/A";
            };
    
            const getXPathElementAttribute = (context, xpath) => {
                const element = document.evaluate(xpath, context, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                return element ? element.nodeValue.trim() : "N/A";
            };
    
            const baseUrl = "https://photon-sol.tinyastro.io";
            
            return rows.map((row, index) => {
                const relativeLink = getXPathElementAttribute(row, ".//div[3]//a/@href");
                const tokenLink = relativeLink !== "N/A" ? new URL(relativeLink, baseUrl).href : "N/A";
                const tokenAmount = getXPathElementText(row, ".//div[4]");
                const tokenCondition = getXPathElementText(row, ".//div[5]//span");
                return {
                    id: `order-${index + 1}`,
                    tokenLink,
                    tokenAmount,
                    tokenCondition,
                };
            });
        }
    );
    
    const matchingOrders = cancelOrders.filter(order => 
        activeOrders.some(activeOrder => 
          activeOrder.tokenLink === order.tokenLink &&
          (
            (activeOrder.tokenCondition.includes("Buy dip") && order.tokenCondition.includes("Buy dip")) ||
            (activeOrder.tokenCondition.includes("Take profit") && order.tokenCondition.includes("Take profit")) ||
            (activeOrder.tokenCondition.includes("Stop loss") && order.tokenCondition.includes("Stop loss"))
          )
        )
      );
        console.log('Matching Orders length:', matchingOrders.length);
        const filteredcancelOrders = cancelOrders.filter(order =>
            !matchingOrders.some(matchingOrder => matchingOrder.tokenLink === order.tokenLink && matchingOrder.tokenCondition === order.tokenCondition)
        );
        console.log('Cancel Orders length after removing duplicates', filteredcancelOrders.length);
    await delay(8000);
    if(matchingOrders.length > 0){
        console.log('Duplicate orders found.');
        for(const matchingOrder of matchingOrders){
            const compareLink = matchingOrder.tokenLink.replace('https://photon-sol.tinyastro.io', '');
            const compareCondition = matchingOrder.tokenCondition;
            const orderRowXPath = `//span[.='canceled']/ancestor::div[contains(@class,'c-grid-table__tr ') and .//div[3]//a[@href='${compareLink}'] and .//div[5]//span[normalize-space(text())='${compareCondition}']]`;
            const orderRow = await mainPage.$(`::-p-xpath(${orderRowXPath})`);
    
            if (!orderRow) {
                console.error(`Order row for ${matchingOrder.tokenLink} and ${matchingOrder.tokenCondition} not found.`);
            } else {
                const deleteButtonXPath = ".//span[@class='c-icon c-icon--trash c-task-table__icon']/ancestor::div[@class='c-grid-table__td c-trades-table__td']";
                const deleteButton = await orderRow.$(`::-p-xpath(${deleteButtonXPath})`);
    
                if (deleteButton) {
                    await deleteButton.click();
                    await delay(2000);
                    console.log(`Delete button clicked for Order that is already activated: ${matchingOrder.tokenLink}  ${matchingOrder.tokenCondition}`);
                } 
                else {
                    console.error(`Delete button not found for Order that is already activated: ${matchingOrder.tokenLink}  ${matchingOrder.tokenCondition}`);
                }
            }
        }
    }
    
    
    
    fs.writeFileSync('cancelled-orders.json', JSON.stringify(filteredcancelOrders, null, 2));
    console.log('Cancelled orders saved to "cancelled-orders.json" file.');
    
    const buyDipOrders = filteredcancelOrders.filter(order => order.tokenCondition.includes("Buy dip"));
    if(buyDipOrders.length > 0){
        console.log('Buy dip orders found.');
        for(const buydiporder of buyDipOrders){
            const newTab = await mainPage.browser().newPage();
            console.log(`Navigating to ${buydiporder.tokenLink} for Order ID: ${buydiporder.id}`);
            await newTab.goto(buydiporder.tokenLink, { waitUntil: 'load' });
            await delay(3000);
            await newTab.waitForSelector('body');
            const buydipoption = await newTab.waitForSelector("::-p-xpath(//div[@class='l-col-auto'][2]//div[@class='c-checkbox__inner c-checkbox__inner--rounded'][1])", { timeout: 20000 });
            await buydipoption.click();
            await delay(2000);
            const buyamountinput = await newTab.waitForSelector("::-p-xpath(//div[@class='js-price-form']//input[@placeholder='Amount to buy in SOL'])", { timeout: 20000 });
            await buyamountinput.type(buydiporder.tokenAmount.toString());
            const Mcdropdown = await newTab.waitForSelector("::-p-xpath(//div[@data-tab-id='dip']//div[contains(@class,'c-btn c-btn--transparent c-drop-group__select__toggle js-dropdown__toggle')][1])", { timeout: 20000 });
            await Mcdropdown.click();
            await delay(2000);
            const Mcoptionselector = await newTab.waitForSelector("::-p-xpath(//div[@data-tab-id='dip']//div[@data-value='MC is'])", { timeout: 20000 });
            await Mcoptionselector.click();
            await delay(2000);
            const mcoptioninput=await newTab.waitForSelector("::-p-xpath(//div[@data-tab-id='dip']//input[@data-type='usd'])", { timeout: 20000 });
            await mcoptioninput.type(buydiporder.tokenTargetPrice.toString());
            await delay(2000);
            const expirationhours = await newTab.waitForSelector("::-p-xpath(//div[@data-tab-id='dip']//input[@data-kind='expiration_type'])", { timeout: 20000 });
            await expirationhours.click();
            for (let i = 0; i < 3; i++) {
                await expirationhours.press('Backspace');
            }
            await expirationhours.type("3");
            await delay(2000);
            const orderbutton=await newTab.waitForSelector("::-p-xpath(//div[@data-tab-id='dip']//button[contains(@class,'js-show__buy-order__submit')][1])", { timeout: 20000 });
            await orderbutton.click();
            try {
                const toastmessage = await newTab.waitForSelector(
                    "::-p-xpath(//div[@class='iziToast-wrapper iziToast-wrapper-topCenter'])",
                    { timeout: 20000 }
                );
                
                const toastText = await toastmessage.evaluate(el => el.textContent.trim());
                
                if (toastText.includes("Order has been successfully created")) {
                    buydiporder.status = "done"; 
                } else {
                    console.log("Order creation failed or unexpected toast message.");
                    if (fs.existsSync('order-creation-failed.txt')) {
                        fs.appendFileSync(
                            'order-creation-failed.txt',
                            `\n${buydiporder.tokenLink}, ${buydiporder.tokenCondition}, for entering this amount : ${buydiporder.tokenTargetPrice} failing to reactivate because of percentage or some other error \n`
                        );
                    }
                }
            } catch (error) {
                console.error("Toast message not found or timeout occurred:", error);
            }
            await delay(4000);
            await newTab.close();
            fs.writeFileSync('cancelled-orders.json', JSON.stringify(filteredcancelOrders, null, 2));
            console.log('Updated cancelled orders saved to "cancelled-orders.json" file.');
            if(buydiporder.status === "done"){
                console.log(`Order ${buydiporder.id} is marked as done. Deleting the order now...`);
                try {
                    // Locate the specific row using the `tokenLink`
                    // first make the links https://photon-sol.tinyastro.io/en/lp/pool_redirect?id=3430673 like this to  /en/lp/pool_redirect?id=3430673 for comparison
                    // and tokencondition should also match .//div[5]//span
                    const compareLink = buydiporder.tokenLink.replace('https://photon-sol.tinyastro.io', '');
                    const compareCondition = buydiporder.tokenCondition;
                    const orderRowXPath = `//span[.='canceled']/ancestor::div[contains(@class,'c-grid-table__tr ') and .//div[3]//a[@href='${compareLink}'] and .//div[5]//span[normalize-space(text())='${compareCondition}']]`;
                    const orderRow = await mainPage.$(`::-p-xpath(${orderRowXPath})`);
            
                    if (!orderRow) {
                        console.error(`Order row for ${buydiporder.id} not found.`);
                    } else {
                        const deleteButtonXPath = ".//span[@class='c-icon c-icon--trash c-task-table__icon']/ancestor::div[@class='c-grid-table__td c-trades-table__td']";
                        const deleteButton = await orderRow.$(`::-p-xpath(${deleteButtonXPath})`);
            
                        if (deleteButton) {
                            await deleteButton.click();
                        } 
                        else {
                            console.error(`Delete button not found for Order ID: ${buydiporder.id}.`);
                        }
                    }
                }
                catch (error) {
                        console.error(`Error deleting order ${buydiporder.id}:`, error);
                    }
                }

    }
}
    const takeprofitOrders = filteredcancelOrders.filter(order => order.tokenCondition.includes("Take profit"));
    if(takeprofitOrders.length > 0){
        console.log('Take profit orders found.');
        for(const takeprofitorder of takeprofitOrders){
            const newTab1 = await mainPage.browser().newPage();
            console.log(`Navigating to ${takeprofitorder.tokenLink} for Order ID: ${takeprofitorder.id}`);
            await newTab1.goto(takeprofitorder.tokenLink, { waitUntil: 'load' });
            await delay(3000);
            await newTab1.waitForSelector('body');
            const selltab = await newTab1.waitForSelector("::-p-xpath(//div[@class='p-show__widget__tabs']//div[@data-tab-id='sell'])", { timeout: 20000 });
            await selltab.click();
            await delay(2000);
            const takeprofitoption = await newTab1.waitForSelector("::-p-xpath(//div[@data-tab-id='sell']//label[@data-tab-id='auto_sell']/ancestor::div[contains(@class, 'l-col-auto')])", { timeout: 20000 });
            await takeprofitoption.click();
            await delay(2000);
            const takeprofittab = await newTab1.waitForSelector("::-p-xpath((//div[@class='c-show-sell__tabs js-tabs']//div[@data-tab-id='take_profit'])[1])", { timeout: 20000 });
            await takeprofittab.click();
            await delay(2000);
            const takeprofitmcdropdown = await newTab1.waitForSelector("::-p-xpath(//div[@class='c-show-sell__tabs__inner js-tabs__content js-w-form__price-trigger is-selected']//div[@class='c-dropdown c-drop-group__select js-dropdown']//div[contains(@class,'c-btn')])", { timeout: 20000 });
            await takeprofitmcdropdown.click();
            await delay(2000);
            const Takeprofitmcoptionselector = await newTab1.waitForSelector("::-p-xpath(//div[@class='c-show-sell__tabs__inner js-tabs__content js-w-form__price-trigger is-selected']//div[@class='c-dropdown c-drop-group__select js-dropdown']//div[@data-value='MC is'])", { timeout: 20000 });
            await Takeprofitmcoptionselector.click();
            await delay(2000);
            const takeprofitmcoptioninput=await newTab1.waitForSelector("::-p-xpath((//div[@class='c-show-sell__tabs__inner js-tabs__content js-w-form__price-trigger is-selected']//input[contains(@class,'c-field__input js-w-form__price-trigger__field')])[2])", { timeout: 20000 });
            await takeprofitmcoptioninput.type(takeprofitorder.tokenTargetPrice.toString());
            await delay(2000);
            const sellamount = await newTab1.waitForSelector(
                "::-p-xpath(//div[@class='c-show-sell__tabs__inner js-tabs__content js-w-form__price-trigger is-selected']//input[@class='c-field__input js-w-form__sell-amnt js-show__sell-order__input'])",
                { timeout: 20000 }
            );
            await sellamount.click();
            await delay(1000);

            for (let i = 0; i < 3; i++) {
                await sellamount.press('Backspace');
            }
            await sellamount.type(takeprofitorder.tokenAmount.replace('%', '').trim());
            await delay(2000);
            const takeprofitexpirationhours = await newTab1.waitForSelector("::-p-xpath((//div[@class='u-px-s u-pb-xs'])[1]//input)", { timeout: 20000 });
            await takeprofitexpirationhours.click();
            for (let i = 0; i < 3; i++) {
                await takeprofitexpirationhours.press('Backspace');
            }
            await takeprofitexpirationhours.type("3");
            await delay(2000);
            const takeprofitorderbutton=await newTab1.waitForSelector("::-p-xpath((//button[contains(@class,'u-mt-s u-w-100 c-btn c-w-form__submit c-btn--purple js-show__sell-order__submit')])[1])", { timeout: 20000 });
            await takeprofitorderbutton.click();
            try {
                const toastmessage = await newTab1.waitForSelector(
                    "::-p-xpath(//div[@class='iziToast-wrapper iziToast-wrapper-topCenter'])",
                    { timeout: 20000 }
                );
                
                const toastText = await toastmessage.evaluate(el => el.textContent.trim());
                
                if (toastText.includes("Order has been successfully created")) {
                    console.log("Order successfully created. Updating status to 'done'.");
                    takeprofitorder.status = "done"; 
                } else {
                    console.log("Order creation failed or unexpected toast message.");
                    
                    if (fs.existsSync('order-creation-failed.txt')) {
                        fs.appendFileSync(
                            'order-creation-failed.txt', 
                            `\n${takeprofitorder.tokenLink}, ${takeprofitorder.tokenCondition}, for entering this amount : ${takeprofitorder.tokenTargetPrice} failing to reactivate because of percentage or some other error \n`
                        );
                    }
                }
            } catch (error) {
                console.error("Toast message not found or timeout occurred:", error);
            }
            await delay(4000);
            await newTab1.close();
            fs.writeFileSync('cancelled-orders.json', JSON.stringify(filteredcancelOrders, null, 2));
            console.log('Updated cancelled orders saved to "cancelled-orders.json" file.');
            if(takeprofitorder.status === "done"){
                console.log(`Order ${takeprofitorder.id} is marked as done. Deleting the order now...`);
                try {
                    // Locate the specific row using the `tokenLink`
                    // first make the links https://photon-sol.tinyastro.io/en/lp/pool_redirect?id=3430673 like this to  /en/lp/pool_redirect?id=3430673 for comparison
                    // and tokencondition should also match .//div[5]//span
                    const compareLink = takeprofitorder.tokenLink.replace('https://photon-sol.tinyastro.io', '');
                    const compareCondition = takeprofitorder.tokenCondition;
                    const orderRowXPath = `//span[.='canceled']/ancestor::div[contains(@class,'c-grid-table__tr ') and .//div[3]//a[@href='${compareLink}'] and .//div[5]//span[normalize-space(text())='${compareCondition}']]`;
                    const orderRow = await mainPage.$(`::-p-xpath(${orderRowXPath})`);
            
                    if (!orderRow) {
                        console.error(`Order row for ${takeprofitorder.id} not found.`);
                    } else {
                        const deleteButtonXPath = ".//span[@class='c-icon c-icon--trash c-task-table__icon']/ancestor::div[@class='c-grid-table__td c-trades-table__td']";
                        const deleteButton = await orderRow.$(`::-p-xpath(${deleteButtonXPath})`);
            
                        if (deleteButton) {
                            await deleteButton.click();
                            console.log(`Delete button clicked for Order ID: ${takeprofitorder.id}`);
                        } 
                        else {
                            console.error(`Delete button not found for Order ID: ${takeprofitorder.id}.`);
                        }
                    }
                }
                catch (error) {
                        console.error(`Error deleting order ${takeprofitorder.id}:`, error);
                    }
                }

            }
        
    }
    const stoplossOrders = filteredcancelOrders.filter(order => order.tokenCondition.includes("Stop loss"));
    if(stoplossOrders.length > 0){
        console.log('Stop loss orders found.');
        for (const stoplossorder of stoplossOrders) {
            const newTab2 = await mainPage.browser().newPage();
            console.log(`Navigating to ${stoplossorder.tokenLink} for Order ID: ${stoplossorder.id}`);
            await newTab2.goto(stoplossorder.tokenLink, { waitUntil: 'load' });
            await delay(3000);
            await newTab2.waitForSelector('body');
            const selltabforstoploss = await newTab2.waitForSelector("::-p-xpath(//div[@class='p-show__widget__tabs']//div[@data-tab-id='sell'])", { timeout: 20000 });
            await selltabforstoploss.click();
            await delay(2000);
            const autosellbtn = await newTab2.waitForSelector("::-p-xpath(//div[@data-tab-id='sell']//label[@data-tab-id='auto_sell']/ancestor::div[contains(@class, 'l-col-auto')])", { timeout: 20000 });
            await autosellbtn.click();
            await delay(2000);
            const stoplossmcdropdown = await newTab2.waitForSelector("::-p-xpath((//div[@data-tab-id='stop_loss'])[2]//div[@class='c-dropdown c-drop-group__select js-dropdown']//div[contains(@class,'c-btn')])", { timeout: 20000 });
            await stoplossmcdropdown.click();
            await delay(2000);
            const stoplossmcoptionselector = await newTab2.waitForSelector("::-p-xpath((//div[@data-tab-id='stop_loss'])[2]//div[@class='c-dropdown c-drop-group__select js-dropdown']//div[@data-value='MC is'])", { timeout: 20000 });
            await stoplossmcoptionselector.click();
            await delay(2000);
            const stoplossmcoptioninput=await newTab2.waitForSelector("::-p-xpath(((//div[@data-tab-id='stop_loss'])[2]//input[@data-line-id='stop_loss'])[2])", { timeout: 20000 });
            await stoplossmcoptioninput.type(stoplossorder.tokenTargetPrice.toString());
            await delay(2000);
            const stoplossSellamount = await newTab2.waitForSelector(
                "::-p-xpath((//div[@data-tab-id='stop_loss'])[2]//input[@class='c-field__input js-w-form__sell-amnt js-show__sell-order__input'])",
                { timeout: 20000 }
            );
            await stoplossSellamount.click();
            await delay(1000);
            for (let i = 0; i < 3; i++) {
                await stoplossSellamount.press('Backspace');
            }
            await stoplossSellamount.type(stoplossorder.tokenAmount.replace('%', '').trim());
            await delay(2000);
            const stoplossexpirationhours = await newTab2.waitForSelector("::-p-xpath((//div[@class='u-px-s u-pb-xs'])[1]//input)", { timeout: 20000 });
            await stoplossexpirationhours.click();
            for (let i = 0; i < 3; i++) {
                await stoplossexpirationhours.press('Backspace');
            }
            await stoplossexpirationhours.type("3");
            await delay(2000);
            const stoplossorderbutton=await newTab2.waitForSelector("::-p-xpath((//button[contains(@class,'u-mt-s u-w-100 c-btn c-w-form__submit c-btn--purple js-show__sell-order__submit')])[1])", { timeout: 20000 });
            await stoplossorderbutton.click();
            try {
                const toastmessage = await newTab2.waitForSelector(
                    "::-p-xpath(//div[@class='iziToast-wrapper iziToast-wrapper-topCenter'])",
                    { timeout: 20000 }
                );
                
                const toastText = await toastmessage.evaluate(el => el.textContent.trim());
                
                if (toastText.includes("Order has been successfully created")) {
                    console.log("Order successfully created. Updating status to 'done'.");
                    stoplossorder.status = "done"; 
                } else {
                    console.log("Order creation failed or unexpected toast message.");
                    if (fs.existsSync('order-creation-failed.txt')) {
                        fs.appendFileSync(
                            'order-creation-failed.txt', 
                            `\n${stoplossorder.tokenLink}, ${stoplossorder.tokenCondition}, for entering this amount : ${stoplossorder.tokenTargetPrice} failing to reactivate because of percentage or some other error \n`
                        );
                    }

                }
            } catch (error) {
                console.error("Toast message not found or timeout occurred:", error);
            }
            await delay(4000);
            await newTab2.close();
            fs.writeFileSync('cancelled-orders.json', JSON.stringify(filteredcancelOrders, null, 2));
            console.log('Updated cancelled orders saved to "cancelled-orders.json" file.');

            if(stoplossorder.status === "done"){
                console.log(`Order ${stoplossorder.id} is marked as done. Deleting the order now...`);
                try {
                    // Locate the specific row using the `tokenLink`
                    // first make the links https://photon-sol.tinyastro.io/en/lp/pool_redirect?id=3430673 like this to  /en/lp/pool_redirect?id=3430673 for comparison
                    // and tokencondition should also match .//div[5]//span
                    const compareLink = stoplossorder.tokenLink.replace('https://photon-sol.tinyastro.io', '');
                    const compareCondition = stoplossorder.tokenCondition;
                    const orderRowXPath = `//span[.='canceled']/ancestor::div[contains(@class,'c-grid-table__tr ') and .//div[3]//a[@href='${compareLink}'] and .//div[5]//span[normalize-space(text())='${compareCondition}']]`;
                    const orderRow = await mainPage.$(`::-p-xpath(${orderRowXPath})`);
            
                    if (!orderRow) {
                        console.error(`Order row for ${stoplossorder.id} not found.`);
                    } else {
                        const deleteButtonXPath = ".//span[@class='c-icon c-icon--trash c-task-table__icon']/ancestor::div[@class='c-grid-table__td c-trades-table__td']";
                        const deleteButton = await orderRow.$(`::-p-xpath(${deleteButtonXPath})`);
            
                        if (deleteButton) {
                            await deleteButton.click();
                            console.log(`Delete button clicked for Order ID: ${stoplossorder.id}`);
                        } 
                        else {
                            console.error(`Delete button not found for Order ID: ${stoplossorder.id}.`);
                        }
                    }
                }
                catch (error) {
                        console.error(`Error deleting order ${stoplossorder.id}:`, error);
                    }
                }
        }
    }
   
    await delay(5000);
    await browser.close();
    browser = null; 
    console.log('All orders completed.'); 
    console.log('Automation complete.');
    setTimeout(async () => {
        console.log('Restarting the main function after 6 minutes');
        await main(); 
    }, 6 * 60 * 1000);
}catch (error) {
    console.error('Error in main function:', error);
    await cleanUpBrowser();
    console.log('main crashed so start again in an instant');
    setTimeout(async () => {
        await main(); 
    }, 1000);
}
    
};
async function cleanUpBrowser() {
    try {
        if (browser) {
            console.log('Closing active browser instance...');
            await browser.close();
            browser = null;
        }
        console.log('Killing orphaned browser processes...');
        execSync('pkill -9 chrome || true'); 
        console.log('Orphaned browser processes terminated.');
    } catch (err) {
        console.error('Error during browser cleanup:', err.message);
    }
}
async function directoryCleanup(directoryPath) {
    try {
        const directorySize = getDirectorySize(directoryPath) / (1024 * 1024);
        if (directorySize > MAX_DIRECTORY_SIZE_MB) {
            console.log('Directory exceeds MAX_DIRECTORY_SIZE_MB set in file');
            fs.rmSync(directoryPath, { recursive: true, force: true });
            console.log('User session directory deleted.');
        }else{
            console.log('Directory size is within the limit.');
        }
    } catch (error) {
        console.error('Error during directory cleanup:', error.message);
    }
}
function getDirectorySize(directoryPath) {
    let totalSize = 0;
    function calculateSize(directory) {
        const files = fs.readdirSync(directory);
        for (const file of files) {
            const filePath = path.join(directory, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                calculateSize(filePath);
            } else {
                totalSize += stats.size;
            }
        }
    }
    calculateSize(directoryPath);
    return totalSize; 
}
main();



