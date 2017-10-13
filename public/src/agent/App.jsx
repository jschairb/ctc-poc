import React from 'react';

import LoginForm from './LoginForm.jsx';
import Log from './Log.jsx';
import SoftPhone from './SoftPhone.jsx';
import Work from './Work.jsx';
import Card from './Card.jsx';

import * as auth from './auth';

// state transitions
class LogTrans {

    constructor(component) {
        this.component = component;
    }

    appendEntry(entry) {
        this.component.setState((prevState, props)=>({
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
            logEntries: [],
            loggedIn: false,
        }

        this.log = new LogTrans(this);
        this.login = this.login.bind(this);
    }

    login(user) {
        this.log.info(`authenticating as: ${user}`);
        this.log.error('oops');

        auth.getClientToken(user)
        .then((clientToken) => {
            this.log.info("acquired softphone token");
            return auth.getWorkerToken(user);
        })
        .then((workerToken) => {
            this.log.info("acquired worker token");
            this.setState({
                loggedIn: true, 
                user: user, 
                workerToken: workerToken, 
                clientToken: clientToken
            });
            this.log.info("signed in as " + user);

            return setupSoftPone(this.state.clientToken /* TODO all the callbacks */);
        })
        .catch((error) => {
            this.log.error(error);
        });
    }

    render() {
        let signIn = <Card title="Signed In" subtitle={"as " + this.state.user}/>
        if (!this.state.loggedIn) {
            signIn = <LoginForm onSubmit={this.login} loggedIn={this.state.loggedIn}/>;
        }
        return (
            <div>
                <h1>Agent Experience</h1>

                <hr/>

                <div className="row">

                    <div className="col-lg-8">
                        {signIn}
                        <br/>
                        <SoftPhone />
                        <br/>
                        <Work />
                    </div>

                    <div className="col-lg-4">
                        <Log entries={this.state.logEntries} loadTime={new Date()} />
                    </div>


                </div>
                
            </div>
        );
    }
}

export default App;
