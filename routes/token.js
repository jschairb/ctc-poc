const
    twilio = require('twilio'),
    config = require('../config');

const generate = (identity) => {
    const capability = new twilio.jwt.ClientCapability({
        accountSid: config.accountSid,
        authToken: config.authToken,
    });

    capability.addScope(new twilio.jwt.ClientCapability.IncomingClientScope(identity));
    capability.addScope(new twilio.jwt.ClientCapability.OutgoingClientScope({
        applicationSid: config.twimlAppSid,
        clientName: identity,
    }));

    // Include identity and token in a JSON response
    return {
        identity: identity,
        token: capability.toJwt(),
    };

}

module.exports.generate = generate;
