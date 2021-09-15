const Page = require('puppeteer').Page

/**
 * 
 * @param {Page} page 
 */
exports.scrollY = function(page) {
    page.evaluate(() => {
        window.scrollBy(0, 800)
    })
}

exports.getDateTime = function() {
    const date = new Date()
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    const hour = date.getHours()
    const min = date.getMinutes()
    const sec = date.getSeconds()

    return `${year}-${month}-${day} ${hour}:${min}:${sec}`
}