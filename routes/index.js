let path = require('path'),
    express = require('express'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    config = require('../config'),
    token = require('../models/token');

let twilio = require('twilio');

let VoiceResponse = twilio.twiml.VoiceResponse;

// Create a Twilio REST API client for authenticated requests to Twilio
let twilio_client = twilio(config.accountSid, config.authToken);

// Create a Mongoose object to connect with MongoDB
let mongoose = require('mongoose');

// Makes connection asynchronously.  Mongoose will queue up database
// operations and release them when the connection is complete.
mongoose.connect(config.mongodbURI, { useMongoClient: true }, (err, res) => {
    if (err) {
        console.log('ERROR connecting to: ' + config.mongodbURI + '. ' + err);
    } else {
        console.log('Succeeded connected to: ' + config.mongodbURI);
    }
});

// load the model schema
let AssignmentCallback = require('../models/AssignmentCallback');
let WorkspaceEvent = require('../models/WorkspaceEvent');

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

        twilio_client.taskrouter.v1
            .workspaces(config.workspaceSid)
            .tasks
            .create({
                workflowSid: config.workflowSid,
                taskChannel: 'voice',
                attributes: JSON.stringify(taskAttributes),
            }).then((_message) => {
                response.send({
                    message: `Thank you, we will contact you via ${config.twilioNumber}`,
                });
            }).catch((error) => {
                console.error(error);
                response.status(500).send(error);
            });
    });


    /* AGENT EXPERIENCE HANDLERS */

    app.get('/agent', (request, response) => {
        const p = path.join(process.cwd(), 'public', 'agent.html');
        response.sendfile(p);
    });

    app.get('/client-token', (request, response) => {
        const tok = token.getClientToken(request.query.agentName);
        response.send(tok);
    });

    app.get('/worker-token', (request, response) => {
        const tok = token.getWorkerToken(
            request.query.agentName,
            config.accountSid,
            config.authToken,
            config.workspaceSid,
            config.workerSid);
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
        console.log('ASSIGNMENT CALLBACK', request.query, request.body);
        const workspaceSid = request.body.WorkspaceSid;
        const taskSid = request.body.TaskSid;

        const callbackResponse = {
            accept: true,
            from: config.twilioNumber,
            instruction: 'call',
            record: 'record-from-answer',
            timeout: 10,
            url: `https://${request.headers.host}/callbacks/ctc-agent-answers?WorkspaceSid=${workspaceSid}&TaskSid=${taskSid}`,
            status_callback_url: `https://${request.headers.host}/callbacks/ctc-agent-complete?WorkspaceSid=${workspaceSid}&TaskSid=${taskSid}`,
        };

        response.status(200).send(callbackResponse);
    });

    // WHEN AGENT ANSWERS CALL
    // whisper to agent; join conference for task; call customer
    app.post('/callbacks/ctc-agent-answers', twilio.webhook({ validate: config.shouldValidate }), (request, response) => {
        console.log('CTC AGENT ANSWERS', request.query, request.body);

        const workspaceSid = request.query.WorkspaceSid;
        const taskSid = request.query.TaskSid;

        twilio_client.taskrouter.v1
            .workspaces(workspaceSid)
            .tasks(taskSid)
            .fetch()
            .then((task) => {
                const taskAttributes = JSON.parse(task.attributes);
                const customerNumber = taskAttributes.phoneNumber;
                const twimlResponse = new VoiceResponse();
                twimlResponse.say('Click-To-Call requested. Please hold for customer connection.', { voice: 'man' });
                twimlResponse.say('Hi agent, This call may be monitored or recorded for quality and training purposes.');
                const dial = twimlResponse.dial({
                    callerId: config.twilioNumber,
                    record: 'record-from-answer-dual',
                });
                dial.conference(taskSid);
                response.send(twimlResponse.toString());

                // call customer right now
                twilio_client.calls.create({
                    url: `https://${request.headers.host}/callbacks/ctc-customer-answers?TaskSid=${taskSid}`,
                    to: customerNumber,
                    from: config.twilioNumber,
                }).then(call => console.log(`customer call created: ${call.sid}`));
            }, (error) => {
                console.log('ERROR', error);
                response.status(500).send(error);
            });
    });

    // WHEN AGENT CLEARS
    // mark task complete
    app.post('/callbacks/ctc-agent-complete', twilio.webhook({ validate: config.shouldValidate }), (request, response) => {
        console.log('CTC AGENT COMPLETE');
        const workspaceSid = request.query.WorkspaceSid;
        const taskSid = request.query.TaskSid;

        // complete the task
        twilio_client.taskrouter.v1
            .workspaces(workspaceSid)
            .tasks(taskSid)
            .update({ assignmentStatus: 'completed', reason: 'call clear' })
            .then((task) => {
                console.log('TASK COMPLETE', task.assignmentStatus, task.reason);
                response.status(200).send('OK');
            }, (error) => {
                console.log('ERROR', error);
                response.status(500).send(error);
            });
    });

    // WHEN CUSTOMER ANSWERS
    // whisper to customer; join conference for task
    app.post('/callbacks/ctc-customer-answers', twilio.webhook({ validate: config.shouldValidate }), (request, response) => {
        console.log('CUSTOMER ANSWER', request.query, request.body);

        const twimlResponse = new VoiceResponse();
        const taskSid = request.query.TaskSid;
        twimlResponse.say('Heyo customer, This call may be monitored or recorded for quality and training purposes.');
        const dial = twimlResponse.dial({
            callerId: config.twilioNumber,
            record: 'record-from-answer-dual',
        });
        dial.conference(taskSid);
        response.send(twimlResponse.toString());
    });


    /* EVENT HANDLERS */

    // Twilio Voice Call Status Change Webhook
    app.post('/events/voice', (request, response) => {
        response.status(200).send('OK');
    });

    // For a full list of what will be posted, please refer to the following
    // url: https://www.twilio.com/docs/api/taskrouter/events#event-callbacks
    app.post('/events/workspaces', twilio.webhook({ validate: config.shouldValidate }), (request, response) => {
        console.log('WORKSPACE EVENT', request.body.EventType, request.body.EventDescription);
        response.status(200).send('OK');
        
        /* TODO getting error on WorkspaceEvent not being a constructor, silencing for now
        var attributes = request.body;
        var workspaceEvent = new WorkspaceEvent(attributes);
        workspaceEvent.save(function (err) {
            if (!err) {
                response.status(200).send('OK');
            } else {
                console.error(err);
                response.status(500).send(err);
            };
        });
        */
    });
};
