
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

# REACT
following [Adding React to an Existing Application](https://reactjs.org/docs/installation.html#adding-react-to-an-existing-application)

new tooling

- react & react-dom – react itself
- babel – copmiles all js for common compatibility
- webpack – assembles all js & css into bundles
- bootstrap – to look as good as the old stuff, but be bundled; [build config docs](http://getbootstrap.com/docs/4.0/getting-started/webpack/)

# Heroku

deploy: `git push -f heroku ${my_branch}:master`
view logs: `heroku logs -a ctc-poc -t`

# Manual Test Procedure

preliminary checks:
1. assert customer phone
1. assert no incomplete tasks exist in [Twilio Task Router](https://www.twilio.com/console/taskrouter/workspaces/WS0a97843504cc448625dfa55723900216/tasks)

## Test customer experience
1. open two tabs with developer consoles:
   1. [customer experience](https://ctc-poc.herokuapp.com/)
   1. [agent experience](https://ctc-poc.herokuapp.com/agent)
1. in the agent experience tab: _become ready to handle callbacks_
   1. login as `agent`
   1. ensure work activity is `Idle`
1. in the customer experience tab: _request callback_
   1. fill out form describing issue & customer DID
   1. submit form
   1. [ ] *observe* confirmation of call request
1. in the agent experience tab: _handle callback_
   1. [ ] *observe* incoming call with data from customer form
   1. [ ] *observe* outgoing softphone call to customer; ring … ring …
1. [ ] *observe* ringing on customer phone from twilio number
   1. answer customer phone
   [ ] *observe* call recording warning
   1. make noise in customer phone
   [ ] *observe* noise from agent soft-phone
1. in the agent experience tab
   1. [ ] *observe* call recording warning
   1. [ ] *observe* noise from customer phone
   1. make noise in agent soft-phone
1. end call: two scenarios: customer or agent termination
   1. in agent experience: observe clear softphone

post checks
1. observe no errors or warning from [Twilio Debugger](https://www.twilio.com/console/runtime/debugge)
1. observe no errors in developer console in any open tabls
