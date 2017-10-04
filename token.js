const
    twilio = require('twilio'),
    config = require('./config');

const getClientToken = (identity) => {
    // TODO authenticate identity (with something)
    // TODO authorize
    const capability = new twilio.jwt.ClientCapability({
        accountSid: config.accountSid,
        authToken: config.authToken,
    });

    capability.addScope(new twilio.jwt.ClientCapability.IncomingClientScope(identity));
    capability.addScope(new twilio.jwt.ClientCapability.OutgoingClientScope({
        applicationSid: config.twimlAppSid,
        clientName: identity,
    }));

    // Include identity and token in a JSON response
    return { token: capability.toJwt() };
}

// Helper function to create Policy
function buildWorkspacePolicy(options) {
    const TASKROUTER_BASE_URL = 'https://taskrouter.twilio.com';
    const version = 'v1';

    options = options || {};
    var resources = options.resources || [];
    var urlComponents = [TASKROUTER_BASE_URL, version, 'Workspaces', config.workspaceSid]

    return new twilio.jwt.taskrouter.TaskRouterCapability.Policy({
        url: urlComponents.concat(resources).join('/'),
        method: options.method || 'GET',
        allow: true
    });
}

const getWorkerToken = (identity) => {
    // TODO authenticate identity (with something)
    // TODO authorize
    const capability = new twilio.jwt.taskrouter.TaskRouterCapability({
        accountSid: config.accountSid,
        authToken: config.authToken,
        workspaceSid: config.workspaceSid,
        channelId: config.channelId,
    });

    // Event Bridge Policies
    var eventBridgePolicies = twilio.jwt.taskrouter.util.defaultEventBridgePolicies(config.accountSid, config.workerSid);

    var workspacePolicies = [
        // Workspace fetch Policy
        buildWorkspacePolicy(),

        // Workspace Activities Update Policy
        buildWorkspacePolicy({ resources: ['Activities'], method: 'POST' }),

        // Workspace Activities Worker Reserations Policy
        buildWorkspacePolicy({ resources: ['Workers', config.workerSid, 'Reservations', '**'], method: 'POST' }),
    ];

    eventBridgePolicies.concat(workspacePolicies).forEach(function (policy) {
        capability.addPolicy(policy);
    });

    return { token: capability.toJwt() };
}

module.exports.getClientToken = getClientToken;
module.exports.getWorkerToken = getWorkerToken;
