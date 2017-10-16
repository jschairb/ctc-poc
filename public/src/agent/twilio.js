// import twilio from 'twilio.min';

function setupDevice(token, established, cleared, callerHup, alerting) {

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
            established(conn.parameters.From, () => { conn.disconnect() });
        });

        Twilio.Device.disconnect(function (conn) {
            cleared();
        });

        Twilio.Device.cancel(function (conn) {
            callerHup();
        });

        Twilio.Device.incoming(function (conn) {
            alerting(conn.parameters.From,
                () => { conn.accept() },
                () => { conn.reject() }
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
    return new Promise((resolve, reject) => {
        const worker = new Twilio.TaskRouter.Worker(token);
        worker.on("ready", function (worker) { resolve(worker); });
        worker.on("connected", connected );
        worker.on("disconnected", disconnected );
        worker.on('error', error);
        worker.on('activity.update', activityUpdate);
        worker.on("reservation.created", reservationCreated);
        worker.on("reservation.accepted", reservationAccepted);
        worker.on("reservation.rejected", reservationRejected);
        worker.on("reservation.timeout", reservationTimeout);
        worker.on("reservation.canceled", reservationCancelled);
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

export {
    setupDevice,
    setupWorker,
    getActivities,
}
