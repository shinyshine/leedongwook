const axios = require('axios');
const chalk = require('chalk');

class Parallel {
    /**
     * @param {string[]} urls
     * @param {Object} options
     * @param {number} options.limit // 同时请求数目
     * @param {Function} options.onFinishAll // 请求全部完成回调，返回全部接口不保证顺序
     * @param {Function} options.onFinishOne // 完成一个请求回调, 返回当前结果和剩余数目
     */
    constructor(urls, options) {

        this._urls = urls;
        this._opts = options;
        this.workingUrls = [...urls];
        this.limit = options.limit || 5;
        this.onFinishOne = options.onFinishOne || (() => {});
        this.onFinishAll = options.onFinishAll || (() => {});
        this.resAll = []

        this.start();

    }

    start() {
        const firstUrls = this.workingUrls.splice(0, this.limit);

        firstUrls.forEach(url => {
            return this.wrapRequest(url)
        })

    }

    wrapRequest = (url) => {
        // onFinishOne
        console.log(chalk.blue('发起新的请求'), url)
        return axios({
            url: url, 
            headers: {
                cookie: 'mid=YNvqMgAEAAGqNrftULX8gcIfc8sT; ig_did=E3FC966B-265E-46CD-BCB6-2495F9B84609; ig_nrcb=1; shbid="861205468796776730541663122177:01f7e5e55a9f29a7225d6448bceea076fd88493e687ca756683f0663166a9db4686e9f6f"; shbts="163158617705468796776730541663122177:01f76fb38f5bc12d5d7f4b5d52807e1bd831759e4504b964c52d6781713fc558338b7467"; ig_lang=en; csrftoken=YMucJsf56cXj2YVZLGPBXTZueyM2yd8J; ds_user_id=6879677673; sessionid=6879677673%3AHTY00fWJ0fUj4l%3A5; rur="EAG05468796776730541663153677:01f75b1ec56a5c164a607c8b081414bc1bcb4cbb3e45129341b3a9da30246cc259dd27c8"'
            }
        }).then(res => {
            this.onFinishOne(res.data);
            this.resAll.push(res.data);
            if(this.resAll.length === this._urls.length) {
                this.onFinishAll(this.resAll)
            }

            if(this.workingUrls.length) {
                const nextUrl = this.workingUrls.shift();
                this.wrapRequest(nextUrl)
            }
 
        })
    }

}

module.exports = Parallel;