const twilio = require('twilio');

class CallbackRequested {
    constructor(callControl, workRouting) {
        this.callControl = callControl;
        this.workRouting = workRouting;
    }

    async do(workspaceSid, workflowSid, attributes) {
        await this.workRouting.createTask(workspaceSid, workflowSid, attributes);
        return `Thank you, we will contact you via ${this.callControl.twilioNumber}`;
    }
}

class AgentAssigned {
    constructor(callControl) {
        this.callControl = callControl;
    }

    async do(workspaceSid, agentAnswersURL, agentCompleteURL) {
        return {
            accept: true,
            from: this.callControl.twilioNumber,
            instruction: 'call',
            record: 'record-from-answer',
            timeout: 10,
            url: agentAnswersURL,
            status_callback_url: agentCompleteURL,
        };
    }
}

class AgentAnswers {
    constructor(callControl, workRouting, CallLeg) {
        this.callControl = callControl;
        this.workRouting = workRouting;
        this.CallLeg = CallLeg;
    }

    async do(taskSid, agentCallSid, workspaceSid, customerAnswersURL) {
        await this.CallLeg.createAgentLeg(taskSid, agentCallSid);

        const task = await this.workRouting.loadTask(workspaceSid, taskSid);
        const taskAttributes = JSON.parse(task.attributes);
        const customerNumber = taskAttributes.phoneNumber;

        const customerCall = await this.callControl.createCustomerCall(customerNumber, taskSid, customerAnswersURL);
        await this.CallLeg.createCustomerLeg(taskSid, customerCall.sid);

        const twimlResponse = new twilio.twiml.VoiceResponse();
        twimlResponse.say('Click-To-Call requested. Please hold for customer connection.', { voice: 'man' });
        twimlResponse.say('Hi agent, This call may be monitored or recorded for quality and training purposes.');
        const dial = twimlResponse.dial({
            callerId: this.twilioNumber,
            record: 'record-from-answer-dual',
        });
        dial.conference(taskSid);
        return twimlResponse;
    }
}

class AgentComplete {
    constructor(workRouting) {
        this.workRouting = workRouting;
    }

    async do(workspaceSid, taskSid) {
        this.workRouting.completeTask(workspaceSid, taskSid, 'call clear');
    }
}

class CustomerAnswers {
    constructor(callControl) {
        this.callControl = callControl;
    }

    async do(taskSid) {
        const twimlResponse = new twilio.twiml.VoiceResponse();

        twimlResponse.say('Heyo customer, This call may be monitored or recorded for quality and training purposes.');
        const dial = twimlResponse.dial({
            callerId: this.callControl.twilioNumber,
            record: 'record-from-answer-dual',
        });
        dial.conference(taskSid);
        return twimlResponse;
    }
}

class HoldCustomer {
    constructor(callControl, CallLeg) {
        this.callControl = callControl;
        this.CallLeg = CallLeg;
    }

    async do(conferenceSid) {
        const customerSid = await this.CallLeg.findCustomer(conferenceSid);
        const holdResp = await this.callControl.holdConfParticipant(conferenceSid, customerSid);
        return holdResp;
    }
}

class RetrieveCustomer {
    constructor(callControl, CallLeg) {
        this.callControl = callControl;
        this.CallLeg = CallLeg;
    }

    async do(conferenceSid) {
        const customerSid = await this.CallLeg.findCustomer(conferenceSid);
        const holdResp = await this.callControl.retrieveConfParticipant(conferenceSid, customerSid);
        return holdResp;
    }
}

class ConsumeWorkspaceEvent {
    // For a full list of what will be posted, please refer to the following
    // url: https://www.twilio.com/docs/api/taskrouter/events#event-callbacks
    constructor(WorkspaceEvent) {
        this.WorkspaceEvent = WorkspaceEvent;
    }

    do(attributes) {
        return new Promise((resolve, reject) => {
            const workspaceEvent = new this.WorkspaceEvent(attributes);
            workspaceEvent.save((err, record) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(record);
            });
        });
    }
}

class ConsumeVoiceEvent {
    // For a full list of what will be posted, please refer to the following
    // url: https://www.twilio.com/docs/api/taskrouter/events#event-callbacks
    constructor(VoiceEvent) {
        this.VoiceEvent = VoiceEvent;
    }

    do(attributes) {
        return new Promise((resolve, reject) => {
            const voiceEvent = new this.VoiceEvent(attributes);
            voiceEvent.save((err, record) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(record);
            });
        });
    }
}

module.exports = {
    CallbackRequested,
    AgentAssigned,
    AgentAnswers,
    AgentComplete,
    CustomerAnswers,
    HoldCustomer,
    RetrieveCustomer,
    ConsumeWorkspaceEvent,
    ConsumeVoiceEvent,
};
