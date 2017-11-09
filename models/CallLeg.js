/* eslint func-names: ["error", "never"] */

const mongoose = require('mongoose');

const schema = new mongoose.Schema({}, { strict: false });

schema.statics.createAgentLeg = function (conferenceName, callSid) {
    return new Promise((resolve, reject) => {
        this.create({
            conferenceName,
            callSid,
            role: 'agent',
            action: 'join',
            time: (new Date()).getTime(),
        }, (err, record) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(record);
        });
    });
};

schema.statics.createCustomerLeg = function (conferenceName, callSid) {
    return new Promise((resolve, reject) => {
        this.create({
            conferenceName,
            callSid,
            role: 'customer',
            action: 'join',
            time: (new Date()).getTime(),
        }, (err, record) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(record);
        });
    });
};

schema.statics.findCustomerLeg = function (conferenceName) {
    return new Promise((resolve, reject) => {
        this.find({ conferenceName, role: 'customer' })
            .sort()
            .limit(1)
            .exec((err, records) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (records.length < 1) {
                    reject(new Error(`no customer leg found for ${conferenceName}`));
                }

                const [customerSid] = records;
                resolve(customerSid);
            });
    });
};

const CallLeg = mongoose.model('CallLeg', schema);

module.exports = CallLeg;
