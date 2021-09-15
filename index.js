const https = require('https');
const fs = require('fs')
const delay = require('delay');
const puppeteer = require('puppeteer');
const chalk = require('chalk');
const Parallel = require('./lib/Parallel');
const BROWSER = Symbol('puppeteer#browser')
const signin = require('./lib/signin')
const { scrollY, getDateTime } = require('./lib/util')
const mkdirp = require('mkdirp')
const URL = require('url').URL;


class PuppeteerInstagram {
    /**
     * @param {Object} [opts={}] 
     * @param {string} [opts.url]  ins链接：https://www.instagram.com/leedongwook_official/
     * @param {number} [opts.limit]  scratch的动态的数目
     * @param {number} [opts.from]  从第几条开始
     * @param {Object} [opts.user]  用户信息
     * @param {string} [opts.user.username]  用户信息
     * @param {string} [opts.user.password]  用户信息
     */
    constructor(opts = {}) {
        // shortcode接口并行请求数量 2
        // image cdn 并行请求数量   10 
        this._opts = opts;
        this.limit = opts.limit || 100;
        this.from = opts.from || 0;
        this.browserReady = false;
        this.shortCodeReady = false;
        this.shortCodes = [];
        this.images = []
        this.query_hash = '2efa04f61586458cef44441f474eee7c';

        this.init();

    }

    get browser () {
        return this[BROWSER];
    }

    async init() {
        const browser = await puppeteer.launch({ headless: false });
        this[BROWSER] = browser;
        this.browserReady = true;

        // 打开浏览器后，模拟用户停顿
        await delay(1200)

        // 登录先
        await signin(browser, this._opts.user);

        // 登录成功后，停顿一会儿打开目标ins主页
        await delay(1200)
        await this.startMain()
    }

    async startMain() {
        const browser = this[BROWSER];
        const page = await browser.newPage();
        await page.goto(this._opts.url);

        console.log(chalk.blue('页面开始滚动'));

        await this._collect_short_codes(page)
        await this._request_detail_list()
        await this._request_and_save_images()


        await browser.close();

    }

    writeShortCodesToDisk() {
        mkdirp.sync('.tmp')
        fs.writeFileSync(
            `.tmp/${+new Date()}.json`,
            JSON.stringify(this.shortCodes)
        )

    }

    async _collect_short_codes(page) {
        return new Promise(resolve => {
            page.on('response', async (res) => {
                const requestUrl = res.url();
    
                if(requestUrl.indexOf('graphql/query') !== -1) {
                    console.log(chalk.green('完成一次ins列表的请求'))
                    // this._saveShortCodes(res.json())
                    const shouldScroll = await this._handle_short_codes(res.json())
                    
                    if(shouldScroll) {
                        console.log('两秒后scroll')
                        await delay(2390)
                        scrollY(page, 800)

                        await delay(2000)
                        scrollY(page, 800)
                    }

                    if(shouldScroll === false) {
                        this.writeShortCodesToDisk()
                        resolve(null)
                    }
                   
                }
            })

        })


        

    }

    async _request_detail_list() {
        return new Promise(resolve => {
            console.log(this.shortCodes, this.shortCodes.length)
            const postUrls = this.shortCodes
                .splice(this.from)
                .map(code => this.generatePostUrl(code))
            
            new Parallel(postUrls, {
                limit: 2,
                onFinishOne: res => {
                    const list = res?.data?.shortcode_media?.edge_sidecar_to_children?.edges || [];
                    const imgs = list.map(item => item.node.display_url);

                    this.images.push(...imgs)
                    console.log(chalk.green('onFinishOne'))
                },
                onFinishAll: () => {
                    console.log(chalk.green(`一共抓取了${this.images.length}张图片链接`), '即将开始请求图片')
                    resolve(null)
                }
            })
            console.log(chalk.blue(`开始抓取${postUrls.length}条动态的所有图片`))
        })
    }

    async _request_and_save_images() {
        const dirName = getDateTime()
        await mkdirp(dirName)

        for(let i = 0; i < this.images.length; i ++) {
            await new Promise(resolve => {
                https.get(this.images[i], res => {
                    const imgSuffix = res.headers['content-type'].match(/^image\/(\w+)$/)[1];
                    const imagePath = `${dirName}/${Math.floor(Math.random() * 100000)}.${imgSuffix}`;
                    const stream = fs.createWriteStream(imagePath);
                    res.pipe(stream).on('finish', function() {
                        console.log(chalk.green(i + 1))
                        resolve(null)
                    })
                })
            })
            
        }
        
    }

    async _handle_short_codes(getJson) {
        const data = await getJson

        if(this.shortCodes.length >= this.limit + this.from) {
            console.log('🍓🍓🍓🍓🍓')
            this.shortCodeReady = true
            return false
        }

        const list = data.data?.user?.edge_owner_to_timeline_media?.edges || []
        const shortCodes = list.map(item => item.node.shortcode)
        this.shortCodes.push(...shortCodes)
        console.log(this.shortCodes.length);

        if(shortCodes.length) {
            return true
        }
    }

    /**
     * 
     * @param {string} shortCode 
     */
    generatePostUrl = (shortCode) => {
        const params = {
            shortcode: shortCode,
            child_comment_count:3,
            fetch_comment_count:40,
            parent_comment_count:24,
            has_threaded_comments:true
        }

        // 屏蔽关键字避免被抓
        const url = new URL(this._opts.url)
        const hostname = url.hostname

        const paramsStr = JSON.stringify(params)

        return `https://${hostname}/graphql/query/?query_hash=${this.query_hash}&variables=${encodeURIComponent(paramsStr)}`
    }

}

new PuppeteerInstagram({ 
    from: 200, // 从第4条ins开始爬取
    limit: 100, // 获取100条ins的图片
    url: 'https://www.instagram.com/leedongwook_official/', // 这个人的ins链接
    user: {
        username: 'na.kuku',
        password: 'LUOXIAOTONG'
    } 
})