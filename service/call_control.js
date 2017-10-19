const holdUrl = 'http://twimlets.com/holdmusic';

class CallControl {
    constructor(twilioClient, accountSid) {
        this.twilioClient = twilioClient;
        this.accountSid = accountSid;
    }

    // see for more info https://www.twilio.com/blog/2016/06/introducing-conference-hold.html
    holdConfParticipant(conferenceSid, participantSid) {
        return new Promise((resolve, reject) => {
            this.twilioClient.api.accounts(this.accountSid)
                .conferences(conferenceSid)
                .participants(participantSid)
                .update({ hold: 'true', holdUrl })
                .then(resolve, reject)
                .done();
        });
    }
}

module.exports = CallControl;
