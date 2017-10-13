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

class LogView {

    info(message) {
        let elapsedTime = formatDuration(new Date() - this.checkpoint);
        let entry = `<div class='entry'><div class='time'>${elapsedTime}</div><div class='info'>${message}</div></div>`;
        $('#log > #entries').append(entry);
    }

    error(message) {
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

class ErrorView {

    constructor() {
        this.element = $('#error');
    }

    hide() {
        this.element.hide();
    }

    show(message) {
        this.element.show();
        $('#message', this.element).text(message);
    }

}

class DisjunctView {

    constructor(element) {
        this.element = element;
    }

    show(selector) {
        $('> *', this.element).hide();
        $(selector, this.element).show();
    }

}

class WorkerView {

    constructor() {
        this.element = $('#worker-view');
        this.disjunct = new DisjunctView($('> .disjunct', this.element));

        this.availabilitySelect = $('#ready #activity-select', this.element);
        this.availabilitySelect.on('change', () => {
            let activitySid;
            $('option:selected', this.availabilitySelect).each(function() {
                activitySid = this.value;
            });
            this.updateActivity(activitySid);
        });
    }

    disconnected() {
        this.disjunct.show('#disconnected');
    }

    connecting() {
        this.disjunct.show('#connecting');
    }

    ready(updateActivity) {
        this.disjunct.show('#ready');
        $('#ready #name', this.element).text(this.worker.friendlyName);
        $('#ready #activity', this.element).text(this.worker.activityName);
        $('#ready #available', this.element).text(this.worker.available);

        let select = $('#ready #activity-select', this.element)
        $('> option', select).remove();

        this.activities.forEach((a) => {
            let opt = $(`<option label='${a.friendlyName} - ${a.available ? 'available' : 'unavailable'}'>${a.sid}</option>`);
            if (a.friendlyName == this.worker.activityName) {
                opt.prop('selected', true);
            }
            select.append(opt);
        });
    }

    working(accountName, accountNumber, contactName, contactNumber, phoneNumber, requestReason, ticketNumber) {
        this.disjunct.show('#accepted');
        $('#accepted #account-name', this.element).text(accountName);
        $('#accepted #account-number', this.element).text(accountNumber);
        $('#accepted #contact-name', this.element).text(contactName);
        $('#accepted #contact-number', this.element).text(contactNumber);
        $('#accepted #phone-number', this.element).text(phoneNumber);
        $('#accepted #request-reason', this.element).text(requestReason);
        $('#accepted #ticket-number', this.element).text(ticketNumber);
    }

}

class SoftPhoneView {

    constructor() {
        this.element = $('#softphone-view');
        this.disjunct = new DisjunctView($('> .disjunct', this.element));

        $('#login-button').on('click', (ev) => {
            ev.preventDefault();
            let agentName = $('#agentName').val()
            this.submitAgentName(agentName);
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

    login() {
        this.disjunct.show('#login');
        return new Promise((resolve, reject) => {
            this.submitAgentName = resolve;
        });
    }

    connecting() {
        this.disjunct.show('#connecting');
    }

    available() {
        this.disjunct.show('#available');
        $('#available #agent', this.element).text(this.clientName);
    }

    alerting(calling, accept) {
        this.disjunct.show('#alerting');
        $('#alerting #calling', this.element).text(calling);
        this.accept = accept;
    }

    established(calling, clear) {
        this.disjunct.show('#established');
        $('> #established #calling', this.element).text(calling);
        this.clear = clear;
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

async function getActivities(worker) {
    return new Promise((resolve, reject) => {
        worker.workspace.activities.fetch((error, activityList) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(activityList.data);
        });
    });
}

function setupTwilioWorker(token, state) {
    return new Promise((resolve, reject) => {
        const worker = new Twilio.TaskRouter.Worker(token);

        worker.on("connected", function () {
            state.info("Twilio.TaskRouter.Worker Websocket has connected");
        });

        worker.on("disconnected", function () {
            state.info("Twilio.TaskRouter.Worker Websocket has disconnected");
        });

        worker.on("ready", function (worker) {
            state.info(`Twilio.TaskRouter.Worker registered`);
            state.info(`Twilio.TaskRouter.Worker sid: ${worker.sid}`);
            state.info(`Twilio.TaskRouter.Worker name: ${worker.friendlyName}`);
            state.info(`Twilio.TaskRouter.Worker activity: ${worker.activityName}`);
            state.info(`Twilio.TaskRouter.Worker available: ${worker.available}`);
            resolve(worker);
        });

        worker.on('error', (err) => {
            state.error('Twilio.TaskRouter.Worker error: ' + error);
        });

        worker.on('activity.update', function (worker) {
            state.changeActivity(worker);
        });

        worker.on("reservation.created", function (reservation) {
            state.reserved(reservation);
        });

        worker.on("reservation.accepted", (reservation) => {
            state.working(reservation);
        });

        worker.on("reservation.rejected", function (reservation) {
            state.info("Reservation " + reservation.sid + " rejected!");
        });

        worker.on("reservation.timeout", function (reservation) {
            state.info("Reservation " + reservation.sid + " timed out!");
        });

        worker.on("reservation.canceled", function (reservation) {
            state.info("Reservation " + reservation.sid + " canceled!");
        });

    });
}

function setupTwilioSoftPhone(token, state) {
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
            state.established(conn.parameters.From, () => { conn.disconnect() });
        });

        Twilio.Device.disconnect(function (conn) {
            state.cleared();
        });

        Twilio.Device.cancel(function (conn) {
            state.callerHup();
        });

        Twilio.Device.incoming(function (conn) {
            state.alerting(conn.parameters.From,
                () => { conn.accept() },
                () => { conn.reject() }
            );
        });
    });
}

class State {

    constructor(errorView, logView, workerView, softPhoneView) {
        this.errorView = errorView;
        this.logView = logView;
        this.workerView = workerView;
        this.softPhoneView = softPhoneView;

        this.task = null;
    }

    info(msg) {
        this.logView.info(msg);
        console.log(msg);
    }

    error(msg) {
        this.logView.error(msg);
        this.errorView.show(msg);
        console.error(msg);
    }

    // work signals
    reserved(reservation) {
        this.info("-----");
        this.info("You have been reserved to handle a call!");
        this.info("Call from: " + reservation.task.attributes.from);
        this.info("Selected language: " + reservation.task.attributes.selected_language);
        this.info("-----");

        this.info('accepting reservation');

        reservation.accept((error, reservation) => {
            this.info('conferencing');
            reservation.conference(null, null, null, null, null, {
                'From': '+12104056986' // TODO get from config
            });
        });
    }

    working(reservation) {
        this.info("Reservation " + reservation.sid + " accepted!");
        let attrs = reservation.task.attributes;
        this.workerView.working(
            attrs.accountName,
            attrs.accountNumber,
            attrs.contactName,
            attrs.contactNumber,
            attrs.phoneNumber,
            attrs.requestReason,
            attrs.ticketNumber
        );

        this.task = reservation.task;
    }

    // phone signals
    established(from, disconnect) {
        // coupled to working
        this.info(`established call from ${from}`);
        this.softPhoneView.established(from, disconnect);
    }

    cleared() {
        this.info('call ended');
        this.softPhoneView.available(agentName);

        // should happen right before work.idle
        this.task.complete((err, task) => {
            if (err) {
                state.error(err);
                return;
            }

            this.info("task completed: " + task);
            this.idle();
        });
    }

    callerHup() {
        this.info('caller hung up');
        this.softPhoneView.available();
    }

    idle() {
        this.task = null;
        this.softPhoneView.available();
        this.workerView.ready();
    }

    changeActivity(worker) {
        this.info("Worker activity changed to: " + worker.activityName);
        this.workerView.worker = worker;
    }

    alerting(from, accept, reject) {
        // TODO make sure available?

        if (this.task) {
            log.info(`incoming call from ${from}; ignoring`);
            reject();
            return;
        }

        this.logView.makeCheckpoint();
        this.info(`incoming call from ${from}`);
        accept();
    }

}

async function initialize() {
    // components
    let logView = new LogView(),
        errorView = new ErrorView(),
        workerView = new WorkerView(),
        softPhoneView = new SoftPhoneView(),
        state = new State(errorView, logView, workerView, softPhoneView);
    
    try {

        // initial state
        logView.makeCheckpoint();
        logView.info('page loaded');
        workerView.disconnected();

        // respond to login
        let agentName = await softPhoneView.login();
        softPhoneView.clientName = agentName; // TODO setter?
        softPhoneView.connecting();
        workerView.connecting();

        // setup softphone
        let clientToken = await getClientToken(agentName);
        logView.info(`twilio softphone token(${agentName}) acquired`);
        let softPhone = await setupTwilioSoftPhone(clientToken, state);
        logView.info(`twilio softphone setup`);
        softPhoneView.available();

        // setup worker
        let workerToken = await getWorkerToken(agentName);
        logView.info(`twilio worker token(${agentName}) acquired`);
        let worker = await setupTwilioWorker(workerToken, state);
        let activities = await getActivities(worker);
        workerView.worker = worker;
        workerView.activities = activities;
        workerView.updateActivity = (activitySid) => {
            worker.update({ ActivitySid: activitySid }, (error, worker) => {
                if (error) {
                    state.error(error);
                    return;
                }
        
                state.info('Twilio.TaskRouter.Worker change activity: ' + activitySid);
            });
        };
        logView.info(`twilio worker setup`);
        workerView.ready();

    } catch (error) {
        state.error(error.message);
    }
}

$(() => {
    initialize().then(() => { console.log('initialized') })
});
