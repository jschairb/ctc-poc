
<a href="https://www.twilio.com">
  <img src="https://static0.twilio.com/marketing/bundles/marketing/img/logos/wordmark-red.svg" alt=Twilio width=250 />
</a>


# Click-To-Call

This repository demonstrates some of the possible capabilities of Twilio while building a Click-To-Call feature.

## Getting Started

see `package.json` for current version of node/npm.

* Copy `.example.env` to `.env` and change values
* `npm install`
* `node app.js`

## Resources

* https://www.twilio.com/docs/api/voice/making-calls
* https://elements.heroku.com/buttons/heroku-examples/node-websockets
* https://www.twilio.com/docs/tutorials/automated-survey-node-express#what-we-will-learn
* https://www.twilio.com/docs/tutorials/dynamic-call-center-node-express
* https://www.twilio.com/studio#request-access
* https://networktest.twilio.com/
* http://www.mathguide.de/info/tools/languagecode.html


## Logging

Use `console.log(message)` throughout the application

`heroku logs -a ctc-poc -t`

### Configuration

#### Setting Your Environment Variables

Are you using a bash shell? Use echo $SHELL to find out. For a bash shell, using the Gmail example, edit the ~/.bashrc or ~/.bashprofile file and add:

```bash
export TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxx
export TWILIO_AUTH_TOKEN=yyyyyyyyyyyyyyyyy
export TWILIO_NUMBER=+15556667777

```

Are you using Windows or Linux? You can learn more about how to set variables [here](https://www.java.com/en/download/help/path.xml).

### Development

Getting your local environment setup to work with this app is easy.
After you configure your app with the steps above use this guide to
get it going locally.

1. Install the dependencies.

```bash
npm install
```

1. Launch local development webserver.

```bash
node app.js
```

1. Open browser to [http://localhost:3000](http://localhost:3000).

1. Tweak away on `routes/index.js`.

## Softphone

Given some phone number connected to some TwiML Bin like:

```{.xml}
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="woman" language="fr">Chapeau!</Say>
	<Dial timeout="10">
      <Client>directdial</Client>
	</Dial>
   <Say voice="woman" language="fr">Chapeau! 2</Say>
</Response>
```

Calling the number will dial an agent named `directdial`.

main files:
- `routes/token.js`: acquire twilio client token for softphone
- `public/agent.js`: client side agent experience functionality
- `views/agent.jade`: client side agent experience view

## Meta

This application is a modification of an application example implementing
Click To Call using Twilio created by Twilio Developer Education. No warranty
expressed or implied.  Software is as is.

This software is licensed under the [MIT License](http://www.opensource.org/licenses/mit-license.html).

For further information on the original source, please see the following resources:

* [Github - Original Application Source](https://github.com/TwilioDevEd/clicktocall-node)
* [Twilio - Howto Click To Call](https://twilio.com/docs/howto/click-to-call)
* [Twilio - Tutorial Click To Call](https://www.twilio.com/docs/tutorials/walkthrough/click-to-call/node/express)
