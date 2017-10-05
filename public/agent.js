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

$(() => {

    let log = new Log(),
        controls = new Controls();

    log.makeCheckpoint();
    log.info('page loaded');
    controls.login((agentName) => {
        controls.connecting();
        $.getJSON('/token', { agentName: agentName })
            .done((data) => {
                log.info(`Twilio.Device Token: ${data.identity}`);

                Twilio.Device.setup(data.token, {
                    debug: true, region: 'us1'
                });

                Twilio.Device.ready(function (device) {
                    log.info('Twilio.Device Ready');
                    controls.available(data.identity);
                });

                Twilio.Device.error(function (err) {
                    log.error('Twilio.Device Error: ' + err.message);
                    controls.error(err.message);
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

            })
            .fail(function (error) {
                log.error(`error getting twilio token: ${JSON.stringify(error)}`);
            });
    });

});
