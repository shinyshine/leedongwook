const puppeteer = require('puppeteer');
// const puppeteerExtra = require('puppeteer-extra');
const delay = require('delay');


// puppeteerExtra.use(require('puppeteer-extra-plugin-stealth')())

(async () => {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.goto('https://www.instagram.com/leedongwook_official/');
    // await page.goto('https://www.baidu.com/');
    // await page.goto('https://pptr.dev/#?product=Puppeteer&version=v10.2.0&show=api-event-response');

    await delay(300);
    await page.screenshot({ path: 'screenshot.png' });
    await browser.close();
})()