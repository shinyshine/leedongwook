'use strict'
const delay = require('delay');
const Browser = require('puppeteer').Browser;

/**
 * 登录
 * @param {Browser} browser 
 * @param {Object} user 
 * @param {string} user.username
 * @param {string} user.password
 * 
 */
module.exports = async (browser, user) => {
    const page = await browser.newPage()
    await page.goto('https://www.instagram.com/accounts/login/');

    await page.waitForSelector('input[name=username]', { visible: true })

    // delay 模拟用户操作的停顿，停顿时间随机

    await delay(620)
    await page.type('input[name=username]', user.username, { delay: 30 })

    await delay(530)
    await page.type('input[name=password]', user.password, { delay: 56 })

    await delay(500)
    const [ signup ] = await page.$x('//button[contains(.,"登录")]')

    await Promise.all([
        page.waitForNavigation(),
        signup.click({ delay: 40 })
    ])

    await delay(400)
    await page.close()
}