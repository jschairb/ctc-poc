var path = require('path');
var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var twilio = require('twilio');
var VoiceResponse = twilio.twiml.VoiceResponse;
var config = require('../config');
var token = require('../token');

// Create a Twilio REST API client for authenticated requests to Twilio
var twilio_client = twilio(config.accountSid, config.authToken);

// Create a Mongoose object to connect with MongoDB
var mongoose = require('mongoose');

// Makes connection asynchronously.  Mongoose will queue up database
// operations and release them when the connection is complete.
mongoose.connect(config.mongodbURI, { useMongoClient: true }, function (err, res) {
  if (err) {
    console.log ('ERROR connecting to: ' + config.mongodbURI + '. ' + err);
  } else {
    console.log ('Succeeded connected to: ' + config.mongodbURI);
  }
});

// Using {strict: false} makes the model schemaless.
var workspaceEventSchema = new mongoose.Schema({}, {strict: false});
var WorkspaceEvent = mongoose.model('WorkspaceEvent', workspaceEventSchema);

// Using {strict: false} makes the model schemaless.
var assignmentCallbackSchema = new mongoose.Schema({}, {strict: false});
var AssignmentCallback = mongoose.model('AssignementCallback', assignmentCallbackSchema);

// Configure application routes
module.exports = function(app) {
    // Set Jade as the default template engine
    app.set('view engine', 'jade');

    // Express static file middleware - serves up JS, CSS, and images from the
    // "public" directory where we started our webapp process
    app.use(express.static(path.join(process.cwd(), 'public')));

    // Parse incoming request bodies as form-encoded
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    // Use morgan for HTTP request logging
    app.use(morgan('combined'));

    // Home Page with Click to Call
    app.get('/', function(request, response) {
        response.render('index');
    });

    // Handle an AJAX POST request to place an outbound call
    app.post('/call', function(request, response) {

        // The contract for the POSTed document can be found in /public/app.js#75
        // I've refrained from repeating it here, although, it could be
        // necessary should we want to augment the tasks with something else.
        var taskAttributes = request.body;

        twilio_client.taskrouter.v1
            .workspaces(config.workspaceSid)
            .tasks
            .create({
                workflowSid: config.workflowSid,
                attributes: taskAttributes
            }).then((message) => {
                response.send({
                    message: `Thank you, we will contact you via ${config.twilioNumber}`
                });
            }).catch((error) => {
                console.error(error);
                response.status(500).send(error);
           });
    });

    // This must come before /callbacks/:uuid to be matched explictly.
    app.post('/callbacks/ctc-agent-answers', (request, response) => {
        var attributes = request.body;
        var twimlResponse = new VoiceResponse();

        console.log("BEGIN_CTC_AGENT_ANSWERS:");
        console.log(attributes);
        console.log("END_CTC_AGENT_ANSWERS:");

        twimlResponse.say('Click-To-Call requested. Please hold for customer connection.', { voice: 'man' });
        // twimlResponse.dial(customerNumber, {callerId: config.twilioNumber});
        twimlResponse.hangup();
        console.log('TWIML', twimlResponse.toString());
        response.send(twimlResponse.toString());
    });

    // Twilio Voice Call Status Change Webhook
    app.post('/events/voice', function(request, response) {
        response.status(200).send('OK');
    });

    app.get('/agent', (request, response) => {
        response.render('agent');
    });

    app.get('/client-token', (request, response) => {
        let tok = token.getClientToken(request.query.agentName)
        response.send(tok);
    });

    app.get('/worker-token', (request, response) => {
        let tok = token.getWorkerToken(
            request.query.agentName,
            config.accountSid,
            config.authToken,
            config.workspaceSid,
            config.workerSid
        );
        response.send(tok);
    });

    // For a full list of what will be posted, please refer to the following
    // url:
    // https://www.twilio.com/docs/api/taskrouter/handling-assignment-callbacks
    // This must respond within 5 seconds or it will move the Fallback URL.
    app.post('/assignment_callbacks', (request, response) => {
        var attributes = request.body;
        console.log("BEGIN_ASSIGNMENT_CALLBACKS:");
        console.log(attributes);
        console.log("END_ASSIGNMENT_CALLBACKS:");

        var assignmentCallback = new AssignmentCallback(attributes);
        assignmentCallback.save(function (err) {
            if (!err) {
                var url = `https://${request.headers.host}/callbacks/ctc-agent-answers`;

                var callbackResponse = {
                    accept: "true",
                    from: config.twilioNumber,
                    instruction: "call",
                    timeout: 10,
                    url: url
                };

                response.status(200).send(callbackResponse);
            } else {
                console.error(err);
                response.status(500).send(err);
            };
        });
    });

    // For a full list of what will be posted, please refer to the following
    // url: https://www.twilio.com/docs/api/taskrouter/events#event-callbacks
    app.post('/events/workspaces', (request, response) => {
        var attributes = request.body;

        var workspaceEvent = new WorkspaceEvent(attributes);
        workspaceEvent.save(function (err) {
            if (!err) {
                if (attributes["EventType"] == 'reservation.accepted') {

                };
                response.status(200).send('OK');
            } else {
                console.error(err);
                response.status(500).send(err);
            };
        });
    });
};
