var path = require('path');
var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var twilio = require('twilio');
var VoiceResponse = twilio.twiml.VoiceResponse;
var config = require('../config');

// Copied from docs, unsure why const vs require
const uuidv1 = require('uuid/v1');

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

var callSchema = new mongoose.Schema({
    account: {
        name: String,
        number: String
    },
    callbackURL: String,
    contact: {
        name: String,
        number: String
    },
    phoneNumbers: {
        agent: String,
        from: String,
        to: String
    },
    requestReason: String,
    ticketNumber: String,
    timestampCreated: { type: Date, default: Date.now },
    timestampUpdated: { type: Date, default: Date.now },
    uuid: String
});
var Call = mongoose.model('Call', callSchema);

// This represents the exact schema passed from a Twilio callback. I've added
// SIP attributes, even though I don't think we'll be receiving any. Should
// errors around missing values pop up, there might be a host of
// SipHeader_<name> fields that I couldn't add because they're variable.
// Source: https://www.twilio.com/docs/api/twiml/twilio_request
var callEventSchema = new mongoose.Schema({
    Called: String,
    ToState: String,
    CallerCountry: String,
    Direction: String,
    CallerState: String,
    ToZip: String,
    CallSid: String,
    To: String,
    CallerZip: String,
    ToCountry: String,
    ApiVersion: String,
    CalledZip: String,
    CalledCity: String,
    CallStatus: String,
    From: String,
    AccountSid: String,
    CalledCountry: String,
    CallerCity: String,
    Caller: String,
    FromCountry: String,
    ToCity: String,
    FromCity: String,
    CalledState: String,
    FromZip: String,
    FromState: String,
    ParentCallSid: String,
    SipDomain: String,
    SipUsername: String,
    SipCallId: String,
    SipSourceIp: String,
    CallUUID: String,
    CreatedAt: { type: Date, default: Date.now }
});
var CallEvent = mongoose.model('CallEvent', callEventSchema);

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
        var uuid = uuidv1();

        // This should be the publicly accessible URL for your application
        // Here, we just use the host for the application making the request,
        // but you can hard code it or use something different if need be
        var callbackURL = 'https://' + request.headers.host + '/callbacks/' + encodeURIComponent(uuid);

        var call = new Call({
            account: {
                name: request.body.accountName,
                number: request.body.accountNumber
            },
            callbackURL: callbackURL,
            contact: {
                name: request.body.contactName,
                number: request.body.contactNumber
            },
            phoneNumbers: {
                agent: config.agentNumber,
                from: config.twilioNumber,
                to: request.body.phoneNumber
            },
            requestReason: request.body.requestReason,
            ticketNumber: request.body.ticketNumber,
            uuid: uuid
        });

        call.save(function (err) {if (err) console.log('Error on Call save!')});

        var twilioCallOptions = {
            url: call.callbackURL,
            to: call.phoneNumbers.to,
            from: call.phoneNumbers.from,
            statusCallback: `https://${request.headers.host}/events/voice`,
            statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
        };

        // Place an outbound call to the user, using the TwiML instructions
        // from the /callbacks route
        twilio_client.calls.create(twilioCallOptions)
          .then((message) => {
              console.log("CALL REQUEST RESPONSE:");
              console.log(message);

              console.log("SID:");
              console.log(message.sid);

              // message has a variety of interesting values, but I'm going to
              // just use the webhooks to handle all the CallEvent tracking.
              response.send({
                  message: `Thank you, someone will contact you soon from ${twilioCallOptions.from}.`
              });
          }).catch((error) => {
              console.log(error);
              response.status(500).send(error);
          });
    });

    // Return TwiML instuctions for the outbound call
    app.post('/callbacks/:uuid', function(request, response) {
        var uuid = request.params.uuid;

        Call.findOne({uuid: uuid}).exec(function(err, call) {
            if (!err) {
                var callEvent = new CallEvent(request.body);
                callEvent.CallUUID = uuid;

                callEvent.save(function (err) {if (err) console.log('error on CallEvent save!')});

                var agentNumber = call.phoneNumbers.agent;
                var twimlResponse = new VoiceResponse();

                twimlResponse.say('Thank you for using our Click-To-Call feature. ' +
                                  'We will connect you with someone right now.',
                                  { voice: 'man' });

                twimlResponse.dial(agentNumber);

                response.send(twimlResponse.toString());
            } else {
                console.log(err);
                response.status(500).send(err);
            };
        });
    });

    // Twilio Voice Call Status Change Webhook
    app.post('/events/voice', function(request, response) {
        response.status(200).send('OK');
    });
};
