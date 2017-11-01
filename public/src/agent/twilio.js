/* global fetch:false */
/* global Twilio:false */
// import twilio from 'twilio.min';

function setupDevice(token, established, cleared, callerHup, alerting) {

    return new Promise((resolve, reject) => {
        Twilio.Device.setup(token, {
            debug: true,
            region: 'us1', // TODO move these to config
        });

        Twilio.Device.ready((_device) => { resolve(); });
        Twilio.Device.error((err) => { reject(err); });

        Twilio.Device.connect((conn) => {
            established(conn.parameters.From, () => { conn.disconnect() });
        });

        Twilio.Device.disconnect((_conn) => {
            cleared();
        });

        Twilio.Device.cancel((_conn) => {
            callerHup();
        });

        Twilio.Device.incoming((conn) => {
            alerting(conn.parameters.From,
                () => { conn.accept(); },
                () => { conn.reject(); },
            );
        });
    });
}

function setupWorker(
    token,
    connected,
    disconnected,
    error,
    activityUpdate,
    reservationCreated,
    reservationAccepted,
    reservationRejected,
    reservationTimeout,
    reservationCancelled,
) {
    return new Promise((resolve, _reject) => {
        const worker = new Twilio.TaskRouter.Worker(token);
        worker.on('ready', (w) => { resolve(w); });
        worker.on('connected', connected);
        worker.on('disconnected', disconnected);
        worker.on('error', error);
        worker.on('activity.update', activityUpdate);
        worker.on('reservation.created', reservationCreated);
        worker.on('reservation.accepted', reservationAccepted);
        worker.on('reservation.rejected', reservationRejected);
        worker.on('reservation.timeout', reservationTimeout);
        worker.on('reservation.canceled', reservationCancelled);
    });
}

function getActivities(worker) {
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

function holdCustomer(conferenceSid) {
    return fetch('/hold-customer', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conferenceSid }),
    });
}

function retrieveCustomer(conferenceSid) {
    return fetch('/retrieve-customer', {
        method: 'POST',
        body: JSON.stringify({ conferenceSid }),
    });
}

export {
    setupDevice,
    setupWorker,
    getActivities,
    holdCustomer,
    retrieveCustomer,
};
