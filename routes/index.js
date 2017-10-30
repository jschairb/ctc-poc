const path = require('path');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const config = require('../config');

const CallControl = require('../service/call_control');
const WorkRouting = require('../service/work_routing');
const service = require('../service/service');

const twilio = require('twilio');

// Create a Mongoose object to connect with MongoDB
const mongoose = require('mongoose');

// Makes connection asynchronously.  Mongoose will queue up database
// operations and release them when the connection is complete.
mongoose.connect(config.mongodbURI, { useMongoClient: true }, (err, _res) => {
    if (err) {
        console.log(`ERROR connecting to: ${config.mongodbURI}. ${err}`);
    } else {
        console.log(`Succeeded connected to: ${config.mongodbURI}`);
    }
});

// load the model schema
// let AssignmentCallback = require('../models/AssignmentCallback');
const WorkspaceEvent = require('../models/WorkspaceEvent');
const VoiceEvent = require('../models/VoiceEvent');
const CallLeg = require('../models/CallLeg');
const token = require('../models/token');

// Create a Twilio REST API client for authenticated requests to Twilio

const twilioClient = twilio(config.accountSid, config.authToken);
const callControl = new CallControl(twilioClient, config.accountSid, config.twilioNumber);
const workRouting = new WorkRouting(twilioClient);

// Configure application routes
module.exports = (app) => {
    // Set Jade as the default template engine
    app.set('view engine', 'jade');

    // Express static file middleware - serves up JS, CSS, and images from the
    // "public" directory where we started our webapp process
    app.use(express.static(path.join(process.cwd(), 'public')));

    // Parse incoming request bodies as form-encoded
    app.use(bodyParser.urlencoded({
        extended: true,
    }));

    // Use morgan for HTTP request logging
    app.use(morgan('combined'));

    /* CUSTOMER EXPERIENCE HANDLERS */

    // Home Page with Click to Call
    app.get('/', (request, response) => {
        response.render('index');
    });

    // Handle an AJAX POST request to place an outbound call
    app.post('/call', (request, response) => {
        // The contract for the POSTed document can be found in /public/app.js#75
        // I've refrained from repeating it here, although, it could be
        // necessary should we want to augment the tasks with something else.
        const taskAttributes = request.body;

        new service.CallbackRequested(callControl, workRouting)
            .do(config.workspaceSid, config.workflowSid, taskAttributes)
            .then((message) => { response.send({ message }); })
            .catch((error) => {
                console.log("ERROR /call:", error);
                response.status(500).send(error);
            });
    });


    /* AGENT EXPERIENCE HANDLERS */

    app.get('/agent', (request, response) => {
        const p = path.join(process.cwd(), 'public', 'agent.html');
        response.sendFile(p);
    });

    app.get('/client-token', (request, response) => {
        const tok = token.getClientToken(request.query.agentName);
        response.send(tok);
    });

    app.get('/worker-token', (request, response) => {
        const { agentName } = request.query;

        const agentToWorker = {
            agent1: config.worker1Sid,
            agent2: config.worker2Sid,
        };

        const workerSid = agentToWorker[agentName];

        const tok = token.getWorkerToken(
            request.query.agentName,
            config.accountSid,
            config.authToken,
            config.workspaceSid,
            workerSid,
        );
        response.send(tok);
    });


    /* TASK ROUTING HANDLERS */

    // WHEN AGENT IS RESERVED FOR TASK
    // make a normal call to the agent, with task identifying callbacks
    // For a full list of what will be posted, please refer to the following
    // url:
    // https://www.twilio.com/docs/api/taskrouter/handling-assignment-callbacks
    // This must respond within 5 seconds or it will move the Fallback URL.
    app.post('/assignment_callbacks', twilio.webhook({ validate: config.shouldValidate }), (request, response) => {
        const workspaceSid = request.body.WorkspaceSid;
        const taskSid = request.body.TaskSid;
        new service.AgentAssigned(callControl)
            .do(workspaceSid, taskSid)
            .then((instruction) => { response.status(200).send(instruction); })
            .catch((error) => { response.status(500).send(error); });
    });

    // WHEN AGENT ANSWERS CALL
    // whisper to agent; join conference for task; call customer
    app.post('/callbacks/ctc-agent-answers', twilio.webhook({ validate: config.shouldValidate }), (request, response) => {
        const workspaceSid = request.query.WorkspaceSid;
        const taskSid = request.query.TaskSid;
        const agentCallSid = request.body.CallSid;
        new service.AgentAnswers(callControl, workRouting, CallLeg)
            .do(taskSid, agentCallSid, workspaceSid)
            .then((twimlResponse) => { response.send(twimlResponse.toString()); })
            .catch((error) => { response.status(500).send(error); });
    });

    // WHEN AGENT CLEARS
    // mark task complete
    app.post('/callbacks/ctc-agent-complete', twilio.webhook({ validate: config.shouldValidate }), (request, response) => {
        const workspaceSid = request.query.WorkspaceSid;
        const taskSid = request.query.TaskSid;
        new service.AgentComplete(workRouting)
            .do(workspaceSid, taskSid)
            .then((_task) => { response.status(200).send('OK'); })
            .catch((error) => { response.status(500).send(error); });
    });

    // WHEN CUSTOMER ANSWERS
    // whisper to customer; join conference for task
    app.post('/callbacks/ctc-customer-answers', twilio.webhook({ validate: config.shouldValidate }), (request, response) => {
        const taskSid = request.query.TaskSid;
        new service.CustomerAnswers(callControl)
            .do(taskSid)
            .then((twimlResponse) => { response.send(twimlResponse.toString()); });
    });


    /* EVENT HANDLERS */

    // Twilio Voice Call Status Change Webhook
    app.post('/events/voice', (request, response) => {
        const attributes = request.body;
        new service.ConsumeVoiceEvent(VoiceEvent)
            .do(attributes)
            .then(() => { response.status(200).send('OK'); })
            .catch((err) => { response.status(500).send(err); });
    });

    app.post('/events/workspaces', twilio.webhook({ validate: config.shouldValidate }), (request, response) => {
        const attributes = request.body;
        new service.ConsumeWorkspaceEvent(WorkspaceEvent)
            .do(attributes)
            .then(() => { response.status(200).send('OK'); })
            .catch((err) => { response.status(500).send(err); });
    });

    /* CALL CONTROL */

    app.post('/hold-customer', twilio.webhook({ validate: config.shouldValidate }), (request, response) => {
        const { conferenceSid } = request.params;
        new service.HoldCustomer(callControl, CallLeg)
            .do(conferenceSid)
            .then((resp) => { response.status(200).send(resp); })
            .catch((err) => { response.status(500).send(err); });
    });

    app.post('/retrieve-customer', twilio.webhook({ validate: config.shouldValidate }), (request, response) => {
        const { conferenceSid } = request.params;
        new service.RetrieveCustomer(callControl, CallLeg)
            .do(conferenceSid)
            .then((resp) => { response.status(200).send(resp); })
            .catch((err) => { response.status(500).send(err); });
    });
};
