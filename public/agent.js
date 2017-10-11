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

        this.availabilitySelect = $('#ready #activity-select', this.disjunct);
        this.availabilitySelect.on('change', () => {
            let activitySid;
            $('option:selected', this.availabilitySelect).each(function () {
                activitySid = this.value;
            });
            this.updateActivity(activitySid);
        });
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

    ready(name, activity, available, activities, updateActivity) {
        $('> *', this.disjunct).hide();
        $('#ready', this.disjunct).show();
        $('#ready #name', this.disjunct).text(name);
        $('#ready #activity', this.disjunct).text(activity);
        $('#ready #available', this.disjunct).text(available);

        let select = $('#ready #activity-select', this.disjunct)
        $('> option', select).remove();

        activities.forEach((a) => {
            let opt = $(`<option label='${a.friendlyName} - ${a.available ? 'available' : 'unavailable'}'>${a.sid}</option>`);
            if (a.friendlyName == activity) {
                opt.prop('selected', true);
            }
            select.append(opt);
        });
        this.updateActivity = updateActivity;
    }

    accepted(accountName, accountNumber, contactName, contactNumber, phoneNumber, requestReason, ticketNumber) {
        console.log(accountName);
        $('> *', this.disjunct).hide();
        $('#accepted', this.disjunct).show();
        $('#accepted #account-name', this.disjunct).text(accountName);
        $('#accepted #account-number', this.disjunct).text(accountNumber);
        $('#accepted #contact-name', this.disjunct).text(contactName);
        $('#accepted #contact-number', this.disjunct).text(contactNumber);
        $('#accepted #phone-number', this.disjunct).text(phoneNumber);
        $('#accepted #request-reason', this.disjunct).text(requestReason);
        $('#accepted #ticket-number', this.disjunct).text(ticketNumber);
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

function setupTwilioWorker(token, workerControls, log) {
    return new Promise((resolve, reject) => {
        console.log(token);
        const worker = new Twilio.TaskRouter.Worker(token);

        worker.on("connected", function () {
            console.log("Twilio.TaskRouter.Worker Websocket has connected");
        });

        worker.on("disconnected", function () {
            console.log("Twilio.TaskRouter.Worker Websocket has disconnected");
        });

        worker.on("ready", function (worker) {
            log.info(`Twilio.TaskRouter.Worker registered`)
            log.info(`Twilio.TaskRouter.Worker sid: ${worker.sid}`)             // `WKxxx'`
            log.info(`Twilio.TaskRouter.Worker name: ${worker.friendlyName}`)    // `Twilio.TaskRouter.Worker 1`'
            log.info(`Twilio.TaskRouter.Worker activity: ${worker.activityName}`)    // 'Reserved'
            log.info(`Twilio.TaskRouter.Worker available: ${worker.available}`)       // false

            worker.workspace.activities.fetch((error, activityList) => {
                if (error) {
                    log.error('Twilio.TaskRouter.Worker error: ' + error.message);
                    workerControls.error('Twilio.TaskRouter.Worker error: ' + error.message);
                    return;
                }

                let updateActivity = (activitySid) => {
                    worker.update({ ActivitySid: activitySid }, (error, worker) => {
                        if (error) {
                            log.error('Twilio.TaskRouter.Worker error: ' + error.message);
                            workerControls.error('Twilio.TaskRouter.Worker error: ' + error.message);
                            return;
                        }

                        log.info('Twilio.TaskRouter.Worker change activity: ' + activitySid);
                    });
                }

                workerControls.ready(
                    worker.friendlyName,
                    worker.activityName,
                    worker.available,
                    activityList.data,
                    updateActivity
                )
            });

            resolve(worker);
        });

        worker.on('error', (err) => {
            workerControls.error('Twilio.TaskRouter.Worker error: ' + error);
            reject(err.message);
        });

        worker.on('activity.update', function (worker) {
            log.info("Worker activity changed to: " + worker.activityName);
        });

        worker.on("reservation.created", function (reservation) {
            log.info("-----");
            log.info("You have been reserved to handle a call!");
            log.info("Call from: " + reservation.task.attributes.from);
            log.info("Selected language: " + reservation.task.attributes.selected_language);
            log.info("-----");

            reservation.accept();
            log.info('conferencing');
            reservation.conference(null, null, null, null, null, {
                'From': '+12104056986'
            });
        });

        worker.on("reservation.accepted", function (reservation) {
            log.info("Reservation " + reservation.sid + " accepted!");
            let taskAttributes = reservation.task.attributes;
            
            workerControls.accepted(
                taskAttributes.accountName,
                taskAttributes.accountNumber,
                taskAttributes.contactName,
                taskAttributes.contactNumber,
                taskAttributes.phoneNumber,
                taskAttributes.requestReason,
                taskAttributes.ticketNumber
            );
        });

        worker.on("reservation.rejected", function (reservation) {
            log.info("Reservation " + reservation.sid + " rejected!");
        });

        worker.on("reservation.timeout", function (reservation) {
            log.info("Reservation " + reservation.sid + " timed out!");
        });

        worker.on("reservation.canceled", function (reservation) {
            log.info("Reservation " + reservation.sid + " canceled!");
        });

    });
}

function setupTwilioClient(token, controls, log, completeTask) {
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
            console.log("CONNECTED CONN", conn);
            controls.established(conn.parameters.From, () => { conn.disconnect() });
        });

        Twilio.Device.disconnect(function (conn) {
            log.info('call ended');
            controls.available(agentName);
            console.log("DISCONNECTED CONN", conn);
            completeTask();
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
            conn.accept();
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
                setupTwilioWorker(tokens.worker, workerControls, log).then(
                    (worker) => {
                        log.info('Twilio.TaskRouter.Worker Ready');

                        setupTwilioClient(tokens.client, controls, log).then(
                            () => {
                                log.info('Twilio.Device Ready');
                                controls.available(agentName);
                            },
                            (error) => {
                                log.error('Twilio.Device Error: ' + err.message);
                                controls.error(err.message);
                            });
                    },
                    (error) => {
                        log.error('Twilio.TaskRouter.Worker error: ' + error);
                    });

                
            }, (error) => {
                log.error('error getting twilio tokens: ' + error);
            });
    });

});
