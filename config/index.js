// Define app configuration in a single location, but pull in values from
// system environment variables (so we don't check them in to source control!)
module.exports = {
    // Twilio Account SID - found on your dashboard
    accountSid: process.env.TWILIO_ACCOUNT_SID,

    // Twilio Auth Token - found on your dashboard
    authToken: process.env.TWILIO_AUTH_TOKEN,

    // A Twilio number that you have purchased through the twilio.com web
    // interface or API
    twilioNumber: process.env.TWILIO_NUMBER,

    // Agent Phone Number to dial, should be 1-800 or other inbound
    agentNumber: process.env.AGENT_NUMBER,

    // An application SID is the way that a Twilio application is identified.
    applicationSid: process.env.TWIML_APP_SID,

    // MongoDB connection string
    mongodbURI: process.env.MONGODB_URI,

    // The port your web application will run on
    port: process.env.PORT || 3000,

    // Validate Twilio Requests in production using Express middleware
    // See: https://www.twilio.com/docs/api/security#validating-requests
    shouldValidate: process.env.SHOULD_VALIDATE == 'true' || false,

    // workspace stuffs
    workspaceSid: process.env.WORKSPACE_SID,
    workflowSid: process.env.WORKFLOW_SID,
    workerSid: process.env.WORKER_SID,
    channelId: process.env.CHANNEL_ID,
};
