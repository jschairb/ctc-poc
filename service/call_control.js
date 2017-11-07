const holdUrl = 'http://twimlets.com/holdmusic';

// TODO move base url into class
class CallControl {
    constructor(twilioClient, accountSid, twilioNumber) {
        this.twilioClient = twilioClient;
        this.accountSid = accountSid;
        this.twilioNumber = twilioNumber;
    }

    createCustomerCall(customerNumber, conferenceSid, customerAnswersURL) {
        return new Promise((resolve, reject) => {
            this.twilioClient.calls.create({
                url: customerAnswersURL,
                to: customerNumber,
                from: this.twilioNumber,
            })
                .then(resolve, reject);
        });
    }

    // see for more info https://www.twilio.com/blog/2016/06/introducing-conference-hold.html
    holdConfParticipant(conferenceSid, participantSid) {
        console.log("HOLD CONF PARTICIPANT", conferenceSid, participantSid);
        return new Promise((resolve, reject) => {
            this.twilioClient.api
                .accounts(this.accountSid)
                .conferences(conferenceSid)
                .participants(participantSid)
                .update({ hold: 'true', holdUrl })
                .then(resolve, reject)
                .done();
        });
    }

    retrieveConfParticipant(conferenceSid, participantSid) {
        return new Promise((resolve, reject) => {
            this.twilioClient.api
                .accounts(this.accountSid)
                .conferences(conferenceSid)
                .participants(participantSid)
                .update({ hold: 'false' })
                .then(resolve, reject)
                .done();
        });
    }

    conferenceSidByFriendlyName(friendlyName) {
        return new Promise((resolve, reject) => {
            this.twilioClient.api
                .conferences.each({ friendlyName }, (conference) => {
                    resolve(conference.sid);
                }, (error) => {
                    reject(error);
                });
        });
    }
}

module.exports = CallControl;
