/* eslint func-names: ["error", "never"] */

const mongoose = require('mongoose');

const schema = new mongoose.Schema({}, { strict: false });

schema.statics.createAgentLeg = function (conferenceSid, callSid) {
    return new Promise((resolve, reject) => {
        this.create({
            conferenceSid,
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

schema.statics.createCustomerLeg = function (conferenceSid, callSid) {
    return new Promise((resolve, reject) => {
        this.create({
            conferenceSid,
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

schema.statics.findCustomer = function (conferenceSid) {
    return new Promise((resolve, reject) => {
        this.find({ taskSid: conferenceSid, role: 'customer' })
            .sort()
            .limit(1)
            .exec((err, records) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (records.length < 1) {
                    reject(new Error(`no customer leg found for ${conferenceSid}`));
                }

                const [customerSid] = records;
                resolve(customerSid);
            });
    });
};

const CallLeg = mongoose.model('CallLeg', schema);

module.exports = CallLeg;
