let formatDuration = (ms) => {
    const
        Millisecond = 1,
        Second = 1000 * Millisecond,
        Minute = 60 * Second,
        Hour = 60 * Minute

    let str = '';

    let s = Math.floor(ms / Second);
    let m = Math.floor(ms / Minute);
    let h = Math.floor(ms / Hour);

    if (ms > 0) {
        str += (ms % 1000).toString() + 'ms';
    } else {
        str = '0ms';
    }

    if (s > 0) {
        str = (s % 60).toString() + 's' + str;
    }

    if (m > 0) {
        str = (m % 60).toString() + 'm' + str;
    }

    if (h > 0) {
        str = h.toString() + 'h' + str;
    }

    return str;
}

// load the soft phone
class Log {

    info(message) {
        console.log(message);

        let elapsedTime = formatDuration(new Date() - this.checkpoint);
        let entry = `<div class='entry'><div class='time'>${elapsedTime}</div><div class='info'>${message}</div></div>`;
        $('#log > #entries').append(entry);
    }

    error(message) {
        console.error(message);

        let elapsedTime = formatDuration(new Date() - this.checkpoint);
        let entry = `<div class='entry'><div class='time'>${elapsedTime}</div><div class='error'>${message}</div></div>`;
        $('#log > #entries').append(entry);
    }

    makeCheckpoint() {
        this.checkpoint = new Date();
        let entry = `<div class='entry'><div class='checkpoint'>${this.checkpoint.toISOString()}</div></div>`;
        $('#log > #entries').append(entry);
    }

}

class WorkerControls {

    constructor() {
        this.disjunct = $('#worker-controls > .disjunct');
    }

    error(message) {
        $('> *', this.disjunct).hide();
        $('#error', this.disjunct).show();
        $('#error #message', this.disjunct).text(message);
    }

    disconnected() {
        $('> *', this.disjunct).hide();
        $('#disconnected', this.disjunct).show();
    }

    connecting() {
        $('> *', this.disjunct).hide();
        $('#connecting', this.disjunct).show();
    }

    ready(name, activity, available) {
        $('> *', this.disjunct).hide();
        $('#ready', this.disjunct).show();
        $('#ready #name', this.disjunct).text(name);
        $('#ready #activity', this.disjunct).text(activity);
        $('#ready #available', this.disjunct).text(available);
    }

 }

class Controls {

    constructor() {
        $('#login-button').on('click', (ev) => {
            ev.preventDefault();
            let agentName = $('#agentName').val()
            this.startSession(agentName);
        });

        $('#accept-button').on('click', (ev) => {
            ev.preventDefault();
            this.accept();
        });

        $('#clear-button').on('click', (ev) => {
            ev.preventDefault();
            this.clear();
        });
    }

    login(startSession) {
        $('#controls > *').hide();
        $('#controls > #login').show();
        this.startSession = startSession;
    }

    connecting() {
        $('#controls > *').hide();
        $('#controls > #connecting').show();
    }

    available(agent) {
        $('#controls > *').hide();
        $('#controls > #available').show();
        $('#controls > #available #agent').text(agent);
    }

    alerting(calling, accept) {
        $('#controls > *').hide();
        $('#controls > #alerting').show();
        $('#controls > #alerting #calling').text(calling);
        this.accept = accept;
    }

    established(calling, clear) {
        $('#controls > *').hide();
        $('#controls > #established').show();
        $('#controls > #established #calling').text(calling);
        this.clear = clear;
    }

    error(message) {
        $('#controls > *').hide();
        $('#controls > #error').show();
        $('#controls > #error #message').text(message);
    }

}

async function getClientToken(agentName) {
    return new Promise((resolve, reject) => {
        $.getJSON('/client-token', { agentName: agentName })
            .done((resp) => {
                resolve(resp.token);
            })
            .fail((err) => {
                reject(error);
            })
    });
}

