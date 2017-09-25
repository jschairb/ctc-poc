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
mongoose.connect(config.mongodbURI, function (err, res) {
  if (err) {
    console.log ('ERROR connecting to: ' + config.mongodbURI + '. ' + err);
  } else {
    console.log ('Succeeded connected to: ' + config.mongodbURI);
  }
});

var callSchema = new mongoose.Schema({
    callbackURL: String,
    phoneNumbers: {
        company: String,
        from: String,
        to: String
    },
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
            callbackURL: callbackURL,
            phoneNumbers: {
                company: config.companyNumber,
                from: config.twilioNumber,
                to: request.body.phoneNumber
            },
            uuid: uuid
        });

        call.save(function (err) {if (err) console.log ('Error on Call save!')});

        var twilioCallOptions = {
            from: call.phoneNumbers.from,
            to: call.phoneNumbers.to,
            url: call.callbackURL
        };

        // Place an outbound call to the user, using the TwiML instructions
        // from the /outbound route
        twilio_client.calls.create(twilioCallOptions)
          .then((message) => {
              // console.log(message.responseText);
              var timestamp = Date.now();

              Call.update({uuid: uuid}, {timestampUpdated: timestamp}, function (err) {
                  if (err) console.log(err);
              });

              // Be sure Twilio Response attrs don't overwrite these
              var callEventAttributes = Object.assign({
                  CallUUID: uuid
              }, message.responseText);

              var callEvent = new CallEvent(callEventAttributes);
              callEvent.save(function (err) {if (err) console.log ('Error on CallEvent save!')});

              response.send({
                  message: 'Thank you, someone will contact you soon from 415-650-1953.'
              });
          }).catch((error) => {
              console.log(error);
              response.status(500).send(error);
          });
    });

    // Return TwiML instuctions for the outbound call
    app.post('/callbacks/:uuid', function(request, response) {
        var uuid = request.params.uuid;

        console.log(request.body);

        var call = Call.findOne({uuid: uuid}).exec(function(err, result) {
            if (!err) {
                console.log(result);
            } else {
                console.log('failed query');
            };
        });

        var companyNumber = call.phoneNumbers.company;
        var twimlResponse = new VoiceResponse();

        twimlResponse.say('Thank you for using our Click-To-Call feature' +
                          'We will connect you with someone right now.',
                          { voice: 'alice' });

        twimlResponse.dial(companyNumber);

        response.send(twimlResponse.toString());
    });

    // Probably need to make another endpoint for the other hooks.
};
