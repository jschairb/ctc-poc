import React from 'react';

import Navbar from './Navbar';
import Login from './Login';
import Log from './Log';
import SoftPhone from './SoftPhone';
import Work from './Work';

import * as auth from './auth';
import * as twilio from './twilio';
import * as state from './state';

class LogStateTransformation {
    constructor(component) {
        this.component = component;
    }

    appendEntry(entry) {
        this.component.setState((prevState, _props) => ({
            logEntries: prevState.logEntries.concat(entry),
        }));
    }

    info(msg) {
        this.appendEntry({ time: new Date(), message: msg, level: 'info' });
    }

    error(msg) {
        this.appendEntry({ time: new Date(), message: msg, level: 'error' });
    }

    checkpoint() {
        this.appendEntry({ time: new Date(), level: 'checkpoint' });
    }
}

class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loadTime: new Date(),

            logEntries: [
                { time: new Date(), message: 'initialized', level: 'info' }
            ],

            loginState: state.Login.OFFLINE,
            loginUser: '',

            softphoneState: state.Call.OFFLINE,
            softphoneFrom: null,

            workWorker: null,
            workTask: null,
            workSkills: [
                'linux',
                'windows',
                'netsec',
            ],
        };

        // log state transitions maintained here
        this.log = new LogStateTransformation(this);

        // auth
        this.login = this.login.bind(this);

        // phone actions
        this.alerting = this.alerting.bind(this);
        this.established = this.established.bind(this);
        this.cleared = this.cleared.bind(this);
        this.callerHup = this.callerHup.bind(this);

        this.clear = this.clear.bind(this);
        this.holdCustomer = this.holdCustomer.bind(this);

        // worker actions
        this.connected = this.connected.bind(this);
        this.disconnected = this.disconnected.bind(this);
        this.error = this.error.bind(this);
        this.activityUpdate = this.activityUpdate.bind(this);
        this.reservationCreated = this.reservationCreated.bind(this);
        this.reservationAccepted = this.reservationAccepted.bind(this);
        this.reservationRejected = this.reservationRejected.bind(this);
        this.reservationTimeout = this.reservationTimeout.bind(this);
        this.reservationCancelled = this.reservationCancelled.bind(this);

        this.changeActivity = this.changeActivity.bind(this);
    }

    login(user) {
        // this.setState({ user: user });
        this.log.info(`authenticating as: ${user}`);

        auth.getClientToken(user)
            .then((clientToken) => {
                this.setState({ loginState: state.Login.CONNECTING, loginUser: user });
                this.log.info('acquired softphone token');
                return twilio.setupDevice(
                    clientToken,
                    this.established,
                    this.cleared,
                    this.callerHup,
                    this.alerting,
                );
            })
            .then(() => {
                this.setState({
                    softphoneState: state.Call.CLEAR,
                });
                this.log.info('softphone setup');
            })
            .catch((error) => {
                console.log(error);
                this.log.error(`cannot setup softphone: ${JSON.stringify(error)}`);
            });

        auth.getWorkerToken(user)
            .then((workerToken) => {
                this.setState({ loginState: state.Login.CONNECTING, loginUser: user });
                this.log.info('acquired worker token');
                return twilio.setupWorker(
                    workerToken,
                    this.connected,
                    this.disconnected,
                    this.error,
                    this.activityUpdate,
                    this.reservationCreated,
                    this.reservationAccepted,
                    this.reservationRejected,
                    this.reservationTimeout,
                    this.reservationCancelled,
                );
            })
            .then((worker) => {
                this.log.info('Twilio.TaskRouter.Worker registered');
                this.log.info(`Twilio.TaskRouter.Worker sid: ${worker.sid}`);
                this.log.info(`Twilio.TaskRouter.Worker name: ${worker.friendlyName}`);
                this.log.info(`Twilio.TaskRouter.Worker activity: ${worker.activityName}`);
                this.log.info(`Twilio.TaskRouter.Worker available: ${worker.available}`);
                this.setState({ workWorker: worker });
                return twilio.getActivities(worker);
            })
            .then((activities) => {
                this.setState((prevState, props) => {
                    let st = { workActivities: activities };

                    if (prevState.workWorker && prevState.softphoneState != state.Call.OFFLINE) {
                        st.loginState = state.Login.ONLINE;
                    }

                    return st;
                });
            })
            .catch((error) => {
                console.log(error);
                this.log.error(`cannot setup worker: ${error.toString()}`);
            });
    }

    // softphone callbacks
    alerting(from, accept, reject) {
        this.log.info('call alerting');
        if (this.state.softphoneState == state.Call.ESTABLISHED) {
            this.log.info(`rejecting incoming call from: ${from}`);
            reject();
            return;
        }

        this.log.info(`accepting incoming call from: ${from}`);
        this.setState({
            softphoneState: state.Call.ALERTING,
            softphoneFrom: from,
        });

        accept();
    }

    established(from, clearAction) {
        this.log.info(`call established from: ${from}`);
        this.setState({
            softphoneState: state.Call.ESTABLISHED,
            softphoneFrom: from,
            softphoneClearAction: clearAction,
        });
    }

    callerHup() {
        this.log.info('caller hung up');
        this.setState({
            softphoneState: state.Call.CLEAR,
            softphoneFrom: null,
        });
    }

    cleared() {
        this.log.info('call clear');
        this.setState({
            softphoneState: state.Call.CLEAR,
            softphoneFrom: null,
            workTask: null,
        });
    }

    // softphone actions
    clear() {
        if (!this.state.softphoneClearAction) {
            console.log('CLEAR ACTION UNDEFINED');
            return;
        }

        this.state.softphoneClearAction();
    }

    holdCustomer() {
        if (!this.state.workTask) {
            console.error('CONF INFO UNDEFINED');
            return;
        }

        twilio.holdCustomer(this.state.workTask.sid);
    }

    retrieveCustomer() {
        twilio.holdCustomer(this.state.workTask.sid);
    }

    // work callbacks
    connected() {
        this.log.info('Twilio.TaskRouter.Worker Websocket has connected');
    }

    disconnected() {
        this.log.info('Twilio.TaskRouter.Worker Websocket has disconnected');
    }

    error(err) {
        console.error(err);
        this.log.error(`Twilio.TaskRouter.Worker error: ${err}`);
    }

    activityUpdate(worker) {
        this.log.info(`Worker activity changed to: ${worker.activityName}`);
        this.setState({ workWorker: worker });
    }

    reservationCreated(reservation) {
        this.log.checkpoint();
        this.log.info(`Reservation ${reservation.sid} incoming!`);
    }

    reservationAccepted(reservation) {
        this.log.info(`Reservation ${reservation.sid} accepted!`);
        this.setState({ workTask: reservation.task });
    }

    reservationRejected(reservation) {
        this.log.info(`Reservation ${reservation.sid} rejected!`);
    }

    reservationTimeout(reservation) {
        this.log.info(`Reservation ${reservation.sid} timed out!`);
    }

    reservationCancelled(reservation) {
        this.log.info(`Reservation ${reservation.sid} canceled!`);
    }

    // work actions
    changeActivity(event) {
        const activitySid = event.target.value;
        this.log.info('changing activity');
        this.state.workWorker.update({ ActivitySid: activitySid }, (error, _worker) => {
            if (error) {
                this.log.error(error);
            }
        });
    }

    render() {
        const navItems = [
            {
                text: 'Customer Experience',
                href: '/',
                active: false,
            },
            {
                text: 'Agent Experience',
                href: '/agent',
                active: true,
            },

        ];

        return (
            <div>
                <Navbar brand="CTC" items={navItems} />

                <h1>Agent Experience</h1>

                <div className="row">

                    <div className="col-lg-6">
                        <Login
                            onSubmit={this.login}
                            user={this.state.loginUser}
                            state={this.state.loginState} />

                        <br />

                        <SoftPhone
                            state={this.state.softphoneState}
                            from={this.state.softphoneFrom}
                            clear={this.clear}
                            holdCustomer={this.holdCustomer} />

                        <br />

                        <Work
                            worker={this.state.workWorker}
                            activities={this.state.workActivities}
                            skills={this.state.workSkills}
                            taskQueues={this.state.workTaskQueues}
                            task={this.state.workTask}
                            changeActivity={this.changeActivity}
                            blindTransfer={this.blindTransfer}
                            warmTransfer={this.warmTransfer} />

                    </div>

                    <div className="col-lg-6">
                        <Log entries={this.state.logEntries} loadTime={this.state.loadTime} />
                    </div>


                </div>

            </div>
        );
    }
}

export default App;