async function getWorkerToken(agentName) {
    return new Promise((resolve, reject) => {
        $.getJSON('/worker-token', { agentName: agentName })
            .done((resp) => {
                resolve(resp.token);
            })
            .fail((err) => {
                reject(error);
            })
    });
}

async function getTokens(agentName) {
    let clientToken = await getClientToken(agentName);
    let workerToken = await getWorkerToken(agentName);
    return {
        client: clientToken,
        worker: workerToken,
    }
}

function setupTwilioWorker(token) {
    return new Promise((resolve, reject) => {
        console.log(token);
        const worker = new Twilio.TaskRouter.Worker(token);

        worker.on("connected", function() {
            console.log("Websocket has connected");
        });

        worker.on("disconnected", function() {
            console.log("Websocket has disconnected");
        });

        worker.on("ready", function (worker) {
            resolve(worker);
        });

        worker.on('error', (err) => {
            reject(err.message);
        });
    });
}

function setupTwilioClient(token, controls, log) {
    return new Promise((resolve, reject) => {
        Twilio.Device.setup(token, {
            debug: true, region: 'us1' // TODO move these to config
        });

        Twilio.Device.ready(function (device) {
            resolve();
        });

        Twilio.Device.error(function (err) {
            reject(err);
        });

        Twilio.Device.connect(function (conn) {
            log.info(`established call from ${conn.parameters.From}`);
            controls.established(conn.parameters.From, () => { conn.disconnect() });
        });

        Twilio.Device.disconnect(function (conn) {
            log.info('call ended');
            controls.available(agentName);
        });

        Twilio.Device.cancel(function (conn) {
            log.info('caller hung up');
            controls.available(agentName);
        });

        Twilio.Device.incoming(function (conn) {
            if (conn != Twilio.Device.activeConnection()) {
                log.info(`incoming call from ${conn.parameters.From}; ignoring`);
                conn.reject();
                return;
            }

            log.makeCheckpoint();
            log.info(`incoming call from ${conn.parameters.From}`);
            controls.alerting(conn.parameters.From, () => { conn.accept(); })
        });
    });    
}

$(() => {

    let log = new Log(),
        workerControls = new WorkerControls(),    
        controls = new Controls();

    log.makeCheckpoint();
    log.info('page loaded');

    workerControls.disconnected();
    controls.login((agentName) => {
        controls.connecting();
        workerControls.connecting();
        getTokens(agentName)
            .then((tokens) => {

                // twilio client
                log.info(`Twilio.Device token(${agentName}) acquired`);

                // twilio client
                log.info(`Twilio.TaskRouter token(${agentName}) acquired`);

                // twilio worker
                setupTwilioWorker(tokens.worker).then(
                    (worker) => {
                        log.info(`Twilio.TaskRouter.Worker registered`)
                        log.info(`Twilio.TaskRouter.Worker sid: ${worker.sid}`)             // `WKxxx'`
                        log.info(`Twilio.TaskRouter.Worker name: ${worker.friendlyName}`)    // `Twilio.TaskRouter.Worker 1`'
                        log.info(`Twilio.TaskRouter.Worker activity: ${worker.activityName}`)    // 'Reserved'
                        log.info(`Twilio.TaskRouter.Worker available: ${worker.available}`)       // false
                        workerControls.ready(worker.friendlyName, worker.activityName, worker.available);
                    },
                    (error) => {
                        console.log(error);
                        log.error('Twilio.TaskRouter.Worker error: ' + error);
                        workerControls.error('Twilio.TaskRouter.Worker error: ' + error);
                    });

                setupTwilioClient(tokens.client, controls, log).then(
                    () => {
                        log.info('Twilio.Device Ready');
                        controls.available(agentName);
                     },
                    (error) => { 
                        log.error('Twilio.Device Error: ' + err.message);
                        controls.error(err.message);
                    });
            }, (error) => {
                log.error('error getting twilio tokens: ' + error);
            });
    });

});
