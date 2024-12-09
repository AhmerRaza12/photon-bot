
const { connect } = require("puppeteer-real-browser")

async function test() {

    const { browser, page } = await connect({

        headless: false,

        args: [
            '--no-sandbox',
            '--start-maximized',
        ],

        customConfig: {},

        turnstile: true,

        connectOption: {},

        disableXvfb: false,
        ignoreAllFlags: false,
        defaultViewport: null,

    })
    await page.goto('https://photon-sol.tinyastro.io/')

    const page_content = await page.content();
    console.log(page_content)

}

test()