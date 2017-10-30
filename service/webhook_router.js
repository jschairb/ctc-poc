const querystring = require('querystring');

class WebhookRouter {
    constructor(baseUrl, spec) {
        this.baseUrl = baseUrl;
        this.spec = spec;
    }

    webhook(route, query) {
        const r = this.spec[route];

        if ((typeof r) === 'undefined') {
            throw new Error(`missing webhook spec: ${route}`);
        }

        Object.keys(r.params).forEach((p) => {
            if ((typeof query[p]) === 'undefined') {
                throw new Error(`missing query param: ${p}`);
            }
        });

        const str = querystring.stringify(query);
        return `${this.baseUrl}/${r.path}${str}`;
    }
}

module.exports = WebhookRouter;
