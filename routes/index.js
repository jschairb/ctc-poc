var path = require('path');
var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var twilio = require('twilio');
var VoiceResponse = twilio.twiml.VoiceResponse;
var config = require('../config');


// Create a Twilio REST API client for authenticated requests to Twilio
var client = twilio(config.accountSid, config.authToken);


// Configure application routes
module.exports = function(app) {
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

    // Home Page with Click to Call
    app.get('/', function(request, response) {
        response.render('index');
    });

    // Handle an AJAX POST request to place an outbound call
    app.post('/call', function(request, response) {
        // This should be the publicly accessible URL for your application
        // Here, we just use the host for the application making the request,
        // but you can hard code it or use something different if need be
        var companyNumber = config.companyNumber;
        var url = 'http://' + request.headers.host + '/outbound/' + encodeURIComponent(companyNumber);

        var options = {
            to: request.body.phoneNumber,
            from: config.twilioNumber,
            url: url,
        };

        // Place an outbound call to the user, using the TwiML instructions
        // from the /outbound route
        client.calls.create(options)
          .then((message) => {
            console.log(message.responseText);
            response.send({
                message: 'Thank you, someone will contact you soon from 415-650-1953.',
            });
          })
          .catch((error) => {
            console.log(error);
            response.status(500).send(error);
          });
    });

    // Return TwiML instuctions for the outbound call
    app.post('/outbound/:companyNumber', function(request, response) {
        var companyNumber = request.params.companyNumber;
        var twimlResponse = new VoiceResponse();

        twimlResponse.say('Thank you for using our Click-To-Call feature' +
                          'We will connect you with someone right now.',
                          { voice: 'alice' });

        twimlResponse.dial(companyNumber);

        response.send(twimlResponse.toString());
    });
};
