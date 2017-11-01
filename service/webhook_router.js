const querystring = require('querystring');

class WebhookRouter {
    constructor(baseUrl, spec) {
        this.baseUrl = baseUrl;
        this.spec = spec;
    }

    webhook(route, query) {
        console.log("BB", this.baseUrl);
        const r = this.spec[route];

        // assert route exists
        if ((typeof r) === 'undefined') {
            throw new Error(`missing webhook spec: ${route}`);
        }

        // assert query has required params
        r.params.forEach((p) => {
            if ((typeof query[p]) === 'undefined') {
                throw new Error(`missing query param: ${p}`);
            }
        });

        const str = querystring.stringify(query);
        return `${this.baseUrl}/${r.path}?${str}`;
    }
}

module.exports = WebhookRouter;
